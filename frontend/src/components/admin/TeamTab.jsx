import { useEffect, useRef, useState } from "react";
import { apiGet, apiDelete, apiUpload, compressImage } from "../../lib/api";

const EMPTY_MEMBER = { name: "", title: "", linkedin_url: "", github_url: "", sort_order: 0 };

export default function TeamTab() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(EMPTY_MEMBER);
  const [photo, setPhoto] = useState(null);
  const [badge, setBadge] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // edit modal state
  const [editing, setEditing] = useState(null); 
  const [editForm, setEditForm] = useState(EMPTY_MEMBER);
  const [editPhoto, setEditPhoto] = useState(null);
  const [editBadge, setEditBadge] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const addFormRef = useRef(null);

  async function load() {
    try {
      setMembers(await apiGet("/team"));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addMember(e) {
    e.preventDefault();
    setError(null);
    if (!photo) {
      setError("Photo is required");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("title", form.title);
      formData.append("linkedin_url", form.linkedin_url);
      formData.append("github_url", form.github_url);
      const compressedPhoto = await compressImage(photo);
      formData.append("photo", compressedPhoto, photo.name);
      if (badge) {
        const compressedBadge = await compressImage(badge);
        formData.append("badge", compressedBadge, badge.name);
      }
      await apiUpload("/team", formData);
      setForm(EMPTY_MEMBER);
      setPhoto(null);
      setBadge(null);
      addFormRef.current?.reset();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function removeMember(id) {
    if (!confirm("Delete this member?")) return;
    try {
      await apiDelete(`/team/${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function openEdit(member) {
    setEditing(member);
    setEditForm({ name: member.name, title: member.title, linkedin_url: member.linkedin_url ?? "", github_url: member.github_url ?? "", sort_order: member.sort_order ?? 0 });
    setEditPhoto(null);
    setEditBadge(null);
    setError(null);
  }

  function closeEdit() {
    setEditing(null);
  }

  async function saveEdit(e) {
    e.preventDefault();
    setError(null);
    setEditSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("title", editForm.title);
      formData.append("linkedin_url", editForm.linkedin_url);
      formData.append("github_url", editForm.github_url);
      formData.append("sort_order", String(editForm.sort_order));
      if (editPhoto) {
        const compressed = await compressImage(editPhoto);
        formData.append("photo", compressed, editPhoto.name);
      }
      if (editBadge) {
        const compressed = await compressImage(editBadge);
        formData.append("badge", compressed, editBadge.name);
      }
      await apiUpload(`/team/${editing.id}`, formData, "PUT");
      closeEdit();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  }

  return (
    <div className="admin-tab">
      {error && <p className="admin-error">{error}</p>}

      <h2>Members</h2>
      <div className="admin-photo-grid">
        {members.map((m) => (
          <div key={m.id} className="admin-photo">
            <img src={m.photo_url} alt={m.name} />
            <div>
              {m.name} — {m.title}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Priority: {m.sort_order ?? 0}</div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button onClick={() => openEdit(m)}>Edit</button>
              <button
                onClick={() => removeMember(m.id)}
                style={{ color: "#fff", backgroundColor: "#dc2626", border: "none" }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2>Add Member</h2>
      <form ref={addFormRef} onSubmit={addMember} className="admin-form">
        <input
          placeholder="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          placeholder="LinkedIn URL (optional)"
          type="url"
          value={form.linkedin_url}
          onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
        />
        <input
          placeholder="GitHub URL (optional)"
          type="url"
          value={form.github_url}
          onChange={(e) => setForm({ ...form, github_url: e.target.value })}
        />
        <label>
          Photo*{" "}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0] ?? null)}
            required
          />
        </label>
        <label>
          Badge{" "}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBadge(e.target.files[0] ?? null)}
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Add Member"}
        </button>
      </form>

      {/* Edit modal */}
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => e.target === e.currentTarget && closeEdit()}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              minWidth: "320px",
              maxWidth: "90vw",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Edit Member</h3>

            {/* current photo preview */}
            <div style={{ marginBottom: "1rem", textAlign: "center" }}>
              <img
                src={editing.photo_url}
                alt={editing.name}
                style={{ maxHeight: "120px", borderRadius: "0.25rem", objectFit: "cover" }}
              />
              {editing.badge_url && (
                <img
                  src={editing.badge_url}
                  alt="badge"
                  style={{ maxHeight: "60px", marginLeft: "0.5rem", objectFit: "contain" }}
                />
              )}
            </div>

            <form onSubmit={saveEdit} className="admin-form">
              <input
                placeholder="Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
              <input
                placeholder="Title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />
              <input
                placeholder="LinkedIn URL (optional)"
                type="url"
                value={editForm.linkedin_url}
                onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
              />
              <input
                placeholder="GitHub URL (optional)"
                type="url"
                value={editForm.github_url}
                onChange={(e) => setEditForm({ ...editForm, github_url: e.target.value })}
              />
              <label>
                Display Priority (lower = first){" "}
                <input
                  type="number"
                  value={editForm.sort_order}
                  onChange={(e) => setEditForm({ ...editForm, sort_order: Number(e.target.value) })}
                  style={{ width: "80px" }}
                />
              </label>
              <label>
                New Photo{" "}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditPhoto(e.target.files[0] ?? null)}
                />
              </label>
              <label>
                New Badge{" "}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditBadge(e.target.files[0] ?? null)}
                />
              </label>

              {error && <p className="admin-error" style={{ margin: "0.5rem 0" }}>{error}</p>}

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="submit" disabled={editSubmitting}>
                  {editSubmitting ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={closeEdit}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
