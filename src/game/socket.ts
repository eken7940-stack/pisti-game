type Handler = (data: Record<string, unknown>) => void;

class GameSocket {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Handler[]>();

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);
      this.ws.onopen = () => resolve();
      this.ws.onerror = () => reject(new Error('Bağlantı kurulamadı'));
      this.ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          const list = this.handlers.get(data.type) ?? [];
          list.forEach(h => h(data));
        } catch { /* ignore */ }
      };
      this.ws.onclose = () => {
        const list = this.handlers.get('DISCONNECTED') ?? [];
        list.forEach(h => h({}));
      };
    });
  }

  on(type: string, handler: Handler) {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type)!.push(handler);
  }

  off(type: string, handler: Handler) {
    const list = this.handlers.get(type) ?? [];
    this.handlers.set(type, list.filter(h => h !== handler));
  }

  send(data: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
  }
}

export const socket = new GameSocket();
