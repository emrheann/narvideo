// Oda durumunu kontrol et ve göster
function checkAndDisplayRoomStatus() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {type: 'GET_ROOM_ID'}, function(response) {
      if (response && response.roomId) {
        document.getElementById('roomStatus').classList.add('active');
        document.getElementById('roomIdDisplay').style.display = 'block';
        document.getElementById('roomIdDisplay').textContent = response.roomId;
      }
    });
  });
}

// Sayfa yüklendiğinde oda durumunu kontrol et
document.addEventListener('DOMContentLoaded', checkAndDisplayRoomStatus);

document.getElementById('createRoom').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'CREATE_ROOM' }, response => {
    if (response.roomId) {
      // Oda ID'sini content script'e gönder
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'SET_ROOM_ID',
          roomId: response.roomId
        });
        
        // UI'ı güncelle
        document.getElementById('roomStatus').classList.add('active');
        document.getElementById('roomIdDisplay').style.display = 'block';
        document.getElementById('roomIdDisplay').textContent = response.roomId;
      });
      
      // Başarı mesajını göster
      const button = document.getElementById('createRoom');
      const originalText = button.textContent;
      button.textContent = '✓ Oda Oluşturuldu!';
      button.style.backgroundColor = '#4CAF50';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '#2196F3';
      }, 2000);
    }
  });
});

document.getElementById('joinRoom').addEventListener('click', () => {
  const roomId = document.getElementById('roomId').value.trim();
  if (roomId) {
    console.log('Katılmaya çalışılan oda:', roomId);
    
    chrome.runtime.sendMessage({ type: 'JOIN_ROOM', roomId }, response => {
      console.log('Katılma isteği cevabı:', response);
      
      if (response.success) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'SET_ROOM_ID',
            roomId: roomId
          });
          
          document.getElementById('roomStatus').classList.add('active');
          document.getElementById('roomIdDisplay').style.display = 'block';
          document.getElementById('roomIdDisplay').textContent = roomId;
        });
        
        const button = document.getElementById('joinRoom');
        const originalText = button.textContent;
        button.textContent = '✓ Odaya Katıldınız!';
        button.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '#2196F3';
        }, 2000);
      } else {
        const button = document.getElementById('joinRoom');
        const originalText = button.textContent;
        button.textContent = '✗ Oda Bulunamadı!';
        button.style.backgroundColor = '#f44336';
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '#2196F3';
        }, 2000);
      }
    });
  }
}); 