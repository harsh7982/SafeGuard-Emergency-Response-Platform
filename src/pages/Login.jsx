import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  Mail, Lock, Eye, EyeOff, ShieldCheck,
  ArrowRight, Siren, MapPin, Users, Bot,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to sign in. Check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-v2">
      {/* Background orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-grid-bg" />

      {/* Back to home */}
      <Link to="/" className="auth-back-home">
        <div className="auth-back-logo">
          <ShieldCheck size={18} color="white" />
        </div>
        SafeHer
      </Link>

      <div className="auth-layout">
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="auth-left-tag">
              <span className="auth-tag-dot" />
              Secure Access Portal
            </div>

            <h1 className="auth-left-title">
              Welcome<br />back,<br />
              <span className="auth-left-accent">protector.</span>
            </h1>

            <p className="auth-left-desc">
              Your safety command center is one sign-in away. Monitor alerts,
              manage contacts, and keep protection active.
            </p>

            <div className="auth-feature-list">
              {[
                { icon: Siren,   label: "SOS Emergency System",    desc: "One-tap instant alerts" },
                { icon: MapPin,  label: "Live GPS Tracking",        desc: "Real-time location sharing" },
                { icon: Users,   label: "Trusted Contacts",         desc: "Your safety circle" },
                { icon: Bot,     label: "AI Safety Assistant",      desc: "24/7 guidance" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="auth-feature-item">
                  <div className="auth-feature-icon">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="auth-feature-label">{label}</div>
                    <div className="auth-feature-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="auth-right">
          <div className="auth-form-card">
            <div className="auth-form-icon">
              <ShieldCheck size={28} color="white" />
            </div>

            <h2 className="auth-form-title">Sign in to SafeHer</h2>
            <p className="auth-form-sub">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit} className="auth-form-body">
              <div className="auth-field">
                <label>Email Address</label>
                <div className="input-box">
                  <Mail size={18} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-field-row">
                  <label>Password</label>
                  <a href="#" className="auth-forgot">Forgot password?</a>
                </div>
                <div className="input-box">
                  <Lock size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="auth-eye-btn"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <div className="auth-error-box">{error}</div>}

              <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="auth-spinner" />
                ) : (
                  <>Sign in securely <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>New to SafeHer?</span>
            </div>

            <Link to="/register" className="auth-alt-btn">
              Create a free account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
