"use client";

import { FormEvent, useEffect, useState } from "react";

type Row = {
  id: string;
  email: string;
  name: string;
  role: "SUPERADMIN" | "TEAM_USER";
  isActive: boolean;
  mustChangePassword: boolean;
};

export function UsersManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    name: "",
    role: "TEAM_USER",
    password: "",
  });

  async function load() {
    const response = await fetch("/api/admin/users");
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error ?? "Fehler beim Laden");
    }
    setRows(json.data);
  }

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Konnte nicht speichern");
      return;
    }

    setMessage("User angelegt");
    setForm({ email: "", name: "", role: "TEAM_USER", password: "" });
    await load();
  }

  async function toggleActive(row: Row) {
    const response = await fetch(`/api/admin/users/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Konnte nicht aktualisieren");
      return;
    }

    setMessage("User aktualisiert");
    await load();
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <form className="panel" onSubmit={submit}>
        <h2>User anlegen</h2>
        <div className="form-grid">
          <div>
            <label>Name</label>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </div>
          <div>
            <label>E-Mail</label>
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </div>
          <div>
            <label>Rolle</label>
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="TEAM_USER">TEAM_USER</option>
              <option value="SUPERADMIN">SUPERADMIN</option>
            </select>
          </div>
          <div>
            <label>Passwort</label>
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <button type="submit">Anlegen</button>
        </div>
      </form>

      {message ? <div className="alert">{message}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      <div className="panel">
        <h3>User Liste</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Rolle</th>
              <th>Aktiv</th>
              <th>PW Wechsel</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td>{row.role}</td>
                <td>{row.isActive ? "Ja" : "Nein"}</td>
                <td>{row.mustChangePassword ? "Ja" : "Nein"}</td>
                <td>
                  <button type="button" onClick={() => toggleActive(row)}>
                    {row.isActive ? "Deaktivieren" : "Aktivieren"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
