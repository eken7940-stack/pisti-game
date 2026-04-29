import React, { useEffect, useState, useRef } from 'react';
import type { GameState, Card } from '../game/types';
import { playCard } from '../game/gameLogic';
import { botMove } from '../game/bot';
import { CardComponent } from './Card';
import { ScoreBoard } from './ScoreBoard';
import { SFX } from '../game/audio';
import { Confetti } from './Confetti';
import { updateStats } from '../game/stats';

interface Props {
  state: GameState;
  onStateChange: (s: GameState) => void;
  onRestart: () => void;
}

interface FlyingCard { card: Card; from: 'player' | 'bot'; id: number; }

const EMOJIS = ['👏','🔥','😂','😤','🎉','💀'];
const MOVE_TIME = 20; // saniye
let flyId = 0;

function vibrate(ms: number | number[]) {
  try { navigator.vibrate?.(ms as number); } catch { /* ignore */ }
}

export const GameBoard: React.FC<Props> = ({ state, onStateChange, onRestart }) => {
  const [botThinking, setBotThinking] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [flyingCard, setFlyingCard] = useState<FlyingCard | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [moveTimer, setMoveTimer] = useState(MOVE_TIME);
  const [lastCards, setLastCards] = useState<Card[]>([]);
  const [reaction, setReaction] = useState<string | null>(null);
  const [floatingReaction, setFloatingReaction] = useState<{ emoji: string; id: number } | null>(null);

  const pendingState = useRef<GameState | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPhase = useRef(state.phase);
  const statsUpdated = useRef(false);

  // Oyun bitince istatistik + konfeti
  useEffect(() => {
    if (state.phase === 'gameover' && prevPhase.current === 'playing' && !statsUpdated.current) {
      statsUpdated.current = true;
      const playerWon = state.player.score > state.bot.score;
      const tie = state.player.score === state.bot.score;
      const result = tie ? 'draw' : playerWon ? 'win' : 'loss';
      updateStats(result, state.player.pistiCount);
      if (playerWon) {
        setShowConfetti(true);
        SFX.win();
        vibrate(200);
        setTimeout(() => setShowConfetti(false), 4000);
      } else if (!tie) {
        SFX.lose();
        vibrate([100, 50, 100]);
      }
    }
    prevPhase.current = state.phase;
  }, [state.phase]);

  // Oyuncu hamle sayacı
  useEffect(() => {
    if (state.currentTurn === 'player' && state.phase === 'playing' && !flyingCard) {
      setMoveTimer(MOVE_TIME);
      clearInterval(moveTimerRef.current!);
      moveTimerRef.current = setInterval(() => {
        setMoveTimer(prev => {
          if (prev <= 1) {
            clearInterval(moveTimerRef.current!);
            // Süre dolunca rastgele kart at
            if (state.player.hand.length > 0) {
              const randomCard = state.player.hand[Math.floor(Math.random() * state.player.hand.length)];
              handlePlayerCard(randomCard);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(moveTimerRef.current!);
    }
    return () => clearInterval(moveTimerRef.current!);
  }, [state.currentTurn, state.phase, flyingCard]);

  // Bot hamlesi
  useEffect(() => {
    if (state.currentTurn === 'bot' && state.phase === 'playing' && !botThinking) {
      setBotThinking(true);
      const delay = 3000;
      setCountdown(3);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);

      const timer = setTimeout(() => {
        clearInterval(countdownRef.current!);
        setCountdown(0);
        setBotThinking(false);
        const card = botMove(state);
        const next = playCard(state, card, 'bot');
        pendingState.current = next;
        if (next.message.includes('pişti')) SFX.botPisti();
        else if (next.pile.length === 0) { SFX.cardCapture(); vibrate(80); }
        else SFX.cardPlay();
        setLastCards(prev => [card, ...prev].slice(0, 5));
        setFlyingCard({ card, from: 'bot', id: ++flyId });
      }, delay);

      return () => { clearTimeout(timer); clearInterval(countdownRef.current!); };
    }
  }, [state.currentTurn, state.phase]);

  const handleAnimEnd = () => {
    if (pendingState.current) {
      onStateChange(pendingState.current);
      pendingState.current = null;
    }
    setFlyingCard(null);
  };

  const handlePlayerCard = (card: Card) => {
    if (state.currentTurn !== 'player' || state.phase !== 'playing' || botThinking || flyingCard) return;
    clearInterval(moveTimerRef.current!);
    const next = playCard(state, card, 'player');
    pendingState.current = next;
    if (next.message.includes('Pişti')) { SFX.pisti(); vibrate([50, 30, 100]); }
    else if (next.pile.length === 0) { SFX.cardCapture(); vibrate(80); }
    else { SFX.cardPlay(); vibrate(30); }
    setLastCards(prev => [card, ...prev].slice(0, 5));
    setFlyingCard({ card, from: 'player', id: ++flyId });
  };

  const sendReaction = (emoji: string) => {
    setReaction(emoji);
    setFloatingReaction({ emoji, id: Date.now() });
    vibrate(40);
    setTimeout(() => setReaction(null), 2000);
    setTimeout(() => setFloatingReaction(null), 1200);
  };

  const topPile = state.pile[state.pile.length - 1];
  const timerPct = (moveTimer / MOVE_TIME) * 100;
  const timerColor = moveTimer <= 5 ? '#ef4444' : moveTimer <= 10 ? '#f59e0b' : '#6c63ff';

  if (state.phase === 'gameover') {
    const playerWon = state.player.score > state.bot.score;
    const tie = state.player.score === state.bot.score;
    return (
      <>
        {showConfetti && <Confetti />}
        <div className="gameover">
          <div className="gameover-card">
            <div className="gameover-emoji">{tie ? '🤝' : playerWon ? '🏆' : '😔'}</div>
            <h2>{tie ? 'Berabere!' : playerWon ? 'Kazandın!' : 'Kaybettin!'}</h2>
            <div className="gameover-scores">
              <div className={`go-score ${playerWon ? 'go-winner' : ''}`}>
                <span>Sen</span>
                <strong>{state.player.score}</strong>
                <small>{state.player.pistiCount} pişti</small>
              </div>
              <div className={`go-score ${!playerWon && !tie ? 'go-winner' : ''}`}>
                <span>Bot</span>
                <strong>{state.bot.score}</strong>
                <small>{state.bot.pistiCount} pişti</small>
              </div>
            </div>
            <button className="btn-restart" onClick={onRestart}>Tekrar Oyna</button>
            <button className="btn-quit" onClick={onRestart}>Ana Menü</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="gameboard">
      {showConfetti && <Confetti />}

      <ScoreBoard player={state.player} bot={state.bot} deckCount={state.deck.length} pileCount={state.pile.length} />
      <button className="quit-btn" onClick={() => setConfirmQuit(true)} title="Çık">✕</button>

      {/* Bot eli */}
      <div className="hand hand-bot">
        {state.bot.hand.map((_, i) => (
          <div key={i} className="card-3d-wrapper card-small">
            <div className="card-3d card-back" />
          </div>
        ))}
        {botThinking && (
          <div className="thinking">
            🤔 Düşünüyor
            {countdown > 0 && <span className="countdown">{countdown}s</span>}
          </div>
        )}
      </div>

      {/* Masa */}
      <div className="table-area">
        <div className="pile-area">
          {state.pile.length === 0 && !flyingCard ? (
            <div className="pile-empty">Masa boş</div>
          ) : (
            <div className="pile-stack">
              {state.pile.slice(-4).map((c, i, arr) => (
                <div key={c.id} style={{
                  position: 'absolute', top: i * 3, left: i * 3, zIndex: i,
                  transform: `rotate(${(i - arr.length / 2) * 3}deg)`,
                }}>
                  <CardComponent card={c} faceDown={i < arr.length - 1} />
                </div>
              ))}
            </div>
          )}
          {topPile && <div className="pile-label">{state.pile.length} kart</div>}
        </div>
      </div>

      {/* Uçan kart */}
      {flyingCard && (
        <div key={flyingCard.id} className={`flying-card flying-from-${flyingCard.from}`} onAnimationEnd={handleAnimEnd}>
          <CardComponent card={flyingCard.card} />
        </div>
      )}

      {/* Floating emoji reaksiyon */}
      {floatingReaction && (
        <div key={floatingReaction.id} className="floating-reaction">{floatingReaction.emoji}</div>
      )}

      {/* Mesaj + hamle sayacı */}
      <div className="message-bar">
        <span>{state.message}</span>
        {state.currentTurn === 'player' && state.phase === 'playing' && !flyingCard && (
          <span className="turn-indicator"> — Senin sıran</span>
        )}
      </div>

      {/* Hamle sayacı */}
      {state.currentTurn === 'player' && state.phase === 'playing' && !flyingCard && (
        <div className="move-timer-bar">
          <div
            className="move-timer-fill"
            style={{ width: `${timerPct}%`, background: timerColor, transition: 'width 1s linear, background 0.3s' }}
          />
          <span className="move-timer-text" style={{ color: timerColor }}>{moveTimer}s</span>
        </div>
      )}

      {/* Emoji reaksiyonlar */}
      <div className="emoji-reactions">
        {EMOJIS.map(e => (
          <button
            key={e}
            className={`emoji-btn ${reaction === e ? 'emoji-btn-active' : ''}`}
            onClick={() => sendReaction(e)}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Oyuncu eli */}
      <div className="hand hand-player">
        {state.player.hand.map(card => {
          const topCard = state.pile[state.pile.length - 1];
          const canCapture = topCard && (card.rank === topCard.rank || card.rank === 'J');
          const isFlying = flyingCard?.card.id === card.id;
          return (
            <div key={card.id} style={{ opacity: isFlying ? 0 : 1, transition: 'opacity 0.1s' }}>
              <CardComponent
                card={card}
                onClick={() => handlePlayerCard(card)}
                highlight={!!canCapture && state.currentTurn === 'player' && !flyingCard}
              />
            </div>
          );
        })}
      </div>

      {/* Çıkış onay */}
      {confirmQuit && (
        <div className="overlay-modal">
          <div className="modal-box">
            <div style={{ fontSize: '2.5rem' }}>🚪</div>
            <h3>Oyundan Çık?</h3>
            <p>İlerleme kaybolacak.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button className="online-btn online-btn-create" onClick={onRestart}>Çık</button>
              <button className="online-btn online-btn-join" onClick={() => setConfirmQuit(false)}>Devam Et</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
