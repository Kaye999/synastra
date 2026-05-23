"use client";

// ChatWidget — Synastra Oracle. Floating brass sigil bottom-right that opens
// a slide-over panel with a streaming chat. Tier-gated:
//   free   → panel shows an upgrade CTA, no input
//   reader → 10 questions/day, shown in header
//   depth  → unlimited
// Streams SSE events from /api/chat (see route handler for format).

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Tier } from '@/lib/types';

type Role = 'user' | 'assistant';
type Msg = { role: Role; content: string };

type Props = {
  chartContext: unknown;
  firstName: string;
  tier: Tier;
  userId: string;
};

const UI_HISTORY_MAX = 20; // rendered in the panel
const API_HISTORY_MAX = 10; // sent to the API per request

const BRASS = '#C8A052';
const MIDNIGHT = '#0F1320';
const RAISE = '#161B2B';
const CREAM = '#FCFAF6';
const INK_FAINT = 'rgba(252,250,246,0.55)';
const RULE = 'rgba(252,250,246,0.08)';

type SpeechRecognitionLike = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (e: { results: { isFinal: boolean; 0: { transcript: string } }[] & { length: number } }) => void;
  onerror: (e: { error?: string }) => void;
  onend: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function ChatWidget({ chartContext, firstName, tier, userId }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaHit, setQuotaHit] = useState(false);
  // Voice mode — when on, the mic button captures speech and the
  // assistant's reply is spoken aloud after it finishes streaming.
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const storageKey = `synastra.chat.${userId}`;
  const canChat = tier === 'reader' || tier === 'depth' || tier === 'master';
  const canVoice = canChat; // same gate as text chat

  // Initialise the audio element once for TTS playback.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const a = new Audio();
    a.preload = 'none';
    a.addEventListener('ended', () => setSpeaking(false));
    a.addEventListener('error', () => setSpeaking(false));
    audioElRef.current = a;
    return () => {
      a.pause();
      audioElRef.current = null;
    };
  }, []);

  // Load persisted history
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Msg[];
        if (Array.isArray(parsed)) setMessages(parsed.slice(-UI_HISTORY_MAX));
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  // Persist history
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-UI_HISTORY_MAX)));
    } catch {
      /* ignore */
    }
  }, [messages, storageKey]);

  // Autoscroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // Focus input on open
  useEffect(() => {
    if (open && canChat) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, canChat]);

  // ── Voice helpers ────────────────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;
    try {
      setSpeaking(true);
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok || !res.body) {
        setSpeaking(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = audioElRef.current;
      if (!a) return;
      a.src = url;
      a.onended = () => {
        URL.revokeObjectURL(url);
        setSpeaking(false);
      };
      await a.play();
    } catch {
      setSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    const a = audioElRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setSpeaking(false);
  }, []);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setError(null);
    setQuotaHit(false);

    const userMsg: Msg = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    // Seed assistant placeholder that we'll fill as tokens stream in.
    let assistantBuf = '';
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const payload = {
        messages: nextMessages.slice(-API_HISTORY_MAX).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        chartContext,
      };
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        setQuotaHit(true);
        setLoading(false);
        setMessages((prev) => prev.slice(0, -1)); // drop empty assistant
        return;
      }
      if (res.status === 402) {
        setError('Upgrade to Reader or Depth to ask the Oracle.');
        setLoading(false);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      if (!res.ok || !res.body) {
        setError('Something disturbed the transmission. Try again.');
        setLoading(false);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Split SSE frames (separated by blank lines)
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';

        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;
          let evt: { type: string; delta?: string; message?: string };
          try {
            evt = JSON.parse(jsonStr);
          } catch {
            continue;
          }
          if (evt.type === 'text' && typeof evt.delta === 'string') {
            assistantBuf += evt.delta;
            setMessages((prev) => {
              const out = prev.slice();
              const last = out[out.length - 1];
              if (last && last.role === 'assistant') {
                out[out.length - 1] = { role: 'assistant', content: assistantBuf };
              }
              return out;
            });
          } else if (evt.type === 'error') {
            setError('Something disturbed the transmission. Try again.');
          }
          // 'done' → loop will terminate on next read
        }
      }
    } catch {
      setError('Network fell silent. Try again.');
      setMessages((prev) => {
        if (prev.length && prev[prev.length - 1].role === 'assistant' && prev[prev.length - 1].content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setLoading(false);
      // If voice mode is on, speak the final assistant message.
      if (voiceMode && assistantBuf.trim()) {
        void speak(assistantBuf);
      }
    }
  }, [input, loading, messages, chartContext, voiceMode, speak]);

  // ── Speech-to-text via the browser's Web Speech API ──────────────────
  // No external API call — Web Speech API uses the browser's built-in
  // recogniser (Chrome/Edge: Google; Safari: Apple). Falls back to a
  // disabled mic if unavailable.
  const startListening = useCallback(() => {
    if (loading || quotaHit) return;
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError('Voice input is not supported in this browser yet.');
      return;
    }
    // Stop the assistant if it's mid-speech so the user can interrupt.
    stopSpeaking();
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-AU';
    rec.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setInput(transcript);
    };
    rec.onerror = (e) => {
      if (e.error && e.error !== 'aborted' && e.error !== 'no-speech') {
        setError(`Microphone: ${e.error}`);
      }
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      // Auto-send if voice mode is on and we have something to send.
      if (voiceMode) {
        // setInput is async; defer to next tick before checking.
        setTimeout(() => {
          if (inputRef.current?.value.trim()) {
            void send();
          }
        }, 50);
      }
    };
    recognitionRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }, [loading, quotaHit, voiceMode, send, stopSpeaking]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  const toggleListen = useCallback(() => {
    if (listening) stopListening();
    else startListening();
  }, [listening, startListening, stopListening]);

  const toggleVoiceMode = useCallback(() => {
    setVoiceMode((v) => {
      const next = !v;
      if (!next) {
        stopListening();
        stopSpeaking();
      }
      return next;
    });
  }, [stopListening, stopSpeaking]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const quotaLabel =
    tier === 'master'
      ? 'The Nine · unlimited'
      : tier === 'depth'
        ? 'The Seven · unlimited'
        : tier === 'reader'
          ? 'The Five · 10/day'
          : 'The Two · 3/day teaser';

  const visibleMessages = messages.slice(-UI_HISTORY_MAX);

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        aria-label="Ask the Oracle"
        onClick={() => setOpen(true)}
        className="synastra-chat-trigger"
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 60,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: MIDNIGHT,
          border: `1px solid ${BRASS}`,
          color: BRASS,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 160ms ease, box-shadow 160ms ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
        }}
      >
        <OracleSigil />
      </button>
      <style jsx global>{`
        .synastra-chat-trigger:hover {
          transform: scale(1.05);
          box-shadow: 0 0 18px rgba(200, 160, 82, 0.45), 0 4px 20px rgba(0, 0, 0, 0.45);
        }
        @keyframes synSlide {
          from { transform: translateX(24px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes synFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {open && (
        <div
          role="dialog"
          aria-label="Synastra Oracle"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            pointerEvents: 'none',
          }}
        >
          {/* Scrim (clickable to close) */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(5,7,14,0.55)',
              backdropFilter: 'blur(2px)',
              pointerEvents: 'auto',
              animation: 'synFade 180ms ease-out',
            }}
          />
          {/* Panel */}
          <aside
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(420px, 100vw)',
              background: MIDNIGHT,
              borderLeft: `1px solid ${RULE}`,
              color: CREAM,
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'auto',
              animation: 'synSlide 220ms cubic-bezier(.2,.8,.2,1)',
            }}
          >
            {/* Header */}
            <header
              style={{
                padding: '18px 20px 14px',
                borderBottom: `1px solid ${RULE}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "'Alice', serif",
                    fontSize: 20,
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Ask the Oracle
                </h2>
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: BRASS,
                  }}
                >
                  {quotaLabel}
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: CREAM,
                  fontSize: 24,
                  lineHeight: 1,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ×
              </button>
            </header>

            {/* Messages */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {!canChat ? (
                <FreeTierCTA firstName={firstName} />
              ) : visibleMessages.length === 0 ? (
                <p
                  style={{
                    fontFamily: "'Alice', serif",
                    fontSize: 16,
                    color: INK_FAINT,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Welcome, {firstName || 'friend'}. Ask about a placement, a transit, a sefira, a
                  nakshatra, a pillar — or anything in the symbolic field.
                </p>
              ) : (
                visibleMessages.map((m, i) => <MessageBubble key={i} role={m.role} content={m.content} />)
              )}

              {loading && canChat && (
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: BRASS,
                    opacity: 0.7,
                  }}
                >
                  consulting…
                </div>
              )}

              {quotaHit && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 14,
                    border: `1px solid ${BRASS}`,
                    fontFamily: "'Alice', serif",
                    fontSize: 15,
                    lineHeight: 1.5,
                  }}
                >
                  You&apos;ve used all 10 questions today.{' '}
                  <a href="/pricing" style={{ color: BRASS, textDecoration: 'underline' }}>
                    Upgrade to Depth for unlimited →
                  </a>
                </div>
              )}
              {error && (
                <div
                  style={{
                    padding: 10,
                    border: `1px solid ${RULE}`,
                    color: INK_FAINT,
                    fontSize: 13,
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            {/* Input */}
            {canChat ? (
              <div style={{ borderTop: `1px solid ${RULE}`, padding: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 10,
                    borderBottom: `1px solid ${BRASS}`,
                    paddingBottom: 6,
                  }}
                >
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Ask…"
                    disabled={loading || quotaHit}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 0,
                      outline: 'none',
                      resize: 'none',
                      color: CREAM,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 13,
                      lineHeight: 1.5,
                      padding: '6px 0',
                      maxHeight: 120,
                    }}
                  />
                  <button
                    type="button"
                    onClick={toggleListen}
                    disabled={loading || quotaHit || !canVoice}
                    aria-label={listening ? 'Stop listening' : 'Speak'}
                    title={listening ? 'Stop' : 'Speak'}
                    style={{
                      background: listening ? BRASS : 'transparent',
                      border: `1px solid ${BRASS}`,
                      color: listening ? MIDNIGHT : BRASS,
                      width: 34,
                      height: 30,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: loading || !canVoice ? 'not-allowed' : 'pointer',
                      opacity: !canVoice ? 0.4 : 1,
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <MicGlyph active={listening} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={loading || quotaHit || !input.trim()}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${BRASS}`,
                      color: BRASS,
                      fontFamily: "'Alice', serif",
                      fontSize: 13,
                      padding: '6px 14px',
                      cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                      opacity: loading || !input.trim() ? 0.5 : 1,
                      letterSpacing: '0.04em',
                    }}
                  >
                    Ask
                  </button>
                </div>
                {/* Voice mode toggle — when on, mic auto-sends + assistant
                    replies are spoken aloud. */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
                  <button
                    type="button"
                    onClick={toggleVoiceMode}
                    style={{
                      background: 'transparent',
                      border: 0,
                      padding: 0,
                      color: voiceMode ? BRASS : INK_FAINT,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    {voiceMode ? '● Voice mode · on' : '○ Voice mode · off'}
                  </button>
                  {speaking && (
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      style={{
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        color: BRASS,
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      ⏹ Stop speaking
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function MessageBubble({ role, content }: { role: Role; content: string }) {
  if (role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div
          style={{
            maxWidth: '82%',
            border: `1px solid ${BRASS}`,
            padding: '10px 14px',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 13,
            lineHeight: 1.55,
            color: CREAM,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {content}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div
        style={{
          maxWidth: '92%',
          background: RAISE,
          padding: '12px 14px',
          fontFamily: "'Alice', serif",
          fontSize: 15,
          lineHeight: 1.6,
          color: CREAM,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content || <span style={{ opacity: 0.4 }}>…</span>}
      </div>
    </div>
  );
}

function FreeTierCTA({ firstName }: { firstName: string }) {
  return (
    <div
      style={{
        padding: 20,
        border: `1px solid ${RULE}`,
        background: RAISE,
      }}
    >
      <p
        style={{
          fontFamily: "'Alice', serif",
          fontSize: 18,
          lineHeight: 1.5,
          color: CREAM,
          margin: '0 0 16px',
        }}
      >
        {firstName ? `${firstName}, the ` : 'The '}Synastra Oracle is available on Reader and Depth
        plans.
      </p>
      <a
        href="/pricing"
        style={{
          display: 'inline-block',
          border: `1px solid ${BRASS}`,
          color: BRASS,
          padding: '8px 16px',
          fontFamily: "'Alice', serif",
          fontSize: 14,
          textDecoration: 'none',
          letterSpacing: '0.04em',
        }}
      >
        Upgrade →
      </a>
    </div>
  );
}

function OracleSigil() {
  // Small brass asterism / crosshair. Four-pointed star inside a thin circle.
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="13" cy="13" r="10.5" stroke={BRASS} strokeWidth="0.8" opacity="0.55" />
      <path
        d="M13 2.5 L14 12 L23.5 13 L14 14 L13 23.5 L12 14 L2.5 13 L12 12 Z"
        fill={BRASS}
      />
      <circle cx="13" cy="13" r="1.2" fill={MIDNIGHT} />
    </svg>
  );
}

function MicGlyph({ active }: { active: boolean }) {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden="true">
      <rect x="4.5" y="1" width="5" height="9" rx="2.5" fill="currentColor" />
      <path d="M2 8 a5 5 0 0 0 10 0" stroke="currentColor" strokeWidth="1" fill="none" />
      <line x1="7" y1="13" x2="7" y2="15" stroke="currentColor" strokeWidth="1" />
      {active && <circle cx="7" cy="6" r="6.4" stroke="currentColor" strokeWidth="0.5" opacity="0.5" fill="none" />}
    </svg>
  );
}
