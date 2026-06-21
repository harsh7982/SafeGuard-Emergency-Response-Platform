import apiClient from "../api/client";
import {
  DEFAULT_PROFILE,
  evaluateCheckIn,
  getInactiveMinutes,
  inferLocationLabel,
  inferRouteLabel,
  touchActivity,
} from "./guardianTwinEngine";
import {
  captureAudioSnippet,
  listEvidence,
  runEvidenceAutopilot,
  saveIncident,
  storeAudioEvidence,
  toDisplayEvidence,
  verifyAllEvidence,
  verifyEvidenceItem,
  simulateTamper,
  restoreEvidence,
} from "./evidenceVault";

const PROFILE_PREFIX = "safeher_guardian_profile_";
const STATUS_PREFIX = "safeher_guardian_status_";
const PROTECTION_PREFIX = "safeher_protection_enabled_";

export function getUserKey(user) {
  return user?.id ?? user?.email ?? "default";
}

function profileStorageKey(userKey) {
  return `${PROFILE_PREFIX}${userKey}`;
}

function statusStorageKey(userKey) {
  return `${STATUS_PREFIX}${userKey}`;
}

function readProfileLocal(userKey) {
  try {
    const raw = localStorage.getItem(profileStorageKey(userKey));
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_PROFILE };
}

function writeProfileLocal(userKey, profile) {
  localStorage.setItem(profileStorageKey(userKey), JSON.stringify(profile));
}

export function getProtectionEnabled(userKey) {
  return localStorage.getItem(`${PROTECTION_PREFIX}${userKey}`) === "true";
}

export function setProtectionEnabled(userKey, enabled) {
  localStorage.setItem(`${PROTECTION_PREFIX}${userKey}`, enabled ? "true" : "false");
}

