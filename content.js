let currentRoomId = '';
let isUpdatingState = false;
let videoElement = null;
let syncInterval = null;

// Video elementini bul
function findVideoElement() {
  const video = document.querySelector('video');
  if (video && video !== videoElement) {
    videoElement = video;
    attachVideoListeners(video);
    console.log('Yeni video elementi bulundu ve dinleyiciler eklendi');
  }
  return video;
}

// Video durumunu güncelle
function updateVideoState(videoState) {
  if (isUpdatingState) return;
  
  const video = videoElement || findVideoElement();
  if (!video) return;

  isUpdatingState = true;
  console.log('Video durumu güncelleniyor:', videoState);

  try {
    // Zaman farkı kontrolü
    const timeDiff = Math.abs(video.currentTime - videoState.currentTime);
    if (timeDiff > 0.5) {
      video.currentTime = videoState.currentTime;
    }

    // Oynatma durumu kontrolü
    if (videoState.isPlaying && video.paused) {
      video.play().catch(error => {
        console.error('Video oynatma hatası:', error);
      });
    } else if (!videoState.isPlaying && !video.paused) {
      video.pause();
    }
  } catch (error) {
    console.error('Video güncelleme hatası:', error);
  } finally {
    setTimeout(() => {
      isUpdatingState = false;
    }, 100);
  }
}

// Video durumunu diğer katılımcılara gönder
function broadcastVideoState(video, forceSend = false) {
  if (!currentRoomId || isUpdatingState) return;

  const videoState = {
    currentTime: video.currentTime,
    isPlaying: !video.paused
  };

  console.log('Video durumu yayınlanıyor:', videoState);
  chrome.runtime.sendMessage({
    type: 'UPDATE_VIDEO_STATE',
    roomId: currentRoomId,
    videoState: videoState,
    forceSend: forceSend
  });
}

// Video olaylarını dinle
function attachVideoListeners(video) {
  if (!video) return;

  // Önceki interval'i temizle
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  // Play olayı
  video.addEventListener('play', () => {
    if (!isUpdatingState) {
      console.log('Video oynatma olayı tetiklendi');
      broadcastVideoState(video, true);
    }
  });

  // Pause olayı
  video.addEventListener('pause', () => {
    if (!isUpdatingState) {
      console.log('Video durdurma olayı tetiklendi');
      broadcastVideoState(video, true);
    }
  });

  // Seeking olayı
  video.addEventListener('seeked', () => {
    if (!isUpdatingState) {
      console.log('Video konumu değişti');
      broadcastVideoState(video, true);
    }
  });

  // Periyodik senkronizasyon
  syncInterval = setInterval(() => {
    if (video && !video.paused && !isUpdatingState) {
      broadcastVideoState(video);
    }
  }, 1000);

  console.log('Video dinleyicileri eklendi');
}

// Mesajları dinle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Mesaj alındı:', request);

  switch (request.type) {
    case 'SYNC_VIDEO_STATE':
      updateVideoState(request.videoState);
      break;
    
    case 'SET_ROOM_ID':
      currentRoomId = request.roomId;
      console.log('Oda ID ayarlandı:', currentRoomId);
      // Video elementini tekrar kontrol et ve dinleyicileri ekle
      findVideoElement();
      break;
    
    case 'GET_ROOM_ID':
      sendResponse({ roomId: currentRoomId });
      break;
  }
  return true;
});

// Sayfa yüklendiğinde ve DOM değiştiğinde video elementini kontrol et
const observer = new MutationObserver(() => {
  findVideoElement();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Sayfa yüklendiğinde başlangıç kontrolü
document.addEventListener('DOMContentLoaded', () => {
  findVideoElement();
});

// Periyodik olarak video elementini kontrol et
setInterval(() => {
  findVideoElement();
}, 2000); 