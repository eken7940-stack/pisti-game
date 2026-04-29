import React, { useState, useRef, useEffect } from 'react';

interface Message { from: string; text: string; }

interface Props {
  myName: string;
  opponentName: string;
  chat: Message[];
  onSend: (text: string) => void;
}

export const ChatBox: React.FC<Props> = ({ myName, chat, onSend }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const messagesRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(chat.length);

  useEffect(() => {
    if (!open && chat.length > prevLen.current) {
      setUnread(u => u + (chat.length - prevLen.current));
    }
    prevLen.current = chat.length;
    if (open && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [chat, open]);

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
    setTimeout(() => {
      if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }, 50);
  };

  const send = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <>
      {/* Toggle butonu */}
      <button className="chat-fab" onClick={() => open ? setOpen(false) : handleOpen()}>
        💬
        {unread > 0 && !open && <span className="chat-fab-badge">{unread}</span>}
      </button>

      {/* Chat paneli */}
      {open && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <span>💬 Sohbet</span>
            <button className="chat-panel-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-panel-messages" ref={messagesRef}>
            {chat.length === 0 && (
              <div className="chat-empty">Henüz mesaj yok</div>
            )}
            {chat.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.from === myName ? 'chat-bubble-mine' : 'chat-bubble-theirs'}`}>
                <span className="chat-bubble-name">{m.from}</span>
                <span className="chat-bubble-text">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="chat-panel-input-row">
            <input
              className="chat-panel-input"
              placeholder="Mesaj yaz..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              maxLength={60}
              autoFocus
            />
            <button className="chat-panel-send" onClick={send}>➤</button>
          </div>
        </div>
      )}
    </>
  );
};
