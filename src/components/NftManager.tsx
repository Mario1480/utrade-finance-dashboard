"use client";

import { FormEvent, useEffect, useState } from "react";

type Props = { isSuperadmin: boolean };
type Row = {
  id: string;
  month: string;
  tier: string;
  soldCount: number;
  unitPriceUsd: number;
  status: string;
  createdBy: string;
};

export function NftManager({ isSuperadmin }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    tier: "BRONZE",
    soldCount: "",
    unitPriceUsd: "",
  });

  async function load() {
    const response = await fetch("/api/nft/sales");
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error ?? "Fehler beim Laden");
    }
    setRows(json.data);
  }

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await fetch("/api/nft/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month: form.month,
        tier: form.tier,
        soldCount: Number(form.soldCount),
        unitPriceUsd: Number(form.unitPriceUsd),
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Konnte nicht speichern");
      return;
    }

    setMessage("NFT-Eintrag gespeichert");
    setForm({ ...form, soldCount: "", unitPriceUsd: "" });
    await load();
  }

  async function setStatus(id: string, status: "APPROVED" | "REJECTED") {
    const response = await fetch("/api/nft/sales", {
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
      <form className="panel" onSubmit={onSubmit}>
        <h2>NFT Verkäufe erfassen</h2>
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
            <label>Tier</label>
            <select
              value={form.tier}
              onChange={(event) => setForm({ ...form, tier: event.target.value })}
            >
              <option value="BRONZE">Bronze</option>
              <option value="SILVER">Silber</option>
              <option value="GOLD">Gold</option>
            </select>
          </div>
          <div>
            <label>Verkauft</label>
            <input
              type="number"
              min="0"
              value={form.soldCount}
              onChange={(event) => setForm({ ...form, soldCount: event.target.value })}
              required
            />
          </div>
          <div>
            <label>Unit Price USD</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.unitPriceUsd}
              onChange={(event) => setForm({ ...form, unitPriceUsd: event.target.value })}
              required
            />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <button type="submit">Speichern</button>
        </div>
        {message ? <div className="alert">{message}</div> : null}
        {error ? <div className="alert error">{error}</div> : null}
      </form>

      <div className="panel">
        <h3>NFT Verkäufe</h3>
        <table>
          <thead>
            <tr>
              <th>Monat</th>
              <th>Tier</th>
              <th>Anzahl</th>
              <th>Unit USD</th>
              <th>Status</th>
              <th>Von</th>
              {isSuperadmin ? <th>Aktion</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.month}</td>
                <td>{row.tier}</td>
                <td>{row.soldCount}</td>
                <td>{row.unitPriceUsd.toFixed(2)}</td>
                <td>
                  <code className="badge">{row.status}</code>
                </td>
                <td>{row.createdBy}</td>
                {isSuperadmin ? (
                  <td>
                    <button type="button" onClick={() => setStatus(row.id, "APPROVED")}>OK</button>{" "}
                    <button
                      className="danger"
                      type="button"
                      onClick={() => setStatus(row.id, "REJECTED")}
                    >
                      Reject
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
