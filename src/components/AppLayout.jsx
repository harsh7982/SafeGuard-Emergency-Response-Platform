import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  ShieldCheck, Phone, FileWarning, MapPin, Bot,
  ShieldAlert, ClipboardList, Bell, LogOut, LayoutDashboard,
} from "lucide-react";
import "../pages/Dashboard.css";

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

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const firstName = user?.fullName?.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const initials = user?.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="db-root">
      <aside className="db-sidebar">
        <div className="db-sidebar-logo">
          <div className="db-logo-icon"><ShieldCheck size={16} color="white" /></div>
          <span>SafeHer</span>
        </div>

        <nav className="db-sidebar-nav">
          {NAV_LINKS.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`db-nav-item ${location.pathname === to ? "db-nav-active" : ""}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="db-sidebar-footer">
          <Link to="/profile" className="db-sidebar-user">
            <div className="db-user-avatar">{initials}</div>
            <div className="db-user-info">
              <div className="db-user-name">{firstName}</div>
              <div className="db-user-role">Protected</div>
            </div>
          </Link>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="db-logout-btn"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      <main className="db-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
