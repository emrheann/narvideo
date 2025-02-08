let player;
let peer;
let conn;
let isHost = false;
let lastTime = 0; // Son video zamanını takip etmek için
let username = localStorage.getItem('chatUsername') || 'Misafir';
let showMessageTime = true; // Global scope'a taşıdık
let userColor = localStorage.getItem('chatColor') || '#ff4444';

// Giriş işlemleri
function initLogin() {
    const loginModal = document.getElementById('loginModal');
    const usernameInput = document.getElementById('loginUsername');
    const hostButton = document.getElementById('hostButton');
    const guestButton = document.getElementById('guestButton');
    const connectButton = document.getElementById('connectButton');

    // Kayıtlı kullanıcı adını yükle
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
    }

    let selectedRole = '';

    // Role seçimi
    hostButton.addEventListener('click', () => {
        hostButton.classList.add('selected');
        guestButton.classList.remove('selected');
        selectedRole = 'host';
        updateConnectButton();
    });

    guestButton.addEventListener('click', () => {
        guestButton.classList.add('selected');
        hostButton.classList.remove('selected');
        selectedRole = 'guest';
        updateConnectButton();
    });

    // Kullanıcı adı değişikliği
    usernameInput.addEventListener('input', updateConnectButton);

    // Bağlan butonu kontrolü
    function updateConnectButton() {
        const username = usernameInput.value.trim();
        connectButton.disabled = !username || !selectedRole;
    }

    // Bağlan butonuna tıklandığında
    connectButton.addEventListener('click', () => {
        username = usernameInput.value.trim();
        isHost = selectedRole === 'host';
        
        // Kullanıcı adını kaydet
        localStorage.setItem('chatUsername', username);
        
        // Modal'ı kaldır
        loginModal.style.display = 'none';
        
        // Uygulamayı başlat
        initApp();
    });
}

// Kullanıcı tercihlerini yöneten fonksiyon
function initUserPreferences() {
    // Chat modu tercihi (yan panel / overlay)
    const chatMode = localStorage.getItem('chatMode') || 'side'; // Varsayılan: yan panel
    const chatModeButton = document.getElementById('chatModeButton');
    const chatPanel = document.getElementById('chatPanel');
    const chatPanelOverlay = document.getElementById('chatPanelOverlay');
    const videoContainer = document.querySelector('.video-container');

    // Chat modunu ayarla
    if (chatMode === 'overlay') {
        chatPanel.style.display = 'none';
        chatPanelOverlay.classList.add('active');
        videoContainer.style.width = '100%';
        chatModeButton.classList.add('active');
    } else {
        chatPanel.style.display = 'flex';
        chatPanelOverlay.classList.remove('active');
        videoContainer.style.width = `calc(100% - ${chatPanel.offsetWidth}px)`;
        chatModeButton.classList.remove('active');
    }

    // Chat modu değiştiğinde
    chatModeButton.addEventListener('click', () => {
        const newMode = chatPanel.style.display === 'none' ? 'side' : 'overlay';
        localStorage.setItem('chatMode', newMode);
    });

    // Saat gösterimi tercihi
    const showMessageTime = localStorage.getItem('showMessageTime') !== 'false'; // Varsayılan: true
    const toggleTimeButton = document.getElementById('toggleTimeButton');

    // Saat gösterimini ayarla
    if (!showMessageTime) {
        toggleTimeButton.classList.remove('active');
        document.querySelectorAll('.chat-message .time').forEach(el => {
            el.style.display = 'none';
        });
    } else {
        toggleTimeButton.classList.add('active');
    }

    // Chat panel genişliği
    const chatWidth = localStorage.getItem('chatWidth');
    if (chatWidth) {
        chatPanel.style.width = chatWidth + 'px';
        videoContainer.style.width = `calc(100% - ${chatWidth}px)`;
    }

    // Chat panel genişliği değiştiğinde
    const chatResizeHandle = document.getElementById('chatResizeHandle');
    let isResizing = false;

    chatResizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
    });

    function handleResize(e) {
        if (!isResizing) return;
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 200 && newWidth <= 600) {
            chatPanel.style.width = newWidth + 'px';
            videoContainer.style.width = `calc(100% - ${newWidth}px)`;
            localStorage.setItem('chatWidth', newWidth);
        }
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
    }

    // Kullanıcı adı
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
        username = savedUsername;
    }

    // Kullanıcı rengi
    const savedColor = localStorage.getItem('userColor');
    if (savedColor) {
        userColor = savedColor;
    }
}

