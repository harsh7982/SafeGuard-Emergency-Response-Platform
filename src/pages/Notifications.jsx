import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { getGuardianAlerts, getUserKey } from "../services/guardianTwinService";
import {
  ShieldCheck,
  ArrowLeft,
  Bell,
  Siren,
  FileWarning,
  Clock,
  CheckCheck,
  LoaderCircle,
  AlertTriangle,
} from "lucide-react";
import "./Notifications.css";

// Builds a notification feed from SOS + incidents data
function buildNotifications(incidents) {
  const notes = [];

  incidents.forEach((incident) => {
    const isSOS =
      incident.incidentType?.toLowerCase().includes("sos") ||
      incident.incidentType?.toLowerCase().includes("emergency");

    notes.push({
      id: `inc-${incident.id}`,
      type: isSOS ? "sos" : "incident",
      title: isSOS ? "SOS Alert Triggered" : `Incident Reported: ${incident.incidentType}`,
      body: incident.description || "No description provided.",
      time: incident.createdAt,
      status: incident.status,
      risk: incident.riskScore,
      read: incident.status === "RESOLVED",
    });

    if (incident.status === "INVESTIGATING") {
      notes.push({
        id: `upd-${incident.id}`,
        type: "update",
        title: "Incident Under Investigation",
        body: `Your report "${incident.incidentType}" is now being investigated.`,
        time: incident.createdAt,
        status: incident.status,
        read: false,
      });
    }

    if (incident.status === "ESCALATED") {
      notes.push({
        id: `esc-${incident.id}`,
        type: "alert",
        title: "Incident Escalated",
        body: `Your report "${incident.incidentType}" has been escalated to authorities.`,
        time: incident.createdAt,
        status: incident.status,
        read: false,
      });
    }
  });

  return notes.sort((a, b) => new Date(b.time) - new Date(a.time));
}

const TYPE_CONFIG = {
  sos: { icon: Siren, color: "#f43f5e", bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.25)", label: "SOS" },
  incident: { icon: FileWarning, color: "#fb7185", bg: "rgba(251,113,133,0.1)", border: "rgba(251,113,133,0.2)", label: "Report" },
  update: { icon: CheckCheck, color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)", label: "Update" },
  alert: { icon: AlertTriangle, color: "#facc15", bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.2)", label: "Alert" },
  guardian: { icon: ShieldCheck, color: "#14b8a6", bg: "rgba(20,184,166,0.1)", border: "rgba(20,184,166,0.22)", label: "Twin" },
};

function NotificationCard({ note, onMarkRead }) {
  const config = TYPE_CONFIG[note.type] || TYPE_CONFIG.incident;
  const Icon = config.icon;

  return (
    <div className={`notif-card ${note.read ? "read" : "unread"}`}
      style={{ borderColor: note.read ? "rgba(255,255,255,0.06)" : config.border, border: `1px solid ${note.read ? "rgba(255,255,255,0.06)" : config.border}` }}
    >
      <div
        className="notif-icon-bubble"
        style={{ background: config.bg, border: `1px solid ${config.border}` }}
      >
        <Icon size={19} style={{ color: config.color }} />
      </div>

      <div className="notif-card-body">
        <div className="notif-card-top">
          <span
            className="notif-type-badge"
            style={{ color: config.color, background: config.bg, border: `1px solid ${config.border}` }}
          >
            {config.label}
          </span>
          {!note.read && <span className="notif-unread-dot" />}
        </div>

        <h4 className="notif-card-title">{note.title}</h4>
        <p className="notif-card-desc">{note.body}</p>

        <div className="notif-card-footer">
          <span className="notif-card-time">
            <Clock size={13} />
            {new Date(note.time).toLocaleString()}
          </span>

          {!note.read && (
            <button className="notif-mark-read-btn" onClick={() => onMarkRead(note.id)}>
              <CheckCheck size={13} /> Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      const loadIncidentNotes = async () => {
        try {
          const { data } = await apiClient.get("/api/incidents");
          return buildNotifications(data);
        } catch {
          return [];
        }
      };

      const notes = await loadIncidentNotes();
      try {
        const guardianNotes = getGuardianAlerts(getUserKey(user)).map((a) => ({
          id: `gt-${a.id}`,
          type: "guardian",
          title: a.title,
          body: a.body,
          time: a.createdAt,
          status: a.riskLevel,
          read: a.read,
        }));

        setNotifications([...guardianNotes, ...notes].sort((a, b) => new Date(b.time) - new Date(a.time)));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = filter === "ALL"
    ? notifications
    : filter === "UNREAD"
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.type === filter.toLowerCase());

  return (
    <div className="notif-content">
        {/* Header */}
        <div className="notif-header">
          <div>
            <span className="dash-badge">
              <Bell size={14} />
              Safety Alerts
            </span>
            <h1 className="notif-title">
              Notifications
              {unreadCount > 0 && (
                <span className="notif-unread-count">{unreadCount}</span>
              )}
            </h1>
          </div>

          {unreadCount > 0 && (
            <button className="notif-mark-all-btn" onClick={markAllRead}>
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="notif-filters">
          {["ALL", "UNREAD", "SOS", "INCIDENT", "UPDATE", "ALERT"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`notif-filter-btn ${filter === f ? "active" : ""}`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="notif-loading">
            <LoaderCircle className="spin" size={20} />
            Loading notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="notif-empty">
            <Bell size={40} />
            <h3>
              {notifications.length === 0 ? "No notifications yet" : "Nothing matches this filter"}
            </h3>
            <p>
              {notifications.length === 0
                ? "Notifications appear here when you trigger SOS or report incidents."
                : "Try a different filter tab."}
            </p>
          </div>
        ) : (
          <div className="notif-list">
            {filtered.map((note) => (
              <NotificationCard key={note.id} note={note} onMarkRead={markRead} />
            ))}
          </div>
        )}
      </div>
  );
}

export default Notifications;
