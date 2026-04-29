import { useState, useEffect } from 'react';
import { DifficultySelect } from './components/DifficultySelect';
import { GameBoard } from './components/GameBoard';
import { OnlineRoom } from './components/OnlineRoom';
import { OnlineGame } from './components/OnlineGame';
import { Radio } from './components/Radio';
import { StatsPanel } from './components/StatsPanel';
import type { Difficulty, GameState } from './game/types';
import { initGame } from './game/gameLogic';
import { socket } from './game/socket';
import { loadStats } from './game/stats';
import type { GameStats } from './game/stats';
import './App.css';

type Screen = 'menu' | 'solo' | 'online-lobby' | 'online-game';

interface OnlineInfo {
  playerIndex: number;
  roomId: string;
  myName: string;
  opponentName: string;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [onlineInfo, setOnlineInfo] = useState<OnlineInfo | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<GameStats>(loadStats());
  const [onlineCount, setOnlineCount] = useState(0);

  // Online oyuncu sayacını dinle
  useEffect(() => {
    const handler = (d: Record<string, unknown>) => setOnlineCount(d.count as number);
    socket.on('ONLINE_COUNT', handler);
    return () => socket.off('ONLINE_COUNT', handler);
  }, []);

  const handleSoloStart = (difficulty: Difficulty) => {
    setGameState(initGame(difficulty));
    setScreen('solo');
  };

  const handleOnlineReady = (playerIndex: number, roomId: string, myName: string, opponentName: string) => {
    setOnlineInfo({ playerIndex, roomId, myName, opponentName });
    setScreen('online-game');
  };

  const handleLeaveOnline = () => {
    socket.disconnect();
    setOnlineInfo(null);
    setScreen('menu');
  };

  const handleRestart = () => {
    setStats(loadStats());
    setScreen('menu');
  };

  return (
    <>
      {screen === 'menu' && (
        <DifficultySelect
          onSelect={handleSoloStart}
          onOnline={() => setScreen('online-lobby')}
          onStats={() => { setStats(loadStats()); setShowStats(true); }}
          onlineCount={onlineCount}
        />
      )}
      {screen === 'solo' && gameState && (
        <GameBoard
          state={gameState}
          onStateChange={setGameState}
          onRestart={handleRestart}
        />
      )}
      {screen === 'online-lobby' && (
        <OnlineRoom
          onReady={handleOnlineReady}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'online-game' && onlineInfo && (
        <OnlineGame
          playerIndex={onlineInfo.playerIndex}
          myName={onlineInfo.myName}
          opponentName={onlineInfo.opponentName}
          onLeave={handleLeaveOnline}
        />
      )}
      {showStats && <StatsPanel stats={stats} onClose={() => setShowStats(false)} />}
      <Radio />
    </>
  );
}
