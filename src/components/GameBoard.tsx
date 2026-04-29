import React, { useEffect, useState, useRef } from 'react';
import type { GameState, Card } from '../game/types';
import { playCard } from '../game/gameLogic';
import { botMove } from '../game/bot';
import { CardComponent } from './Card';
import { ScoreBoard } from './ScoreBoard';
import { SFX } from '../game/audio';

interface Props {
  state: GameState;
  onStateChange: (s: GameState) => void;
  onRestart: () => void;
}

interface FlyingCard {
  card: Card;
  from: 'player' | 'bot';
  id: number;
}

let flyId = 0;

export const GameBoard: React.FC<Props> = ({ state, onStateChange, onRestart }) => {
  const [botThinking, setBotThinking] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [flyingCard, setFlyingCard] = useState<FlyingCard | null>(null);
  const pendingState = useRef<GameState | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPhase = useRef(state.phase);

  // Oyun bitince ses
  useEffect(() => {
    if (state.phase === 'gameover' && prevPhase.current === 'playing') {
      const playerWon = state.player.score > state.bot.score;
      setTimeout(() => playerWon ? SFX.win() : SFX.lose(), 300);
    }
    prevPhase.current = state.phase;
  }, [state.phase]);

  // Bot hamlesi
  useEffect(() => {
    if (state.currentTurn === 'bot' && state.phase === 'playing' && !botThinking) {
      setBotThinking(true);
      const delay = 4000;
      setCountdown(4);

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

        // Ses
        if (next.message.includes('pişti')) SFX.botPisti();
        else if (next.pile.length === 0) SFX.cardCapture();
        else SFX.cardPlay();

        setFlyingCard({ card, from: 'bot', id: ++flyId });
      }, delay);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownRef.current!);
      };
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
    const next = playCard(state, card, 'player');
    pendingState.current = next;

    // Ses
    if (next.message.includes('Pişti')) SFX.pisti();
    else if (next.pile.length === 0) SFX.cardCapture();
    else SFX.cardPlay();

    setFlyingCard({ card, from: 'player', id: ++flyId });
  };

  const topPile = state.pile[state.pile.length - 1];

  if (state.phase === 'gameover') {
    const playerWon = state.player.score > state.bot.score;
    const tie = state.player.score === state.bot.score;
    return (
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
        </div>
      </div>
    );
  }

  return (
    <div className="gameboard">
      <ScoreBoard
        player={state.player}
        bot={state.bot}
        deckCount={state.deck.length}
        pileCount={state.pile.length}
      />

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
                <div
                  key={c.id}
                  style={{
                    position: 'absolute',
                    top: i * 3, left: i * 3, zIndex: i,
                    transform: `rotate(${(i - arr.length / 2) * 3}deg)`,
                  }}
                >
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
        <div
          key={flyingCard.id}
          className={`flying-card flying-from-${flyingCard.from}`}
          onAnimationEnd={handleAnimEnd}
        >
          <CardComponent card={flyingCard.card} />
        </div>
      )}

      {/* Mesaj */}
      <div className="message-bar">
        <span>{state.message}</span>
        {state.currentTurn === 'player' && state.phase === 'playing' && !flyingCard && (
          <span className="turn-indicator"> — Senin sıran</span>
        )}
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
    </div>
  );
};
