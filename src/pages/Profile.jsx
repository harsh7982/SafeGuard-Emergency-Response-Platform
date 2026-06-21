import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  ShieldCheck,
  ArrowLeft,
  User,
  Mail,
  LogOut,
  Shield,
  Phone,
  FileWarning,
  MapPin,
  Bot,
  KeyRound,
  ClipboardList,
} from "lucide-react";
import "./Profile.css";

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  const roles = user?.roles || [];
  const isAdmin = roles.some((r) => r === "ROLE_ADMIN" || r === "ADMIN");
  const isOfficer = roles.some((r) => r === "ROLE_OFFICER" || r === "OFFICER");

  return (
    <div className="profile-content">
        {/* Profile hero card */}
        <div className="profile-hero-card">
          <div className="profile-avatar">{initials}</div>

          <div className="profile-hero-info">
            <div className="profile-name-row">
              <h1 className="profile-name">{user?.fullName || "SafeHer User"}</h1>
              {isAdmin && <span className="profile-role-badge admin">Admin</span>}
              {isOfficer && <span className="profile-role-badge officer">Officer</span>}
              {!isAdmin && !isOfficer && (
                <span className="profile-role-badge user">Protected</span>
              )}
            </div>
            <div className="profile-email-row">
              <Mail size={15} />
              <span>{user?.email || "—"}</span>
            </div>
          </div>

          <button className="profile-logout-btn" onClick={handleLogout}>
            <LogOut size={17} />
            Sign Out
          </button>
        </div>

        {/* Account info grid */}
        <div className="profile-info-grid">
          {/* Account details */}
          <div className="profile-card">
            <div className="profile-card-header">
              <User size={19} />
              <h3>Account Details</h3>
            </div>

            {[
              { label: "Full Name",     value: user?.fullName || "—",                                          icon: User   },
              { label: "Email Address", value: user?.email    || "—",                                          icon: Mail   },
              { label: "Account Role",  value: isAdmin ? "Administrator" : isOfficer ? "Safety Officer" : "User", icon: Shield },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="profile-info-row">
                <Icon size={16} />
                <div>
                  <div className="profile-info-label">{label}</div>
                  <div className="profile-info-value">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Security */}
          <div className="profile-card">
            <div className="profile-card-header">
              <Shield size={19} />
              <h3>Security</h3>
            </div>

            <div className="profile-info-row">
              <KeyRound size={16} />
              <div>
                <div className="profile-info-label">Password</div>
                <div className="profile-info-value">••••••••••••</div>
              </div>
            </div>

            <div className="profile-info-row">
              <Shield size={16} />
              <div>
                <div className="profile-info-label">Authentication</div>
                <div className="profile-jwt-row">
                  <span className="profile-jwt-dot" />
                  JWT Token Active
                </div>
              </div>
            </div>

            <div className="profile-info-row">
              <KeyRound size={16} />
              <div>
                <div className="profile-info-label">Password Encryption</div>
                <div className="profile-info-value">BCrypt — Secure</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="profile-links-card">
          <h3>Quick Access</h3>
          <div className="profile-links-grid">
            {[
              { to: "/contacts", icon: Phone,        label: "Emergency Contacts" },
              { to: "/report",   icon: FileWarning,  label: "Report Incident"    },
              { to: "/history",  icon: ClipboardList,label: "Incident History"   },
              { to: "/tracking", icon: MapPin,        label: "Live Tracking"      },
              { to: "/ai",       icon: Bot,           label: "AI Assistant"       },
            ].map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to} className="profile-link-item">
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
  );
}

export default Profile;
