"use client";

import { useEffect, useState } from "react";

type Row = {
  month: string;
  hasApprovedData: boolean;
  isClosed: boolean;
  closedAt: string | null;
  closedBy: { id: string; name: string; email: string } | null;
};

export function CommunityMonthStatusManager({
  isSuperadmin,
}: {
  isSuperadmin: boolean;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/community/month-status");
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error ?? "Fehler beim Laden");
    }

    setRows(json.data);
  }

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);

  async function setMonthState(month: string, action: "close" | "open") {
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/community/month-status/${month}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Aktion fehlgeschlagen");
      return;
    }

    setMessage(
      action === "close"
        ? `Monat ${month} geschlossen`
        : `Monat ${month} wieder geöffnet`,
    );
    await load();
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="panel">
        <h2>Community Monatsfreigabe</h2>
        <p>
          Nur geschlossene Monate erscheinen im öffentlichen Dashboard unter
          <code className="badge" style={{ marginLeft: 6 }}>/dashboard</code>.
        </p>
      </div>

      {message ? <div className="alert">{message}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Monat</th>
              <th>Approved Daten</th>
              <th>Status</th>
              <th>Geschlossen am</th>
              <th>Geschlossen von</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{row.hasApprovedData ? "Ja" : "Nein"}</td>
                <td>
                  <code className="badge">{row.isClosed ? "Closed" : "Open"}</code>
                </td>
                <td>
                  {row.closedAt
                    ? new Date(row.closedAt).toLocaleString("de-DE")
                    : "-"}
                </td>
                <td>{row.closedBy?.name ?? "-"}</td>
                <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {!row.isClosed ? (
                    <button type="button" onClick={() => setMonthState(row.month, "close")}>
                      Schließen
                    </button>
                  ) : null}
                  {row.isClosed && isSuperadmin ? (
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => setMonthState(row.month, "open")}
                    >
                      Wieder öffnen
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>Keine Monate mit approved Daten gefunden.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
