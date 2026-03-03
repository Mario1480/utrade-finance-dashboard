"use client";

import { FormEvent, useEffect, useState } from "react";

type Row = {
  id: string;
  month: string;
  token: string;
  amountToken: number;
  txUrl: string;
  chain: string;
  status: string;
  createdBy: string;
};

export function BurningManager({ isSuperadmin }: { isSuperadmin: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    token: "UTT",
    amountToken: "",
    txUrl: "",
    chain: "Solana",
  });

  async function load() {
    const response = await fetch("/api/burning");
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error ?? "Fehler beim Laden");
    }
    setRows(json.data);
  }

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);

  function resetForm() {
    setForm({
      month: new Date().toISOString().slice(0, 7),
      token: "UTT",
      amountToken: "",
      txUrl: "",
      chain: "Solana",
    });
    setEditingId(null);
  }

  function startEdit(row: Row) {
    setEditingId(row.id);
    setForm({
      month: row.month,
      token: row.token,
      amountToken: String(row.amountToken),
      txUrl: row.txUrl,
      chain: row.chain,
    });
    setMessage(null);
    setError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    const isEdit = Boolean(editingId);
    const response = await fetch("/api/burning", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(isEdit ? { id: editingId } : {}),
        month: form.month,
        token: form.token,
        amountToken: Number(form.amountToken),
        txUrl: form.txUrl,
        chain: form.chain,
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Konnte nicht speichern");
      return;
    }

    setMessage(isEdit ? "Burning-Eintrag aktualisiert" : "Burning-Eintrag gespeichert");
    resetForm();
    await load();
  }

  async function setStatus(id: string, status: "APPROVED" | "REJECTED") {
    const response = await fetch("/api/burning", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Statusänderung fehlgeschlagen");
      return;
    }

    setMessage(`Status: ${status}`);
    await load();
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <form className="panel" onSubmit={submit}>
        <h2>{editingId ? "Burning bearbeiten" : "Burning erfassen"}</h2>
        <div className="form-grid">
          <div>
            <label>Monat</label>
            <input type="month" value={form.month} onChange={(event) => setForm({ ...form, month: event.target.value })} required />
          </div>
          <div>
            <label>Token</label>
            <select value={form.token} onChange={(event) => setForm({ ...form, token: event.target.value })}>
              <option value="UTT">UTT</option>
              <option value="USHARK">USHARK</option>
            </select>
          </div>
          <div>
            <label>Menge</label>
            <input type="number" step="0.000001" value={form.amountToken} onChange={(event) => setForm({ ...form, amountToken: event.target.value })} required />
          </div>
          <div>
            <label>Chain</label>
            <input value={form.chain} onChange={(event) => setForm({ ...form, chain: event.target.value })} required />
          </div>
          <div>
            <label>Tx URL</label>
            <input type="url" value={form.txUrl} onChange={(event) => setForm({ ...form, txUrl: event.target.value })} required />
          </div>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button type="submit">{editingId ? "Änderungen speichern" : "Speichern"}</button>
          {editingId ? (
            <button className="secondary" type="button" onClick={resetForm}>
              Abbrechen
            </button>
          ) : null}
        </div>
        {message ? <div className="alert">{message}</div> : null}
        {error ? <div className="alert error">{error}</div> : null}
      </form>

      <div className="panel">
        <h3>Burning Liste</h3>
        <table>
          <thead>
            <tr>
              <th>Monat</th>
              <th>Token</th>
              <th>Menge</th>
              <th>Chain</th>
              <th>Tx Link</th>
              <th>Status</th>
              <th>Von</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.month}</td>
                <td>{row.token}</td>
                <td>{row.amountToken}</td>
                <td>{row.chain}</td>
                <td>
                  <a href={row.txUrl} target="_blank" rel="noopener noreferrer">
                    Öffnen
                  </a>
                </td>
                <td>
                  <code className="badge">{row.status}</code>
                </td>
                <td>{row.createdBy}</td>
                <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="secondary" type="button" onClick={() => startEdit(row)}>
                    Bearbeiten
                  </button>
                  {isSuperadmin ? (
                    <>
                      <button type="button" onClick={() => setStatus(row.id, "APPROVED")}>OK</button>
                      <button className="danger" type="button" onClick={() => setStatus(row.id, "REJECTED")}>Reject</button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
