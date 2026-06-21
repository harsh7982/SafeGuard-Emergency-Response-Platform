import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  ShieldCheck, User, Mail, Lock, Eye, EyeOff,
  ArrowRight, HeartHandshake, MapPinned, UserPlus,
} from "lucide-react";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (password !== confirmPassword) { setMessage("Passwords do not match."); return; }
    if (password.length < 8) { setMessage("Password must be at least 8 characters."); return; }
    setIsSubmitting(true);
    try {
      await register({ fullName: name, email, password });
      navigate("/login", { replace: true });
    } catch (err) {
      setMessage(err?.response?.data?.message || "Unable to create account. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-v2">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-grid-bg" />

      <Link to="/" className="auth-back-home">
        <div className="auth-back-logo"><ShieldCheck size={18} color="white" /></div>
        SafeHer
      </Link>

      <div className="auth-layout">
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="auth-left-tag">
              <span className="auth-tag-dot" />
              Join SafeHer Network
            </div>
            <h1 className="auth-left-title">
              Create your<br />
              <span className="auth-left-accent">safety identity.</span>
            </h1>
            <p className="auth-left-desc">
              Build your secure account to access every safety tool SafeHer offers —
              SOS alerts, GPS tracking, AI assistance, and more.
            </p>
            <div className="auth-feature-list">
              {[
                { icon: UserPlus,      label: "Quick Setup",         desc: "Ready in under a minute" },
                { icon: HeartHandshake,label: "Trusted Circle",      desc: "Add contacts who get SOS alerts" },
                { icon: MapPinned,     label: "Location Safety",     desc: "GPS sharing on your terms" },
                { icon: ShieldCheck,   label: "Secured Account",     desc: "BCrypt + JWT protection" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="auth-feature-item">
                  <div className="auth-feature-icon"><Icon size={16} /></div>
                  <div>
                    <div className="auth-feature-label">{label}</div>
                    <div className="auth-feature-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-right">
          <div className="auth-form-card">
            <div className="auth-form-icon">
              <ShieldCheck size={28} color="white" />
            </div>
            <h2 className="auth-form-title">Create Account</h2>
            <p className="auth-form-sub">Start your protection journey</p>

            <form onSubmit={handleSubmit} className="auth-form-body">
              <div className="auth-field">
                <label>Full Name</label>
                <div className="input-box">
                  <User size={18} />
                  <input type="text" placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
              </div>

              <div className="auth-field">
                <label>Email Address</label>
                <div className="input-box">
                  <Mail size={18} />
                  <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="auth-field">
                <label>Password</label>
                <div className="input-box">
                  <Lock size={18} />
                  <input type={showPassword ? "text" : "password"} placeholder="Minimum 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="auth-eye-btn" aria-label="Toggle password">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label>Confirm Password</label>
                <div className="input-box">
                  <Lock size={18} />
                  <input type={showConfirm ? "text" : "password"} placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="auth-eye-btn" aria-label="Toggle confirm password">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {message && <div className="auth-error-box">{message}</div>}

              <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? <span className="auth-spinner" /> : <>Create SafeHer Account <ArrowRight size={18} /></>}
              </button>
            </form>

            <div className="auth-divider"><span>Already have an account?</span></div>
            <Link to="/login" className="auth-alt-btn">Sign in instead</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
