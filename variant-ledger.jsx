// SBFTX·AI — Ledger / Counsel Terminal (refined)
// Polished single-screen layout. Bigger transcript readability, primary input,
// regrouped left rail, amplified 147-day appellate anchor, smaller portrait,
// subtle motion feedback, progressive character reveal on bot replies.

function VariantLedger() {
  const [messages, setMessages] = React.useState([
    {
      role: 'bot',
      text:
        "Counsel is online. State your charge — I will respond with the record. Cooperator testimony, headline narratives, and tabloid color are not weighted.",
      done: true,
    },
  ]);
  const [draft, setDraft] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const [pulse, setPulse] = React.useState(0); // increments to flash transmit feedback
  const scrollRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const [tick, setTick] = React.useState(0);

  // typing cursor for live tickers / clock
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // auto-scroll
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  // progressive reveal: when last message is a bot in-progress, tick it forward
  React.useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'bot' || last.done) return;
    const full = last.full;
    if (last.text.length >= full.length) {
      setMessages((m) => {
        const copy = m.slice();
        copy[copy.length - 1] = { ...copy[copy.length - 1], done: true };
        return copy;
      });
      return;
    }
    const id = setTimeout(() => {
      setMessages((m) => {
        const copy = m.slice();
        const lst = copy[copy.length - 1];
        // advance 2-3 chars per tick for that terminal feel
        const next = full.slice(0, lst.text.length + 2 + Math.floor(Math.random() * 2));
        copy[copy.length - 1] = { ...lst, text: next };
        return copy;
      });
    }, 14);
    return () => clearTimeout(id);
  }, [messages]);

  const send = (text) => {
    const t = (text ?? draft).trim();
    if (!t) return;
    setMessages((m) => [...m, { role: 'user', text: t, done: true }]);
    setDraft("");
    setPulse((p) => p + 1);
    setThinking(true);

    inputRef.current?.focus();
    fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: t }),
    })
      .then((res) => res.json())
      .then((data) => {
        setThinking(false);

        const reply = data.answer || data.error || "No response";

        setMessages((m) => [
          ...m,
          { role: "bot", text: "", full: reply, done: false },
        ]);
      })
      .catch((err) => {
        setThinking(false);

        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text: "",
            full: "Error: " + err.message,
            done: false,
          },
        ]);
      });
  };
  const tickerItems = [
    { k: 'CLAIMS.RECOVERY', v: '118.0%', d: '+0.4', pos: true },
    { k: 'APPEAL.STATUS', v: 'PENDING', d: '2DCIR', pos: true },
    { k: 'COOPERATORS', v: '3', d: 'PLEA', pos: false },
    { k: 'SHORTFALL.MYTH', v: '0.0B', d: 'AUDITED', pos: true },
    { k: 'PRESS.BIAS', v: 'HIGH', d: '+0.07', pos: false },
    { k: 'BAHAMAS.LIC', v: 'VALID', d: 'DARE', pos: true },
    { k: 'EA.GIVING', v: '$160M', d: 'PRE-NOV', pos: true },
    { k: 'DAYS.SERVED', v: '1183', d: '+1', pos: false },
  ];

  const evidence = [
    ['DKT-1142', 'Recovery plan, 118¢/$'],
    ['DKT-0879', 'DARE registration, FTX Digital'],
    ['EX-A-44', 'TOS §8.3 — margin & rehypoth.'],
    ['EX-A-12', 'Alameda credit facility memo'],
    ['EX-D-07', 'Pre-collapse giving ledger'],
    ['EX-D-21', 'Congressional testimony, Dec ’21'],
  ];

  const utc = new Date().toUTCString().slice(17, 25);

  return (
    <div style={ledger.root}>
      {/* top bar */}
      <div style={ledger.topbar}>
        <div style={ledger.brand}>
          <span style={ledger.brandMark}>◆</span>
          <span style={{ letterSpacing: '0.18em' }}>SBFTX·AI</span>
          <span style={ledger.brandSub}>COUNSEL TERMINAL · v3.11</span>
        </div>
        <div style={ledger.topNav}>
          <span>DOSSIER</span>
          <span>RECORD</span>
          <span style={ledger.navActive}>COLLOQUY</span>
          <span>APPEAL</span>
          <span>SUPPORT</span>
        </div>
        <div style={ledger.topClock}>
          <span style={ledger.statusDot} /> LIVE · {utc} UTC
        </div>
      </div>

      {/* ticker */}
      <div style={ledger.ticker}>
        <div style={{ display: 'flex', gap: 28, animation: 'lt-scroll 38s linear infinite' }}>
          {[...tickerItems, ...tickerItems, ...tickerItems].map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, whiteSpace: 'nowrap' }}>
              <span style={{ color: '#7e7460' }}>{it.k}</span>
              <span style={{ color: '#e8c87b' }}>{it.v}</span>
              <span style={{ color: it.pos ? '#7ed492' : '#e0796b' }}>
                {it.pos ? '▲' : '▼'} {it.d}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* main grid */}
      <div style={ledger.grid}>
        {/* ─── LEFT RAIL ─────────────────────────────────────── */}
        <aside style={ledger.rail}>
          {/* IDENTITY */}
          <section style={ledger.section}>
            <div style={ledger.sectionHead}>
              <span>01 / IDENTITY</span>
              <span style={ledger.sectionMeta}>SUBJECT FILE</span>
            </div>
            <div style={ledger.identity}>
              <div style={ledger.portraitWrap}>
                <Portrait variant="pixel" size={92} fg="#d6b66a" />
                <div style={ledger.scanline} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={ledger.idName}>S.B.F.</div>
                <div style={ledger.idAlias}>petitioner · 0xA1F4…6E2D</div>
                <div style={ledger.idTags}>
                  <span style={ledger.tagDanger}>INCARCERATED</span>
                  <span style={ledger.tagOk}>ON APPEAL</span>
                </div>
              </div>
            </div>
          </section>

          {/* SENTENCING */}
          <section style={ledger.section}>
            <div style={ledger.sectionHead}>
              <span>02 / SENTENCING</span>
              <span style={ledger.sectionMeta}>SDNY · 23-CR-490</span>
            </div>
            <dl style={ledger.dl}>
              <Row k="CONVICTED" v="NOV 2, 2023" />
              <Row k="COUNTS" v="7 / 7" />
              <Row k="SENTENCE" v="25 YR" />
              <Row k="FACILITY" v="MDC BROOKLYN" />
              <Row k="DAYS SERVED" v="1,183" tone="warn" />
            </dl>
          </section>

          {/* FINANCIALS */}
          <section style={ledger.section}>
            <div style={ledger.sectionHead}>
              <span>03 / FINANCIALS</span>
              <span style={ledger.sectionMeta}>ESTATE · POST-PETITION</span>
            </div>
            <dl style={ledger.dl}>
              <Row k="MAKE-WHOLE" v="118¢ / $" tone="ok" />
              <Row k="NET HARM" v="$0.00" tone="ok" />
              <Row k="CLAIMS MARKET" v="142¢" tone="ok" />
              <Row k="EA GIVING (PRE)" v="$160M" />
            </dl>
          </section>

          {/* EVIDENCE */}
          <section style={ledger.section}>
            <div style={ledger.sectionHead}>
              <span>04 / EVIDENCE LOCKER</span>
              <span style={ledger.sectionMeta}>{evidence.length} ITEMS</span>
            </div>
            <ul style={ledger.evList}>
              {evidence.map(([id, label]) => (
                <li key={id} style={ledger.evRow}>
                  <span style={ledger.evId}>{id}</span>
                  <span style={ledger.evLabel}>{label}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        {/* ─── CENTER — TRANSCRIPT ───────────────────────────── */}
        <main style={ledger.center}>
          <div style={ledger.chatHead}>
            <div>
              <div style={ledger.chatHeadTitle}>COLLOQUY · OPEN CHANNEL</div>
              <div style={ledger.chatHeadMeta}>
                SESSION {String(tick % 10000).padStart(4, '0')}-A · ALL EXCHANGES ARCHIVED · USE ⏷ EXPORT
              </div>
            </div>
            <button
              style={ledger.exportBtn}
              onClick={() => window.exportTranscript(messages, 'LEDGER / Counsel Terminal')}
            >
              ⏷ EXPORT TRANSCRIPT
            </button>
          </div>

          <div ref={scrollRef} style={ledger.chatScroll}>
            {messages.map((m, i) => (
              <article
                key={i}
                style={{
                  ...ledger.msgRow,
                  ...(m.role === 'user' ? ledger.msgUser : ledger.msgBot),
                  animation: 'lt-fadein 380ms ease both',
                }}
              >
                <div style={ledger.msgGutter}>
                  <div style={ledger.msgIdx}>{String(i + 1).padStart(3, '0')}</div>
                  <div style={ledger.msgWho}>{m.role === 'user' ? 'CHALLENGER' : 'COUNSEL'}</div>
                </div>
                <div style={ledger.msgBody}>
                  {m.role === 'bot' ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(m.text || m.full || "", { breaks: true, gfm: true }),
                      }}
                    />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.text || m.full || ""}</div>
                  )}
                  {m.role === 'bot' && !m.done && <span style={ledger.cursor}>▮</span>}
                </div>
              </article>
            ))}
            {thinking && (
              <article style={{ ...ledger.msgRow, ...ledger.msgBot, animation: 'lt-fadein 280ms ease both' }}>
                <div style={ledger.msgGutter}>
                  <div style={ledger.msgIdx}>{String(messages.length + 1).padStart(3, '0')}</div>
                  <div style={ledger.msgWho}>COUNSEL</div>
                </div>
                <div style={{ ...ledger.msgBody, color: '#8d836a' }}>
                  <span style={ledger.cursor}>▮</span> retrieving the record
                  <span style={ledger.dot}>.</span>
                  <span style={{ ...ledger.dot, animationDelay: '0.18s' }}>.</span>
                  <span style={{ ...ledger.dot, animationDelay: '0.36s' }}>.</span>
                </div>
              </article>
            )}
          </div>

          {/* prompt strip — quieter */}
          <div style={ledger.promptStrip}>
            <span style={ledger.promptLabel}>OPENINGS ›</span>
            <div style={ledger.promptList}>
              {window.SUGGESTED_PROMPTS.slice(0, 4).map((p) => (
                <button key={p} style={ledger.promptBtn} onClick={() => send(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* primary input */}
          <form
            key={pulse} /* re-mount each send to retrigger flash */
            style={{ ...ledger.inputCard, animation: pulse ? 'lt-pulse 420ms ease' : 'none' }}
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <span style={ledger.inputCaret}>▶</span>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="STATE YOUR CHARGE_"
              style={ledger.input}
              autoFocus
            />
            <button type="submit" style={ledger.sendBtn} disabled={!draft.trim()}>
              <span>TRANSMIT</span>
              <span style={ledger.sendKey}>⏎</span>
            </button>
          </form>
        </main>

        {/* ─── RIGHT RAIL — APPELLATE ANCHOR ─────────────────── */}
        <aside style={ledger.rail2}>
          <section style={ledger.anchor}>
            <div style={ledger.anchorKicker}>APPELLATE WATCH · 2D CIR.</div>
            <div style={ledger.anchorDocket}>DOCKET 24-1644</div>

            <div style={ledger.anchorBig}>
              <span style={ledger.anchorNum}>147</span>
              <span style={ledger.anchorUnit}>DAYS</span>
            </div>
            <div style={ledger.anchorLabel}>UNTIL ORAL ARGUMENT</div>

            <div style={ledger.anchorBar}>
              <div style={{ ...ledger.anchorBarFill, width: '64%' }} />
            </div>
            <div style={ledger.anchorBarLabels}>
              <span>BRIEFED</span>
              <span style={{ color: '#e8c87b' }}>● TODAY</span>
              <span>ARGUED</span>
            </div>
          </section>

          <section style={ledger.section}>
            <div style={ledger.sectionHead}>
              <span>RECOVERY CURVE</span>
              <span style={ledger.sectionMeta}>NOV ’22 → NOW</span>
            </div>
            <Sparkline />
          </section>

          <section style={ledger.section}>
            <div style={ledger.sectionHead}>
              <span>WIRE</span>
              <span style={ledger.sectionMeta}>LAST 30D</span>
            </div>
            <ul style={ledger.wire}>
              <li>
                <span style={ledger.wireDot} /> Trustee filing — distributions on track.
                <em> Apr 24</em>
              </li>
              <li>
                <span style={{ ...ledger.wireDot, background: '#e0796b' }} /> Government
                opposition brief, redacted. <em> Apr 18</em>
              </li>
              <li>
                <span style={ledger.wireDot} /> Amicus filed — 14 academics. <em> Apr 11</em>
              </li>
              <li>
                <span style={ledger.wireDot} /> Customer claims sale @ 142¢. <em> Mar 30</em>
              </li>
            </ul>
          </section>
        </aside>
      </div>

      <div style={ledger.footer}>
        <span>SBFTX·AI · NOT LEGAL ADVICE · MODEL OUTPUT IS ARGUMENT, NOT FACT</span>
        <span>BUILD 3.11.04 · KEY 0xA1F4…6E2D</span>
      </div>

      <style>{`
        @keyframes lt-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-66.66%); } }
        @keyframes lt-blink  { 50% { opacity: 0; } }
        @keyframes lt-fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes lt-pulse  { 0% { box-shadow: 0 0 0 0 rgba(232,200,123,0.55); } 100% { box-shadow: 0 0 0 14px rgba(232,200,123,0); } }
        @keyframes lt-dot    { 0%,60%,100% { opacity: 0.25; } 30% { opacity: 1; } }
      `}</style>
    </div>
  );
}

// ── small components ───────────────────────────────────────
function Row({ k, v, tone }) {
  const color = tone === 'ok' ? '#7ed492' : tone === 'warn' ? '#e0796b' : '#ece4cc';
  return (
    <div style={ledger.dlRow}>
      <dt style={ledger.dlKey}>{k}</dt>
      <dd style={{ ...ledger.dlVal, color }}>{v}</dd>
    </div>
  );
}

function Sparkline() {
  const pts = Array.from({ length: 24 }, (_, i) =>
    Math.min(118, Math.max(0, 6 + i * 5 + (i % 3) * 2 - (i === 8 ? 8 : 0)))
  );
  const w = 252,
    h = 64;
  const max = 120;
  const path = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * w} ${h - (p / max) * h}`)
    .join(' ');
  return (
    <div style={{ position: 'relative' }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        <line
          x1="0"
          y1={h - (100 / max) * h}
          x2={w}
          y2={h - (100 / max) * h}
          stroke="#3a3528"
          strokeDasharray="2 4"
        />
        <path d={path} stroke="#7ed492" fill="none" strokeWidth="1.5" />
        <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="#7ed492" opacity="0.08" />
      </svg>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: '#8d836a',
          fontSize: 9.5,
          marginTop: 6,
          letterSpacing: '0.14em',
        }}
      >
        <span>0¢</span>
        <span style={{ color: '#7ed492' }}>118¢ ●</span>
      </div>
    </div>
  );
}

// ── styles ─────────────────────────────────────────────────
const FG = '#ece4cc'; // primary text — bumped from #cfc3a0 for legibility
const FG_DIM = '#8d836a'; // secondary
const BORDER = '#2c2718';
const BG = '#0c0b07';
const BG2 = '#100e09';
const ACCENT = '#e8c87b';
const OK = '#7ed492';
const WARN = '#e0796b';

const ledger = {
  root: {
    width: '100%',
    height: '100%',
    background: BG,
    color: FG,
    fontFamily: '"JetBrains Mono", "Berkeley Mono", ui-monospace, Menlo, monospace',
    fontSize: 12,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    borderBottom: `1px solid ${BORDER}`,
    background: BG2,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12, color: ACCENT, fontWeight: 600, fontSize: 13 },
  brandMark: { color: ACCENT, fontSize: 16 },
  brandSub: { color: FG_DIM, fontWeight: 400, fontSize: 10, letterSpacing: '0.18em', marginLeft: 4 },
  topNav: { display: 'flex', gap: 26, color: FG_DIM, fontSize: 11, letterSpacing: '0.18em' },
  navActive: { color: ACCENT, borderBottom: `1px solid ${ACCENT}`, paddingBottom: 4 },
  topClock: {
    color: OK,
    fontSize: 10,
    letterSpacing: '0.18em',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: OK,
    animation: 'lt-blink 1.4s infinite',
    display: 'inline-block',
  },

  ticker: {
    overflow: 'hidden',
    borderBottom: `1px solid ${BORDER}`,
    padding: '7px 0',
    background: '#0a0906',
    fontSize: 11,
    letterSpacing: '0.06em',
  },

  grid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '300px minmax(0, 1fr) 304px',
    minHeight: 0,
    minWidth: 0,
  },

  // RAILS — generous internal whitespace, clear section banding
  rail: {
    borderRight: `1px solid ${BORDER}`,
    padding: '8px 0',
    background: '#0a0906',
    overflowY: 'auto',
    minWidth: 0,
    minHeight: 0,
  },
  rail2: {
    borderLeft: `1px solid ${BORDER}`,
    padding: '8px 0',
    background: '#0a0906',
    overflowY: 'auto',
    minWidth: 0,
    minHeight: 0,
  },
  section: {
    padding: '20px 22px',
    borderBottom: `1px solid ${BORDER}`,
  },
  sectionHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    color: ACCENT,
    fontSize: 10,
    letterSpacing: '0.22em',
    marginBottom: 14,
  },
  sectionMeta: { color: FG_DIM, fontWeight: 400 },

  // identity block
  identity: { display: 'flex', alignItems: 'center', gap: 14 },
  portraitWrap: {
    position: 'relative',
    border: `1px solid ${BORDER}`,
    padding: 6,
    background: '#0d0c08',
    overflow: 'hidden',
    flexShrink: 0,
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    background: 'linear-gradient(90deg, transparent, #e8c87b, transparent)',
    animation: 'lt-blink 2.6s infinite',
    opacity: 0.4,
  },
  idName: { color: FG, fontSize: 18, letterSpacing: '0.12em', fontWeight: 600 },
  idAlias: { color: FG_DIM, fontSize: 10.5, letterSpacing: '0.1em', marginTop: 4 },
  idTags: { display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  tagDanger: {
    fontSize: 9,
    letterSpacing: '0.18em',
    color: WARN,
    border: `1px solid ${WARN}`,
    padding: '2px 6px',
  },
  tagOk: {
    fontSize: 9,
    letterSpacing: '0.18em',
    color: OK,
    border: `1px solid ${OK}`,
    padding: '2px 6px',
  },

  // dl rows
  dl: { margin: 0, padding: 0 },
  dlRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '7px 0',
    borderBottom: '1px dotted #1d1a12',
    fontSize: 11.5,
  },
  dlKey: { color: FG_DIM, letterSpacing: '0.12em' },
  dlVal: { color: FG, fontWeight: 500 },

  evList: { listStyle: 'none', padding: 0, margin: 0 },
  evRow: {
    display: 'flex',
    gap: 12,
    padding: '7px 0',
    borderBottom: '1px dotted #1d1a12',
    fontSize: 11.5,
  },
  evId: { color: ACCENT, minWidth: 76, letterSpacing: '0.06em' },
  evLabel: { color: FG },

  // CENTER
  center: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
    background: 'repeating-linear-gradient(0deg, #0c0b07 0 28px, #0e0d09 28px 29px)',
  },
  chatHead: {
    padding: '16px 28px',
    borderBottom: `1px solid ${BORDER}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#0a0906',
  },
  chatHeadTitle: { color: ACCENT, letterSpacing: '0.18em', fontSize: 13 },
  chatHeadMeta: { color: FG_DIM, fontSize: 10.5, marginTop: 6, letterSpacing: '0.12em' },
  exportBtn: {
    background: 'transparent',
    color: ACCENT,
    border: `1px solid #6b5e3a`,
    padding: '8px 14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 11,
    letterSpacing: '0.18em',
  },

  chatScroll: { flex: 1, overflowY: 'auto', padding: '20px 28px', minHeight: 0 },
  msgRow: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: 22,
    padding: '14px 0',
    borderBottom: '1px dashed #1d1a12',
  },
  msgUser: {},
  msgBot: {},
  msgGutter: { color: FG_DIM, fontSize: 10, letterSpacing: '0.18em' },
  msgIdx: { color: ACCENT },
  msgWho: { marginTop: 4 },
  msgBody: {
    color: FG,
    lineHeight: 1.65,
    fontSize: 13.5,
    letterSpacing: '0.005em',
  },
  cursor: {
    color: OK,
    animation: 'lt-blink 1s infinite',
    marginLeft: 2,
  },
  dot: { display: 'inline-block', animation: 'lt-dot 1.1s infinite' },

  // PROMPTS — quieter, single line
  promptStrip: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 28px',
    borderTop: `1px solid ${BORDER}`,
    background: '#0a0906',
    overflowX: 'auto',
  },
  promptLabel: {
    color: FG_DIM,
    fontSize: 10,
    letterSpacing: '0.22em',
    flexShrink: 0,
  },
  promptList: { display: 'flex', gap: 6, flexWrap: 'nowrap' },
  promptBtn: {
    background: 'transparent',
    color: FG_DIM,
    border: '1px solid #1f1c12',
    padding: '6px 10px',
    fontFamily: 'inherit',
    fontSize: 11,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'color 160ms, border-color 160ms',
  },

  // INPUT — primary, framed, responsive
  inputCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    margin: '14px 24px 22px',
    background: '#15120a',
    border: `1px solid #4a3f23`,
    boxShadow: 'inset 0 0 0 1px rgba(232,200,123,0.04)',
  },
  inputCaret: { color: OK, fontSize: 14 },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: ACCENT,
    fontFamily: 'inherit',
    fontSize: 15,
    letterSpacing: '0.04em',
    padding: '4px 0',
  },
  sendBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    background: ACCENT,
    color: '#0d0c08',
    border: 'none',
    padding: '11px 18px',
    fontFamily: 'inherit',
    fontSize: 12,
    letterSpacing: '0.22em',
    cursor: 'pointer',
    fontWeight: 700,
    transition: 'transform 120ms, filter 120ms',
  },
  sendKey: {
    fontSize: 12,
    background: 'rgba(13,12,8,0.18)',
    padding: '1px 6px',
    borderRadius: 3,
  },

  // RIGHT — appellate anchor
  anchor: {
    padding: '24px 22px 28px',
    borderBottom: `1px solid ${BORDER}`,
    background:
      'linear-gradient(180deg, rgba(232,200,123,0.06) 0%, rgba(232,200,123,0) 100%)',
  },
  anchorKicker: { color: ACCENT, fontSize: 10, letterSpacing: '0.22em' },
  anchorDocket: { color: FG_DIM, fontSize: 10.5, letterSpacing: '0.16em', marginTop: 4 },
  anchorBig: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 18,
  },
  anchorNum: {
    color: ACCENT,
    fontSize: 88,
    lineHeight: 0.9,
    fontWeight: 600,
    letterSpacing: '-0.04em',
    textShadow: '0 0 32px rgba(232,200,123,0.18)',
  },
  anchorUnit: {
    color: ACCENT,
    fontSize: 16,
    letterSpacing: '0.3em',
  },
  anchorLabel: {
    color: FG_DIM,
    fontSize: 11,
    letterSpacing: '0.22em',
    marginTop: 6,
  },
  anchorBar: {
    height: 6,
    background: '#1c1810',
    border: `1px solid ${BORDER}`,
    marginTop: 22,
    position: 'relative',
  },
  anchorBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    background: 'linear-gradient(90deg, #6b5e3a, #e8c87b)',
  },
  anchorBarLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    color: FG_DIM,
    fontSize: 9.5,
    marginTop: 8,
    letterSpacing: '0.16em',
  },

  wire: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: 11.5,
    lineHeight: 1.65,
    color: FG,
  },
  wireDot: {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: OK,
    marginRight: 8,
    transform: 'translateY(-1px)',
  },

  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 24px',
    borderTop: `1px solid ${BORDER}`,
    fontSize: 10,
    color: FG_DIM,
    letterSpacing: '0.16em',
    background: '#0a0906',
  },
};

window.VariantLedger = VariantLedger;
