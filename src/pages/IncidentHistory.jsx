import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import {
  ShieldCheck,
  FileWarning,
  LoaderCircle,
  ArrowLeft,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
} from "lucide-react";
import "./IncidentHistory.css";

const STATUS_LABELS = {
  NEW: { label: "New", color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.25)" },
  INVESTIGATING: { label: "Investigating", color: "#facc15", bg: "rgba(250,204,21,0.12)", border: "rgba(250,204,21,0.25)" },
  RESOLVED: { label: "Resolved", color: "#86efac", bg: "rgba(134,239,172,0.12)", border: "rgba(134,239,172,0.25)" },
  ESCALATED: { label: "Escalated", color: "#f87171", bg: "rgba(248,113,113,0.14)", border: "rgba(248,113,113,0.28)" },
};

const RISK_COLORS = {
  LOW: { color: "#bef264", bg: "rgba(190,242,100,0.12)", border: "rgba(190,242,100,0.2)" },
  MEDIUM: { color: "#facc15", bg: "rgba(250,204,21,0.12)", border: "rgba(250,204,21,0.2)" },
  HIGH: { color: "#fb7185", bg: "rgba(251,113,133,0.14)", border: "rgba(251,113,133,0.22)" },
  CRITICAL: { color: "#f43f5e", bg: "rgba(244,63,94,0.16)", border: "rgba(244,63,94,0.28)" },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.NEW;
  return (
    <span
      className="history-status-badge"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

function RiskBadge({ risk }) {
  const r = RISK_COLORS[risk] || RISK_COLORS.LOW;
  return (
    <span
      className="history-risk-badge"
      style={{ color: r.color, background: r.bg, border: `1px solid ${r.border}` }}
    >
      {risk || "LOW"}
    </span>
  );
}

function IncidentHistory() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await apiClient.get("/api/incidents");
        setIncidents(data);
      } catch {
        setError("Failed to load incident history.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    let result = incidents;

    if (statusFilter !== "ALL") {
      result = result.filter((i) => i.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.incidentType?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [search, statusFilter, incidents]);

  const stats = {
    total: incidents.length,
    resolved: incidents.filter((i) => i.status === "RESOLVED").length,
    active: incidents.filter((i) => i.status === "NEW" || i.status === "INVESTIGATING").length,
    escalated: incidents.filter((i) => i.status === "ESCALATED").length,
  };

  return (
    <div className="history-content">
        {/* Header */}
        <div className="history-header">
          <span className="dash-badge">Your Safety Record</span>
          <h1 className="history-title">Incident Reports</h1>
          <p className="history-desc">
            A full record of every incident you've reported. Track status updates and review past safety events.
          </p>
        </div>

        {/* Stats row */}
        <div className="history-stats">
          {[
            { label: "Total Reports", value: stats.total, icon: FileWarning, color: "#fb7185" },
            { label: "Active", value: stats.active, icon: AlertTriangle, color: "#facc15" },
            { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "#86efac" },
            { label: "Escalated", value: stats.escalated, icon: AlertTriangle, color: "#f87171" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="history-stat-card">
              <div className="history-stat-icon">
                <Icon size={22} style={{ color }} />
              </div>
              <div className="history-stat-value" style={{ color }}>{value}</div>
              <div className="history-stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter bar */}
        <div className="history-filter-bar">
          <div className="input-box history-search">
            <Search size={18} />
            <input
              placeholder="Search by type or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="history-filter-tabs">
            {["ALL", "NEW", "INVESTIGATING", "RESOLVED", "ESCALATED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`history-filter-btn ${statusFilter === s ? "active" : ""}`}
              >
                {s === "ALL" ? "All" : STATUS_LABELS[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="history-loading">
            <LoaderCircle className="spin" size={22} />
            Loading your incident history...
          </div>
        ) : error ? (
          <div className="form-message error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="history-empty">
            <FileWarning size={40} />
            <h3>
              {incidents.length === 0 ? "No incidents reported yet" : "No results match your filter"}
            </h3>
            <p>
              {incidents.length === 0
                ? "Once you submit a report, it will appear here."
                : "Try changing the search or status filter."}
            </p>
            {incidents.length === 0 && (
              <Link to="/report" className="history-empty-cta">
                Report First Incident
              </Link>
            )}
          </div>
        ) : (
          <div className="history-list">
            {filtered.map((incident) => (
              <div key={incident.id} className="history-incident-card">
                <div className="history-incident-top">
                  <div>
                    <div className="history-incident-type-row">
                      <FileWarning size={18} />
                      <h3>{incident.incidentType}</h3>
                    </div>
                    <p className="history-incident-desc">
                      {incident.description || "No description provided."}
                    </p>
                  </div>

                  <div className="history-badges">
                    <StatusBadge status={incident.status} />
                    <RiskBadge risk={incident.riskScore} />
                  </div>
                </div>

                <div className="history-incident-meta">
                  {incident.latitude && incident.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="history-meta-link"
                    >
                      <MapPin size={15} />
                      {Number(incident.latitude).toFixed(4)}, {Number(incident.longitude).toFixed(4)}
                    </a>
                  )}
                  <span className="history-meta-item">
                    <Clock size={15} />
                    {new Date(incident.createdAt).toLocaleString()}
                  </span>
                  <span className="history-meta-id">ID #{incident.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}

export default IncidentHistory;
