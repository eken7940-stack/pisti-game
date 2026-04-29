const { WebSocketServer } = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;

// HTTP server — dist klasörünü serve eder
const server = http.createServer((req, res) => {
  const distPath = path.join(__dirname, '..', 'dist');
  let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url);

  // SPA fallback
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distPath, 'index.html');
  }

  const ext = path.extname(filePath);
  const mime = {
    '.html': 'text/html',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.svg':  'image/svg+xml',
    '.png':  'image/png',
    '.ico':  'image/x-icon',
    '.woff2':'font/woff2',
  }[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

// WebSocket server — aynı HTTP server üzerinde
const wss = new WebSocketServer({ server });

const rooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function send(ws, data) {
  if (ws.readyState === 1) ws.send(JSON.stringify(data));
}

function broadcast(room, data, excludeWs = null) {
  room.players.forEach(p => {
    if (p && p !== excludeWs) send(p, data);
  });
}

wss.on('connection', (ws) => {
  ws.roomId = null;
  ws.playerIndex = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'CREATE_ROOM': {
        const roomId = generateRoomId();
        rooms.set(roomId, {
          players: [ws, null],
          names: [msg.name || 'Oyuncu 1', null],
        });
        ws.roomId = roomId;
        ws.playerIndex = 0;
        send(ws, { type: 'ROOM_CREATED', roomId, playerIndex: 0 });
        console.log(`Oda oluşturuldu: ${roomId}`);
        break;
      }

      case 'JOIN_ROOM': {
        const roomId = msg.roomId?.toUpperCase();
        const room = rooms.get(roomId);
        if (!room)            { send(ws, { type: 'ERROR', message: 'Oda bulunamadı' }); return; }
        if (room.players[1])  { send(ws, { type: 'ERROR', message: 'Oda dolu' });       return; }

        room.players[1] = ws;
        room.names[1] = msg.name || 'Oyuncu 2';
        ws.roomId = roomId;
        ws.playerIndex = 1;

        send(ws, { type: 'ROOM_JOINED', roomId, playerIndex: 1, opponentName: room.names[0] });
        send(room.players[0], { type: 'OPPONENT_JOINED', opponentName: room.names[1] });
        console.log(`${roomId} odasına katılındı`);
        break;
      }

      case 'PLAY_CARD': {
        const room = rooms.get(ws.roomId);
        if (!room) return;
        broadcast(room, { type: 'OPPONENT_PLAYED', card: msg.card, playerIndex: ws.playerIndex }, ws);
        break;
      }

      case 'GAME_STATE': {
        const room = rooms.get(ws.roomId);
        if (!room) return;
        broadcast(room, { type: 'GAME_STATE', state: msg.state }, ws);
        break;
      }

      case 'CHAT': {
        const room = rooms.get(ws.roomId);
        if (!room) return;
        broadcast(room, { type: 'CHAT', text: msg.text, from: room.names[ws.playerIndex] }, ws);
        break;
      }

      case 'REMATCH': {
        const room = rooms.get(ws.roomId);
        if (!room) return;
        broadcast(room, { type: 'REMATCH_REQUEST', from: ws.playerIndex }, ws);
        break;
      }

      case 'REMATCH_ACCEPT': {
        const room = rooms.get(ws.roomId);
        if (!room) return;
        broadcast(room, { type: 'REMATCH_START' });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!ws.roomId) return;
    const room = rooms.get(ws.roomId);
    if (!room) return;
    broadcast(room, { type: 'OPPONENT_LEFT' }, ws);
    room.players[ws.playerIndex] = null;
    if (room.players.every(p => !p)) rooms.delete(ws.roomId);
  });
});

server.listen(PORT, () => {
  console.log(`🃏 Berra & Paşa server: http://localhost:${PORT}`);
});
