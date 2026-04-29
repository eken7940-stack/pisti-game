import React, { useState } from 'react';
import type { Card as CardType } from '../game/types';

interface Props {
  card: CardType;
  onClick?: () => void;
  faceDown?: boolean;
  small?: boolean;
  highlight?: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

export const CardComponent: React.FC<Props> = ({ card, onClick, faceDown, small, highlight }) => {
  const [hovered, setHovered] = useState(false);
  const isRed = RED_SUITS.has(card.suit);

  if (faceDown) {
    return (
      <div className={`card-3d-wrapper ${small ? 'card-small' : ''}`}>
        <div className="card-3d card-back" />
      </div>
    );
  }

  return (
    <div
      className={`card-3d-wrapper ${small ? 'card-small' : ''} ${onClick ? 'card-clickable' : ''} ${hovered && onClick ? 'card-hovered' : ''} ${highlight ? 'card-highlight' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`card-3d ${isRed ? 'card-red' : 'card-black'}`}>
        {/* Kart yüzeyi */}
        <div className="card-face card-front">
          <div className="card-corner card-top-left">
            <span className="card-rank">{card.rank}</span>
            <span className="card-suit-sm">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
          <div className="card-center-suit">{SUIT_SYMBOLS[card.suit]}</div>
          <div className="card-corner card-bottom-right">
            <span className="card-rank">{card.rank}</span>
            <span className="card-suit-sm">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
          {/* 3D kenar efekti */}
          <div className="card-shine" />
        </div>
      </div>
    </div>
  );
};
