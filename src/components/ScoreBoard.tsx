import React from 'react';
import type { Player } from '../game/types';

interface Props {
  player: Player;
  bot: Player;
  deckCount: number;
  pileCount: number;
}

export const ScoreBoard: React.FC<Props> = ({ player, bot, deckCount, pileCount }) => (
  <div className="scoreboard">
    <div className="score-item">
      <span className="score-label">Sen</span>
      <span className="score-value">{player.score}</span>
      <span className="score-sub">{player.captured.length} kart · {player.pistiCount} pişti</span>
    </div>
    <div className="score-middle">
      <span>🂠 {deckCount} kart</span>
      <span>📚 {pileCount} masada</span>
    </div>
    <div className="score-item score-item-right">
      <span className="score-label">Bot</span>
      <span className="score-value">{bot.score}</span>
      <span className="score-sub">{bot.captured.length} kart · {bot.pistiCount} pişti</span>
    </div>
  </div>
);
