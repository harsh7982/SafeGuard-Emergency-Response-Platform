import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Check,
  CircleStop,
  Clock3,
  Copy,
  Crosshair,
  ExternalLink,
  FileWarning,
  LocateFixed,
  MapPin,
  Navigation,
  Radio,
  Share2,
  ShieldCheck,
  Signal,
} from "lucide-react";
import "./LiveTracking.css";

const initialStatus = {
  type: "idle",
  message: "Start tracking when you want to share your live position.",
};

function LiveTracking() {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState(initialStatus);
  const [copied, setCopied] = useState(false);
  const [manualLocation, setManualLocation] = useState({
    lat: "19.033000",
    lng: "73.029000",
  });
  const watchId = useRef(null);

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    setStatus({
      type: "stopped",
      message: "Live updates are paused. Your last position remains visible.",
    });
  };

  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setStatus({
        type: "error",
        message: "This browser does not support location tracking.",
      });
      return;
    }

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    setStatus({
      type: "requesting",
      message: "Waiting for location permission and a GPS signal...",
    });

    watchId.current = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => {
        setLocation({
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
          speed: coords.speed,
          heading: coords.heading,
          updatedAt: timestamp,
        });
        setStatus({
          type: "active",
          message: "Your position is updating automatically.",
        });
      },
      (error) => {
        const messages = {
          1: "Location permission was denied. Enable it in browser settings and try again.",
          2: "Your location is currently unavailable. Check GPS or network access.",
          3: "Location request timed out. Move to an open area and try again.",
        };

        watchId.current = null;
        setStatus({
          type: "error",
          message: messages[error.code] || "Unable to start live tracking.",
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  };

  const useManualLocation = () => {
    const lat = Number(manualLocation.lat);
    const lng = Number(manualLocation.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setStatus({
        type: "error",
        message: "Enter valid latitude and longitude values to use manual location.",
      });
      return;
    }

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    setLocation({
      lat,
      lng,
      accuracy: null,
      speed: null,
      heading: null,
      updatedAt: Date.now(),
      source: "manual",
    });
    setStatus({
      type: "active",
      message: "Manual location is active. You can share or copy this maps link now.",
    });
  };

  const mapsUrl = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : "";
  const mapEmbedUrl = location
    ? `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=16&output=embed`
    : "";

  const shareLocation = async () => {
    if (!location) {
      setStatus({
        type: "error",
        message: "Start tracking before sharing your location.",
      });
      return;
    }

    const shareData = {
      title: "My SafeHer live location",
      text: "I am sharing my current location through SafeHer.",
      url: mapsUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text} ${shareData.url}`
        );
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setStatus({
          type: "error",
          message: "Location sharing was unavailable. Try copying the link.",
        });
      }
    }
  };

  const copyLocation = async () => {
    if (!location) {
      setStatus({
        type: "error",
        message: "Start tracking before copying your location.",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(mapsUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setStatus({
        type: "error",
        message: "Could not copy the link. Open it in Maps and copy it there.",
      });
    }
  };

  const formatCoordinate = (value) =>
    typeof value === "number" ? value.toFixed(6) : "Waiting";

  const formatUpdatedTime = () =>
    location
      ? new Date(location.updatedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "Not started";

  const isActive = status.type === "active";
  const isRequesting = status.type === "requesting";

  return (
    <div className="tracking-page">
      <section className="tracking-header">
        <div>
          <span className="tracking-badge">
            <Radio size={16} />
            Real-Time Protection
          </span>
          <h1>Stay visible to the people you trust.</h1>
          <p>
            Start a private tracking session, monitor GPS accuracy, and share
            your current position whenever you need support.
          </p>
        </div>

        <div className={`tracking-status-card ${status.type}`}>
          <span className="status-light" />
          <div>
            <small>TRACKING STATUS</small>
            <strong>
              {isActive
                ? "Live and updating"
                : isRequesting
                  ? "Connecting"
                  : status.type === "error"
                    ? "Needs attention"
                    : "Tracking paused"}
            </strong>
          </div>
        </div>
      </section>

      <div className="tracking-grid">
        <section className="map-panel">
          <div className="map-toolbar">
            <div>
              <MapPin size={19} />
              <span>Live map</span>
            </div>
            {location && (
              <a href={mapsUrl} target="_blank" rel="noreferrer">
                Open in Maps
                <ExternalLink size={15} />
              </a>
            )}
          </div>

          <div className="map-canvas">
            {location ? (
              <iframe
                title="Current SafeHer location"
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="map-placeholder">
                <div className="map-grid-lines" />
                <div className={`map-glow ${isRequesting ? "searching" : ""}`}>
                  <span className="location-ring" />
                  <span className="location-ring ring-two" />
                  <span className="location-dot">
                    <Crosshair size={21} />
                  </span>
                </div>
                <h2>
                  {isRequesting ? "Finding your position" : "Location is private"}
                </h2>
                <p>
                  {isRequesting
                    ? "Keep this page open while SafeHer connects to GPS."
                    : "Tracking begins only after you press the button."}
                </p>
              </div>
            )}
          </div>

          <div className={`tracking-notice ${status.type}`}>
            <Signal size={18} />
            <span>{status.message}</span>
          </div>
        </section>

        <aside className="tracking-sidebar">
          <section className="tracking-card location-card">
            <div className="card-title">
              <div>
                <span>SESSION DETAILS</span>
                <h2>Current position</h2>
              </div>
              <Navigation size={24} />
            </div>

            <div className="coordinate-row">
              <div>
                <span>Latitude</span>
                <strong>{formatCoordinate(location?.lat)}</strong>
              </div>
              <div>
                <span>Longitude</span>
                <strong>{formatCoordinate(location?.lng)}</strong>
              </div>
            </div>

            <div className="tracking-metrics">
              <div>
                <LocateFixed size={18} />
                <span>Accuracy</span>
                <strong>
                  {location?.accuracy != null ? `${Math.round(location.accuracy)} m` : location?.source === "manual" ? "Manual" : "--"}
                </strong>
              </div>
              <div>
                <Activity size={18} />
                <span>Speed</span>
                <strong>
                  {location?.speed != null
                    ? `${(location.speed * 3.6).toFixed(1)} km/h`
                    : "--"}
                </strong>
              </div>
              <div>
                <Clock3 size={18} />
                <span>Updated</span>
                <strong>{formatUpdatedTime()}</strong>
              </div>
            </div>

            {isActive || isRequesting ? (
              <button className="stop-tracking-btn" onClick={stopTracking}>
                <CircleStop size={19} />
                Stop Live Tracking
              </button>
            ) : (
              <button className="start-tracking-btn" onClick={startTracking}>
                <Crosshair size={19} />
                Start Live Tracking
              </button>
            )}

            <div className="manual-location-box">
              <div className="manual-location-title">Location permission off?</div>
              <div className="manual-location-inputs">
                <label>
                  Latitude
                  <input
                    type="number"
                    step="0.000001"
                    value={manualLocation.lat}
                    onChange={(event) => setManualLocation((prev) => ({ ...prev, lat: event.target.value }))}
                  />
                </label>
                <label>
                  Longitude
                  <input
                    type="number"
                    step="0.000001"
                    value={manualLocation.lng}
                    onChange={(event) => setManualLocation((prev) => ({ ...prev, lng: event.target.value }))}
                  />
                </label>
              </div>
              <button className="manual-location-btn" type="button" onClick={useManualLocation}>
                <MapPin size={17} />
                Use Manual Location
              </button>
            </div>
          </section>

          <section className="tracking-card share-card">
            <span className="card-eyebrow">TRUSTED SHARING</span>
            <h3>Send your current location</h3>
            <p>
              SafeHer creates a maps link that you can send through any
              messaging app.
            </p>

            <button
              className="share-location-btn"
              onClick={shareLocation}
              disabled={!location}
            >
              <Share2 size={18} />
              Share Location
            </button>
            <button
              className="copy-location-btn"
              onClick={copyLocation}
              disabled={!location}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? "Link Copied" : "Copy Maps Link"}
            </button>
          </section>

          <Link to="/report" className="tracking-emergency-card">
            <FileWarning size={22} />
            <div>
              <span>Something happened?</span>
              <strong>Report an incident</strong>
            </div>
            <ExternalLink size={17} />
          </Link>
        </aside>
      </div>

      <footer className="privacy-note">
        <ShieldCheck size={17} />
        <span>
          Your browser controls location permission. SafeHer does not start
          tracking until you choose to begin.
        </span>
      </footer>
    </div>
  );
}

export default LiveTracking;
