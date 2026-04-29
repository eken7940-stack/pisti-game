import React, { useRef, useState, useEffect } from 'react';

interface Station {
  name: string;
  url: string;
  genre: string;
  emoji: string;
  logo?: string;
}

const STATIONS: Station[] = [
  {
    name: 'Polis Radyosu',
    url: 'https://m.egm.gov.tr:8093/stream?/;stream.mp3',
    genre: 'Polis',
    emoji: '🚔',
    logo: 'https://yt3.googleusercontent.com/B-o41U7LQULCf3TlBjmAmhIsPglR7hlGmbzn_wLLQbe1CGhP0b9cmr1xVp7lTv7nkuDFRfhIsg=s900-c-k-c0x00ffffff-no-rj',
  },
  {
    name: 'Slow 7',
    url: 'https://moondigitaledge2.radyotvonline.net/radyo7slow/playlist.m3u8',
    genre: 'Slow',
    emoji: '🎵',
    logo: 'https://www.canliradyodinle.fm/wp-content/uploads/slow-7.jpg',
  },
  {
    name: 'Slow Türk',
    url: 'https://radyo.duhnet.tv/slowturk?/;stream.mp3',
    genre: 'Slow',
    emoji: '🎶',
    logo: 'https://www.canliradyodinle.fm/wp-content/uploads/slow-turk-dinle.jpg',
  },
  {
    name: 'Efkar',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/EFKAR128AAC.aac?/;stream.mp3',
    genre: 'Arabesk',
    emoji: '😔',
    logo: 'https://www.canliradyodinle.fm/wp-content/uploads/efkar-fm.jpg',
  },
  {
    name: 'Kral Pop',
    url: 'https://dygedge.radyotvonline.net/kralpop/playlist.m3u8',
    genre: 'Pop',
    emoji: '👑',
    logo: 'https://www.canliradyodinle.fm/wp-content/uploads/kral-pop.jpg',
  },
  {
    name: 'Radyo Ekin',
    url: 'https://yayin.turkhosted.com:6006/stream?/;stream.mp3',
    genre: 'Türk Halk',
    emoji: '🌾',
    logo: 'https://www.canliradyodinle.fm/wp-content/uploads/radyo-ekin-fm.jpg',
  },
  {
    name: 'Joy Türk',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_TURK128AAC.aac?/;stream.mp3',
    genre: 'Türkçe Pop',
    emoji: '🎤',
    logo: 'https://www.canliradyodinle.fm/wp-content/uploads/joy-turk-dinle.jpg',
  },
  {
    name: 'Metro FM',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/METRO_FM128AAC.aac?/;stream.mp3',
    genre: 'Pop/Rock',
    emoji: '🎸',
    logo: 'https://www.canliradyodinle.fm/wp-content/uploads/metro-fm.jpg',
  },
  {
    name: 'Damar FM',
    url: 'https://moondigitaledge2.radyotvonline.net/radyo7arabesk/playlist.m3u8',
    genre: 'Arabesk',
    emoji: '💔',
    logo: 'https://www.canliradyodinle.fm/wp-content/uploads/damar-fm.jpg',
  },
  { name: 'Jazz FM',      url: 'https://stream.jazz.fm/jazz128',                 genre: 'Jazz',   emoji: '🎷' },
  { name: 'Lofi',         url: 'https://streams.ilovemusic.de/iloveradio17.mp3', genre: 'Lofi',   emoji: '🎧' },
  { name: 'Casino Vibes', url: 'https://streams.ilovemusic.de/iloveradio2.mp3',  genre: 'Pop',    emoji: '🎰' },
];

export const Radio: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Station | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const play = (station: Station) => {
    setError(false);
    setLoading(true);
    setCurrent(station);
    const audio = audioRef.current!;
    audio.src = station.url;
    audio.load();
    audio.play()
      .then(() => { setPlaying(true); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); setPlaying(false); });
  };

  const toggle = () => {
    const audio = audioRef.current!;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else if (current) {
      setLoading(true);
      audio.play()
        .then(() => { setPlaying(true); setLoading(false); })
        .catch(() => { setError(true); setLoading(false); });
    }
  };

  return (
    <>
      <audio ref={audioRef} onEnded={() => setPlaying(false)} />

      {/* Radyo butonu */}
      <button
        className="radio-fab"
        onClick={() => setOpen(o => !o)}
        title="Radyo"
        aria-label="Radyo aç/kapat"
      >
        {playing ? '📻' : '🎵'}
        {playing && <span className="radio-fab-dot" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="radio-panel">
          <div className="radio-header">
            <span className="radio-title">📻 Radyo</span>
            <button className="radio-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Şu an çalan */}
          <div className="radio-now">
            {current ? (
              <>
                {current.logo
                  ? <img src={current.logo} alt={current.name} className="radio-now-logo" />
                  : <span className="radio-now-emoji">{current.emoji}</span>
                }
                <div className="radio-now-info">
                  <span className="radio-now-name">{current.name}</span>
                  <span className="radio-now-genre">{current.genre}</span>
                </div>
                <button className="radio-play-btn" onClick={toggle} disabled={loading}>
                  {loading ? '⏳' : playing ? '⏸' : '▶'}
                </button>
              </>
            ) : (
              <span className="radio-hint">Bir istasyon seç</span>
            )}
          </div>

          {error && <div className="radio-error">⚠ Bağlanılamadı</div>}

          {/* İstasyonlar */}
          <div className="radio-stations">
            {STATIONS.map(s => (
              <button
                key={s.name}
                className={`radio-station ${current?.name === s.name ? 'radio-station-active' : ''}`}
                onClick={() => play(s)}
              >
                {s.logo
                  ? <img src={s.logo} alt={s.name} className="radio-station-logo" />
                  : <span>{s.emoji}</span>
                }
                <div className="radio-station-info">
                  <span className="radio-station-name">{s.name}</span>
                  <span className="radio-station-genre">{s.genre}</span>
                </div>
                {current?.name === s.name && playing && (
                  <span className="radio-equalizer">
                    <span /><span /><span />
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Ses */}
          <div className="radio-volume">
            <span>🔈</span>
            <input
              type="range" min={0} max={1} step={0.05}
              value={volume}
              onChange={e => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (audioRef.current) audioRef.current.volume = v;
              }}
            />
            <span>🔊</span>
          </div>
        </div>
      )}
    </>
  );
};
