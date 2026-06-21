import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import {
  ShieldCheck,
  FileWarning,
  MapPin,
  MessageSquare,
  LocateFixed,
  LoaderCircle,
  Send,
  Upload,
  Paperclip,
  CheckCircle2,
  X,
  File,
  Image,
  Film,
} from "lucide-react";

const initialForm = {
  incidentType: "",
  description: "",
  latitude: "",
  longitude: "",
};

function fileIcon(type) {
  if (!type) return File;
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Film;
  return File;
}

function ReportIncident() {
  const [form, setForm] = useState(initialForm);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [riskScore, setRiskScore] = useState("");

  // Evidence state
  const [submittedId, setSubmittedId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [uploadMessage, setUploadMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: "error", text: "Geolocation is not supported by this browser." });
      return;
    }

    setIsLocating(true);
    setMessage({ type: "", text: "" });

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }));
        setIsLocating(false);
        setMessage({ type: "success", text: "Current location added to the report." });
      },
      () => {
        setIsLocating(false);
        setMessage({ type: "error", text: "Location permission was denied. Enter coordinates manually." });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitReport = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!form.incidentType.trim() || !form.description.trim() || form.latitude === "" || form.longitude === "") {
      setMessage({ type: "error", text: "Complete all fields and add the incident location." });
      return;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setMessage({ type: "error", text: "Enter valid latitude and longitude values." });
      return;
    }

    setIsSubmitting(true);
    setRiskScore("");

    try {
      const { data } = await apiClient.post("/api/incidents", {
        incidentType: form.incidentType.trim(),
        description: form.description.trim(),
        latitude,
        longitude,
      });

      const score = data?.riskScore || "LOW";
      setRiskScore(score);
      setSubmittedId(data.id);
      setForm(initialForm);
      setMessage({
        type: "success",
        text: `Incident reported successfully. Risk level: ${score}. You can now attach evidence below.`,
      });
    } catch (error) {
      const status = error.response?.status;
      const text =
        status === 401 || status === 403
          ? "Your session is missing or expired. Log in again before reporting."
          : error.response?.data?.message || "The report could not be submitted. Check that the backend is running.";
      setMessage({ type: "error", text });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadEvidence = async () => {
    if (!selectedFiles.length || !submittedId) return;

    setUploadingFiles(true);
    setUploadMessage({ type: "", text: "" });

    const results = [];

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        await apiClient.post(`/api/evidence/upload/${submittedId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        results.push({ name: file.name, success: true });
      } catch {
        results.push({ name: file.name, success: false });
      }
    }

    setUploadResults(results);
    setUploadingFiles(false);

    const failed = results.filter((r) => !r.success).length;
    if (failed === 0) {
      setUploadMessage({ type: "success", text: `All ${results.length} file(s) uploaded successfully.` });
      setSelectedFiles([]);
    } else {
      setUploadMessage({ type: "error", text: `${failed} file(s) failed to upload. Others succeeded.` });
    }
  };

  return (
    <div className="report-inner">
      <div className="report-layout">
        {/* Report Form */}
        <form className="report-form" onSubmit={submitReport}>
          <span className="dash-badge">Secure Incident Reporting</span>
          <h1>Report an incident</h1>
          <p>
            Submit important details safely. This report can later be linked
            with evidence and emergency tracking.
          </p>

          <label htmlFor="incidentType">Incident Type</label>
          <div className="input-box">
            <FileWarning size={20} />
            <input
              id="incidentType"
              name="incidentType"
              value={form.incidentType}
              onChange={updateField}
              placeholder="Harassment / Stalking / Unsafe Area"
              required
            />
          </div>

          <label htmlFor="description">Description</label>
          <div className="textarea-box">
            <MessageSquare size={20} />
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="Explain what happened..."
              required
            />
          </div>

          <div className="location-label">
            <label htmlFor="latitude">Location Coordinates</label>
            <button className="location-btn" type="button" onClick={captureLocation} disabled={isLocating}>
              {isLocating ? <LoaderCircle className="spin" size={17} /> : <LocateFixed size={17} />}
              {isLocating ? "Locating..." : "Use Current Location"}
            </button>
          </div>

          <div className="coordinate-grid">
            <div className="input-box">
              <MapPin size={20} />
              <input
                id="latitude"
                type="number"
                name="latitude"
                value={form.latitude}
                onChange={updateField}
                min="-90"
                max="90"
                step="any"
                placeholder="Latitude"
                required
              />
            </div>
            <div className="input-box">
              <MapPin size={20} />
              <input
                type="number"
                name="longitude"
                value={form.longitude}
                onChange={updateField}
                min="-180"
                max="180"
                step="any"
                placeholder="Longitude"
                aria-label="Longitude"
                required
              />
            </div>
          </div>

          {message.text && (
            <div className={`form-message ${message.type}`} role="alert">
              {message.text}
            </div>
          )}

          {riskScore && message.type === "success" && (
            <div className={`risk-chip risk-${riskScore.toLowerCase()}`} style={{ marginTop: 12 }}>
              Severity: {riskScore}
            </div>
          )}

          <button className="auth-btn" disabled={isSubmitting || Boolean(submittedId)}>
            {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <Send size={18} />}
            {isSubmitting ? "Submitting..." : submittedId ? "Report Submitted ✓" : "Submit Report"}
          </button>

          {submittedId && (
            <button
              type="button"
              className="location-btn"
              style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
              onClick={() => {
                setSubmittedId(null);
                setUploadResults([]);
                setUploadMessage({ type: "", text: "" });
                setSelectedFiles([]);
                setMessage({ type: "", text: "" });
                setRiskScore("");
              }}
            >
              Report Another Incident
            </button>
          )}
        </form>

        {/* Side panel */}
        <div className="report-side">
          {/* Evidence upload — shown after report is created */}
          <div className="report-alert" style={{ position: "relative" }}>
            <Upload size={36} style={{ color: submittedId ? "#86efac" : "#fb7185" }} />
            <h2>Evidence Upload</h2>

            {!submittedId ? (
              <p>Submit the incident report first, then attach screenshots, photos, videos, or documents as digital evidence.</p>
            ) : (
              <>
                <p style={{ color: "#86efac", marginBottom: 16 }}>
                  Incident #{submittedId} created. Attach evidence files below.
                </p>

                {/* File drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed rgba(251,113,133,0.35)",
                    borderRadius: 16,
                    padding: "20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "rgba(225,29,72,0.06)",
                    transition: "0.2s",
                    marginBottom: 14,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(251,113,133,0.65)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(251,113,133,0.35)"}
                >
                  <Paperclip size={22} style={{ color: "#fb7185", marginBottom: 8 }} />
                  <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Click to select files</p>
                  <p style={{ color: "#64748b", fontSize: "0.78rem", marginTop: 4 }}>Images, Videos, PDFs, Docs</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                />

                {/* Selected files list */}
                {selectedFiles.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    {selectedFiles.map((file, i) => {
                      const Icon = fileIcon(file.type);
                      return (
                        <div key={i} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 14px",
                          borderRadius: 12,
                          background: "rgba(2,6,23,0.45)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          marginBottom: 8,
                        }}>
                          <Icon size={16} style={{ color: "#fb7185", flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: "0.85rem", color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.name}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", flexShrink: 0 }}>
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                          <button type="button" onClick={() => removeFile(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                            <X size={15} style={{ color: "#64748b" }} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upload results */}
                {uploadResults.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    {uploadResults.map((r, i) => (
                      <div key={i} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: "0.85rem",
                        color: r.success ? "#86efac" : "#f87171",
                        marginBottom: 4,
                      }}>
                        {r.success
                          ? <CheckCircle2 size={14} />
                          : <X size={14} />}
                        {r.name}
                      </div>
                    ))}
                  </div>
                )}

                {uploadMessage.text && (
                  <div className={`form-message ${uploadMessage.type}`} style={{ marginBottom: 14 }}>
                    {uploadMessage.text}
                  </div>
                )}

                <button
                  type="button"
                  className="auth-btn"
                  onClick={uploadEvidence}
                  disabled={uploadingFiles || selectedFiles.length === 0}
                  style={{ marginTop: 0 }}
                >
                  {uploadingFiles ? <LoaderCircle className="spin" size={18} /> : <Upload size={18} />}
                  {uploadingFiles ? "Uploading..." : `Upload ${selectedFiles.length > 0 ? `${selectedFiles.length} file(s)` : "Evidence"}`}
                </button>
              </>
            )}
          </div>

          {/* Status info card */}
          <div className="contact-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            <h3>Report Status</h3>
            <p style={{ color: "#94a3b8" }}>New reports are marked as NEW by default.</p>
            <span style={{ color: "#86efac" }}>
              {submittedId ? `✓ Incident #${submittedId} logged` : "Secure Logging Active"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportIncident;
