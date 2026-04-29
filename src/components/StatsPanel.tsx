import React from 'react';
import type { GameStats } from '../game/stats';

interface Props {
  stats: GameStats;
  onClose: () => void;
}

export const StatsPanel: React.FC<Props> = ({ stats, onClose }) => {
  const winRate = stats.totalGames > 0
    ? Math.round((stats.wins / stats.totalGames) * 100)
    : 0;

  return (
    <div className="overlay-modal" onClick={onClose}>
      <div className="modal-box stats-box" onClick={e => e.stopPropagation()}>
        <h3>📊 İstatistikler</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-val">{stats.totalGames}</span>
            <span className="stat-lbl">Oyun</span>
          </div>
          <div className="stat-item stat-win">
            <span className="stat-val">{stats.wins}</span>
            <span className="stat-lbl">Kazanma</span>
          </div>
          <div className="stat-item stat-loss">
            <span className="stat-val">{stats.losses}</span>
            <span className="stat-lbl">Kaybetme</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">{stats.draws}</span>
            <span className="stat-lbl">Beraberlik</span>
          </div>
          <div className="stat-item stat-pisti">
            <span className="stat-val">{stats.totalPisti}</span>
            <span className="stat-lbl">Toplam Pişti</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">%{winRate}</span>
            <span className="stat-lbl">Kazanma Oranı</span>
          </div>
        </div>
        <button className="online-btn online-btn-join" onClick={onClose}>Kapat</button>
      </div>
    </div>
  );
};
