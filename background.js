let rooms = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Gelen istek:', request.type, request);
  console.log('Mevcut odalar:', rooms);

  switch (request.type) {
    case 'CREATE_ROOM':
      const roomId = Math.random().toString(36).substring(2, 8);
      rooms[roomId] = {
        host: sender.tab ? sender.tab.id : null,
        participants: [],
        videoState: {
          currentTime: 0,
          isPlaying: false
        }
      };
      console.log('Oda oluşturuldu:', roomId);
      sendResponse({ roomId: roomId });
      break;

    case 'JOIN_ROOM':
      console.log('Katılmak istenen oda:', request.roomId);
      if (rooms[request.roomId]) {
        if (sender.tab && !rooms[request.roomId].participants.includes(sender.tab.id)) {
          rooms[request.roomId].participants.push(sender.tab.id);
        }
        console.log(`Oda ${request.roomId}'ye katılım başarılı`);
        sendResponse({ success: true });

        // Yeni katılan kullanıcıya mevcut video durumunu gönder
        if (rooms[request.roomId].videoState) {
          setTimeout(() => {
            chrome.tabs.sendMessage(sender.tab.id, {
              type: 'SYNC_VIDEO_STATE',
              videoState: rooms[request.roomId].videoState
            });
          }, 1000); // Biraz bekleyerek video elementinin hazır olmasını sağla
        }
      } else {
        console.log(`Oda ${request.roomId} bulunamadı!`);
        sendResponse({ success: false });
      }
      break;

    case 'UPDATE_VIDEO_STATE':
      if (rooms[request.roomId]) {
        // Video durumunu güncelle
        rooms[request.roomId].videoState = request.videoState;
        console.log('Video durumu güncellendi:', request.videoState);
        
        // Tüm katılımcılara gönder (gönderen hariç)
        const participants = rooms[request.roomId].participants;
        const host = rooms[request.roomId].host;
        
        [...participants, host].forEach(tabId => {
          if (tabId && tabId !== sender.tab.id) {
            console.log(`Video durumu ${tabId} ID'li taba gönderiliyor`);
            chrome.tabs.sendMessage(tabId, {
              type: 'SYNC_VIDEO_STATE',
              videoState: request.videoState
            });
          }
        });
      }
      break;
  }
  return true;
});

// Tab kapatıldığında temizlik yap
chrome.tabs.onRemoved.addListener((tabId) => {
  Object.keys(rooms).forEach(roomId => {
    const room = rooms[roomId];
    
    // Katılımcılardan çıkar
    const index = room.participants.indexOf(tabId);
    if (index > -1) {
      room.participants.splice(index, 1);
      console.log(`Tab ${tabId} odadan çıkarıldı:`, roomId);
    }
    
    // Host ise ve oda boşsa odayı sil
    if (room.host === tabId && room.participants.length === 0) {
      delete rooms[roomId];
      console.log('Oda silindi:', roomId);
    }
  });
});

// Her 30 saniyede bir aktif odaları logla
setInterval(() => {
  console.log('Aktif odalar:', rooms);
}, 30000);

// Eklenti ikonuna tıklandığında
chrome.browserAction.onClicked.addListener(function() {
  // Yeni sekme aç
  chrome.tabs.create({
    url: 'sync.html'
  });
}); 