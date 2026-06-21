// ============================================================
// SSB PREP TRACKER — Standalone PWA App
// ============================================================

const { useState, useEffect, useMemo, useCallback, useRef } = React;

const PHASE_INFO = {
  1: { name: "FOUNDATION", color: "#6B7A4F" },
  2: { name: "BUILD", color: "#6B7A4F" },
  3: { name: "TRANSITION", color: "#B8863B" },
  4: { name: "INTEGRATION", color: "#B8863B" },
  5: { name: "MOCK CYCLE", color: "#A8552E" },
  6: { name: "CONSOLIDATION", color: "#A8552E" },
  7: { name: "TAPER", color: "#5B7A8C" },
};

function dKey(date) { return `done:${date}`; }
function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}
function fmtDayBadge(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return { dow: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(), dom: d.getDate() };
}

// ---- localStorage-backed persistence (replaces window.storage) ----
const LS_DONE_KEY = "ssb_tracker_done_v1";
const LS_RATINGS_KEY = "ssb_tracker_ratings_v1";

function useStorage() {
  const [done, setDone] = useState({});
  const [ratings, setRatings] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const d = localStorage.getItem(LS_DONE_KEY);
      if (d) setDone(JSON.parse(d));
    } catch (e) {}
    try {
      const r = localStorage.getItem(LS_RATINGS_KEY);
      if (r) setRatings(JSON.parse(r));
    } catch (e) {}
    setLoaded(true);
  }, []);

  const persistDone = useCallback((next) => {
    setDone(next);
    try { localStorage.setItem(LS_DONE_KEY, JSON.stringify(next)); } catch (e) {}
  }, []);

  const persistRatings = useCallback((next) => {
    setRatings(next);
    try { localStorage.setItem(LS_RATINGS_KEY, JSON.stringify(next)); } catch (e) {}
  }, []);

  return { done, ratings, loaded, persistDone, persistRatings };
}

function ReadinessGauge({ pct, size = 64 }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2A2F33" strokeWidth="5" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#C98A3D" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.32em" fontSize={size * 0.26} fill="#EDE9E0" fontFamily="'Oswald', sans-serif" fontWeight="600">
        {pct}%
      </text>
    </svg>
  );
}

function TaskRow({ task, idx, dayDate, isDone, onToggle }) {
  const [time, block, detail] = task;
  const isBreakOrFixed = !detail && (block.toLowerCase().includes("break") || block.toLowerCase().includes("fixed") ||
    block.toLowerCase().includes("commute") || block.toLowerCase().includes("buffer") ||
    block.toLowerCase().includes("dinner") || block.toLowerCase().includes("lunch") ||
    block.toLowerCase().includes("breakfast") || block.toLowerCase().includes("college") ||
    block.toLowerCase().includes("free") || block.toLowerCase().includes("wind down") ||
    block.toLowerCase().includes("get ready"));

  return (
    <button
      className={`task-row ${isDone ? "task-done" : ""} ${isBreakOrFixed ? "task-anchor" : ""}`}
      onClick={() => onToggle(dayDate, idx)}
    >
      <span className="task-check" aria-hidden="true">
        {isDone ? (
          <svg viewBox="0 0 24 24" width="15" height="15"><path d="M4 12.5L9.5 18L20 6" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        ) : null}
      </span>
      <span className="task-body">
        <span className="task-time">{time}</span>
        <span className="task-text">
          <span className="task-block">{block}</span>
          {detail ? <span className="task-detail">{detail}</span> : null}
        </span>
      </span>
    </button>
  );
}

