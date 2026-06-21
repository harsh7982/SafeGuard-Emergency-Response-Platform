import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useGuardianProtection } from "../context/GuardianProtection";
import "./Dashboard.css";
import {
  ShieldCheck, Siren, MapPin, Phone, FileWarning,
  Bot, Users, Bell, LogOut,
  ClipboardList, LayoutDashboard, ChevronRight,
  Radio, AlertTriangle, CheckCircle2, ShieldAlert,
} from "lucide-react";

/* Animated counter hook */
function useCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

const NAV_LINKS = [
  { to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard"   },
  { to: "/contacts",      icon: Phone,            label: "Contacts"    },
  { to: "/report",        icon: FileWarning,      label: "Report"      },
  { to: "/tracking",      icon: MapPin,           label: "Tracking"    },
  { to: "/ai",            icon: Bot,              label: "AI Assistant"},
  { to: "/guardian-twin", icon: ShieldAlert,      label: "Guardian Twin"},
  { to: "/history",       icon: ClipboardList,    label: "History"     },
  { to: "/notifications", icon: Bell,             label: "Alerts"      },
];

const RISK_CLASS = { CRITICAL:"risk-critical", HIGH:"risk-high", MEDIUM:"risk-medium" };

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lastStatus, protectionOn } = useGuardianProtection();
  const [sosLoading, setSosLoading]   = useState(false);
  const [sosMessage, setSosMessage]   = useState({ type:"", text:"" });
  const [sosCount,   setSosCount]     = useState(0);
  const [contactsCount, setContactsCount] = useState(0);
  const [reportsCount,  setReportsCount]  = useState(0);
  const [incidentRows,  setIncidentRows]  = useState([]);
  const [loading, setLoading] = useState(true);

  const contactsAnim = useCounter(contactsCount);
  const reportsAnim  = useCounter(reportsCount);
  const sosAnim      = useCounter(sosCount);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, iRes] = await Promise.all([
          apiClient.get("/api/contacts"),
          apiClient.get("/api/incidents"),
        ]);
        setContactsCount(cRes.data.length);
        setReportsCount(iRes.data.length);
        setIncidentRows(iRes.data.slice(0,5).map(i => ({
          id: i.id,
          title: i.incidentType,
          subtitle: i.description || "No description.",
          badge: i.riskScore || "LOW",
          time: new Date(i.createdAt).toLocaleString(),
          status: i.status,
        })));
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSOS = async () => {
    setSosMessage({ type:"", text:"" });
    if (!navigator.geolocation) { setSosMessage({ type:"error", text:"GPS not supported." }); return; }
    if (!window.confirm("Send emergency SOS alert now?")) return;
    setSosLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { data } = await apiClient.post("/api/sos", {
            message: "SOS from SafeHer dashboard",
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
          setSosCount(p => p+1);
          setSosMessage({ type:"success", text: data.message || "SOS sent successfully." });
        } catch(e) {
          setSosMessage({ type:"error", text: e?.response?.data?.message || "SOS failed." });
        } finally { setSosLoading(false); }
      },
      () => { setSosMessage({ type:"error", text:"Location denied. Enable GPS and retry." }); setSosLoading(false); }
    );
  };

  const firstName = user?.fullName?.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const initials  = user?.fullName?.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2) || "?";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      {/* Top bar */}
      <div className="db-topbar">
        <div>
          <div className="db-topbar-greeting">{greeting}, {firstName} 👋</div>
          <div className="db-topbar-sub">Here's your safety overview</div>
        </div>
        <div className="db-topbar-actions">
          <Link to="/profile" className="db-topbar-avatar">{initials}</Link>
        </div>
      </div>

        {/* Stats row */}
        <div className="db-stats-row">
          {[
            { icon: Users,       value: contactsAnim, label: "Trusted Contacts",  color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.2)"  },
            { icon: Siren,       value: sosAnim,      label: "SOS Triggered",     color: "#f43f5e", bg: "rgba(244,63,94,0.1)",   border: "rgba(244,63,94,0.22)"  },
            { icon: FileWarning, value: reportsAnim,  label: "Reports Filed",     color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)"  },
            { icon: ShieldCheck, value: protectionOn ? "ON" : "OFF", label: "Guardian Protection", color: "#86efac", bg: "rgba(134,239,172,0.1)", border: "rgba(134,239,172,0.2)" },
          ].map(({ icon: Icon, value, label, color, bg, border }) => (
            <div key={label} className="db-stat-card" style={{ "--stat-color": color, "--stat-bg": bg, "--stat-border": border }}>
              <div className="db-stat-icon"><Icon size={20} style={{ color }} /></div>
              <div className="db-stat-value" style={{ color }}>{value}</div>
              <div className="db-stat-label">{label}</div>
            </div>
          ))}
        </div>

        {lastStatus && (
          <Link to="/guardian-twin" className="db-guardian-banner" style={{
            "--gt-tone": lastStatus.tone === "danger" ? "#fb7185" : lastStatus.tone === "warning" ? "#facc15" : "#86efac",
          }}>
            <div className="db-guardian-banner-left">
              <ShieldAlert size={20} />
              <div>
                <strong>Guardian Twin — {lastStatus.status}</strong>
                <span>{lastStatus.reason} · Match {lastStatus.match}% · Autopilot {lastStatus.autopilot}</span>
              </div>
            </div>
            <div className="db-guardian-banner-meta">
              {protectionOn ? "Protection ON" : "Protection OFF"} · Risk {lastStatus.risk}/100
              <ChevronRight size={16} />
            </div>
          </Link>
        )}

        {/* Main grid */}
        <div className="db-content-grid">
          {/* SOS Panel */}
          <div className="db-sos-card">
            <div className="db-sos-grid-lines" />
            <div className="db-sos-top">
              <AlertTriangle size={16} style={{ color: "#fda4af" }} />
              <span>Emergency Only</span>
            </div>
            <div className="db-sos-center">
              <button
                className={`db-sos-btn ${sosLoading ? "db-sos-loading" : ""}`}
                onClick={handleSOS}
                disabled={sosLoading}
                aria-label="Trigger SOS"
              >
                {sosLoading ? <span className="db-sos-spinner" /> : "SOS"}
              </button>
              <div className="db-sos-rings">
                <div className="db-sos-ring r1" />
                <div className="db-sos-ring r2" />
                <div className="db-sos-ring r3" />
              </div>
            </div>
            <p className="db-sos-hint">Tap to send emergency alert with your location</p>
            {sosMessage.text && (
              <div className={`db-sos-msg db-sos-msg-${sosMessage.type}`}>
                {sosMessage.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                {sosMessage.text}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="db-quick-card">
            <div className="db-section-title">
              <Radio size={16} />
              Quick Actions
            </div>
            <div className="db-actions-list">
              {[
                { to:"/contacts", icon:Phone,       label:"Emergency Contacts", desc:"Manage trusted people",    color:"#60a5fa" },
                { to:"/report",   icon:FileWarning, label:"Report Incident",    desc:"File a safety report",     color:"#fbbf24" },
                { to:"/tracking", icon:MapPin,      label:"Live Tracking",      desc:"Share your location",      color:"#86efac" },
                { to:"/ai",       icon:Bot,         label:"AI Assistant",       desc:"Get instant guidance",     color:"#a78bfa" },
                { to:"/guardian-twin", icon:ShieldAlert, label:"Guardian Twin", desc:"Detect abnormal patterns", color:"#14b8a6" },
              ].map(({ to, icon:Icon, label, desc, color }) => (
                <Link key={to} to={to} className="db-action-item">
                  <div className="db-action-icon" style={{ background:`${color}14`, border:`1px solid ${color}25` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div className="db-action-text">
                    <div className="db-action-label">{label}</div>
                    <div className="db-action-desc">{desc}</div>
                  </div>
                  <ChevronRight size={15} className="db-action-arrow" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="db-recent-card">
          <div className="db-recent-header">
            <div className="db-section-title">
              <ClipboardList size={16} />
              Recent Incidents
            </div>
            <Link to="/history" className="db-view-all">View all <ChevronRight size={14} /></Link>
          </div>

          {loading ? (
            <div className="db-skeleton-list">
              {[1,2,3].map(i => <div key={i} className="db-skeleton-row" />)}
            </div>
          ) : incidentRows.length === 0 ? (
            <div className="db-empty-state">
              <ShieldCheck size={36} style={{ color: "#1e293b" }} />
              <p>No incidents reported yet.</p>
              <Link to="/report" className="db-empty-cta">Report your first incident</Link>
            </div>
          ) : (
            <div className="db-incident-list">
              {incidentRows.map(incident => (
                <div key={incident.id} className="db-incident-row">
                  <div className={`db-incident-dot ${RISK_CLASS[incident.badge] || "risk-low"}`} />
                  <div className="db-incident-info">
                    <div className="db-incident-title-row">
                      <span className="db-incident-title">{incident.title}</span>
                      <span className={`risk-chip ${RISK_CLASS[incident.badge] || "risk-low"}`}>{incident.badge}</span>
                    </div>
                    <div className="db-incident-sub">{incident.subtitle}</div>
                    <div className="db-incident-time">{incident.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </>
  );
}

export default Dashboard;
