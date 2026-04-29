import React from 'react';
import type { Difficulty } from '../game/types';

interface Props {
  onSelect: (d: Difficulty) => void;
  onOnline: () => void;
}

const options: { value: Difficulty; label: string; desc: string; emoji: string }[] = [
  { value: 'easy',   label: 'Kolay',  desc: 'Bot rastgele oynar',   emoji: '😊' },
  { value: 'normal', label: 'Normal', desc: 'Bot akıllıca düşünür', emoji: '🤔' },
  { value: 'hard',   label: 'Zor',    desc: 'Bot optimal oynar',    emoji: '🧠' },
];

export const DifficultySelect: React.FC<Props> = ({ onSelect, onOnline }) => (
  <div className="menu">
    <div className="menu-title">
      {/* Meta logo */}
      <div className="title-crowns">
        <span className="meta-logo">∞</span>
      </div>
      <h1 className="game-title">
        <span className="title-meta">Meta</span>
        <span className="title-amp"> </span>
        <span className="title-pasa">Pişti Salonu</span>
      </h1>
      <p className="menu-subtitle">Türk Kart Oyunu</p>
    </div>

    <div className="menu-modes">
      {/* Solo mod */}
      <div className="mode-section">
        <p className="mode-label">🤖 Bota Karşı Oyna</p>
        <div className="difficulty-options">
          {options.map(opt => (
            <button
              key={opt.value}
              className={`difficulty-btn difficulty-${opt.value}`}
              onClick={() => onSelect(opt.value)}
            >
              <span className="diff-emoji">{opt.emoji}</span>
              <span className="diff-label">{opt.label}</span>
              <span className="diff-desc">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Online mod */}
      <div className="mode-section">
        <p className="mode-label">🌐 Online Oyna</p>
        <button className="online-mode-btn" onClick={onOnline}>
          <span className="online-mode-icon">⚔️</span>
          <div>
            <span className="online-mode-title">2 Kişilik Online</span>
            <span className="online-mode-desc">Arkadaşınla oyna</span>
          </div>
        </button>
      </div>
    </div>
  </div>
);
