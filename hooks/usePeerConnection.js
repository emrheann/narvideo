import { useState, useEffect } from 'react';
import { Peer } from 'peerjs';

export default function usePeerConnection() {
  const [peer, setPeer] = useState(null);
  const [conn, setConn] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState(null);

  useEffect(() => {
    // Host olmayı dene
    const newPeer = new Peer('videosync-host', {
      debug: 2
    });

    newPeer.on('open', () => {
      setIsHost(true);
      setRoomId('Host');
      setPeer(newPeer);
    });

    newPeer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        // Host zaten var, izleyici olarak bağlan
        const viewerPeer = new Peer(null, {
          debug: 2
        });
        
        viewerPeer.on('open', () => {
          const connection = viewerPeer.connect('videosync-host');
          
          connection.on('open', () => {
            setIsHost(false);
            setConn(connection);
            setPeer(viewerPeer);
            setRoomId('İzleyici');
          });
        });
      }
    });

    // Host olarak bağlantı gelirse
    newPeer.on('connection', (connection) => {
      setConn(connection);
      setupConnection(connection);
    });

    return () => {
      if (peer) peer.destroy();
      if (conn) conn.close();
    };
  }, []);

  const setupConnection = (connection) => {
    connection.on('data', (data) => {
      switch (data.type) {
        case 'videoUpdate':
          // Video güncellemelerini handle et
          break;
        case 'chat':
          // Chat mesajlarını handle et
          break;
        // ... diğer mesaj tipleri
      }
    });
  };

  const sendMessage = (message) => {
    if (conn) {
      conn.send(message);
    }
  };

  return {
    peer,
    conn,
    isHost,
    roomId,
    sendMessage
  };
} 