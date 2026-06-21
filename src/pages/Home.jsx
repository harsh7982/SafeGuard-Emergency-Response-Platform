import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, ArrowRight, Bot, ChevronRight,
  HeartHandshake, LockKeyhole, MapPin, Navigation,
  Phone, Siren, Sparkles, Check, ArrowUpRight,
  LayoutDashboard, FileWarning, Users, Smartphone, Bell,
  Zap, Eye, Shield, Radio, Clock, Globe, Fingerprint,
  AlertTriangle, Activity, Wifi, Server, Database,
} from "lucide-react";
import "./Home.css";

/* ═══ Hooks ═══ */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useMousePosition(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    el.addEventListener("mousemove", handler);
    return () => el.removeEventListener("mousemove", handler);
  }, [ref]);
}

/* ═══ Data ═══ */
const FEATURES = [
  { icon: Siren, color: "#f43f5e", title: "Emergency SOS", desc: "One-tap panic button sends your real-time GPS coordinates to every trusted contact. Works offline with SMS fallback.", tag: "INSTANT", to: "/dashboard" },
  { icon: Navigation, color: "#60a5fa", title: "Live GPS Tracking", desc: "Privacy-first location sharing. Start and stop anytime. Contacts see your movement in real-time on a live map.", tag: "REAL-TIME", to: "/tracking" },
  { icon: Bot, color: "#a78bfa", title: "AI Safety Assistant", desc: "Describe your situation in natural language. Get context-aware safety steps, route suggestions, and emergency protocols.", tag: "INTELLIGENT", to: "/ai" },
  { icon: Shield, color: "#14b8a6", title: "Guardian Twin AI", desc: "Machine learning model trained on your routine. Detects route deviations, unusual inactivity, and triggers automated evidence capture.", tag: "ADAPTIVE", to: "/guardian-twin" },
  { icon: Users, color: "#22c55e", title: "Trusted Safety Circle", desc: "Curated contact network with tiered permissions. Primary contacts get full alerts; secondary contacts receive check-in pings.", tag: "NETWORK", to: "/contacts" },
  { icon: FileWarning, color: "#fbbf24", title: "Evidence Vault", desc: "SHA-256 hashed incident reports with GPS metadata, timestamped evidence uploads, and tamper-proof chain of custody.", tag: "FORENSIC", to: "/report" },
];

const TECH_STACK = [
  { icon: Server, label: "Spring Boot API" },
  { icon: Database, label: "PostgreSQL" },
  { icon: Shield, label: "JWT + BCrypt" },
  { icon: Globe, label: "React 19" },
  { icon: Wifi, label: "WebSocket Ready" },
  { icon: Fingerprint, label: "SHA-256 Hashing" },
];

