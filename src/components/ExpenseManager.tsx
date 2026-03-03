"use client";

import { FormEvent, useEffect, useState } from "react";

type Props = { isSuperadmin: boolean };
type Row = {
  id: string;
  month: string;
  category: string;
  vendor: string;
  costType: string;
  amountUsd: number;
  note: string | null;
  status: string;
  createdBy: string;
};

export function ExpenseManager({ isSuperadmin }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    category: "Marketing",
    vendor: "",
    costType: "MONTHLY",
    amountUsd: "",
    note: "",
  });

  async function load() {
    const response = await fetch("/api/finance/expenses");
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
      category: "Marketing",
      vendor: "",
      costType: "MONTHLY",
      amountUsd: "",
      note: "",
    });
    setEditingId(null);
  }

  function startEdit(row: Row) {
    setEditingId(row.id);
    setForm({
      month: row.month,
      category: row.category,
      vendor: row.vendor,
      costType: row.costType,
      amountUsd: String(row.amountUsd),
      note: row.note ?? "",
    });
    setMessage(null);
    setError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const isEdit = Boolean(editingId);

    const response = await fetch("/api/finance/expenses", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(isEdit ? { id: editingId } : {}),
        month: form.month,
        category: form.category,
        vendor: form.vendor,
        costType: form.costType,
        amountUsd: Number(form.amountUsd),
        note: form.note || undefined,
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Konnte nicht speichern");
      return;
    }

    setMessage(isEdit ? "Eintrag aktualisiert" : "Eintrag gespeichert");
    resetForm();
    await load();
  }

  async function deleteRow(id: string) {
    if (!window.confirm("Eintrag wirklich löschen?")) {
      return;
    }

    setError(null);
    setMessage(null);

    const response = await fetch(`/api/finance/expenses/${id}`, {
      method: "DELETE",
    });
    const json = await response.json();

    if (!response.ok) {
      setError(json.error ?? "Löschen fehlgeschlagen");
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    setMessage("Eintrag gelöscht");
    await load();
  }

  async function setStatus(id: string, status: "APPROVED" | "REJECTED") {
    const response = await fetch(`/api/finance/expenses/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
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
      <form className="panel" onSubmit={onSubmit}>
        <h2>{editingId ? "Ausgabe bearbeiten" : "Ausgaben erfassen"}</h2>
        <div className="form-grid">
          <div>
            <label>Monat</label>
            <input
              type="month"
              value={form.month}
              onChange={(event) => setForm({ ...form, month: event.target.value })}
              required
            />
          </div>
          <div>
            <label>Kategorie</label>
            <input
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              required
            />
          </div>
          <div>
            <label>Vendor</label>
            <input
              value={form.vendor}
              onChange={(event) => setForm({ ...form, vendor: event.target.value })}
              required
            />
          </div>
          <div>
            <label>Kostenart</label>
            <select
              value={form.costType}
              onChange={(event) => setForm({ ...form, costType: event.target.value })}
            >
              <option value="MONTHLY">Monatlich</option>
              <option value="ONE_TIME">Einmalig</option>
            </select>
          </div>
          <div>
            <label>Betrag USD</label>
            <input
              type="number"
              step="0.01"
              value={form.amountUsd}
              onChange={(event) => setForm({ ...form, amountUsd: event.target.value })}
              required
            />
          </div>
          <div>
            <label>Notiz</label>
            <input
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
            />
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
        <h3>Ausgaben</h3>
        <table>
          <thead>
            <tr>
              <th>Monat</th>
              <th>Kategorie</th>
              <th>Vendor</th>
              <th>Art</th>
              <th>USD</th>
              <th>Status</th>
              <th>Von</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.month}</td>
                <td>{row.category}</td>
                <td>{row.vendor}</td>
                <td>{row.costType}</td>
                <td>{row.amountUsd.toFixed(2)}</td>
                <td>
                  <code className="badge">{row.status}</code>
                </td>
                <td>{row.createdBy}</td>
                <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="secondary" type="button" onClick={() => startEdit(row)}>
                    Bearbeiten
                  </button>
                  <button className="danger" type="button" onClick={() => deleteRow(row.id)}>
                    Löschen
                  </button>
                  {isSuperadmin ? (
                    <>
                      <button type="button" onClick={() => setStatus(row.id, "APPROVED")}>OK</button>
                      <button
                        className="danger"
                        type="button"
                        onClick={() => setStatus(row.id, "REJECTED")}
                      >
                        Reject
                      </button>
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
