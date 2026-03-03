"use client";

import { FormEvent, useEffect, useState } from "react";

type Row = {
  id: string;
  label: string;
  amountValue: string | number | null;
  asset: string;
  chain: string;
  address: string;
  isActive: boolean;
};

export function AddressManager({ isSuperadmin }: { isSuperadmin: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "",
    amountValue: "",
    asset: "UTT",
    chain: "Solana",
    address: "",
    isActive: true,
  });

  async function load() {
    const response = await fetch("/api/addresses");
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
    setEditingId(null);
    setForm({
      label: "",
      amountValue: "",
      asset: "UTT",
      chain: "Solana",
      address: "",
      isActive: true,
    });
  }

  function startEdit(row: Row) {
    setEditingId(row.id);
    setForm({
      label: row.label,
      amountValue: row.amountValue == null ? "" : String(row.amountValue),
      asset: row.asset,
      chain: row.chain,
      address: row.address,
      isActive: row.isActive,
    });
    setMessage(null);
    setError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isSuperadmin) {
      return;
    }

    const isEdit = Boolean(editingId);
    const parsedAmount = form.amountValue ? Number(form.amountValue) : undefined;
    const response = await fetch(
      isEdit ? `/api/addresses/${editingId}` : "/api/addresses",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          amountValue: isEdit ? (parsedAmount ?? null) : parsedAmount,
          asset: form.asset,
          chain: form.chain,
          address: form.address,
          isActive: form.isActive,
        }),
      },
    );
    const json = await response.json();

    if (!response.ok) {
      setError(json.error ?? "Konnte nicht speichern");
      return;
    }

    setMessage(isEdit ? "Adresse aktualisiert" : "Adresse gespeichert");
    resetForm();
    await load();
  }

  async function deleteRow(id: string) {
    if (!window.confirm("Adresse wirklich löschen?")) {
      return;
    }

    const response = await fetch(`/api/addresses/${id}`, {
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

    setMessage("Adresse gelöscht");
    await load();
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      {isSuperadmin ? (
        <form className="panel" onSubmit={submit}>
          <h2>{editingId ? "Projektadresse bearbeiten" : "Projektadresse hinzufügen"}</h2>
          <div className="form-grid">
            <div>
              <label>Label</label>
              <input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} required />
            </div>
            <div>
              <label>Amount (optional)</label>
              <input type="number" step="0.01" value={form.amountValue} onChange={(event) => setForm({ ...form, amountValue: event.target.value })} />
            </div>
            <div>
              <label>Asset</label>
              <input value={form.asset} onChange={(event) => setForm({ ...form, asset: event.target.value })} required />
            </div>
            <div>
              <label>Chain</label>
              <input value={form.chain} onChange={(event) => setForm({ ...form, chain: event.target.value })} required />
            </div>
            <div>
              <label>Address</label>
              <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required />
            </div>
            <div>
              <label>Aktiv</label>
              <select
                value={form.isActive ? "yes" : "no"}
                onChange={(event) => setForm({ ...form, isActive: event.target.value === "yes" })}
              >
                <option value="yes">Ja</option>
                <option value="no">Nein</option>
              </select>
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
      ) : null}

      <div className="panel">
        <h3>Adressen</h3>
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Amount</th>
              <th>Asset</th>
              <th>Chain</th>
              <th>Address</th>
              <th>Aktiv</th>
              {isSuperadmin ? <th>Aktion</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.label}</td>
                <td>{row.amountValue ?? "-"}</td>
                <td>{row.asset}</td>
                <td>{row.chain}</td>
                <td style={{ maxWidth: 220, overflowWrap: "anywhere" }}>{row.address}</td>
                <td>{row.isActive ? "Ja" : "Nein"}</td>
                {isSuperadmin ? (
                  <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button className="secondary" type="button" onClick={() => startEdit(row)}>
                      Bearbeiten
                    </button>
                    <button className="danger" type="button" onClick={() => deleteRow(row.id)}>
                      Löschen
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