// Ana uygulama başlatma
function initApp() {
    loadYouTubeAPI();
    initPeer();
    initChat();
    initTopBar();
    initUserPreferences(); // Kullanıcı tercihlerini yükle
}

// Top bar işlemleri ayrı fonksiyona
function initTopBar() {
    const topBar = document.getElementById('topBar');
    const hoverArea = document.querySelector('.hover-area');
    let hideTimeout;

    // Video yükleme butonu
    document.getElementById('loadVideo').addEventListener('click', () => {
        const url = document.getElementById('videoUrl').value.trim();
        const videoId = getVideoId(url);
        
        if (videoId) {
            // Player'ı göster ve placeholder'ı gizle
            hideVideoPlaceholder();
            
            player.loadVideoById(videoId);
            if (conn) {
                conn.send({
                    type: 'videoUpdate',
                    videoId: videoId,
                    time: 0,
                    state: 1,
                    hidePlaceholder: true
                });
            }

            // Video başladıktan 3 saniye sonra top bar'ı gizle
            setTimeout(() => {
                document.getElementById('topBar').classList.add('hidden');
            }, 3000);
        }
    });

    // Hover alanına gelince top bar'ı göster
    hoverArea.addEventListener('mouseenter', () => {
        topBar.classList.remove('hidden');
        clearTimeout(hideTimeout);
    });

    // Top bar'a gelince gizleme zamanlayıcısını iptal et
    topBar.addEventListener('mouseenter', () => {
        clearTimeout(hideTimeout);
    });

    // Top bar'dan çıkınca 1 saniye sonra gizle
    topBar.addEventListener('mouseleave', () => {
        hideTimeout = setTimeout(() => {
            topBar.classList.add('hidden');
        }, 1000);
    });
}

// PeerJS bağlantısını kur
function initPeer() {
    // İlk olarak host olmayı dene
    peer = new Peer('videosync-host', {
        debug: 2
    });

    peer.on('open', () => {
        // Başarıyla host olduk
        isHost = true;
        document.getElementById('roomId').textContent = 'Host (Bağlantı bekleniyor)';
    });

    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            // Host zaten var, izleyici olarak bağlan
            peer = new Peer(null, {
                debug: 2
            });
            
            peer.on('open', () => {
                // Host'a bağlan
                conn = peer.connect('videosync-host');
                
                conn.on('open', () => {
                    isHost = false;
                    setupConnection();
                    document.getElementById('roomId').textContent = 'İzleyici (Bağlandı)';
                });
            });
        }
    });

    // Host olarak bağlantı gelirse
    peer.on('connection', (connection) => {
        conn = connection;
        setupConnection();
        document.getElementById('roomId').textContent = 'Host (Bağlantı kuruldu)';
    });
}

