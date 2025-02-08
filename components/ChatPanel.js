import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

export default function ChatPanel({ 
  mode, 
  username, 
  showTime, 
  onSendMessage 
}) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendMessage(message);
    setMessage('');
  };

  return (
    <div className={`${styles.chatPanel} ${mode === 'overlay' ? styles.overlay : ''}`}>
      <div className={styles.chatMessages}>
        {messages.map((msg, index) => (
          <div key={index} className={styles.chatMessage}>
            {showTime && <span className={styles.time}>[{msg.time}]</span>}
            <span className={styles.sender} style={{color: msg.color}}>
              {msg.sender}:
            </span>
            <span className={styles.content}>{msg.content}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className={styles.chatInputArea}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mesajınızı yazın..."
          className={styles.chatInput}
        />
        <button type="submit" className={styles.sendButton}>
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
} 