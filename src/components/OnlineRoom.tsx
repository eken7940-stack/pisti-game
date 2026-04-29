import React, { useState } from 'react';
import { socket } from '../game/socket';
import { getSocketUrl } from '../game/socketUrl';

interface Props {
  onReady: (playerIndex: number, roomId: string, myName: string, opponentName: string) => void;
  onBack: () => void;
}

type Screen = 'lobby' | 'waiting';

export const OnlineRoom: React.FC<Props> = ({ onReady, onBack }) => {
  const [screen, setScreen] = useState<Screen>('lobby');
  const [myName, setMyName] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  const connect = async () => {
    if (connecting) return;
    setConnecting(true);
    setError('');
    try {
      await socket.connect(getSocketUrl());
    } catch {
      setError('Sunucuya bağlanılamadı.');
      setConnecting(false);
      return;
    }
    setConnecting(false);
  };

  const createRoom = async () => {
    if (!myName.trim()) { setError('İsim gir'); return; }
    await connect();
    if (error) return;

    socket.on('ROOM_CREATED', (d) => {
      setRoomId(d.roomId as string);
      setScreen('waiting');
    });

    socket.on('OPPONENT_JOINED', (d) => {
      onReady(0, roomId, myName, d.opponentName as string);
    });

    socket.send({ type: 'CREATE_ROOM', name: myName });
  };

  const joinRoom = async () => {
    if (!myName.trim()) { setError('İsim gir'); return; }
    if (!roomInput.trim()) { setError('Oda kodu gir'); return; }
    await connect();
    if (error) return;

    socket.on('ROOM_JOINED', (d) => {
      onReady(1, d.roomId as string, myName, d.opponentName as string);
    });

    socket.on('ERROR', (d) => {
      setError(d.message as string);
    });

    socket.send({ type: 'JOIN_ROOM', roomId: roomInput.trim(), name: myName });
  };

  // URL'den oda kodu al
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) setRoomInput(code.toUpperCase());
  }, []);

  const shareLink = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="online-room">
      <button className="back-btn" onClick={onBack}>← Geri</button>

      <div className="online-title">
        <span className="meta-logo-sm">∞</span>
        <span className="online-title-berra">Meta</span>
        <span className="online-title-amp"> </span>
        <span className="online-title-pasa">Pişti Salonu</span>
      </div>
      <p className="online-subtitle">Online 2 Kişilik</p>

      {screen === 'lobby' && (
        <div className="online-card">
          <div className="form-group">
            <label>İsmin</label>
            <input
              className="online-input"
              placeholder="Adını gir..."
              value={myName}
              onChange={e => setMyName(e.target.value)}
              maxLength={16}
            />
          </div>

          {error && <div className="online-error">⚠ {error}</div>}

          <div className="online-actions">
            <button className="online-btn online-btn-create" onClick={createRoom} disabled={connecting}>
              {connecting ? '⏳' : '🏠'} Oda Oluştur
            </button>
            <div className="online-divider">veya</div>
            <div className="join-row">
              <input
                className="online-input room-input"
                placeholder="Oda kodu..."
                value={roomInput}
                onChange={e => setRoomInput(e.target.value.toUpperCase())}
                maxLength={5}
              />
              <button className="online-btn online-btn-join" onClick={joinRoom} disabled={connecting}>
                Katıl
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'waiting' && (
        <div className="online-card waiting-card">
          <div className="waiting-spinner">⏳</div>
          <p className="waiting-text">Rakip bekleniyor...</p>
          <div className="room-code-box">
            <span className="room-code-label">Oda Kodu</span>
            <span className="room-code">{roomId}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="copy-btn" onClick={copyCode}>
                {copied ? '✓ Kopyalandı' : '📋 Kodu Kopyala'}
              </button>
              <button className="copy-btn share-btn" onClick={shareLink}>
                🔗 Link Paylaş
              </button>
            </div>
          </div>
          <p className="waiting-hint">Kodu veya linki arkadaşına gönder</p>
        </div>
      )}
    </div>
  );
};