// Bağlantı ayarlarını yap
function setupConnection() {
    document.getElementById('roomId').textContent = 'Bağlandı';

    conn.on('data', (data) => {
        if (!player) return;

        if (data.type === 'requestVideo') {
            // Host ise mevcut video durumunu gönder
            if (isHost && player.getVideoData()) {
                conn.send({
                    type: 'videoUpdate',
                    videoId: player.getVideoData().video_id,
                    time: player.getCurrentTime(),
                    state: player.getPlayerState(),
                    hidePlaceholder: true // Placeholder'ı gizlemek için flag ekle
                });
            }
        }
        else if (data.type === 'videoUpdate') {
            // Placeholder'ı gizle
            if (data.hidePlaceholder) {
                hideVideoPlaceholder();
            }
            
            // Video yükle ve zaman ayarla
            player.loadVideoById({
                videoId: data.videoId,
                startSeconds: data.time
            });

            // Video durumunu ayarla (oynatma/durdurma)
            setTimeout(() => {
                if (data.state === 2) { // PAUSED
                    player.pauseVideo();
                } else if (data.state === 1) { // PLAYING
                    player.playVideo();
                }
            }, 500); // Videonun yüklenmesi için kısa bir süre bekle
        }
        else if (data.type === 'play') {
            player.playVideo();
        }
        else if (data.type === 'pause') {
            player.pauseVideo();
        }
        else if (data.type === 'seek') {
            player.seekTo(data.time);
        }
        else if (data.type === 'chat') {
            addChatMessage(data);
        }
    });

    // İzleyici ise bağlanır bağlanmaz video durumunu iste
    if (!isHost) {
        setTimeout(() => {
            conn.send({ type: 'requestVideo' });
        }, 1000); // Player'ın hazır olması için biraz bekle
    }
}

// Player'ı oluştur
function createPlayer() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        playerVars: {
            controls: 1,
            disablekb: 0,
            enablejsapi: 1,
            fs: 1,
            rel: 0
        },
        events: {
            'onStateChange': onPlayerStateChange,
            'onReady': () => {
                // Video zaman değişikliğini kontrol et
                setInterval(() => {
                    if (!player || !conn) return;
                    
                    const currentTime = player.getCurrentTime();
                    if (Math.abs(currentTime - lastTime) > 2) {
                        conn.send({
                            type: 'seek',
                            time: currentTime
                        });
                    }
                    lastTime = currentTime;
                }, 1000);
            }
        }
    });
}

// YouTube API'sini yükle
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    loadYouTubeAPI();
    initPeer();
    initChat();
    initTopBar();
});

// Video ID'sini URL'den çıkar
function getVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : false;
}

