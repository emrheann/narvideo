import { useState } from 'react';
import styles from '../styles/Home.module.css';

const EMOJIS = ['😀', '😂', '😊', '😍', '🥰', '😎', '😋', '🤔', 
                '😴', '😭', '😱', '🥳', '👍', '👎', '👋', '🙌', 
                '👏', '🎉', '❤️', '💔', '💯', '🔥', '✨', '⭐'];

export default function EmojiPicker({ onEmojiSelect }) {
  const [isVisible, setIsVisible] = useState(false);

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji);
    setIsVisible(false);
  };

  return (
    <div className={styles.emojiPickerContainer}>
      <button 
        className={styles.emojiButton}
        onClick={() => setIsVisible(!isVisible)}
      >
        <i className="fa-regular fa-face-smile"></i>
      </button>
      {isVisible && (
        <div className={styles.emojiGrid}>
          {EMOJIS.map((emoji, index) => (
            <button
              key={index}
              className={styles.emojiItem}
              onClick={() => handleEmojiClick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 