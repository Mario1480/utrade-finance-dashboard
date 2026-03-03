"use client";

import { FormEvent, useEffect, useState } from "react";

type Row = {
  id: string;
  name: string;
  payoutPct: string;
  walletChain: string | null;
  walletAddress: string | null;
  isActive: boolean;
  validFrom: string;
};

type EditForm = {
  name: string;
  payoutPct: string;
  walletChain: string;
  walletAddress: string;
  validFrom: string;
  isActive: boolean;
};

export function TeamManager({ isSuperadmin }: { isSuperadmin: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [form, setForm] = useState({
    name: "",
    payoutPct: "",
    walletChain: "",
    walletAddress: "",
    validFrom: new Date().toISOString().slice(0, 7),
  });

  async function load() {
    const response = await fetch("/api/rules/team-members");
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
    if (!isSuperadmin) {
      return;
    }

    const response = await fetch("/api/rules/team-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        payoutPct: Number(form.payoutPct),
        walletChain: form.walletChain || undefined,
        walletAddress: form.walletAddress || undefined,
        validFrom: form.validFrom,
      }),
    });
    const json = await response.json();

    if (!response.ok) {
      setError(json.error ?? "Konnte nicht speichern");
      return;
    }

    setMessage("Teammitglied gespeichert");
    setForm({ ...form, name: "", payoutPct: "", walletAddress: "" });
    await load();
  }

  function startEdit(row: Row) {
    setEditingId(row.id);
    setEditForm({
      name: row.name,
      payoutPct: String(Number(row.payoutPct)),
      walletChain: row.walletChain ?? "",
      walletAddress: row.walletAddress ?? "",
      validFrom: new Date(row.validFrom).toISOString().slice(0, 7),
      isActive: row.isActive,
    });
    setMessage(null);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveEdit(id: string) {
    if (!editForm) {
      return;
    }

    const response = await fetch(`/api/rules/team-members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        payoutPct: Number(editForm.payoutPct),
        walletChain: editForm.walletChain || null,
        walletAddress: editForm.walletAddress || null,
        validFrom: editForm.validFrom,
        isActive: editForm.isActive,
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Update fehlgeschlagen");
      return;
    }

    setMessage("Teammitglied aktualisiert");
    cancelEdit();
    await load();
  }

  async function toggleActive(row: Row) {
    const response = await fetch(`/api/rules/team-members/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Statusänderung fehlgeschlagen");
      return;
    }

    setMessage("Status aktualisiert");
    await load();
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      {isSuperadmin ? (
        <form className="panel" onSubmit={submit}>
          <h2>Teammitglied hinzufügen</h2>
          <div className="form-grid">
            <div>
              <label>Name</label>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div>
              <label>Payout Quote (0-1)</label>
              <input
                type="number"
                step="0.01"
                value={form.payoutPct}
                onChange={(event) => setForm({ ...form, payoutPct: event.target.value })}
                required
              />
            </div>
            <div>
              <label>Wallet Chain</label>
              <input value={form.walletChain} onChange={(event) => setForm({ ...form, walletChain: event.target.value })} />
            </div>
            <div>
              <label>Wallet Address</label>
              <input
                value={form.walletAddress}
                onChange={(event) => setForm({ ...form, walletAddress: event.target.value })}
              />
            </div>
            <div>
              <label>Gültig ab</label>
              <input type="month" value={form.validFrom} onChange={(event) => setForm({ ...form, validFrom: event.target.value })} required />
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <button type="submit">Speichern</button>
          </div>
          {message ? <div className="alert">{message}</div> : null}
          {error ? <div className="alert error">{error}</div> : null}
        </form>
      ) : null}

      <div className="panel">
        <h3>Teammitglieder</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Payout</th>
              <th>Chain</th>
              <th>Adresse</th>
              <th>Aktiv</th>
              <th>Valid From</th>
              {isSuperadmin ? <th>Aktion</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isEditing = editingId === row.id;

              return (
                <tr key={row.id}>
                  <td>
                    {isEditing ? (
                      <input
                        value={editForm?.name ?? ""}
                        onChange={(event) =>
                          setEditForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                        }
                      />
                    ) : (
                      row.name
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm?.payoutPct ?? ""}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, payoutPct: event.target.value } : prev,
                          )
                        }
                      />
                    ) : (
                      `${(Number(row.payoutPct) * 100).toFixed(2)}%`
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        value={editForm?.walletChain ?? ""}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, walletChain: event.target.value } : prev,
                          )
                        }
                      />
                    ) : (
                      row.walletChain
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        value={editForm?.walletAddress ?? ""}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, walletAddress: event.target.value } : prev,
                          )
                        }
                      />
                    ) : (
                      row.walletAddress
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select
                        value={editForm?.isActive ? "yes" : "no"}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, isActive: event.target.value === "yes" } : prev,
                          )
                        }
                      >
                        <option value="yes">Ja</option>
                        <option value="no">Nein</option>
                      </select>
                    ) : row.isActive ? (
                      "Ja"
                    ) : (
                      "Nein"
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="month"
                        value={editForm?.validFrom ?? ""}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, validFrom: event.target.value } : prev,
                          )
                        }
                      />
                    ) : (
                      new Date(row.validFrom).toISOString().slice(0, 10)
                    )}
                  </td>
                  {isSuperadmin ? (
                    <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {isEditing ? (
                        <>
                          <button type="button" onClick={() => saveEdit(row.id)}>
                            Save
                          </button>
                          <button className="secondary" type="button" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="secondary" type="button" onClick={() => startEdit(row)}>
                            Bearbeiten
                          </button>
                          <button type="button" onClick={() => toggleActive(row)}>
                            {row.isActive ? "Deaktivieren" : "Aktivieren"}
                          </button>
                        </>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
