import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import {
  ShieldCheck,
  Phone,
  Plus,
  User,
  Heart,
  Trash2,
  LoaderCircle,
  Pencil,
  Check,
  X,
} from "lucide-react";

const emptyForm = { name: "", phoneNumber: "", relationship: "" };

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/contacts");
      setContacts(data);
    } catch {
      setMessage({ type: "error", text: "Failed to load contacts." });
    } finally {
      setLoading(false);
    }
  };

  // Fetch contacts on mount
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      fetchContacts();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, []);

  const updateField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateEditField = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!form.name.trim() || !form.phoneNumber.trim() || !form.relationship.trim()) {
      setMessage({ type: "error", text: "All fields are required." });
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await apiClient.post("/api/contacts", form);
      setContacts((prev) => [...prev, data]);
      setForm(emptyForm);
      setMessage({ type: "success", text: "Contact added successfully." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to add contact.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this contact?")) return;
    try {
      await apiClient.delete(`/api/contacts/${id}`);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setMessage({ type: "success", text: "Contact removed." });
    } catch {
      setMessage({ type: "error", text: "Failed to delete contact." });
    }
  };

  const startEdit = (contact) => {
    setEditId(contact.id);
    setEditForm({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      relationship: contact.relationship,
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm(emptyForm);
  };

  const saveEdit = async (id) => {
    try {
      const { data } = await apiClient.put(`/api/contacts/${id}`, editForm);
      setContacts((prev) => prev.map((c) => (c.id === id ? data : c)));
      setEditId(null);
      setMessage({ type: "success", text: "Contact updated." });
    } catch {
      setMessage({ type: "error", text: "Failed to update contact." });
    }
  };

  return (
    <div className="contacts-inner">
      <div className="contacts-layout">
        {/* Add Contact Form */}
        <form className="contacts-form" onSubmit={handleAdd}>
          <h1>Emergency Contacts</h1>
          <p>Add trusted people who will receive SOS alerts.</p>

          <label>Name</label>
          <div className="input-box">
            <User size={20} />
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="Mother / Friend / Guardian"
            />
          </div>

          <label>Phone Number</label>
          <div className="input-box">
            <Phone size={20} />
            <input
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={updateField}
              placeholder="+91 9876543210"
            />
          </div>

          <label>Relationship</label>
          <div className="input-box">
            <Heart size={20} />
            <input
              name="relationship"
              value={form.relationship}
              onChange={updateField}
              placeholder="Parent / Friend / Brother"
            />
          </div>

          {message.text && (
            <div className={`form-message ${message.type}`} role="alert">
              {message.text}
            </div>
          )}

          <button className="auth-btn" type="submit" disabled={submitting}>
            {submitting ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <Plus size={18} />
            )}
            {submitting ? "Adding..." : "Add Contact"}
          </button>
        </form>

        {/* Contacts List */}
        <div className="contacts-list">
          <h2>Trusted Circle</h2>

          {loading ? (
            <div className="activity-row">
              <LoaderCircle className="spin" size={20} />
              <p style={{ marginLeft: 12, color: "#94a3b8" }}>Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="contact-card">
              <div>
                <h3>No contacts yet</h3>
                <p>Add your first trusted contact using the form.</p>
              </div>
            </div>
          ) : (
            contacts.map((contact) =>
              editId === contact.id ? (
                // Inline edit mode
                <div className="contact-card" key={contact.id} style={{ flexDirection: "column", gap: 12 }}>
                  <div className="input-box" style={{ marginBottom: 8 }}>
                    <User size={18} />
                    <input
                      name="name"
                      value={editForm.name}
                      onChange={updateEditField}
                      placeholder="Name"
                    />
                  </div>
                  <div className="input-box" style={{ marginBottom: 8 }}>
                    <Phone size={18} />
                    <input
                      name="phoneNumber"
                      value={editForm.phoneNumber}
                      onChange={updateEditField}
                      placeholder="Phone Number"
                    />
                  </div>
                  <div className="input-box" style={{ marginBottom: 8 }}>
                    <Heart size={18} />
                    <input
                      name="relationship"
                      value={editForm.relationship}
                      onChange={updateEditField}
                      placeholder="Relationship"
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => saveEdit(contact.id)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 10,
                        border: "none",
                        background: "rgba(34,197,94,0.2)",
                        color: "#86efac",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Check size={16} /> Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 10,
                        border: "none",
                        background: "rgba(255,255,255,0.07)",
                        color: "#94a3b8",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <X size={16} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="contact-card" key={contact.id}>
                  <div>
                    <h3>{contact.name}</h3>
                    <p>{contact.phoneNumber}</p>
                    <span>{contact.relationship}</span>
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <button
                      type="button"
                      onClick={() => startEdit(contact)}
                      style={{ background: "none", border: "none", cursor: "pointer" }}
                      aria-label="Edit contact"
                    >
                      <Pencil size={18} style={{ color: "#94a3b8" }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(contact.id)}
                      style={{ background: "none", border: "none", cursor: "pointer" }}
                      aria-label="Delete contact"
                    >
                      <Trash2 size={18} style={{ color: "#fb7185" }} />
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default Contacts;
