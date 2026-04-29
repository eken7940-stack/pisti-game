import React from 'react';
import type { Difficulty } from '../game/types';

interface Props {
  onSelect: (d: Difficulty) => void;
  onOnline: () => void;
  onStats: () => void;
  onlineCount: number;
}

const options: { value: Difficulty; label: string; desc: string; emoji: string }[] = [
  { value: 'easy',   label: 'Kolay',  desc: 'Bot rastgele oynar',   emoji: '😊' },
  { value: 'normal', label: 'Normal', desc: 'Bot akıllıca düşünür', emoji: '🤔' },
  { value: 'hard',   label: 'Zor',    desc: 'Bot optimal oynar',    emoji: '🧠' },
];

export const DifficultySelect: React.FC<Props> = ({ onSelect, onOnline, onStats, onlineCount }) => (
  <div className="menu">
    {/* Online sayaç */}
    {onlineCount > 0 && (
      <div className="online-badge">
        <span className="online-dot" />
        {onlineCount} çevrimiçi
      </div>
    )}

    <div className="menu-title">
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

      <button className="stats-menu-btn" onClick={onStats}>
        📊 İstatistiklerim
      </button>
    </div>
  </div>
);