function DayCard({ day, done, onToggle, expanded, onExpand, isToday }) {
  const total = day.tasks.length;
  const completed = day.tasks.filter((_, i) => done[dKey(day.date)]?.[i]).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const badge = fmtDayBadge(day.date);
  const phase = PHASE_INFO[day.phase];

  return (
    <div className={`day-card ${isToday ? "day-today" : ""}`}>
      <button className="day-header" onClick={() => onExpand(day.date)}>
        <div className="day-badge" style={{ borderColor: phase.color }}>
          <span className="day-dow">{badge.dow}</span>
          <span className="day-dom">{badge.dom}</span>
        </div>
        <div className="day-meta">
          <div className="day-label-row">
            <span className="day-label">{day.label}</span>
            {isToday && <span className="today-pill">TODAY</span>}
          </div>
          <div className="day-progress-track">
            <div className="day-progress-fill" style={{ width: `${pct}%`, background: phase.color }} />
          </div>
          <span className="day-progress-text">{completed}/{total} complete</span>
        </div>
        <svg className={`chevron ${expanded ? "chevron-open" : ""}`} width="18" height="18" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {expanded && (
        <div className="day-tasks">
          {day.tasks.map((t, i) => (
            <TaskRow key={i} task={t} idx={i} dayDate={day.date} isDone={!!done[dKey(day.date)]?.[i]} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

function SelfRatingPanel({ checkpoint, ratings, onSave }) {
  const [local, setLocal] = useState(ratings[checkpoint.id] || {});
  useEffect(() => { setLocal(ratings[checkpoint.id] || {}); }, [ratings, checkpoint.id]);

  const update = (area, field, value) => {
    const next = { ...local, [area]: { ...(local[area] || {}), [field]: value } };
    setLocal(next);
    onSave(checkpoint.id, next);
  };

  return (
    <div className="rating-panel">
      <div className="rating-panel-title">{checkpoint.label}</div>
      {SELF_RATING_AREAS.map((area) => (
        <div className="rating-row" key={area}>
          <div className="rating-area">{area}</div>
          <div className="rating-inputs">
            <select
              className="rating-select"
              value={local[area]?.score || ""}
              onChange={(e) => update(area, "score", e.target.value)}
            >
              <option value="">–</option>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <input
              className="rating-improve"
              placeholder="One thing to improve…"
              value={local[area]?.note || ""}
              onChange={(e) => update(area, "note", e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PackingList({ done, onToggle }) {
  const total = PACKING_LIST.length;
  const completed = PACKING_LIST.filter((_, i) => done[dKey("packing")]?.[i]).length;
  return (
    <div className="packing-list">
      <div className="packing-header">
        <span>FINAL DOCUMENTS &amp; PACKING</span>
        <span className="packing-count">{completed}/{total}</span>
      </div>
      {PACKING_LIST.map((item, i) => {
        const isDone = !!done[dKey("packing")]?.[i];
        return (
          <button key={i} className={`task-row packing-row ${isDone ? "task-done" : ""}`} onClick={() => onToggle("packing", i)}>
            <span className="task-check">
              {isDone ? (
                <svg viewBox="0 0 24 24" width="15" height="15"><path d="M4 12.5L9.5 18L20 6" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : null}
            </span>
            <span className="task-text"><span className="task-block">{item}</span></span>
          </button>
        );
      })}
    </div>
  );
}

function InstallBanner() {
  const [show, setShow] = useState(false);
  const deferredRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      deferredRef.current = e;
      if (!localStorage.getItem("ssb_install_dismissed")) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  return (
    <div className="install-banner">
      <span>Install this as an app on your home screen</span>
      <div className="install-actions">
        <button className="install-btn" onClick={async () => {
          if (deferredRef.current) {
            deferredRef.current.prompt();
            await deferredRef.current.userChoice;
          }
          setShow(false);
        }}>Install</button>
        <button className="install-dismiss" onClick={() => {
          localStorage.setItem("ssb_install_dismissed", "1");
          setShow(false);
        }}>✕</button>
      </div>
    </div>
  );
}

function App() {
  const { done, ratings, loaded, persistDone, persistRatings } = useStorage();
  const [view, setView] = useState("today");
  const [expandedDay, setExpandedDay] = useState(null);
  const today = todayISO();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!expandedDay) {
      const t = DAYS.find(d => d.date === today);
      setExpandedDay(t ? t.date : DAYS[0].date);
    }
  }, [loaded]);

  const toggleTask = useCallback((dateKey, idx) => {
    const key = dKey(dateKey);
    const dayState = { ...(done[key] || {}) };
    dayState[idx] = !dayState[idx];
    persistDone({ ...done, [key]: dayState });
  }, [done, persistDone]);

  const saveRating = useCallback((checkpointId, areaData) => {
    persistRatings({ ...ratings, [checkpointId]: areaData });
  }, [ratings, persistRatings]);

  const overallStats = useMemo(() => {
    let total = 0, completed = 0;
    DAYS.forEach(day => {
      total += day.tasks.length;
      const key = dKey(day.date);
      completed += day.tasks.filter((_, i) => done[key]?.[i]).length;
    });
    return { total, completed, pct: total ? Math.round((completed / total) * 100) : 0 };
  }, [done]);

  const daysUntilReport = useMemo(() => {
    const t = new Date(today + "T00:00:00");
    const r = new Date(META.reportingDay + "T00:00:00");
    return Math.round((r - t) / 86400000);
  }, [today]);

  const currentPhase = useMemo(() => {
    const d = DAYS.find(d => d.date === today);
    return d ? d.phase : (today < META.windowStart ? 1 : 7);
  }, [today]);

  const todayDay = DAYS.find(d => d.date === today);
  const visibleDays = view === "today" ? (todayDay ? [todayDay] : []) : DAYS;

  if (!loaded) {
    return (
      <div className="app-shell loading-shell">
        <div className="loading-text">LOADING TRACKER…</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <InstallBanner />

      <header className="sitrep">
        <div className="sitrep-top">
          <div>
            <div className="sitrep-eyebrow">SITREP</div>
            <h1 className="sitrep-title">{META.title}</h1>
            <div className="sitrep-sub">{META.subtitle}</div>
          </div>
          <ReadinessGauge pct={overallStats.pct} />
        </div>
        <div className="sitrep-stats">
          <div className="stat">
            <span className="stat-value" style={{ color: PHASE_INFO[currentPhase].color }}>
              PHASE {currentPhase}
            </span>
            <span className="stat-label">{PHASE_INFO[currentPhase].name}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">{daysUntilReport >= 0 ? daysUntilReport : 0}</span>
            <span className="stat-label">DAYS TO REPORT</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">{overallStats.completed}/{overallStats.total}</span>
            <span className="stat-label">TASKS DONE</span>
          </div>
        </div>
      </header>

      <nav className="tab-bar">
        {[
          { id: "today", label: "TODAY" },
          { id: "all", label: "FULL PLAN" },
          { id: "ratings", label: "RATINGS" },
          { id: "packing", label: "PACKING" },
        ].map(t => (
          <button key={t.id} className={`tab ${view === t.id ? "tab-active" : ""}`} onClick={() => setView(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="content" ref={scrollRef}>
        {(view === "today" || view === "all") && (
          <>
            {view === "today" && !todayDay && (
              <div className="out-of-window">
                <div className="out-of-window-title">
                  {today < META.windowStart ? "PREP WINDOW NOT YET OPEN" : "PREP WINDOW COMPLETE"}
                </div>
                <div className="out-of-window-sub">
                  {today < META.windowStart
                    ? `Tracker begins ${META.windowStart}.`
                    : "Reporting day has passed. Check the Full Plan tab to review."}
                </div>
              </div>
            )}

            {view === "all" && (
              <div className="anchors-card">
                <div className="anchors-title">FIXED DAILY ANCHORS — NON-NEGOTIABLE</div>
                {ANCHORS.map((a, i) => (
                  <div className="anchor-row" key={i}>
                    <span className="anchor-time">{a.time}</span>
                    <span className="anchor-label">{a.label}</span>
                  </div>
                ))}
              </div>
            )}

            {visibleDays.map(day => (
              <DayCard
                key={day.date}
                day={day}
                done={done}
                onToggle={toggleTask}
                expanded={expandedDay === day.date}
                onExpand={(d) => setExpandedDay(expandedDay === d ? null : d)}
                isToday={day.date === today}
              />
            ))}
          </>
        )}

        {view === "ratings" && (
          <div className="ratings-view">
            {SELF_RATING_CHECKPOINTS.map(cp => (
              <SelfRatingPanel key={cp.id} checkpoint={cp} ratings={ratings} onSave={saveRating} />
            ))}
          </div>
        )}

        {view === "packing" && (
          <PackingList done={done} onToggle={toggleTask} />
        )}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
