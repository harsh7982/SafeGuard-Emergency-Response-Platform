import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle, Bell, Bot,
  ClipboardList, Clock3, FileWarning,
  LayoutDashboard, LogOut, MapPin, Phone,
  ShieldAlert, ShieldCheck, Zap,
  Navigation, Route, Users, Radio,
  CheckCircle2, TrendingUp, LockKeyhole,
  Fingerprint, EyeOff, Eye, FileCheck2,
  DatabaseZap, ChevronRight,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useGuardianProtection } from "../context/GuardianProtection";
import {
  getUserKey,
  loadProfile,
  saveProfile as saveGuardianProfile,
  runCheckIn,
  getCurrentPosition,
} from "../services/guardianTwinService";
import { getInactiveMinutes } from "../services/guardianTwinEngine";
import "./GuardianTwin.css";
import "./Dashboard.css";

/* ── Nav links (shared with sidebar) ── */
const NAV_LINKS = [
  { to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard"    },
  { to: "/contacts",      icon: Phone,           label: "Contacts"     },
  { to: "/report",        icon: FileWarning,     label: "Report"       },
  { to: "/tracking",      icon: MapPin,          label: "Tracking"     },
  { to: "/ai",            icon: Bot,             label: "AI Assistant" },
  { to: "/guardian-twin", icon: ShieldAlert,     label: "Guardian Twin"},
  { to: "/history",       icon: ClipboardList,   label: "History"      },
  { to: "/notifications", icon: Bell,            label: "Alerts"       },
];

const DEFAULT_PROFILE_VALUES = {
  expectedLocation: "D.Y. Patil University",
  safeRoute: "College → Home",
  usualTransport: "College cab",
};

const SCHEDULE = [
  {
    day: "Mon",
    slots: [
      { time: "08:30", label: "Home → College", tone: "safe", icon: "🏠" },
      { time: "17:00", label: "College → Home", tone: "safe", icon: "🎓" },
    ],
  },
  {
    day: "Tue",
    slots: [
      { time: "08:30", label: "Home → College", tone: "safe", icon: "🏠" },
      { time: "18:00", label: "Library", tone: "warning", icon: "📚" },
    ],
  },
  {
    day: "Wed",
    slots: [
      { time: "08:30", label: "Home → College", tone: "safe", icon: "🏠" },
      { time: "17:30", label: "Gym", tone: "safe", icon: "💪" },
    ],
  },
  {
    day: "Thu",
    slots: [
      { time: "08:30", label: "Home → College", tone: "safe", icon: "🏠" },
      { time: "17:00", label: "College → Home", tone: "safe", icon: "🎓" },
    ],
  },
  {
    day: "Fri",
    slots: [
      { time: "08:30", label: "Home → College", tone: "safe", icon: "🏠" },
      { time: "19:00", label: "Friends Meetup", tone: "warning", icon: "👥" },
    ],
  },
  {
    day: "Sat",
    slots: [
      { time: "10:00", label: "Gym", tone: "safe", icon: "💪" },
      { time: "18:00", label: "Home", tone: "safe", icon: "🏠" },
    ],
  },
  {
    day: "Sun",
    slots: [
      { time: "09:00", label: "Home", tone: "safe", icon: "🏠" },
      { time: "17:00", label: "Family Time", tone: "safe", icon: "👨‍👩‍👧" },
    ],
  },
];

const SCENARIOS = {
  safe: {
    tone: "safe",
    status: "Safe",
    match: 92,
    expected: "College",
    current: "College",
    reason: "Route and timing match baseline",
    autopilot: "Standby",
    activity: "2 min ago",
    route: "College → Home",
    transport: "College cab",
    risk: 18,
    risks: { Location: 10, Time: 20, Movement: 15, Activity: 25 },
    device: { os: "Android", battery: "82%", network: "4G" },
    timeline: [],
    routeDeviation: false,
    evidence: [],
  },
  warning: {
    tone: "warning",
    status: "Warning",
    match: 61,
    expected: "Home",
    current: "Library",
    reason: "Late movement outside expected route",
    autopilot: "Standby",
    activity: "22 min ago",
    route: "College → Library",
    transport: "Walking",
    risk: 58,
    risks: { Location: 60, Time: 52, Movement: 48, Activity: 55 },
    device: { os: "Android", battery: "54%", network: "4G" },
    timeline: [["7:10 PM", "Route changed", "Moved away from usual route"]],
    routeDeviation: true,
    evidence: [],
  },
  danger: {
    tone: "danger",
    status: "Critical",
    match: 28,
    expected: "Home",
    current: "Unknown Area",
    reason: "Route deviation plus inactivity spike",
    autopilot: "Active",
    activity: "95 min ago",
    route: "Unknown",
    transport: "Unknown",
    risk: 87,
    risks: { Location: 95, Time: 75, Movement: 82, Activity: 96 },
    device: { os: "Android", battery: "14%", network: "2G" },
    timeline: [
      ["9:12 PM", "Deviation detected", "Moved to unknown path"],
      ["9:35 PM", "No activity", "No interaction for over 60 min"],
      ["9:40 PM", "Autopilot started", "Evidence capture initiated"],
    ],
    routeDeviation: true,
    evidence: [
      { id: "e1", name: "gps-log-1.json", type: "GPS Log", size: "42 KB", created: "9:40 PM", hash: "9f1d2e4c7647d0f90dbf57e1bc3489f32948f198d4caafcc1d2192b9c3f81f1a" },
      { id: "e2", name: "audio-clip-1.m4a", type: "Audio Recording", size: "1.8 MB", created: "9:41 PM", hash: "31deab22cfa24c4f5d4127fa4d59ff078ce350d9d8fd2dbe4f81f9f6a084fc22" },
    ],
  },
};

function removeDefaultTripText(profile) {
  if (!profile) return profile;
  return {
    ...profile,
    expectedLocation:
      profile.expectedLocation === DEFAULT_PROFILE_VALUES.expectedLocation
        ? ""
        : profile.expectedLocation,
    safeRoute:
      profile.safeRoute === DEFAULT_PROFILE_VALUES.safeRoute
        ? ""
        : profile.safeRoute,
    usualTransport:
      profile.usualTransport === DEFAULT_PROFILE_VALUES.usualTransport
        ? ""
        : profile.usualTransport,
  };
}

/* ────────────────────────────── Sidebar ────────────────────────────── */
function Sidebar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const firstName = user?.fullName?.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const initials  = user?.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <aside className="db-sidebar">
      <div className="db-sidebar-logo">
        <div className="db-logo-icon"><ShieldCheck size={20} color="white" /></div>
        <span>SafeHer</span>
      </div>
      <nav className="db-sidebar-nav">
        {NAV_LINKS.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className={`db-nav-item ${location.pathname === to ? "db-nav-active" : ""}`}>
            <Icon size={18} /><span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="db-sidebar-footer">
        <div className="db-sidebar-user">
          <div className="db-user-avatar">{initials}</div>
          <div className="db-user-info">
            <div className="db-user-name">{firstName}</div>
            <div className="db-user-role">Protected</div>
          </div>
        </div>
        <button onClick={() => { logout(); navigate("/"); }} className="db-logout-btn" title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

/* ────────────────────────── RiskRing component ─────────────────────── */
function RiskRing({ risk, tone }) {
  const circumference = 2 * Math.PI * 54;
  const offset        = circumference - (risk / 100) * circumference;
  const color = tone === "danger" ? "#fb7185" : tone === "warning" ? "#facc15" : "#86efac";

  return (
    <div className="gt-risk-ring-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
        <circle
          cx="70" cy="70" r="54"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1), stroke 0.4s" }}
        />
      </svg>
      <div className="gt-risk-ring-inner">
        <strong style={{ color }}>{risk}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

/* ────────────────────────── MatchRing component ────────────────────── */
function MatchRing({ match, tone }) {
  const circumference = 2 * Math.PI * 54;
  const offset        = circumference - (match / 100) * circumference;
  const color = tone === "danger" ? "#fb7185" : tone === "warning" ? "#facc15" : "#86efac";

  return (
    <div className="gt-ring-wrap">
      <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r="54" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" />
        <circle
          cx="80" cy="80" r="54"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1), stroke 0.4s" }}
        />
      </svg>
      <div className="gt-ring-inner">
        <strong style={{ color }}>{match}%</strong>
        <span>Match</span>
      </div>
    </div>
  );
}

/* ──────────────────────── Overview tab ─────────────────────────────── */
function OverviewTab({ active }) {
  return (
    <div className="gt-tab-content">
      {/* Twin Dashboard */}
      <div className="gt-overview-grid">
        <article className="gt-panel gt-twin-card">
          <div className="gt-panel-head">
            <div>
              <h2>Guardian Twin Dashboard</h2>
              <p>Normal behavior compared with current signals.</p>
            </div>
            <span className={`gt-pill ${active.tone}`}>{active.status}</span>
          </div>

          <div className="gt-match-row">
            <MatchRing match={active.match} tone={active.tone} />
            <div className="gt-facts">
              <div><span>Expected Location</span><strong>{active.expected}</strong></div>
              <div><span>Current Location</span><strong>{active.current}</strong></div>
              <div><span>Reason</span><strong>{active.reason}</strong></div>
              <div><span>Evidence Autopilot</span>
                <strong className={active.autopilot === "Active" ? "gt-text-danger" : "gt-text-safe"}>
                  {active.autopilot}
                </strong>
              </div>
            </div>
          </div>

          <div className="gt-metrics">
            <div><Clock3   size={18} /><span>Last Activity</span><strong>{active.activity}</strong></div>
            <div><Route    size={18} /><span>Route</span><strong>{active.route}</strong></div>
            <div><Users    size={18} /><span>Safe Contacts</span><strong>Parents, Guardian, Friend</strong></div>
            <div><Radio    size={18} /><span>Transport</span><strong>{active.transport}</strong></div>
          </div>
        </article>

        {/* AI Risk Formula */}
        <article className="gt-panel">
          <div className="gt-panel-head">
            <div>
              <h2>AI Risk Formula</h2>
              <p>Weighted anomaly score — each factor drives the final risk score.</p>
            </div>
            <RiskRing risk={active.risk} tone={active.tone} />
          </div>

          <div className="gt-formula-legend">
            <div className="gt-formula-pill">40% Location</div>
            <div className="gt-formula-pill">20% Time</div>
            <div className="gt-formula-pill">20% Movement</div>
            <div className="gt-formula-pill">20% Activity</div>
          </div>

          <div className="gt-risk-list">
            {Object.entries(active.risks).map(([label, value]) => {
              const barColor = value >= 70 ? "#fb7185" : value >= 40 ? "#facc15" : "#86efac";
              return (
                <div key={label} className="gt-risk-row">
                  <span>{label}</span>
                  <div className="gt-risk-bar-bg">
                    <div
                      className="gt-risk-bar-fill"
                      style={{ width: `${value}%`, background: barColor, transition: "width 0.8s cubic-bezier(.4,0,.2,1)" }}
                    />
                  </div>
                  <strong style={{ color: barColor }}>{value}%</strong>
                </div>
              );
            })}
          </div>

          <div className="gt-device-row">
            <div><span>OS</span><strong>{active.device.os}</strong></div>
            <div><span>Battery</span>
              <strong className={parseInt(active.device.battery) <= 20 ? "gt-text-danger" : ""}>
                {active.device.battery}
              </strong>
            </div>
            <div><span>Network</span><strong>{active.device.network}</strong></div>
          </div>
        </article>
      </div>

      {/* Incident Timeline */}
      <article className="gt-panel">
        <div className="gt-panel-head">
          <div>
            <h2>Incident Timeline</h2>
            <p>Automatically generated when Guardian Twin detects rising risk.</p>
          </div>
          <span className={`gt-pill ${active.autopilot === "Active" ? "danger" : "safe"}`}>
            Autopilot {active.autopilot}
          </span>
        </div>

        {active.timeline.length === 0 ? (
          <div className="gt-timeline-empty">
            <CheckCircle2 size={24} />
            <span>No anomalies detected. All activity is within normal patterns.</span>
          </div>
        ) : (
          <div className="gt-timeline">
            {active.timeline.map(([time, title, detail], i) => (
              <div className="gt-event" key={i}>
                <div className="gt-event-left">
                  <time>{time}</time>
                  <div className="gt-event-dot" />
                  {i < active.timeline.length - 1 && <div className="gt-event-line" />}
                </div>
                <div className="gt-event-body">
                  <strong>{title}</strong>
                  <span>{detail}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

/* ────────────────────────── Schedule tab ───────────────────────────── */
function ScheduleTab() {
  const today = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];

  return (
    <div className="gt-tab-content">
      <article className="gt-panel">
        <div className="gt-panel-head">
          <div>
            <h2>Daily Safety Schedule</h2>
            <p>
              Guardian Twin treats these time-location patterns as normal.
              Deviations raise the risk score.
            </p>
          </div>
          <span className="gt-pill safe">Learned</span>
        </div>

        <div className="gt-learn-badges">
          {["Home", "College", "Library", "Gym", "Workplace"].map((loc) => (
            <span key={loc} className="gt-learn-badge">📍 {loc}</span>
          ))}
          {["Cab", "Bus", "Walking"].map((t) => (
            <span key={t} className="gt-learn-badge gt-learn-badge-transport">🚌 {t}</span>
          ))}
        </div>

        <div className="gt-schedule-grid">
          {SCHEDULE.map(({ day, slots }) => (
            <div key={day} className={`gt-schedule-day ${day === today ? "gt-schedule-today" : ""}`}>
              <div className="gt-schedule-day-label">
                {day}
                {day === today && <span className="gt-today-dot" />}
              </div>
              <div className="gt-schedule-slots">
                {slots.map((slot) => (
                  <div key={slot.time + slot.label} className={`gt-slot gt-slot-${slot.tone}`}>
                    <span className="gt-slot-icon">{slot.icon}</span>
                    <div>
                      <strong>{slot.label}</strong>
                      <time>{slot.time}</time>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* Activity patterns */}
      <div className="gt-patterns-row">
        <article className="gt-panel">
          <div className="gt-panel-head"><div><h2>Activity Rhythm</h2><p>Expected interaction frequency.</p></div></div>
          <div className="gt-pattern-list">
            <div className="gt-pattern-item">
              <TrendingUp size={18} style={{ color: "#60a5fa" }} />
              <div>
                <strong>Active every 20 minutes</strong>
                <span>Normal app/motion check-in interval</span>
              </div>
            </div>
            <div className="gt-pattern-item">
              <AlertTriangle size={18} style={{ color: "#facc15" }} />
              <div>
                <strong>Alert after 60 minutes</strong>
                <span>Inactivity gap triggers warning level</span>
              </div>
            </div>
            <div className="gt-pattern-item">
              <Zap size={18} style={{ color: "#fb7185" }} />
              <div>
                <strong>Autopilot after 120 minutes</strong>
                <span>Evidence capture and contact escalation starts</span>
              </div>
            </div>
          </div>
        </article>

        <article className="gt-panel">
          <div className="gt-panel-head"><div><h2>Safe Contacts</h2><p>People alerted when risk is critical.</p></div></div>
          <div className="gt-contacts-list">
            {[
              { name: "Parent",  rel: "Father / Mother", icon: "👨‍👩‍👧" },
              { name: "Guardian", rel: "Trusted adult",  icon: "🛡️"     },
              { name: "Friend",  rel: "Trusted peer",    icon: "👭"      },
            ].map((c) => (
              <div key={c.name} className="gt-contact-item">
                <div className="gt-contact-avatar">{c.icon}</div>
                <div>
                  <strong>{c.name}</strong>
                  <span>{c.rel}</span>
                </div>
                <span className="gt-pill safe" style={{ fontSize: "0.72rem" }}>Active</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

/* ────────────────────────── Routes tab ─────────────────────────────── */
function RoutesTab({ active }) {
  const isDeviation = active.routeDeviation;

  return (
    <div className="gt-tab-content">
      <div className="gt-routes-grid">
        <article className="gt-panel gt-map-panel">
          <div className="gt-map">
            <svg viewBox="0 0 640 380" preserveAspectRatio="none" aria-hidden="true">
              {/* Background roads */}
              <path className="gt-road" d="M80 310 C220 240 320 190 440 110" />
              <path className="gt-road gt-road-secondary" d="M440 110 C510 128 570 185 610 270" />
              <path className="gt-road gt-road-secondary" d="M220 240 C260 280 300 310 340 330" />
              {/* Normal route */}
              <path className="gt-route-normal" d="M80 310 C220 240 320 190 440 110" />
              {/* Deviation route — only shown in high-risk */}
              {isDeviation && (
                <path className="gt-route-risk" d="M440 110 C510 128 570 185 610 270" />
              )}
            </svg>

            <div className="gt-place home"><MapPin size={18} />Home</div>
            <div className={`gt-place college ${!isDeviation ? "current" : ""}`}>
              <MapPin size={18} />College
            </div>
            {isDeviation && (
              <div className="gt-place unknown current">
                <AlertTriangle size={18} />Unknown Area
              </div>
            )}
          </div>
        </article>

        <div className="gt-route-info">
          <article className="gt-panel">
            <div className="gt-panel-head">
              <div><h2>Known Safe Routes</h2><p>Routes Guardian Twin treats as normal.</p></div>
            </div>
            <div className="gt-route-list">
              {[
                { from: "Home",    to: "College",  transport: "Cab",     safe: true  },
                { from: "College", to: "Home",     transport: "Cab",     safe: true  },
                { from: "College", to: "Library",  transport: "Walking", safe: true  },
                { from: "Home",    to: "Gym",      transport: "Walking", safe: true  },
                { from: "College", to: "Unknown",  transport: "Walking", safe: false },
              ].map((r) => (
                <div key={r.from + r.to} className={`gt-route-item ${r.safe ? "" : "gt-route-item-risk"}`}>
                  <div className="gt-route-path">
                    <span>{r.from}</span>
                    <Navigation size={14} />
                    <span>{r.to}</span>
                  </div>
                  <div className="gt-route-meta">
                    <span>🚌 {r.transport}</span>
                    {r.safe
                      ? <span className="gt-pill safe" style={{ fontSize: "0.72rem" }}>Safe</span>
                      : <span className="gt-pill danger" style={{ fontSize: "0.72rem" }}>Flagged</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="gt-panel">
            <div className="gt-panel-head">
              <div><h2>Current Route Status</h2><p>Live comparison against the learned pattern.</p></div>
              <span className={`gt-pill ${active.tone}`}>{active.status}</span>
            </div>
            <div className="gt-route-status-grid">
              <div><span>Expected</span><strong>{active.expected}</strong></div>
              <div><span>Current</span><strong>{active.current}</strong></div>
              <div><span>Route</span><strong>{active.route}</strong></div>
              <div><span>Reason</span><strong>{active.reason}</strong></div>
            </div>
            {isDeviation && (
              <div className="gt-deviation-alert">
                <AlertTriangle size={16} />
                <span>Route deviation detected — Evidence Autopilot is active.</span>
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── Evidence Vault tab ─────────────────────── */
function EvidenceTab({ active, tampered, setTampered, verified, setVerified, verifyEvidence, verifying, liveMessage, onTamper, onRestore }) {
  const [revealHash, setRevealHash] = useState(null);
  const evidence = active.evidence;

  const handleTamper = () => {
    if (!evidence.length) return;
    if (onTamper?.(evidence[0]?.id)) {
      setTampered(true);
      setVerified(false);
    } else {
      setTampered(true);
      setVerified(false);
    }
  };

  const handleRestore = () => {
    onRestore?.();
    setTampered(false);
    setVerified(true);
  };

  return (
    <div className="gt-tab-content">
      <article className="gt-panel">
        <div className="gt-panel-head">
          <div>
            <h2>Emergency Evidence Vault</h2>
            <p>
              All files are hashed with SHA-256 the moment they are created.
              Verifying recalculates the hash — any change is immediately visible.
            </p>
          </div>
          <span className={`gt-pill ${verified && evidence.length > 0 ? "safe" : evidence.length === 0 ? "safe" : "danger"}`}>
            {evidence.length === 0 ? "Standby" : verified ? "All Verified" : "Tampered Detected"}
          </span>
        </div>

        {evidence.length === 0 ? (
          <div className="gt-vault-empty">
            <LockKeyhole size={36} />
            <strong>Vault is empty</strong>
            <span>Evidence Autopilot only activates when risk crosses the alert threshold.</span>
            <span className="gt-vault-hint">Try the "Route Deviation" or "No Activity" demo scenario above.</span>
          </div>
        ) : (
          <div className="gt-evidence-list">
            {evidence.map((item, i) => {
              const isTamperedItem = tampered && i === 1;
              const displayHash = isTamperedItem
                ? item.hash.slice(0, -6) + "91BADC"
                : item.hash;
              const isRevealed = revealHash === item.name;

              return (
                <div key={item.name} className={`gt-evidence-card ${isTamperedItem ? "gt-evidence-tampered" : ""}`}>
                  <div className="gt-evidence-header">
                    <div className="gt-evidence-icon">
                      {item.type === "GPS Log" ? "📍" :
                       item.type === "Audio Recording" ? "🎙️" : "📱"}
                    </div>
                    <div className="gt-evidence-meta">
                      <strong>{item.name}</strong>
                      <div className="gt-evidence-tags">
                        <span className="gt-etag">{item.type}</span>
                        <span className="gt-etag">{item.size}</span>
                        <span className="gt-etag">{item.created}</span>
                      </div>
                    </div>
                    <div className="gt-evidence-status">
                      {isTamperedItem
                        ? <span className="gt-pill danger">Modified</span>
                        : <span className="gt-pill safe">Verified</span>
                      }
                    </div>
                  </div>

                  <div className="gt-hash-row">
                    <div className="gt-hash-label">
                      <Fingerprint size={14} />
                      SHA-256 Hash
                    </div>
                    <div className={`gt-hash-value ${isTamperedItem ? "gt-hash-mismatch" : ""}`}>
                      {isRevealed ? displayHash : `${displayHash.slice(0, 20)}...`}
                      <button
                        className="gt-hash-toggle"
                        onClick={() => setRevealHash(isRevealed ? null : item.name)}
                        aria-label={isRevealed ? "Hide hash" : "Show full hash"}
                      >
                        {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {isTamperedItem && (
                      <div className="gt-hash-alert">
                        <AlertTriangle size={13} /> Stored hash does not match current file hash
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="gt-vault-actions">
          <button
            className="gt-secondary-btn"
            type="button"
            onClick={verifyEvidence}
            disabled={verifying || evidence.length === 0}
          >
            <FileCheck2 size={16} />
            {verifying ? "Verifying..." : "Verify Integrity"}
          </button>
          <button
            className="gt-secondary-btn"
            type="button"
            onClick={handleTamper}
            disabled={evidence.length === 0 || tampered}
          >
            <AlertTriangle size={16} />
            Simulate Tamper
          </button>
          {tampered && (
            <button className="gt-secondary-btn" type="button" onClick={handleRestore}>
              <CheckCircle2 size={16} />
              Restore
            </button>
          )}
        </div>

        {liveMessage && <div className="gt-message">{liveMessage}</div>}
      </article>

      {/* Cybersecurity explainer */}
      <article className="gt-panel">
        <div className="gt-panel-head">
          <div><h2>Cybersecurity Layer</h2><p>How evidence integrity is protected.</p></div>
        </div>
        <div className="gt-cyber-grid">
          {[
            { icon: Fingerprint, color: "#a78bfa", title: "SHA-256 Hashing",           text: "Every evidence file gets a unique fingerprint the moment it is created. Any modification — even a single byte — changes the hash completely." },
            { icon: Clock3,      color: "#60a5fa", title: "Timestamping",               text: "Every action in the incident timeline is recorded with a precise timestamp so the exact sequence of events is provable in court." },
            { icon: LockKeyhole, color: "#86efac", title: "Encrypted Storage",          text: "Evidence files are stored with AES encryption. Only authorised parties with the correct key can access the content." },
            { icon: Eye,         color: "#fb7185", title: "Integrity Verification",     text: "Before any evidence is opened, the current hash is recalculated and compared with the stored hash. Any mismatch triggers a tamper alert." },
          ].map(({ icon: Icon, color, title, text }) => (
            <div key={title} className="gt-cyber-card">
              <Icon size={22} style={{ color }} />
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

/* ────────────────────────── How It Works tab ───────────────────────── */
function HowItWorksTab() {
  return (
    <div className="gt-tab-content">
      {/* Full advanced flow */}
      <article className="gt-panel">
        <div className="gt-panel-head">
          <div>
            <h2>Advanced Autopilot Flow</h2>
            <p>What happens from the first anomaly all the way to contact notification.</p>
          </div>
        </div>

        <div className="gt-advanced-flow">
          {[
            { step: "01", icon: Bot,         color: "#60a5fa", title: "Guardian Twin Detects Anomaly",
              text: "Location, time, movement, and activity signals are compared to the learned safety profile. Any deviation raises the anomaly score." },
            { step: "02", icon: TrendingUp,  color: "#facc15", title: "Risk Score Rises",
              text: "The weighted formula calculates a real-time risk score: 40% location + 20% time + 20% movement + 20% activity. Crossing 60 triggers a warning." },
            { step: "03", icon: DatabaseZap, color: "#fb7185", title: "Evidence Autopilot Activates",
              text: "At risk > 70, Autopilot starts automatically capturing GPS logs, audio, device state (OS, battery, network), and an incident timeline." },
            { step: "04", icon: Fingerprint, color: "#a78bfa", title: "SHA-256 Hash Generated",
              text: "Each evidence file receives a SHA-256 fingerprint immediately. Timestamps are attached to every action. AES encryption secures the files." },
            { step: "05", icon: ShieldCheck, color: "#86efac", title: "Silent SOS & Contact Alert",
              text: "Emergency contacts receive a silent notification with the evidence bundle, current location, risk level, and incident timeline." },
          ].map(({ step, icon: Icon, color, title, text }, i, arr) => (
            <div key={step} className="gt-flow-row">
              <div className="gt-flow-step-wrap">
                <div className="gt-flow-num" style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
                  {step}
                </div>
                {i < arr.length - 1 && <div className="gt-flow-connector" />}
              </div>
              <div className="gt-flow-card">
                <div className="gt-flow-icon" style={{ background: `${color}14`, border: `1px solid ${color}25` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* What the twin learns */}
      <article className="gt-panel">
        <div className="gt-panel-head">
          <div><h2>What Guardian Twin Learns</h2><p>The inputs that build your digital safety profile.</p></div>
        </div>
        <div className="gt-learns-grid">
          {[
            { icon: "📍", title: "Daily Locations",     items: ["Home", "College", "Library", "Gym", "Workplace"] },
            { icon: "📅", title: "Daily Schedule",      items: ["Leave Home: 8:30 AM", "Reach College: 9:00 AM", "Leave College: 5 PM", "Reach Home: 6 PM"] },
            { icon: "🗺️", title: "Travel Patterns",    items: ["Home → College", "College → Home", "College → Library"] },
            { icon: "🚌", title: "Transport Habits",    items: ["College cab", "Bus", "Walking"] },
            { icon: "👥", title: "Safe Contacts",       items: ["Parents", "Guardian", "Friends"] },
            { icon: "⚡", title: "Activity Rhythm",     items: ["Active every 20 min", "Alert at 60 min gap", "Autopilot at 120 min"] },
          ].map(({ icon, title, items }) => (
            <div key={title} className="gt-learns-card">
              <div className="gt-learns-icon">{icon}</div>
              <strong>{title}</strong>
              <ul>
                {items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </article>

      {/* Detection scenarios */}
      <article className="gt-panel">
        <div className="gt-panel-head">
          <div><h2>How It Detects Danger</h2><p>Three real-world anomaly scenarios.</p></div>
        </div>
        <div className="gt-scenarios-explain">
          {[
            { label: "Scenario 1", title: "Route Deviation",
              normal: "College → Home", today: "College → Unknown Area", notice: "Unexpected Route" },
            { label: "Scenario 2", title: "Late Night Activity",
              normal: "Home by 6 PM", today: "Still moving at 11 PM", notice: "Abnormal Activity" },
            { label: "Scenario 3", title: "Complete Inactivity",
              normal: "Active every 20 minutes", today: "No activity for 2 hours", notice: "Possible Distress" },
          ].map(({ label, title, normal, today, notice }) => (
            <div key={label} className="gt-explain-card">
              <div className="gt-explain-label">{label}</div>
              <strong>{title}</strong>
              <div className="gt-explain-compare">
                <div className="gt-explain-box safe">
                  <span>Normal</span>
                  <strong>{normal}</strong>
                </div>
                <ChevronRight size={16} style={{ color: "#475569", flexShrink: 0 }} />
                <div className="gt-explain-box danger">
                  <span>Today</span>
                  <strong>{today}</strong>
                </div>
              </div>
              <div className="gt-explain-notice">
                <AlertTriangle size={14} />
                AI notices: {notice}
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

/* ────────────────────────── Main component ─────────────────────────── */
function GuardianTwin() {
  const { user } = useAuth();
  const userKey = getUserKey(user);
  const { protectionOn, toggleProtection, lastStatus, performCheck } = useGuardianProtection();

  const [profile,     setProfile]     = useState(null);
  const [profileMessage, setProfileMessage] = useState("");
  const [liveResult,  setLiveResult]  = useState(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [checking,    setChecking]    = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);

  const [checkInForm, setCheckInForm] = useState({
    latitude: 19.033,
    longitude: 73.029,
    currentLocationLabel: "Current GPS location",
    routeLabel: "College → Home",
    transportMode: "College cab",
    inactiveMinutes: 10,
    batteryPercent: 82,
    networkType: "4G",
  });

  const previewTabs = [OverviewTab, ScheduleTab, RoutesTab, EvidenceTab, HowItWorksTab];

  const active = liveResult || lastStatus || SCENARIOS.safe;
  const StatusIcon =
    active.tone === "danger"
      ? AlertTriangle
      : active.tone === "warning"
        ? Clock3
        : ShieldCheck;
  const statusCopy = {
    safe: {
      title: "On track",
      body: "Your trip looks normal.",
      action: "Guard is ready.",
    },
    warning: {
      title: "Check in",
      body: "Something looks unusual.",
      action: "Tap I’m safe.",
    },
    danger: {
      title: "High risk",
      body: "Help may be needed.",
      action: "Alert contacts.",
    },
  }[active.tone] || {
    title: active.status,
    body: active.reason,
    action: "Review your status.",
  };

  useEffect(() => {
    loadProfile(user).then(({ profile: p }) => {
      setProfile(removeDefaultTripText(p));
      setCheckInForm((prev) => ({
        ...prev,
        latitude: p.safeLatitude ?? prev.latitude,
        longitude: p.safeLongitude ?? prev.longitude,
        transportMode: p.usualTransport ?? prev.transportMode,
        inactiveMinutes: getInactiveMinutes(userKey),
      }));
    });
  }, [user, userKey]);

  const updateProfileField  = (f, v) => setProfile((p) => ({ ...p, [f]: v }));
  const updateCheckInField  = (f, v) => setCheckInForm((p) => ({ ...p, [f]: v }));

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMessage("");
    try {
      const { profile: saved, source } = await saveGuardianProfile(user, profile);
      setProfile(saved);
      setProfileMessage(
        source === "api"
          ? "Guardian profile saved to server."
          : "Guardian profile saved locally. Twin is ready."
      );
    } catch {
      setProfileMessage("Profile could not be saved.");
    }
  };

  const applyCheckInResult = (result, payload) => {
    setLiveResult(result.ui);
    setCheckInForm((prev) => ({
      ...prev,
      inactiveMinutes: payload.inactiveMinutes,
    }));
    setLiveMessage(
      result.ui.autopilot === "Active"
        ? `High risk detected. Evidence Autopilot created incident with ${result.ui.evidence.length} files.`
        : "Check-in complete. Behavior matches your normal pattern."
    );
  };

  const runLiveCheckIn = async () => {
    setLiveMessage("");
    if (!profile) {
      setLiveMessage("Save your normal safety pattern first.");
      return;
    }
    if (!navigator.geolocation) {
      setLiveMessage("GPS not supported. Use manual check-in.");
      return;
    }
    setChecking(true);
    try {
      const coords = await getCurrentPosition();
      const payload = {
        ...checkInForm,
        latitude: coords.latitude,
        longitude: coords.longitude,
        inactiveMinutes: Number(checkInForm.inactiveMinutes),
        batteryPercent: Number(checkInForm.batteryPercent),
      };
      const result = await runCheckIn(user, profile, payload);
      applyCheckInResult(result, payload);
    } catch (err) {
      setLiveMessage(
        err?.message === "GPS not supported" || err?.code
          ? "Location denied or unavailable. Use manual check-in."
          : "Check-in failed. Try manual coordinates."
      );
    } finally {
      setChecking(false);
    }
  };

  const runManualCheckIn = async () => {
    setLiveMessage("");
    if (!profile) {
      setLiveMessage("Save your normal safety pattern first.");
      return;
    }
    setChecking(true);
    try {
      const payload = {
        ...checkInForm,
        latitude: Number(checkInForm.latitude),
        longitude: Number(checkInForm.longitude),
        inactiveMinutes: Number(checkInForm.inactiveMinutes),
        batteryPercent: Number(checkInForm.batteryPercent),
      };
      const result = await runCheckIn(user, profile, payload);
      applyCheckInResult(result, payload);
    } catch {
      setLiveMessage("Manual check-in failed.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="gt-main">
        <span style={{ display: "none" }} aria-hidden="true">{previewTabs.length}</span>

        {/* ── Simple status hero ── */}
        <section className="gt-hero">
          <div className="gt-hero-left">
            <span className="page-badge"><ShieldAlert size={16} />Journey Guard</span>
            <h1>Watch my trip</h1>
            <p>Start before leaving. Check in when safe.</p>
            <div className="gt-plain-steps" aria-label="How Guardian Twin works">
              <div><span>1</span><strong>Start</strong></div>
              <div><span>2</span><strong>Travel</strong></div>
              <div><span>3</span><strong>Check in</strong></div>
            </div>
          </div>

          <div className={`gt-status-summary ${active.tone}`}>
            <div className="gt-status-topline">
              <div className="gt-status-icon"><StatusIcon size={24} /></div>
              <span className={`gt-pill ${active.tone}`}>{active.status}</span>
            </div>
            <h2>{statusCopy.title}</h2>
            <p>{statusCopy.body}</p>
            <div className="gt-status-score">
              <RiskRing risk={active.risk} tone={active.tone} />
              <div>
                <span>Risk</span>
                <strong>{active.risk}/100</strong>
                <small>{statusCopy.action}</small>
              </div>
            </div>
            <div className="gt-status-facts">
              <div><span>Where you are</span><strong>{active.current}</strong></div>
              <div><span>Last activity</span><strong>{active.activity}</strong></div>
            </div>
          </div>
        </section>

        {/* ── Simple actions ── */}
        <section className="gt-action-grid" aria-label="Guardian Twin actions">
          <button
            type="button"
            className={`gt-action-card ${protectionOn ? "active" : ""}`}
            onClick={() => toggleProtection(!protectionOn)}
          >
            <ShieldCheck size={18} />
            <strong>{protectionOn ? "Guard is on" : "Start guard"}</strong>
            <span>Before leaving.</span>
          </button>
          <button
            type="button"
            className="gt-action-card"
            onClick={() => setShowCheckIn((v) => !v)}
          >
            <Navigation size={18} />
            <strong>{showCheckIn ? "Hide check-in" : "I'm safe"}</strong>
            <span>When you arrive.</span>
          </button>
          <button
            type="button"
            className="gt-action-card"
            onClick={() => performCheck().then((r) => r && applyCheckInResult(r, checkInForm)).catch(() => {})}
            disabled={checking || !profile}
          >
            <Zap size={18} />
            <strong>Check now</strong>
            <span>Recheck trip.</span>
          </button>
        </section>

        {/* ── Live / Manual check-in panel ── */}
        {showCheckIn && (
          <section className="gt-checkin-section">
            <div className="gt-checkin-grid">
              {/* Save profile */}
              <form className="gt-panel gt-checkin-form" onSubmit={saveProfile}>
                <div className="gt-panel-head">
                  <div><h2>My trip</h2><p>Only the basics.</p></div>
                </div>
                {profile ? (
                  <div className="gt-form-grid">
                    <label>Going to<input value={profile.expectedLocation || ""} onChange={(e) => updateProfileField("expectedLocation", e.target.value)} /></label>
                    <label>Arrive by<input type="time" value={profile.expectedHomeTime || "18:00"} onChange={(e) => updateProfileField("expectedHomeTime", e.target.value)} /></label>
                    <label>Route<input value={profile.safeRoute || ""} onChange={(e) => updateProfileField("safeRoute", e.target.value)} /></label>
                    <label>Alert after<input type="number" value={profile.maxInactiveMinutes ?? 120} onChange={(e) => updateProfileField("maxInactiveMinutes", e.target.value)} /></label>
                  </div>
                ) : (
                  <div className="gt-message">{profileMessage || "Loading profile…"}</div>
                )}
                <button className="gt-primary-btn" type="submit" disabled={!profile}>Save Journey</button>
                {profileMessage && profile && <div className="gt-message">{profileMessage}</div>}
              </form>

              {/* Run check-in */}
              <article className="gt-panel gt-checkin-form">
                <div className="gt-panel-head">
                  <div><h2>I’m safe</h2><p>Check in.</p></div>
                </div>
                <div className="gt-form-grid">
                  <label>Now at<input value={checkInForm.currentLocationLabel} onChange={(e) => updateCheckInField("currentLocationLabel", e.target.value)} /></label>
                  <label>Minutes silent<input type="number" value={checkInForm.inactiveMinutes} onChange={(e) => updateCheckInField("inactiveMinutes", e.target.value)} /></label>
                </div>
                <div className="gt-check-actions">
                  <button className="gt-primary-btn" type="button" onClick={runLiveCheckIn} disabled={checking}>
                    {checking ? "Checking…" : "Use my phone location"}
                  </button>
                  <button className="gt-secondary-btn" type="button" onClick={runManualCheckIn} disabled={checking}>
                    Save
                  </button>
                </div>
                {liveMessage && <div className="gt-message">{liveMessage}</div>}
              </article>
            </div>
          </section>
        )}

    </div>
  );
}

export default GuardianTwin;
