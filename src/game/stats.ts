export interface GameStats {
  wins: number;
  losses: number;
  draws: number;
  totalPisti: number;
  totalGames: number;
}

const KEY = 'meta_pisti_stats';

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { wins: 0, losses: 0, draws: 0, totalPisti: 0, totalGames: 0 };
}

export function saveStats(s: GameStats) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function updateStats(result: 'win' | 'loss' | 'draw', pistiCount: number) {
  const s = loadStats();
  s.totalGames++;
  s.totalPisti += pistiCount;
  if (result === 'win') s.wins++;
  else if (result === 'loss') s.losses++;
  else s.draws++;
  saveStats(s);
  return s;
}