export function getLastStatus(userKey) {
  try {
    const raw = localStorage.getItem(statusStorageKey(userKey));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLastStatus(userKey, status) {
  localStorage.setItem(statusStorageKey(userKey), JSON.stringify(status));
}

export async function loadProfile(user) {
  const userKey = getUserKey(user);
  try {
    const { data } = await apiClient.get("/api/guardian-twin/profile");
    writeProfileLocal(userKey, data);
    return { profile: { ...DEFAULT_PROFILE, ...data }, source: "api" };
  } catch {
    return { profile: readProfileLocal(userKey), source: "local" };
  }
}

export async function saveProfile(user, profile) {
  const userKey = getUserKey(user);
  const payload = {
    ...profile,
    safeLatitude: Number(profile.safeLatitude),
    safeLongitude: Number(profile.safeLongitude),
    collegeLatitude: Number(profile.collegeLatitude ?? DEFAULT_PROFILE.collegeLatitude),
    collegeLongitude: Number(profile.collegeLongitude ?? DEFAULT_PROFILE.collegeLongitude),
    safeRadiusMeters: Number(profile.safeRadiusMeters),
    maxInactiveMinutes: Number(profile.maxInactiveMinutes),
    alertInactiveMinutes: Number(profile.alertInactiveMinutes ?? 60),
  };
  writeProfileLocal(userKey, payload);
  try {
    const { data } = await apiClient.put("/api/guardian-twin/profile", payload);
    writeProfileLocal(userKey, data);
    return { profile: { ...DEFAULT_PROFILE, ...data }, source: "api" };
  } catch {
    return { profile: payload, source: "local" };
  }
}

function buildCheckInPayload(profile, userKey, overrides = {}) {
  const inactive =
    overrides.inactiveMinutes ?? getInactiveMinutes(userKey) ?? 0;

  const base = {
    latitude: overrides.latitude ?? profile.safeLatitude,
    longitude: overrides.longitude ?? profile.safeLongitude,
    currentLocationLabel: overrides.currentLocationLabel,
    routeLabel: overrides.routeLabel,
    transportMode: overrides.transportMode ?? profile.usualTransport,
    inactiveMinutes: inactive,
    batteryPercent: overrides.batteryPercent ?? estimateBattery(),
    networkType: overrides.networkType ?? estimateNetwork(),
  };

  const payload = {
    ...base,
    currentLocationLabel:
      base.currentLocationLabel ?? inferLocationLabel(profile, base),
    routeLabel: base.routeLabel ?? inferRouteLabel(profile, base),
  };

  return payload;
}

function estimateBattery() {
  if (!navigator.getBattery) return 82;
  return 82;
}

function estimateNetwork() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return navigator.onLine ? "4G" : "Offline";
  return conn.effectiveType?.toUpperCase() || "4G";
}

export async function runCheckIn(user, profile, overrides = {}) {
  const userKey = getUserKey(user);
  touchActivity(userKey);

  const payload = buildCheckInPayload(profile, userKey, overrides);

  try {
    const { data } = await apiClient.post("/api/guardian-twin/check-in", payload);
    const ui = mapResultToUi(data, profile, payload, userKey);
    saveLastStatus(userKey, ui);
    return { raw: data, ui, source: "api" };
  } catch {
    return runCheckInLocal(user, profile, payload, userKey);
  }
}

async function runCheckInLocal(user, profile, payload, userKey) {
  const evaluation = evaluateCheckIn(profile, payload);
  let evidence = [];
  let incidentId = null;

  if (evaluation.autopilotActivated) {
    incidentId = crypto.randomUUID();
    evidence = await runEvidenceAutopilot(userKey, {
      incidentId,
      payload,
      evaluation,
    });

    captureAudioSnippet(6).then((audio) => {
      if (audio) storeAudioEvidence(userKey, incidentId, audio);
    });

    saveIncident(userKey, {
      id: incidentId,
      riskScore: evaluation.riskScore,
      riskLevel: evaluation.riskLevel,
      reason: evaluation.reason,
      createdAt: new Date().toISOString(),
      payload: { lat: payload.latitude, lon: payload.longitude },
    });

    pushGuardianAlert(userKey, evaluation, incidentId);
  }

  const raw = {
    ...evaluation,
    incidentId,
    evidence,
  };

  const ui = mapResultToUi(raw, profile, payload, userKey);
  saveLastStatus(userKey, ui);
  return { raw, ui, source: "local" };
}

function pushGuardianAlert(userKey, evaluation, incidentId) {
  const key = `safeher_guardian_alerts_${userKey}`;
  const alerts = JSON.parse(localStorage.getItem(key) || "[]");
  alerts.unshift({
    id: incidentId,
    title: "Guardian Twin Alert",
    body: `${evaluation.reason} Risk score: ${evaluation.riskScore}. Evidence Autopilot activated.`,
    riskLevel: evaluation.riskLevel,
    createdAt: new Date().toISOString(),
    read: false,
  });
  localStorage.setItem(key, JSON.stringify(alerts.slice(0, 30)));
}

export function getGuardianAlerts(userKey) {
  try {
    return JSON.parse(localStorage.getItem(`safeher_guardian_alerts_${userKey}`) || "[]");
  } catch {
    return [];
  }
}

export function mapResultToUi(data, profile, payload, userKey) {
  const tone =
    data.riskLevel === "HIGH" ? "danger" : data.riskLevel === "MEDIUM" ? "warning" : "safe";

  const evidenceItems = (data.evidence || []).map((item) =>
    item.fileName
      ? toDisplayEvidence(item)
      : {
          id: item.id,
          name: item.fileName || item.name,
          type: item.fileType || item.type,
          size: item.size || "—",
          hash: item.sha256Hash || item.hash,
          created: item.createdAt
            ? new Date(item.createdAt).toLocaleString()
            : item.created,
          status: "Verified",
        }
  );

  if (!evidenceItems.length && data.autopilotActivated) {
    const vault = listEvidence(userKey).slice(0, 4);
    evidenceItems.push(...vault.map(toDisplayEvidence));
  }

  return {
    status:
      data.riskLevel === "HIGH" ? "High Risk" : data.riskLevel === "MEDIUM" ? "Warning" : "Safe",
    tone,
    match: data.behaviorMatch,
    risk: data.riskScore,
    expected: profile?.expectedLocation || "Saved safe place",
    current: payload.currentLocationLabel || "Current GPS location",
    reason: data.reason,
    transport: payload.transportMode,
    activity:
      payload.inactiveMinutes <= 1
        ? "Just now"
        : `${payload.inactiveMinutes} min inactive`,
    route: payload.routeLabel,
    risks: data.anomalyScores,
    autopilot: data.autopilotActivated ? "Active" : "Standby",
    routeDeviation:
      data.riskLevel === "HIGH" ||
      (payload.routeLabel || "").toLowerCase().includes("unknown"),
    timeline: (data.timeline || []).map((line) => {
      const [time, title] = String(line).split(" | ");
      return [time || "Now", title || line, "Generated by the Guardian Twin rule engine."];
    }),
    evidence: evidenceItems,
    incidentId: data.incidentId,
    device: {
      os: navigator.userAgent.includes("Android")
        ? "Android"
        : navigator.userAgent.includes("iPhone")
          ? "iOS"
          : "Web Browser",
      battery: `${payload.batteryPercent ?? "?"}%`,
      network: payload.networkType || "Unknown",
    },
    isLive: true,
  };
}

export async function verifyEvidence(userKey, evidenceIds) {
  try {
    if (evidenceIds?.[0]) {
      const { data } = await apiClient.get(
        `/api/guardian-twin/evidence/${evidenceIds[0]}/verify`
      );
      return data;
    }
  } catch {
    /* fall through */
  }
  return verifyAllEvidence(userKey, evidenceIds);
}

export async function verifySingleEvidence(userKey, evidenceId) {
  try {
    const { data } = await apiClient.get(`/api/guardian-twin/evidence/${evidenceId}/verify`);
    return data;
  } catch {
    return verifyEvidenceItem(userKey, evidenceId);
  }
}

export function tamperDemoEvidence(userKey, evidenceId) {
  return simulateTamper(userKey, evidenceId);
}

export function restoreDemoEvidence(userKey) {
  restoreEvidence(userKey);
}

export async function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GPS not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  });
}

export { DEFAULT_PROFILE, getInactiveMinutes, touchActivity };
