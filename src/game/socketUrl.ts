// Local'de ws://localhost:3001, production'da aynı domain üzerinden wss://
export function getSocketUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const host = import.meta.env.DEV ? 'localhost:3001' : location.host;
  return `${proto}://${host}`;
}
