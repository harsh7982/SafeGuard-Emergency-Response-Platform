/** Weighted anomaly scoring for Guardian Twin (40/20/20/20). */

export const RISK_WEIGHTS = {
  location: 0.4,
  time: 0.2,
  movement: 0.2,
  activity: 0.2,
};

export const DEFAULT_PROFILE = {
  expectedLocation: "D.Y. Patil University",
  safeRoute: "College → Home",
  usualTransport: "College cab",
  expectedHomeTime: "18:00",
  safeLatitude: 19.033,
  safeLongitude: 73.029,
  collegeLatitude: 18.9894,
  collegeLongitude: 73.1175,
  safeRadiusMeters: 700,
  maxInactiveMinutes: 120,
  alertInactiveMinutes: 60,
  activityIntervalMinutes: 20,
  knownLocations: ["Home", "College", "Library", "Gym", "Workplace"],
  knownRoutes: [
    { from: "Home", to: "College", transport: "Cab", safe: true },
    { from: "College", to: "Home", transport: "Cab", safe: true },
    { from: "College", to: "Library", transport: "Walking", safe: true },
    { from: "Home", to: "Gym", transport: "Walking", safe: true },
  ],
};

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

function clamp(n, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

function parseHomeMinutes(timeStr) {
  const [h, m] = (timeStr || "18:00").split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesSinceMidnight(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

function isWeekday(date = new Date()) {
  const d = date.getDay();
  return d >= 1 && d <= 5;
}

function scoreLocation(profile, payload) {
  const homeDist = haversineMeters(
    payload.latitude,
    payload.longitude,
    profile.safeLatitude,
    profile.safeLongitude
  );
  const collegeDist = haversineMeters(
    payload.latitude,
    payload.longitude,
    profile.collegeLatitude ?? profile.safeLatitude,
    profile.collegeLongitude ?? profile.safeLongitude
  );
  const radius = profile.safeRadiusMeters || 700;
  const nearHome = homeDist <= radius;
  const nearCollege = collegeDist <= radius * 1.5;

  if (nearHome || nearCollege) return 8;

  const km = Math.min(homeDist, collegeDist) / 1000;
  if (km > 5) return 95;
  if (km > 2) return 78;
  if (km > 1) return 55;
  return 35;
}

function scoreTime(profile) {
  if (!isWeekday()) return 12;
  const now = minutesSinceMidnight();
  const homeMin = parseHomeMinutes(profile.expectedHomeTime);
  if (now <= homeMin) return 10;
  const lateBy = now - homeMin;
  if (lateBy >= 300) return 92;
  if (lateBy >= 180) return 74;
  if (lateBy >= 60) return 48;
  return 22;
}

function scoreMovement(profile, payload) {
  const route = (payload.routeLabel || "").toLowerCase();
  const safeRoute = (profile.safeRoute || "").toLowerCase();

  if (route.includes("unknown")) return 88;
  if (safeRoute && route === safeRoute.toLowerCase()) return 6;

  const known = (profile.knownRoutes || []).some(
    (r) =>
      route.includes(r.from.toLowerCase()) &&
      route.includes(r.to.toLowerCase()) &&
      r.safe !== false
  );
  if (known) return 18;

  const transport = (payload.transportMode || "").toLowerCase();
  const usual = (profile.usualTransport || "").toLowerCase();
  if (usual && transport && !transport.includes(usual.split(" ")[0]?.toLowerCase() ?? "")) {
    return 62;
  }
  return 45;
}

function scoreActivity(profile, payload) {
  const inactive = Number(payload.inactiveMinutes) || 0;
  const max = profile.maxInactiveMinutes || 120;
  const alert = profile.alertInactiveMinutes || 60;

  if (inactive >= max) return 95;
  if (inactive >= max * 0.75) return 72;
  if (inactive >= alert) return 52;
  if (inactive >= profile.activityIntervalMinutes * 2) return 28;
  return 8;
}

function weightedRisk(scores) {
  return Math.round(
    scores.Location * RISK_WEIGHTS.location +
      scores.Time * RISK_WEIGHTS.time +
      scores.Movement * RISK_WEIGHTS.movement +
      scores.Activity * RISK_WEIGHTS.activity
  );
}

function riskLevel(score) {
  if (score >= 70) return "HIGH";
  if (score >= 45) return "MEDIUM";
  return "LOW";
}

function buildReason(scores, payload) {
  const entries = [
    ["Location", scores.Location],
    ["Time", scores.Time],
    ["Movement", scores.Movement],
    ["Activity", scores.Activity],
  ].sort((a, b) => b[1] - a[1]);

  const [top, value] = entries[0];
  if (value >= 70) {
    if (top === "Location") return "Unexpected location detected away from safe zones.";
    if (top === "Time") return "Abnormal activity outside expected home schedule.";
    if (top === "Movement") return "Unexpected movement pattern detected.";
    return "Possible distress — prolonged inactivity detected.";
  }
  if (payload.routeLabel?.toLowerCase().includes("unknown")) {
    return "Unexpected movement pattern detected.";
  }
  if (Number(payload.inactiveMinutes) >= (DEFAULT_PROFILE.alertInactiveMinutes || 60)) {
    return "Activity gap exceeds normal rhythm.";
  }
  return "Daily pattern is normal.";
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function evaluateCheckIn(profile, payload, options = {}) {
  const merged = { ...DEFAULT_PROFILE, ...profile };
  const now = options.timestamp ? new Date(options.timestamp) : new Date();

  const anomalyScores = {
    Location: scoreLocation(merged, payload),
    Time: scoreTime(merged, now),
    Movement: scoreMovement(merged, payload),
    Activity: scoreActivity(merged, payload),
  };

  const riskScore = weightedRisk(anomalyScores);
  const behaviorMatch = clamp(100 - riskScore, 5, 99);
  const level = riskLevel(riskScore);
  const autopilotActivated = riskScore >= 70;

  const timeline = [];
  const t = formatTime(now);

  if (riskScore >= 45) {
    timeline.push(`${t} | Risk score increased`);
  }
  if (anomalyScores.Movement >= 70) {
    timeline.push(`${t} | Route deviation detected`);
  }
  if (anomalyScores.Activity >= 70) {
    timeline.push(`${t} | Activity gap detected`);
  }
  if (autopilotActivated) {
    timeline.push(`${t} | Evidence Autopilot activated`);
    timeline.push(`${t} | GPS logging started`);
    timeline.push(`${t} | Device state captured`);
    if (level === "HIGH") {
      timeline.push(`${t} | Silent SOS prepared`);
    }
  } else if (riskScore < 30) {
    timeline.push(`${t} | Normal activity rhythm`);
  }

  return {
    riskScore,
    behaviorMatch,
    riskLevel: level,
    reason: buildReason(anomalyScores, payload),
    anomalyScores,
    autopilotActivated,
    timeline,
    evaluatedAt: now.toISOString(),
  };
}

export function getInactiveMinutes(userKey) {
  const key = `safeher_last_activity_${userKey}`;
  const raw = localStorage.getItem(key);
  if (!raw) return 0;
  const last = Number(raw);
  if (!last) return 0;
  return Math.floor((Date.now() - last) / 60000);
}

export function touchActivity(userKey) {
  localStorage.setItem(`safeher_last_activity_${userKey}`, String(Date.now()));
}

export function inferRouteLabel(profile, payload) {
  const homeDist = haversineMeters(
    payload.latitude,
    payload.longitude,
    profile.safeLatitude,
    profile.safeLongitude
  );
  const collegeDist = haversineMeters(
    payload.latitude,
    payload.longitude,
    profile.collegeLatitude ?? profile.safeLatitude,
    profile.collegeLongitude ?? profile.safeLongitude
  );
  const radius = profile.safeRadiusMeters || 700;

  if (homeDist <= radius) return "→ Home";
  if (collegeDist <= radius * 1.5) return "→ College";
  if (homeDist > radius * 3 && collegeDist > radius * 3) return "College → Unknown Area";
  return profile.safeRoute || "College → Home";
}

export function inferLocationLabel(profile, payload) {
  const homeDist = haversineMeters(
    payload.latitude,
    payload.longitude,
    profile.safeLatitude,
    profile.safeLongitude
  );
  const collegeDist = haversineMeters(
    payload.latitude,
    payload.longitude,
    profile.collegeLatitude ?? profile.safeLatitude,
    profile.collegeLongitude ?? profile.safeLongitude
  );
  const radius = profile.safeRadiusMeters || 700;

  if (homeDist <= radius) return "Home";
  if (collegeDist <= radius * 1.5) return profile.expectedLocation || "College";
  if (homeDist > 2000) return "Unknown Area near Sector 12";
  return payload.currentLocationLabel || "Current GPS location";
}
