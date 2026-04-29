import { useState } from 'react';
import { DifficultySelect } from './components/DifficultySelect';
import { GameBoard } from './components/GameBoard';
import { OnlineRoom } from './components/OnlineRoom';
import { OnlineGame } from './components/OnlineGame';
import { Radio } from './components/Radio';
import type { Difficulty, GameState } from './game/types';
import { initGame } from './game/gameLogic';
import { socket } from './game/socket';
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

  return (
    <>
      {screen === 'menu' && (
        <DifficultySelect
          onSelect={handleSoloStart}
          onOnline={() => setScreen('online-lobby')}
        />
      )}
      {screen === 'solo' && gameState && (
        <GameBoard
          state={gameState}
          onStateChange={setGameState}
          onRestart={() => setScreen('menu')}
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
      <Radio />
    </>
  );
}