function Home() {
  const heroRef = useRef(null);
  useMousePosition(heroRef);
  const [whyRef, whyVis] = useReveal();
  const [featRef, featVis] = useReveal(0.08);
  const [howRef, howVis] = useReveal();
  const [secRef, secVis] = useReveal(0.08);
  const [techRef, techVis] = useReveal();
  const [ctaRef, ctaVis] = useReveal();

  return (
    <div className="sh">

      {/* ═══ NAV ═══ */}
      <nav className="sh-nav">
        <Link to="/" className="sh-nav-brand">
          <div className="sh-nav-logo"><ShieldCheck size={16} /></div>
          SafeHer
        </Link>
        <div className="sh-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#security">Security</a>
          <Link to="/dashboard"><LayoutDashboard size={13} /> Dashboard</Link>
        </div>
        <div className="sh-nav-actions">
          <Link to="/login" className="sh-nav-signin">Log in</Link>
          <Link to="/register" className="sh-nav-cta">Get Started</Link>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <header className="sh-hero" ref={heroRef}>
        <div className="sh-hero-blur" />
        <div className="sh-hero-noise" />
        <div className="sh-hero-grid-bg" />
        <div className="sh-hero-radial" />

        <div className="sh-hero-inner">
          <div className="sh-hero-left">
            <div className="sh-pill">
              <span className="sh-pill-dot" />
              <span>Open-source women safety platform</span>
              <ArrowUpRight size={12} />
            </div>

            <h1>
              <span className="sh-h1-line">Detect threats.</span>
              <span className="sh-h1-line sh-h1-grad">Protect instantly.</span>
              <span className="sh-h1-line">Stay connected.</span>
            </h1>

          <div className="sh-hero-btns">
              <Link to="/register" className="sh-btn-primary">
                Create free account
                <ArrowRight size={15} />
              </Link>
              <Link to="/login" className="sh-btn-ghost">
                Sign in
                <ChevronRight size={14} />
              </Link>
            </div>

          </div>

          <div className="sh-hero-right">
            <div className="sh-orb-container">
              <div className="sh-orb">
                <svg className="sh-orb-logo" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer glow circle */}
                  <circle cx="60" cy="60" r="58" stroke="rgba(251,113,133,0.3)" strokeWidth="1" />
                  <circle cx="60" cy="60" r="50" stroke="rgba(251,113,133,0.15)" strokeWidth="0.5" />
                  {/* Shield shape */}
                  <path d="M60 18 L88 32 L88 58 C88 78 74 94 60 102 C46 94 32 78 32 58 L32 32 Z" fill="url(#shieldGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
                  {/* Inner shield highlight */}
                  <path d="M60 26 L82 37 L82 57 C82 73 71 86 60 93 C49 86 38 73 38 57 L38 37 Z" fill="rgba(9,9,11,0.6)" stroke="rgba(251,113,133,0.3)" strokeWidth="0.5" />
                  {/* Woman silhouette — head */}
                  <circle cx="60" cy="48" r="7" fill="url(#headGrad)" />
                  {/* Woman silhouette — body */}
                  <path d="M52 58 C52 55 56 54 60 54 C64 54 68 55 68 58 L66 74 C66 76 64 78 60 78 C56 78 54 76 54 74 Z" fill="url(#bodyGrad)" />
                  {/* Heart accent */}
                  <path d="M60 82 C58 80 54 77 54 74.5 C54 73 55.5 72 57 72 C58.5 72 59.5 73 60 74 C60.5 73 61.5 72 63 72 C64.5 72 66 73 66 74.5 C66 77 62 80 60 82 Z" fill="var(--accent)" opacity="0.9" />
                  {/* Checkmark */}
                  <path d="M55 64 L58.5 67.5 L66 60" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
                  <defs>
                    <linearGradient id="shieldGrad" x1="60" y1="18" x2="60" y2="102">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#be123c" />
                    </linearGradient>
                    <linearGradient id="headGrad" x1="60" y1="41" x2="60" y2="55">
                      <stop offset="0%" stopColor="#fda4af" />
                      <stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                    <linearGradient id="bodyGrad" x1="60" y1="54" x2="60" y2="78">
                      <stop offset="0%" stopColor="#fda4af" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="sh-orb-ring sh-orb-ring-1" />
              <div className="sh-orb-ring sh-orb-ring-2" />
              <div className="sh-orb-ring sh-orb-ring-3" />

              <div className="sh-hcard sh-hcard-1">
                <div className="sh-hcard-icon" style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e" }}><Siren size={16} /></div>
                <div><strong>SOS Triggered</strong><span>GPS sent to 3 contacts</span></div>
                <div className="sh-hcard-time">now</div>
              </div>
              <div className="sh-hcard sh-hcard-2">
                <div className="sh-hcard-icon" style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}><MapPin size={16} /></div>
                <div><strong>Live Tracking</strong><span>Sharing with Mom</span></div>
                <div className="sh-hcard-time">active</div>
              </div>
              <div className="sh-hcard sh-hcard-3">
                <div className="sh-hcard-icon" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}><Activity size={16} /></div>
                <div><strong>Guardian Twin</strong><span>Normal pattern detected</span></div>
                <div className="sh-hcard-time">2m ago</div>
              </div>
              <div className="sh-hcard sh-hcard-4">
                <div className="sh-hcard-icon" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}><Check size={16} /></div>
                <div><strong>All Clear</strong><span>Safety score: 96/100</span></div>
                <div className="sh-hcard-time">live</div>
              </div>
            </div>
          </div>
        </div>

        <div className="sh-hero-ticker">
          <div className="sh-hero-ticker-inner">
            <span><Check size={12} /> Permission-based GPS</span>
            <span><Check size={12} /> JWT + BCrypt auth</span>
            <span><Check size={12} /> End-to-end encrypted</span>
            <span><Check size={12} /> No third-party data sharing</span>
            <span><Check size={12} /> Open-source codebase</span>
            <span><Check size={12} /> SHA-256 evidence hashing</span>
            <span><Check size={12} /> Real-time SOS alerts</span>
            <span><Check size={12} /> Permission-based GPS</span>
            <span><Check size={12} /> JWT + BCrypt auth</span>
            <span><Check size={12} /> End-to-end encrypted</span>
            <span><Check size={12} /> No third-party data sharing</span>
            <span><Check size={12} /> Open-source codebase</span>
            <span><Check size={12} /> SHA-256 evidence hashing</span>
            <span><Check size={12} /> Real-time SOS alerts</span>
          </div>
        </div>
      </header>

      {/* ═══ WHY ═══ */}
      <section className={`sh-why ${whyVis ? "vis" : ""}`} ref={whyRef}>
        <div className="sh-section-label">THE PROBLEM</div>
        <h2 className="sh-section-title">Women deserve to feel safe.<br /><em>Technology should guarantee it.</em></h2>
        <div className="sh-why-grid">
          {[
            { num: "87%", text: "of women globally have experienced harassment or felt unsafe in public spaces" },
            { num: "45%", text: "avoid certain routes or areas due to safety concerns — limiting their freedom" },
            { num: "3.2s", text: "average time wasted unlocking phone in panic — SafeHer SOS works in under 1 second" },
            { num: "71%", text: "of incidents go unreported because the process is too complex or traumatic" },
          ].map(({ num, text }) => (
            <div key={num} className="sh-why-card">
              <div className="sh-why-num">{num}</div>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className={`sh-feat ${featVis ? "vis" : ""}`} id="features" ref={featRef}>
        <div className="sh-section-label">CAPABILITIES</div>
        <h2 className="sh-section-title">Six integrated safety systems.<br /><em>One unified platform.</em></h2>
        <p className="sh-section-sub">Each module works independently and together — creating layered protection that adapts to your situation in real-time.</p>

        <div className="sh-feat-grid">
          {FEATURES.map(({ icon: Icon, color, title, desc, tag, to }, i) => (
            <Link to={to} key={title} className="sh-feat-card" style={{ "--c": color, "--i": i }}>
              <div className="sh-feat-top">
                <div className="sh-feat-icon"><Icon size={20} /></div>
                <span className="sh-feat-tag">{tag}</span>
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <div className="sh-feat-footer">
                <span>Learn more</span>
                <ArrowRight size={14} />
              </div>
              <div className="sh-feat-glow" />
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className={`sh-how ${howVis ? "vis" : ""}`} id="how" ref={howRef}>
        <div className="sh-section-label">WORKFLOW</div>
        <h2 className="sh-section-title">From setup to protection<br /><em>in under 60 seconds.</em></h2>

        <div className="sh-how-timeline">
          {[
            { step: "01", title: "Create your identity", desc: "Sign up with email and a strong password. Your account is secured with BCrypt hashing and JWT authentication from the first moment.", icon: Fingerprint },
            { step: "02", title: "Build your safety circle", desc: "Add trusted contacts with phone numbers and relationships. Define who gets primary SOS alerts vs. secondary check-in notifications.", icon: Users },
            { step: "03", title: "Configure Guardian Twin", desc: "Let the AI learn your daily patterns — routes, schedules, activity rhythm. It builds a behavioral baseline unique to you.", icon: Shield },
            { step: "04", title: "Stay protected 24/7", desc: "Use any tool anytime: SOS, live tracking, AI chat, incident reports. Guardian Twin monitors in the background and escalates automatically.", icon: Radio },
          ].map(({ step, title, desc, icon: Icon }, i) => (
            <div key={step} className="sh-how-step" style={{ "--i": i }}>
              <div className="sh-how-left">
                <div className="sh-how-num">{step}</div>
                <div className="sh-how-line" />
              </div>
              <div className="sh-how-body">
                <div className="sh-how-icon"><Icon size={20} /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SECURITY ═══ */}
      <section className={`sh-sec ${secVis ? "vis" : ""}`} id="security" ref={secRef}>
        <div className="sh-section-label">ARCHITECTURE</div>
        <h2 className="sh-section-title">Enterprise-grade security.<br /><em>Zero compromises.</em></h2>
        <p className="sh-section-sub">Every layer of SafeHer is designed with security-first principles. Your safety data never leaves your control.</p>

        <div className="sh-sec-grid">
          {[
            { icon: LockKeyhole, color: "#a78bfa", title: "JWT Authentication", desc: "Stateless token-based auth on every API request. Tokens expire, rotate, and are cryptographically verified server-side." },
            { icon: Fingerprint, color: "#f43f5e", title: "BCrypt Password Hashing", desc: "12-round salted hashing makes brute-force attacks computationally infeasible. Even database breaches can't expose passwords." },
            { icon: Navigation, color: "#60a5fa", title: "Consent-Based GPS", desc: "Location services activate only on explicit user action. No background tracking, no persistent location history without permission." },
            { icon: Eye, color: "#22c55e", title: "Zero Data Brokering", desc: "No analytics SDKs, no ad networks, no data partnerships. Your safety information stays within SafeHer infrastructure exclusively." },
            { icon: Database, color: "#fbbf24", title: "SHA-256 Evidence Integrity", desc: "Every uploaded file is hashed at capture time. Verification recalculates and compares — any byte change triggers tamper alerts." },
            { icon: Server, color: "#14b8a6", title: "Encrypted Storage", desc: "AES-256 encryption at rest for all evidence files. Transport layer secured with TLS 1.3. Defense in depth at every layer." },
          ].map(({ icon: Icon, color, title, desc }, i) => (
            <div key={title} className="sh-sec-card" style={{ "--c": color, "--i": i }}>
              <div className="sh-sec-icon"><Icon size={20} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <div className="sh-sec-glow" />
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TECH STACK ═══ */}
      <section className={`sh-tech ${techVis ? "vis" : ""}`} ref={techRef}>
        <div className="sh-section-label">BUILT WITH</div>
        <h2 className="sh-section-title">Production-ready tech stack.</h2>
        <div className="sh-tech-row">
          {TECH_STACK.map(({ icon: Icon, label }) => (
            <div key={label} className="sh-tech-item">
              <Icon size={20} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className={`sh-cta ${ctaVis ? "vis" : ""}`} ref={ctaRef}>
        <div className="sh-cta-bg" />
        <div className="sh-cta-inner">
          <h2>Ready to build your safety network?</h2>
          <p>Create your account in under 30 seconds. Add contacts, configure alerts, and start protection immediately.</p>
          <div className="sh-cta-btns">
            <Link to="/register" className="sh-btn-primary sh-btn-lg">
              Get started — it's free
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="sh-btn-ghost">
              Sign in to existing account
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="sh-footer">
        <div className="sh-footer-top">
          <div className="sh-footer-brand">
            <div className="sh-nav-logo"><ShieldCheck size={16} /></div>
            <span>SafeHer</span>
          </div>
          <p>Open-source platform for women's safety. Built with React, Spring Boot, and PostgreSQL.</p>
        </div>
        <div className="sh-footer-links">
          <div>
            <h4>Product</h4>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/tracking">Live Tracking</Link>
            <Link to="/ai">AI Assistant</Link>
            <Link to="/guardian-twin">Guardian Twin</Link>
          </div>
          <div>
            <h4>Safety</h4>
            <Link to="/contacts">Trusted Contacts</Link>
            <Link to="/report">Report Incident</Link>
            <Link to="/history">Incident History</Link>
            <Link to="/notifications">Alerts</Link>
          </div>
          <div>
            <h4>Account</h4>
            <Link to="/register">Create Account</Link>
            <Link to="/login">Sign In</Link>
            <Link to="/profile">Profile</Link>
          </div>
        </div>
        <div className="sh-footer-bottom">
          <span>© 2024 SafeHer. Designed for safety.</span>
          <div className="sh-footer-badges">
            <span><Check size={11} /> JWT Secured</span>
            <span><Check size={11} /> BCrypt</span>
            <span><Check size={11} /> SHA-256</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
