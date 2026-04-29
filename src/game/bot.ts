import type { Card, GameState } from './types';
import { cardPoints } from './deck';

export function botMove(state: GameState): Card {
  const hand = state.bot.hand;
  const pile = state.pile;
  const topCard = pile[pile.length - 1];
  const difficulty = state.difficulty;

  if (difficulty === 'easy') return easyBot(hand, topCard);
  if (difficulty === 'normal') return normalBot(hand, topCard, pile);
  return hardBot(hand, topCard, pile);
}

// Kolay: rastgele oyna, sadece bariz eşleşmeleri yakala
function easyBot(hand: Card[], topCard: Card | undefined): Card {
  if (topCard) {
    const match = hand.find(c => c.rank === topCard.rank);
    if (match && Math.random() > 0.3) return match; // %70 ihtimalle yakala
  }
  return hand[Math.floor(Math.random() * hand.length)];
}

// Normal: eşleşmeleri yakala, J'yi akıllıca kullan
function normalBot(hand: Card[], topCard: Card | undefined, pile: Card[]): Card {
  if (topCard) {
    // Pişti fırsatı (tek kart varsa ve J değilse)
    if (pile.length === 1) {
      const pistiCard = hand.find(c => c.rank === topCard.rank);
      if (pistiCard) return pistiCard;
    }
    // Normal eşleşme
    const match = hand.find(c => c.rank === topCard.rank);
    if (match) return match;
    // J ile al
    const jack = hand.find(c => c.rank === 'J');
    if (jack && pile.length >= 3) return jack; // Yığın büyükse J kullan
  }
  // Değersiz kart bırak
  return leastValuableCard(hand);
}

// Zor: puan hesabı yaparak optimal oyna
function hardBot(hand: Card[], topCard: Card | undefined, pile: Card[]): Card {
  if (topCard) {
    // Pişti fırsatı
    if (pile.length === 1 && topCard.rank !== 'J') {
      const pistiCard = hand.find(c => c.rank === topCard.rank);
      if (pistiCard) return pistiCard;
    }
    // Yüksek puanlı yığını J ile al
    const pilePoints = pile.reduce((sum, c) => sum + cardPoints(c), 0);
    const jack = hand.find(c => c.rank === 'J');
    if (jack && pilePoints >= 3) return jack;

    // Eşleşme varsa al
    const match = hand.find(c => c.rank === topCard.rank);
    if (match) return match;
  }

  // J'yi sakla, değersiz kart bırak
  return leastValuableCard(hand);
}

function leastValuableCard(hand: Card[]): Card {
  // Önce puansız ve J olmayan kartları bırak
  const safe = hand.filter(c => cardPoints(c) === 0 && c.rank !== 'J');
  if (safe.length > 0) return safe[Math.floor(Math.random() * safe.length)];
  // Sonra puansız kartlar
  const noPoints = hand.filter(c => cardPoints(c) === 0);
  if (noPoints.length > 0) return noPoints[0];
  return hand[0];
}
