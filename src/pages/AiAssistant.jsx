import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, CheckCircle2, LoaderCircle, MapPin, Mic, MicOff, PhoneCall, Radio, Send, ShieldCheck, Siren, Square, Volume2, VolumeX } from "lucide-react";
import apiClient from "../api/client";
import "./AiAssistant.css";

const EMERGENCY_PHRASES = ["safeher help", "help me safeher", "i am in danger", "someone is following me", "send sos", "emergency"];
const getSpeechRecognition = () => window.SpeechRecognition || window.webkitSpeechRecognition;
const isEmergencyMessage = (text) => EMERGENCY_PHRASES.some((phrase) => text.toLowerCase().trim().includes(phrase));

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported on this device."));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => reject(new Error("Location permission was denied or unavailable.")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

function AIAssistant() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([{ role: "assistant", text: "Tell me what is happening. I’ll give you short, practical steps—and you can say “SafeHer help” anytime to send SOS." }]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [status, setStatus] = useState("");
  const [trackingActive, setTrackingActive] = useState(false);
  const [lastLocation, setLastLocation] = useState(null);
  const [lastSharedAt, setLastSharedAt] = useState(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const locationWatchRef = useRef(null);
  const lastLocationPushRef = useRef(0);
  const primaryContact = contacts[0];
  const canListen = useMemo(() => Boolean(getSpeechRecognition()), []);

  useEffect(() => {
    apiClient.get("/api/contacts").then(({ data }) => setContacts(Array.isArray(data) ? data : [])).catch(() => setContacts([]));
  }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, loading]);
  useEffect(() => () => {
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    if (locationWatchRef.current !== null) navigator.geolocation.clearWatch(locationWatchRef.current);
  }, []);

  const speak = (text) => {
    if (!voiceReplies || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  };
  const addAssistantMessage = (text, shouldSpeak = true) => {
    setChat((prev) => [...prev, { role: "assistant", text }]);
    if (shouldSpeak) speak(text);
  };

  const stopEmergencyTracking = () => {
    if (locationWatchRef.current !== null) navigator.geolocation.clearWatch(locationWatchRef.current);
    locationWatchRef.current = null;
    localStorage.removeItem("safeher_emergency_tracking");
    setTrackingActive(false);
    setStatus("Emergency live tracking stopped. Your SOS remains registered.");
  };

  const startEmergencyTracking = (incidentId, initialLocation) => {
    if (!navigator.geolocation) return;
    if (locationWatchRef.current !== null) navigator.geolocation.clearWatch(locationWatchRef.current);
    setLastLocation(initialLocation);
    setLastSharedAt(Date.now());
    setTrackingActive(true);
    lastLocationPushRef.current = Date.now();
    localStorage.setItem("safeher_emergency_tracking", JSON.stringify({ incidentId, startedAt: Date.now() }));
    locationWatchRef.current = navigator.geolocation.watchPosition(
      async ({ coords }) => {
        const location = { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy };
        setLastLocation(location);
        const now = Date.now();
        if (now - lastLocationPushRef.current < 120000) return;
        lastLocationPushRef.current = now;
        try {
          await apiClient.put(`/api/sos/${incidentId}/location`, {
            latitude: location.latitude,
            longitude: location.longitude,
            message: "Automatic live location update from active SafeHer SOS.",
          });
          setLastSharedAt(now);
        } catch {
          setStatus("Tracking is active, but the latest contact update could not be sent.");
        }
      },
      () => setStatus("SOS was sent, but live tracking needs location permission."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const triggerSos = async (reason = "Emergency help requested through SafeHer AI Assistant.") => {
    if (sosLoading) return;
    setSosLoading(true);
    setStatus("Finding your live location…");
    try {
      const location = await getCurrentLocation();
      const mapsLink = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      setStatus("Alerting your trusted contacts…");
      const { data } = await apiClient.post("/api/sos", { ...location, message: `${reason} Live location: ${mapsLink}` });
      startEmergencyTracking(data.incidentId, location);
      const reply = `${data.message} Your live location was attached. Stay in a public place and call 112 if the danger is immediate.`;
      addAssistantMessage(reply);
      setStatus("SOS sent. Live tracking is active and will update your contacts.");
    } catch (error) {
      const text = error?.message || "SOS could not be sent. Call 112 immediately if you are in danger.";
      addAssistantMessage(text);
      setStatus(text);
    } finally { setSosLoading(false); }
  };

  const askAssistant = async (userMessage) => {
    if (!userMessage.trim() || loading) return;
    const cleanMessage = userMessage.trim();
    setChat((prev) => [...prev, { role: "user", text: cleanMessage }]);
    if (isEmergencyMessage(cleanMessage)) {
      await triggerSos(`Emergency phrase detected: "${cleanMessage}"`);
      return;
    }
    setLoading(true);
    setStatus("SafeHer AI is preparing the safest next steps…");
    try {
      const { data } = await apiClient.post("/api/ai/ask", { message: cleanMessage });
      addAssistantMessage(data.reply);
      setStatus("");
    } catch {
      addAssistantMessage("I can’t reach SafeHer AI right now. Move to a public place, call someone you trust, and press SOS if you feel in danger.");
      setStatus("AI is temporarily unavailable. Emergency actions still work.");
    } finally { setLoading(false); }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const userMessage = message;
    setMessage("");
    await askAssistant(userMessage);
  };

  const startVoiceAssistant = () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return setStatus("Voice is unavailable in this browser. You can still type below.");
    window.speechSynthesis?.cancel();
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    setStatus("Listening… describe what is happening.");
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setListening(false);
      setStatus(`Heard: “${transcript}”`);
      askAssistant(transcript);
    };
    recognition.onerror = (event) => {
      setListening(false);
      setStatus(event.error === "not-allowed" ? "Microphone permission is needed for voice help." : "I couldn’t hear that. Tap the microphone and try again.");
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  };
  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); setStatus("Voice listening stopped."); };

  return (
    <main className="assist-page">
      <header className="assist-topbar">
        <div className="assist-brand"><span className="assist-brand-mark"><ShieldCheck size={20} /></span><span>AI Safety Assistant</span></div>
        <div className={`assist-ready ${contacts.length ? "is-ready" : ""}`}><span className="assist-ready-dot" />{contacts.length ? `${contacts.length} trusted ${contacts.length === 1 ? "contact" : "contacts"} ready` : "Add a trusted contact"}</div>
      </header>

      <section className="assist-intro">
        <h1>SafeHer AI Assistant</h1>
        <p>Describe what is happening to get clear next steps. Use voice for hands-free help, or send an SOS with automatic live-location tracking.</p>
      </section>

      {status && <div className="assist-status" role="status" aria-live="polite">{sosLoading || loading || listening ? <LoaderCircle className="spin" size={17} /> : <CheckCircle2 size={17} />}{status}</div>}
      {trackingActive && <section className="assist-live-strip" aria-live="polite"><span className="assist-live-icon"><Radio size={19} /></span><div><strong>Live tracking is active</strong><span>{lastLocation ? `${lastLocation.latitude.toFixed(5)}, ${lastLocation.longitude.toFixed(5)}` : "Finding location"} · {lastSharedAt ? `shared ${new Date(lastSharedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "preparing update"}</span></div><button type="button" onClick={stopEmergencyTracking}><Square size={15} /> Stop</button></section>}

      <section className="assist-main-grid">
        <article className="assist-chat-card">
          <div className="assist-chat-header"><div><span className="assist-avatar"><Bot size={17} /></span><div><strong>Chat with SafeHer</strong><span>Ask for help in your own words</span></div></div><span className="assist-online"><i /> Ready</span></div>
          <div className="assist-chat" aria-live="polite">
            {chat.map((item, index) => <div key={`${item.role}-${index}`} className={`assist-message ${item.role === "user" ? "from-user" : "from-ai"}`}>{item.role === "assistant" && <span className="assist-avatar"><Bot size={16} /></span>}<p>{item.text}</p></div>)}
            {loading && <div className="assist-message from-ai"><span className="assist-avatar"><Bot size={16} /></span><p className="assist-thinking"><i /><i /><i /></p></div>}
            <div ref={chatEndRef} />
          </div>
          <form className="assist-input" onSubmit={sendMessage}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell SafeHer what’s happening…" aria-label="Message SafeHer AI" /><button type="button" className={`assist-input-mic ${listening ? "is-listening" : ""}`} onClick={listening ? stopListening : startVoiceAssistant} disabled={!canListen} aria-label="Use voice input">{listening ? <MicOff size={20} /> : <Mic size={20} />}</button><button type="submit" className="assist-send" disabled={!message.trim() || loading} aria-label="Send message"><Send size={19} /></button></form>
        </article>

        <aside className="assist-features">
          <div><span className="assist-eyebrow">Safety tools</span><h2>Ready when needed</h2></div>
          <button className="assist-feature assist-feature-sos" type="button" onClick={() => triggerSos()} disabled={sosLoading}><span><Siren size={20} /></span><div><strong>{sosLoading ? "Sending SOS…" : "Send SOS"}</strong><small>Alert contacts + start tracking</small></div></button>
          <button className="assist-feature" type="button" onClick={listening ? stopListening : startVoiceAssistant} disabled={!canListen}><span><Mic size={20} /></span><div><strong>{listening ? "Listening…" : "Voice assistant"}</strong><small>Speak instead of typing</small></div></button>
          <button className="assist-feature" type="button" onClick={() => { setVoiceReplies((current) => !current); window.speechSynthesis?.cancel(); }}><span>{voiceReplies ? <Volume2 size={20} /> : <VolumeX size={20} />}</span><div><strong>Spoken answers</strong><small>{voiceReplies ? "On" : "Off"}</small></div></button>
          <div className="assist-feature assist-feature-info"><span><MapPin size={20} /></span><div><strong>Live location</strong><small>Starts automatically after SOS</small></div></div>
          <div className="assist-call-row"><a href="tel:112"><PhoneCall size={17} /> Call 112</a><a className={!primaryContact?.phoneNumber ? "is-disabled" : ""} href={primaryContact?.phoneNumber ? `tel:${primaryContact.phoneNumber}` : undefined}>Trusted contact</a></div>
          <div className="assist-trigger-note"><Mic size={17} /><div><strong>Hands-free emergency</strong><span>Say “SafeHer help” to send SOS.</span></div></div>
          <p className="assist-disclaimer">AI gives safety guidance, not emergency services.</p>
        </aside>
      </section>
    </main>
  );
}

export default AIAssistant;