// Chat fonksiyonları
function initChat() {
    const chatPanel = document.getElementById('chatPanel');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const videoContainer = document.querySelector('.video-container');
    const chatPanelOverlay = document.getElementById('chatPanelOverlay');
    const chatInputOverlayField = document.getElementById('chatInputOverlayField');

    // Kullanıcı ayarları
    username = localStorage.getItem('chatUsername') || 'Misafir';
    let userColor = localStorage.getItem('chatColor') || '#ff4444';

    let hideTimeout;

    // Chat mod ve isim değiştirme kontrolleri
    const chatModeButton = document.getElementById('chatModeButton');
    const changeNameButton = document.getElementById('changeNameButton');
    const nameChangePopup = document.querySelector('.name-change-popup');
    const newNameInput = document.getElementById('newNameInput');
    const confirmNameButton = document.getElementById('confirmNameButton');

    // Chat mod değiştirme - showOverlayChat ve hideOverlayChat fonksiyonlarını ekleyelim
    function showOverlayChat() {
        clearTimeout(hideTimeout);
        chatPanelOverlay.classList.add('visible');
    }

    function hideOverlayChat() {
        hideTimeout = setTimeout(() => {
            chatPanelOverlay.classList.remove('visible');
        }, 5000);
    }

    chatModeButton.addEventListener('click', () => {
        const isOverlayMode = chatPanel.style.display === 'none';
        
        if (isOverlayMode) {
            // Yan chat moduna geç
            chatPanel.style.display = 'flex';
            chatPanelOverlay.classList.remove('active');
            chatPanelOverlay.classList.remove('visible');
            videoContainer.style.width = `calc(100% - ${chatPanel.offsetWidth}px)`;
            // İkon değişimi
            chatModeButton.querySelector('i').classList.remove('fa-comments');
            chatModeButton.querySelector('i').classList.add('fa-message');
        } else {
            // Overlay chat moduna geç
            chatPanel.style.display = 'none';
            chatPanelOverlay.classList.add('active');
            showOverlayChat();
            videoContainer.style.width = '100%';
            // İkon değişimi
            chatModeButton.querySelector('i').classList.remove('fa-message');
            chatModeButton.querySelector('i').classList.add('fa-comments');
        }
    });

    // İsim değiştirme
    changeNameButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Event'in dışarı yayılmasını engelle
        nameChangePopup.classList.add('active');
        newNameInput.value = username;
        newNameInput.focus();
        newNameInput.select();
    });

    // İsmi onayla
    confirmNameButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const newUsername = newNameInput.value.trim();
        if (newUsername && newUsername !== username) {
            const oldUsername = username;
            username = newUsername;
            localStorage.setItem('chatUsername', username);
            
            // Sistem mesajını oluştur
            const systemMessage = {
                type: 'system',
                content: `${oldUsername} kullanıcı adını ${username} olarak değiştirdi`,
                time: formatMessageTime()
            };

            addChatMessage(systemMessage);
            if (conn) {
                conn.send(systemMessage);
            }
        }
        nameChangePopup.classList.remove('active');
    });

    // Enter tuşuna basıldığında da ismi onayla
    newNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Enter'ın varsayılan davranışını engelle
            confirmNameButton.click();
        }
    });

    // Popup dışına tıklandığında kapat
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.name-change-container')) {
            nameChangePopup.classList.remove('active');
        }
    });

    // Varsayılan olarak yan chat'i aktif yap
    chatPanel.style.display = 'flex';
    chatPanelOverlay.classList.remove('active');
    videoContainer.style.width = `calc(100% - ${chatPanel.offsetWidth}px)`;

    // Basit emoji listesi
    const emojis = ['😀', '😂', '😊', '😍', '🥰', '😎', '😋', '🤔', '😴', '😭', '😱', '🥳', 
                    '👍', '👎', '👋', '🙌', '👏', '🎉', '❤️', '💔', '💯', '🔥', '✨', '⭐'];

    // Emoji picker'ları oluştur
    function createEmojiPicker(container) {
        emojis.forEach(emoji => {
            const span = document.createElement('span');
            span.className = 'emoji-item';
            span.textContent = emoji;
            container.appendChild(span);
        });
    }

    const emojiPicker = document.getElementById('emojiPicker');
    const emojiPickerOverlay = document.getElementById('emojiPickerOverlay');
    createEmojiPicker(emojiPicker);
    createEmojiPicker(emojiPickerOverlay);

    // Emoji butonlarına tıklama
    emojiButton.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPicker.classList.toggle('visible');
        emojiPickerOverlay.classList.remove('visible');
    });

    emojiButtonOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPickerOverlay.classList.toggle('visible');
        emojiPicker.classList.remove('visible');
    });

    // Emoji seçme
    emojiPicker.addEventListener('click', (e) => {
        if (e.target.classList.contains('emoji-item')) {
            insertEmoji(chatInput, e.target.textContent);
            emojiPicker.classList.remove('visible');
        }
    });

    emojiPickerOverlay.addEventListener('click', (e) => {
        if (e.target.classList.contains('emoji-item')) {
            insertEmoji(chatInputOverlayField, e.target.textContent);
            emojiPickerOverlay.classList.remove('visible');
        }
    });

    // Emoji ekleme yardımcı fonksiyonu
    function insertEmoji(input, emoji) {
        const cursorPos = input.selectionStart;
        const text = input.value;
        input.value = text.slice(0, cursorPos) + emoji + text.slice(cursorPos);
        input.focus();
        input.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
    }

    // Emoji picker dışına tıklandığında kapat
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.emoji-button') && !e.target.closest('emoji-picker')) {
            emojiPicker.classList.remove('visible');
            emojiPickerOverlay.classList.remove('visible');
        }
    });

    // Zamanı formatla (sadece saat ve dakika)
    function formatMessageTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // Saat gösterimi kontrolü
    const toggleTimeButton = document.getElementById('toggleTimeButton');

    // Başlangıçta localStorage'dan tercihi al
    if (localStorage.getItem('showMessageTime') === 'false') {
        showMessageTime = false;
        toggleTimeButton.classList.remove('active');
        document.querySelectorAll('.chat-message .time').forEach(el => {
            el.style.display = 'none';
        });
    } else {
        toggleTimeButton.classList.add('active');
    }

    // Saat gösterimi toggle butonu
    toggleTimeButton.addEventListener('click', () => {
        showMessageTime = !showMessageTime;
        localStorage.setItem('showMessageTime', showMessageTime);
        
        // Buton stilini güncelle
        toggleTimeButton.classList.toggle('active');
        
        // Tüm mevcut mesajların saat gösterimini güncelle
        document.querySelectorAll('.chat-message .time').forEach(el => {
            el.style.display = showMessageTime ? 'inline' : 'none';
        });
    });

    // Mesaj gönderme fonksiyonu
    function sendMessage(input) {
        const content = input.value.trim();
        if (!content) return;

        const message = {
            type: 'chat',
            content: content,
            sender: username,
            color: userColor,
            time: formatMessageTime()
        };

        addChatMessage(message);
        if (conn) {
            conn.send(message);
        }

        input.value = '';
        
        // Overlay modunda mesaj gönderince otomatik gizle
        if (chatPanelOverlay.classList.contains('active')) {
            showOverlayChat();
            hideOverlayChat();
        }
    }

    // Mesaj gönderme event listener'ları
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage(chatInput);
        }
    });

    chatInputOverlayField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage(chatInputOverlayField);
        }
    });
}

