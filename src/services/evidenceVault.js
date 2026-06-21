/** Emergency Evidence Autopilot — SHA-256 integrity + local vault storage. */

const VAULT_PREFIX = "safeher_evidence_vault_";
const INCIDENT_PREFIX = "safeher_incidents_";

export async function sha256Hex(content) {
  const data =
    typeof content === "string"
      ? new TextEncoder().encode(content)
      : content;
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function vaultKey(userKey) {
  return `${VAULT_PREFIX}${userKey}`;
}

function incidentKey(userKey) {
  return `${INCIDENT_PREFIX}${userKey}`;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function listEvidence(userKey) {
  return readJson(vaultKey(userKey), []);
}

export function listIncidents(userKey) {
  return readJson(incidentKey(userKey), []);
}

export async function createEvidenceFile(userKey, { fileName, fileType, content, incidentId }) {
  const body = typeof content === "string" ? content : JSON.stringify(content, null, 2);
  const hash = await sha256Hex(body);
  const item = {
    id: crypto.randomUUID(),
    incidentId,
    fileName,
    fileType,
    content: body,
    sha256Hash: hash,
    createdAt: new Date().toISOString(),
    sizeBytes: new Blob([body]).size,
  };

  const vault = listEvidence(userKey);
  vault.unshift(item);
  writeJson(vaultKey(userKey), vault);
  return item;
}

export async function runEvidenceAutopilot(userKey, { incidentId, payload, evaluation, gpsTrail = [] }) {
  const files = [];
  const now = new Date();

  const gpsContent = {
    incidentId,
    capturedAt: now.toISOString(),
    trail: gpsTrail.length
      ? gpsTrail
      : [
          {
            time: now.toISOString(),
            lat: payload.latitude,
            lon: payload.longitude,
            label: payload.currentLocationLabel,
          },
        ],
    riskScore: evaluation.riskScore,
  };
  files.push(
    await createEvidenceFile(userKey, {
      fileName: `gps_log_${incidentId}.json`,
      fileType: "GPS Log",
      content: gpsContent,
      incidentId,
    })
  );

  const deviceContent = {
    incidentId,
    capturedAt: now.toISOString(),
    device: {
      platform: navigator.platform || "Web",
      userAgent: navigator.userAgent?.slice(0, 120) || "Unknown",
      language: navigator.language,
      battery: `${payload.batteryPercent ?? "?"}%`,
      network: payload.networkType || "Unknown",
      online: navigator.onLine,
    },
    location: { lat: payload.latitude, lon: payload.longitude },
  };
  files.push(
    await createEvidenceFile(userKey, {
      fileName: `device_state_${incidentId}.json`,
      fileType: "Device State",
      content: deviceContent,
      incidentId,
    })
  );

  const audioMeta = {
    incidentId,
    capturedAt: now.toISOString(),
    note: "Browser autopilot metadata — grant microphone for live audio capture.",
    durationSeconds: 0,
    riskLevel: evaluation.riskLevel,
  };
  files.push(
    await createEvidenceFile(userKey, {
      fileName: `audio_${incidentId}.json`,
      fileType: "Audio Recording",
      content: audioMeta,
      incidentId,
    })
  );

  const timelineContent = {
    incidentId,
    events: evaluation.timeline.map((line) => {
      const [time, title] = line.split(" | ");
      return { time, title, timestamp: now.toISOString() };
    }),
  };
  files.push(
    await createEvidenceFile(userKey, {
      fileName: `timeline_${incidentId}.json`,
      fileType: "Incident Timeline",
      content: timelineContent,
      incidentId,
    })
  );

  return files;
}

export async function verifyEvidenceItem(userKey, evidenceId) {
  const vault = listEvidence(userKey);
  const item = vault.find((e) => e.id === evidenceId);
  if (!item) {
    return { verified: false, message: "Evidence not found in vault." };
  }
  const currentHash = await sha256Hex(item.content);
  const verified = currentHash === item.sha256Hash;
  return {
    verified,
    message: verified
      ? "Integrity check passed. Stored hash matches current file."
      : "Tampering detected. Stored hash does not match current file.",
    storedHash: item.sha256Hash,
    currentHash,
  };
}

export async function verifyAllEvidence(userKey, evidenceIds) {
  if (!evidenceIds?.length) {
    return { verified: true, message: "No evidence to verify." };
  }
  for (const id of evidenceIds) {
    const result = await verifyEvidenceItem(userKey, id);
    if (!result.verified) return result;
  }
  return { verified: true, message: "All evidence files passed integrity verification." };
}

export function simulateTamper(userKey, evidenceId) {
  const vault = listEvidence(userKey);
  const idx = vault.findIndex((e) => e.id === evidenceId);
  if (idx === -1) return false;
  vault[idx] = {
    ...vault[idx],
    content: vault[idx].content.replace(/"lat"/, '"lat_tampered"'),
  };
  writeJson(vaultKey(userKey), vault);
  return true;
}

export function restoreEvidence(userKey) {
  const vault = listEvidence(userKey);
  for (const item of vault) {
    if (item.content.includes('"lat_tampered"')) {
      item.content = item.content.replace(/"lat_tampered"/, '"lat"');
    }
  }
  writeJson(vaultKey(userKey), vault);
}

export function saveIncident(userKey, incident) {
  const list = listIncidents(userKey);
  list.unshift(incident);
  writeJson(incidentKey(userKey), list.slice(0, 50));
  return incident;
}

export function toDisplayEvidence(item) {
  return {
    id: item.id,
    name: item.fileName,
    type: item.fileType,
    size: formatSize(item.sizeBytes || 0),
    hash: item.sha256Hash,
    created: new Date(item.createdAt).toLocaleString(),
    status: "Verified",
  };
}

/** Optional live audio capture when autopilot triggers. */
export async function captureAudioSnippet(seconds = 8) {
  if (!navigator.mediaDevices?.getUserMedia) return null;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    return new Promise((resolve) => {
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        const buffer = await blob.arrayBuffer();
        resolve({ blob, buffer, mimeType: blob.type });
      };
      recorder.start();
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, seconds * 1000);
    });
  } catch {
    return null;
  }
}

export async function storeAudioEvidence(userKey, incidentId, audioResult) {
  if (!audioResult?.buffer) return null;
  const hash = await sha256Hex(audioResult.buffer);
  const meta = {
    incidentId,
    capturedAt: new Date().toISOString(),
    mimeType: audioResult.mimeType,
    sizeBytes: audioResult.buffer.byteLength,
    sha256Hash: hash,
    note: "Live microphone capture during Evidence Autopilot.",
  };
  const body = JSON.stringify(meta);
  return createEvidenceFile(userKey, {
    fileName: `audio_live_${incidentId}.webm.meta.json`,
    fileType: "Audio Recording",
    content: body,
    incidentId,
  });
}
