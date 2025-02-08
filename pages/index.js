import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [player, setPlayer] = useState(null);
  const [peer, setPeer] = useState(null);
  const [conn, setConn] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [username, setUsername] = useState('Misafir');
  const [showMessageTime, setShowMessageTime] = useState(true);
  const [userColor, setUserColor] = useState('#ff4444');
  const [chatMode, setChatMode] = useState('side');
  const playerRef = useRef(null);

  useEffect(() => {
    // Sayfa yüklendiğinde çalışacak kodlar
    loadYouTubeAPI();
    initPeer();
    
    // Kullanıcı tercihlerini yükle
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) setUsername(savedUsername);
    
    const savedColor = localStorage.getItem('userColor');
    if (savedColor) setUserColor(savedColor);
    
    const savedChatMode = localStorage.getItem('chatMode');
    if (savedChatMode) setChatMode(savedChatMode);
    
    const savedShowTime = localStorage.getItem('showMessageTime');
    if (savedShowTime === 'false') setShowMessageTime(false);
  }, []);

  // YouTube API'sini yükle
  const loadYouTubeAPI = () => {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    
    window.onYouTubeIframeAPIReady = createPlayer;
  };

  // Player oluştur
  const createPlayer = () => {
    if (!playerRef.current) return;
    
    const newPlayer = new YT.Player(playerRef.current, {
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
        'onReady': onPlayerReady
      }
    });
    
    setPlayer(newPlayer);
  };

  // ... Diğer fonksiyonlar buraya gelecek ...

  return (
    <div className={styles.container}>
      <Head>
        <title>NarVideo</title>
        <link rel="icon" href="/favicon.ico" />
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
        />
      </Head>

      <main className={styles.main}>
        {/* Top Bar */}
        <div className={`${styles.topBar} ${styles.hidden}`} id="topBar">
          <div className={styles.topBarLogo}>
            <img src="/logo2.png" alt="NarVideo Logo" className={styles.navLogo} />
          </div>
          <input 
            type="text" 
            className={styles.urlInput} 
            placeholder="YouTube video URL'sini yapıştır"
          />
          <button className={styles.playButton}>
            <i className="fa-solid fa-play"></i>
            <span>Başlat</span>
          </button>
          {/* ... Diğer kontroller ... */}
        </div>

        {/* Video Container */}
        <div className={styles.videoContainer}>
          <div className={styles.videoPlaceholder}>
            <i className="fa-solid fa-film"></i>
            <p>Video URL'si girerek başlayın</p>
          </div>
          <div ref={playerRef} id="player"></div>
        </div>

        {/* Chat Panel */}
        {/* ... Chat paneli komponenti ... */}
      </main>
    </div>
  );
} 