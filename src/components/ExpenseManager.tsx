"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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
  const [filterText, setFilterText] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");
  const [filterMonth, setFilterMonth] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
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

  const filteredRows = useMemo(() => {
    const q = filterText.trim().toLowerCase();

    return rows.filter((row) => {
      if (filterStatus !== "ALL" && row.status !== filterStatus) {
        return false;
      }

      if (filterMonth && row.month !== filterMonth) {
        return false;
      }

      if (!q) {
        return true;
      }

      return [
        row.month,
        row.category,
        row.vendor,
        row.costType,
        row.status,
        row.createdBy,
        row.note ?? "",
        row.amountUsd.toFixed(2),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, filterMonth, filterStatus, filterText]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [filterText, filterStatus, filterMonth, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

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
        <div className="form-grid" style={{ marginBottom: 12 }}>
          <div>
            <label>Suche</label>
            <input
              placeholder="Monat, Kategorie, Vendor, Status, User..."
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
            />
          </div>
          <div>
            <label>Status</label>
            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(
                  event.target.value as "ALL" | "PENDING" | "APPROVED" | "REJECTED",
                )
              }
            >
              <option value="ALL">Alle</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div>
            <label>Monat</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(event) => setFilterMonth(event.target.value)}
            />
          </div>
          <div>
            <label>Einträge pro Seite</label>
            <select
              value={String(pageSize)}
              onChange={(event) => setPageSize(Number(event.target.value))}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <button
            className="secondary"
            type="button"
            onClick={() => {
              setFilterText("");
              setFilterStatus("ALL");
              setFilterMonth("");
            }}
          >
            Filter zurücksetzen
          </button>
          <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            {filteredRows.length} von {rows.length} Einträgen
          </span>
        </div>
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
            {pagedRows.map((row) => (
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
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={8}>Keine Einträge für den aktuellen Filter.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <button
            className="secondary"
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Vorherige Seite
          </button>
          <span style={{ alignSelf: "center", color: "var(--muted)", fontSize: "0.9rem" }}>
            Seite {page} von {totalPages}
          </span>
          <button
            className="secondary"
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Nächste Seite
          </button>
        </div>
      </div>
    </div>
  );
}
