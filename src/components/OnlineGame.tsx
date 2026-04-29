import React, { useEffect, useState, useRef } from 'react';
import type { Card, GameState } from '../game/types';
import { initGame } from '../game/gameLogic';
import { playCard } from '../game/gameLogic';
import { CardComponent } from './Card';
import { socket } from '../game/socket';
import { SFX } from '../game/audio';

interface Props {
  playerIndex: number;   // 0 = host (Berra), 1 = guest (Paşa)
  myName: string;
  opponentName: string;
  onLeave: () => void;
}

interface FlyingCard { card: Card; from: 'me' | 'opponent'; id: number; }
let flyId = 0;

export const OnlineGame: React.FC<Props> = ({ playerIndex, myName, opponentName, onLeave }) => {
  const isHost = playerIndex === 0;
  // Host oyunu yönetir ve state'i senkronize eder
  const [gameState, setGameState] = useState<GameState>(() =>
    isHost ? initGame('normal') : ({} as GameState)
  );
  const [ready, setReady] = useState(isHost);
  const [flyingCard, setFlyingCard] = useState<FlyingCard | null>(null);
  const [chat, setChat] = useState<{ from: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [rematchPending, setRematchPending] = useState(false);
  const pendingState = useRef<GameState | null>(null);

  const myTurn = ready && (
    (isHost && gameState.currentTurn === 'player') ||
    (!isHost && gameState.currentTurn === 'bot')
  );

  // Online'da "bot" slot'u = rakip oyuncu
  // Host: currentTurn 'player' = kendi sırası
  // Guest: currentTurn 'bot' = kendi sırası

  useEffect(() => {
    // Host state'i gönderir
    if (isHost && ready) {
      socket.send({ type: 'GAME_STATE', state: gameState });
    }
  }, [gameState]);

  useEffect(() => {
    const onState = (d: Record<string, unknown>) => {
      if (!isHost) {
        setGameState(d.state as GameState);
        setReady(true);
      }
    };

    const onOpponentPlayed = (d: Record<string, unknown>) => {
      const card = d.card as Card;
      // Animasyon
      pendingState.current = null;
      setFlyingCard({ card, from: 'opponent', id: ++flyId });
      // Ses
      SFX.cardPlay();
    };

    const onChat = (d: Record<string, unknown>) => {
      setChat(prev => [...prev.slice(-19), { from: d.from as string, text: d.text as string }]);
    };

    const onLeft = () => setOpponentLeft(true);

    const onRematch = () => setRematchPending(true);

    const onRematchStart = () => {
      setRematchPending(false);
      if (isHost) {
        const fresh = initGame('normal');
        setGameState(fresh);
      }
    };

    socket.on('GAME_STATE', onState);
    socket.on('OPPONENT_PLAYED', onOpponentPlayed);
    socket.on('CHAT', onChat);
    socket.on('OPPONENT_LEFT', onLeft);
    socket.on('REMATCH_REQUEST', onRematch);
    socket.on('REMATCH_START', onRematchStart);

    return () => {
      socket.off('GAME_STATE', onState);
      socket.off('OPPONENT_PLAYED', onOpponentPlayed);
      socket.off('CHAT', onChat);
      socket.off('OPPONENT_LEFT', onLeft);
      socket.off('REMATCH_REQUEST', onRematch);
      socket.off('REMATCH_START', onRematchStart);
    };
  }, [isHost, gameState]);

  const handleAnimEnd = () => {
    if (pendingState.current) {
      setGameState(pendingState.current);
      pendingState.current = null;
    }
    setFlyingCard(null);
  };

  const handlePlayCard = (card: Card) => {
    if (!myTurn || flyingCard || !ready) return;

    // Kendi state'ini güncelle (host yönetir)
    if (isHost) {
      const next = playCard(gameState, card, 'player');
      pendingState.current = next;
      if (next.message.includes('Pişti')) SFX.pisti();
      else if (next.pile.length === 0) SFX.cardCapture();
      else SFX.cardPlay();
    } else {
      // Guest: host'a kart gönder, host işler
      if (gameState.message.includes('Pişti')) SFX.pisti();
      else SFX.cardPlay();
    }

    socket.send({ type: 'PLAY_CARD', card });
    setFlyingCard({ card, from: 'me', id: ++flyId });
  };

  // Host rakibin kartını alınca state'i günceller
  useEffect(() => {
    const onOpponentCard = (d: Record<string, unknown>) => {
      if (!isHost) return;
      const card = d.card as Card;
      const next = playCard(gameState, card, 'bot');
      pendingState.current = next;
    };
    socket.on('OPPONENT_PLAYED', onOpponentCard);
    return () => socket.off('OPPONENT_PLAYED', onOpponentCard);
  }, [isHost, gameState]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socket.send({ type: 'CHAT', text: chatInput });
    setChat(prev => [...prev.slice(-19), { from: myName, text: chatInput }]);
    setChatInput('');
  };

  if (!ready) {
    return (
      <div className="online-loading">
        <div className="waiting-spinner">⏳</div>
        <p>Oyun yükleniyor...</p>
      </div>
    );
  }

  const myPlayer = isHost ? gameState.player : gameState.bot;
  const oppPlayer = isHost ? gameState.bot : gameState.player;
  const myHand = myPlayer?.hand ?? [];
  const oppHand = oppPlayer?.hand ?? [];
  const topPile = gameState.pile?.[gameState.pile.length - 1];

  return (
    <div className="gameboard online-gameboard">
      {/* Üst bar */}
      <div className="online-topbar">
        <div className="online-player-tag opponent-tag">
          <span className={playerIndex === 0 ? 'name-pasa' : 'name-berra'}>
            {playerIndex === 0 ? '👑' : '♛'} {opponentName}
          </span>
          <span className="online-score">{oppPlayer?.score ?? 0} puan</span>
        </div>
        <div className="online-center-info">
          <span className="pile-info-online">📚 {gameState.pile?.length ?? 0}</span>
          <span className="deck-info-online">🂠 {gameState.deck?.length ?? 0}</span>
        </div>
        <div className="online-player-tag my-tag">
          <span className={playerIndex === 0 ? 'name-berra' : 'name-pasa'}>
            {playerIndex === 0 ? '♛' : '👑'} {myName}
          </span>
          <span className="online-score">{myPlayer?.score ?? 0} puan</span>
        </div>
      </div>

      {/* Rakip eli */}
      <div className="hand hand-bot">
        {oppHand.map((_, i) => (
          <div key={i} className="card-3d-wrapper card-small">
            <div className="card-3d card-back" />
          </div>
        ))}
        {!myTurn && gameState.phase === 'playing' && (
          <div className="thinking">⏳ Rakip düşünüyor...</div>
        )}
      </div>

      {/* Masa */}
      <div className="table-area">
        <div className="pile-area">
          {(gameState.pile?.length ?? 0) === 0 && !flyingCard ? (
            <div className="pile-empty">Masa boş</div>
          ) : (
            <div className="pile-stack">
              {(gameState.pile ?? []).slice(-4).map((c, i, arr) => (
                <div key={c.id} style={{
                  position: 'absolute', top: i * 3, left: i * 3, zIndex: i,
                  transform: `rotate(${(i - arr.length / 2) * 3}deg)`,
                }}>
                  <CardComponent card={c} faceDown={i < arr.length - 1} />
                </div>
              ))}
            </div>
          )}
          {topPile && <div className="pile-label">{gameState.pile.length} kart</div>}
        </div>
      </div>

      {/* Uçan kart */}
      {flyingCard && (
        <div
          key={flyingCard.id}
          className={`flying-card flying-from-${flyingCard.from === 'me' ? 'player' : 'bot'}`}
          onAnimationEnd={handleAnimEnd}
        >
          <CardComponent card={flyingCard.card} />
        </div>
      )}

      {/* Mesaj */}
      <div className="message-bar">
        <span>{gameState.message}</span>
        {myTurn && <span className="turn-indicator"> — Senin sıran</span>}
      </div>

      {/* Kendi eli */}
      <div className="hand hand-player">
        {myHand.map(card => {
          const topCard = gameState.pile?.[gameState.pile.length - 1];
          const canCapture = topCard && (card.rank === topCard.rank || card.rank === 'J');
          const isFlying = flyingCard?.card.id === card.id && flyingCard.from === 'me';
          return (
            <div key={card.id} style={{ opacity: isFlying ? 0 : 1, transition: 'opacity 0.1s' }}>
              <CardComponent
                card={card}
                onClick={() => handlePlayCard(card)}
                highlight={!!canCapture && myTurn && !flyingCard}
              />
            </div>
          );
        })}
      </div>

      {/* Chat */}
      <div className="online-chat">
        <div className="chat-messages">
          {chat.map((m, i) => (
            <div key={i} className={`chat-msg ${m.from === myName ? 'chat-mine' : 'chat-theirs'}`}>
              <span className="chat-from">{m.from}:</span> {m.text}
            </div>
          ))}
        </div>
        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder="Mesaj..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendChat()}
            maxLength={60}
          />
          <button className="chat-send" onClick={sendChat}>➤</button>
        </div>
      </div>

      {/* Rakip ayrıldı */}
      {opponentLeft && (
        <div className="overlay-modal">
          <div className="modal-box">
            <div style={{ fontSize: '3rem' }}>😢</div>
            <h3>Rakip ayrıldı</h3>
            <button className="online-btn online-btn-create" onClick={onLeave}>Ana Menü</button>
          </div>
        </div>
      )}

      {/* Rövanş */}
      {rematchPending && (
        <div className="overlay-modal">
          <div className="modal-box">
            <div style={{ fontSize: '2rem' }}>🔄</div>
            <h3>Rövanş teklifi!</h3>
            <p>{opponentName} tekrar oynamak istiyor</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="online-btn online-btn-create" onClick={() => socket.send({ type: 'REMATCH_ACCEPT' })}>Kabul</button>
              <button className="online-btn online-btn-join" onClick={() => setRematchPending(false)}>Reddet</button>
            </div>
          </div>
        </div>
      )}

      {/* Oyun sonu */}
      {gameState.phase === 'gameover' && !opponentLeft && (
        <div className="overlay-modal">
          <div className="modal-box">
            <div style={{ fontSize: '3.5rem' }}>
              {myPlayer.score > oppPlayer.score ? '🏆' : myPlayer.score === oppPlayer.score ? '🤝' : '😔'}
            </div>
            <h3 className="gameover-online-title">
              {myPlayer.score > oppPlayer.score ? 'Kazandın!' : myPlayer.score === oppPlayer.score ? 'Berabere!' : 'Kaybettin!'}
            </h3>
            <div className="gameover-scores">
              <div className={`go-score ${myPlayer.score >= oppPlayer.score ? 'go-winner' : ''}`}>
                <span>{myName}</span>
                <strong>{myPlayer.score}</strong>
                <small>{myPlayer.pistiCount} pişti</small>
              </div>
              <div className={`go-score ${oppPlayer.score > myPlayer.score ? 'go-winner' : ''}`}>
                <span>{opponentName}</span>
                <strong>{oppPlayer.score}</strong>
                <small>{oppPlayer.pistiCount} pişti</small>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="online-btn online-btn-create" onClick={() => socket.send({ type: 'REMATCH' })}>🔄 Rövanş</button>
              <button className="online-btn online-btn-join" onClick={onLeave}>Çık</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