// Player durumu değiştiğinde
function onPlayerStateChange(event) {
    if (!conn) return;
    
    if (event.data === 1) { // PLAYING
        conn.send({ type: 'play' });
    }
    else if (event.data === 2) { // PAUSED
        conn.send({ type: 'pause' });
    }
}

// Saniyeyi saat:dakika:saniye formatına çeviren fonksiyon
function formatTime(seconds) {
    seconds = Math.floor(seconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const parts = [];
    if (h > 0) parts.push(h.toString());
    parts.push(m.toString().padStart(2, '0'));
    parts.push(s.toString().padStart(2, '0'));
    
    return parts.join(':');
}

// Video ileri-geri alma için sistem mesajı
setInterval(() => {
    if (!player || !conn) return;
    
    const currentTime = player.getCurrentTime();
    if (Math.abs(currentTime - lastTime) > 2) {
        // Karşı tarafa seek komutunu gönder
        conn.send({
            type: 'seek',
            time: currentTime
        });
    }
    lastTime = currentTime;
}, 1000);

window.onYouTubeIframeAPIReady = createPlayer;

// Chat mesajı ekleme fonksiyonu (global scope'da)
window.addChatMessage = function(message) {
    function createMessageElement(message) {
        const div = document.createElement('div');
        div.className = message.type === 'system' ? 'chat-message system' : 'chat-message';
        
        if (message.type === 'system') {
            div.innerHTML = `<span class="content">${message.content}</span>`;
        } else {
            div.innerHTML = `
                <span class="time" style="display: ${showMessageTime ? 'inline' : 'none'}">[${message.time}]</span>
                <span class="sender" style="color: ${message.color}">${message.sender}:</span>
                <span class="content">${message.content}</span>
            `;
        }
        return div;
    }

    // Normal chat'e ekle
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = createMessageElement(message);
    chatMessages.insertBefore(messageDiv, chatMessages.firstChild);

    // Overlay chat'e ekle
    const overlayMessages = document.getElementById('chatMessagesOverlay');
    const overlayMessageDiv = createMessageElement(message);
    overlayMessages.insertBefore(overlayMessageDiv, overlayMessages.firstChild);
};

// Placeholder'ı gizlemek için yardımcı fonksiyon
function hideVideoPlaceholder() {
    document.getElementById('player').classList.add('active');
    document.getElementById('videoPlaceholder').style.display = 'none';
} 