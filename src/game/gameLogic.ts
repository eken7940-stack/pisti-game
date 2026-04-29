import type { Card, GameState, Difficulty, Player } from './types';
import { cardPoints, createDeck } from './deck';

function emptyPlayer(): Player {
  return { hand: [], captured: [], score: 0, pistiCount: 0 };
}

export function initGame(difficulty: Difficulty): GameState {
  const deck = createDeck();
  // İlk 4 kart masaya, üstteki J ise alta gömülür
  let pile: Card[] = [];
  let remaining = [...deck];

  // 4 kart masaya aç
  const initial = remaining.splice(0, 4);
  // J masanın üstünde olmamalı
  while (initial[initial.length - 1].rank === 'J') {
    initial.unshift(initial.pop()!);
  }
  pile = initial;

  const player = emptyPlayer();
  const bot = emptyPlayer();

  // Her oyuncuya 4 kart dağıt
  player.hand = remaining.splice(0, 4);
  bot.hand = remaining.splice(0, 4);

  return {
    deck: remaining,
    pile,
    player,
    bot,
    currentTurn: 'player',
    phase: 'playing',
    difficulty,
    lastCapturer: null,
    message: 'Kartını seç!',
    roundNumber: 1,
  };
}

export function dealCards(state: GameState): GameState {
  if (state.deck.length === 0) return state;
  const deck = [...state.deck];
  const player = { ...state.player, hand: deck.splice(0, 4) };
  const bot = { ...state.bot, hand: deck.splice(0, 4) };
  return { ...state, deck, player, bot };
}

export function playCard(state: GameState, card: Card, by: 'player' | 'bot'): GameState {
  const actor = by === 'player' ? { ...state.player } : { ...state.bot };
  const other = by === 'player' ? { ...state.bot } : { ...state.player };

  // Kartı elden çıkar
  actor.hand = actor.hand.filter(c => c.id !== card.id);

  const pile = [...state.pile];
  let message = '';
  let lastCapturer = state.lastCapturer;

  const topCard = pile[pile.length - 1];
  const captures = topCard && (card.rank === topCard.rank || card.rank === 'J');

  if (captures) {
    const isPisti = pile.length === 1 && card.rank !== 'J';
    pile.push(card);
    actor.captured = [...actor.captured, ...pile];
    if (isPisti) {
      actor.pistiCount += 1;
      message = by === 'player' ? '🎉 Pişti! +10 puan!' : '🤖 Bot pişti yaptı!';
    } else {
      message = by === 'player' ? '✅ Aldın!' : '🤖 Bot aldı!';
    }
    lastCapturer = by;
    const newPile: Card[] = [];

    const newState: GameState = {
      ...state,
      pile: newPile,
      lastCapturer,
      message,
      player: by === 'player' ? actor : other,
      bot: by === 'bot' ? actor : other,
      currentTurn: by === 'player' ? 'bot' : 'player',
    };
    return checkRoundEnd(newState);
  } else {
    pile.push(card);
    message = by === 'player' ? 'Kart bırakıldı.' : '🤖 Bot kart bıraktı.';
    const newState: GameState = {
      ...state,
      pile,
      lastCapturer,
      message,
      player: by === 'player' ? actor : other,
      bot: by === 'bot' ? actor : other,
      currentTurn: by === 'player' ? 'bot' : 'player',
    };
    return checkRoundEnd(newState);
  }
}

function checkRoundEnd(state: GameState): GameState {
  const bothEmpty = state.player.hand.length === 0 && state.bot.hand.length === 0;
  if (!bothEmpty) return state;

  if (state.deck.length > 0) {
    return dealCards({ ...state, roundNumber: state.roundNumber + 1 });
  }

  // Oyun bitti - kalan masayı son alana ver
  let player = { ...state.player };
  let bot = { ...state.bot };

  if (state.pile.length > 0) {
    if (state.lastCapturer === 'player') {
      player.captured = [...player.captured, ...state.pile];
    } else if (state.lastCapturer === 'bot') {
      bot.captured = [...bot.captured, ...state.pile];
    } else {
      // Kimse almadıysa oyuncuya ver
      player.captured = [...player.captured, ...state.pile];
    }
  }

  // Daha fazla kart alan +3 puan
  const playerCardCount = player.captured.length;
  const botCardCount = bot.captured.length;

  player.score = calcScore(player);
  bot.score = calcScore(bot);

  if (playerCardCount > botCardCount) player.score += 3;
  else if (botCardCount > playerCardCount) bot.score += 3;

  return { ...state, pile: [], player, bot, phase: 'gameover', message: 'Oyun bitti!' };
}

export function calcScore(player: Player): number {
  let score = player.pistiCount * 10;
  for (const card of player.captured) {
    score += cardPoints(card);
  }
  return score;
}
