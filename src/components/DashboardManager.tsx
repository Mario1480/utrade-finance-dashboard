"use client";

import { useEffect, useMemo, useState } from "react";

type MonthlyData = {
  month: string;
  totals: {
    incomeTotal: number;
    expenseTotal: number;
    profitTotal: number;
    nftProfitPool: number;
    teamPool: number;
    treasuryPool: number;
  };
  nftProfit: {
    bronze: { perNft: number; total: number; count: number };
    silver: { perNft: number; total: number; count: number };
    gold: { perNft: number; total: number; count: number };
  };
  teamPayouts: Array<{ name: string; payoutPct: number; payoutUsd: number }>;
  salesSplit: {
    totalUsd: number;
    tradingUsd: number;
    infrastructureUsd: number;
    operationsUsd: number;
  };
};

export function DashboardManager() {
  const [monthOptions, setMonthOptions] = useState<string[]>([]);
  const [month, setMonth] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [monthly, setMonthly] = useState<MonthlyData | null>(null);
  const [trend, setTrend] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadMonthOptions() {
    const response = await fetch("/api/dashboard/month-options");
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error ?? "Konnte Monatsoptionen nicht laden");
    }

    return (json.data.months ?? []) as string[];
  }

  async function loadMonthly(value: string) {
    const response = await fetch(`/api/dashboard/monthly?month=${value}`);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error ?? "Konnte Monatsdaten nicht laden");
    }

    setMonthly(json.data);
  }

  async function loadTrend(fromMonth: string, toMonth: string) {
    const response = await fetch(
      `/api/dashboard/trends?from=${fromMonth}&to=${toMonth}`,
    );
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error ?? "Konnte Trenddaten nicht laden");
    }

    setTrend(json.data);
  }

  async function initialize() {
    setError(null);

    try {
      const options = await loadMonthOptions();
      setMonthOptions(options);

      if (options.length === 0) {
        setMonth("");
        setFrom("");
        setTo("");
        setMonthly(null);
        setTrend([]);
        return;
      }

      const defaultTo = options[0];
      const defaultFrom = options[Math.min(5, options.length - 1)];

      setMonth(defaultTo);
      setFrom(defaultFrom);
      setTo(defaultTo);

      await Promise.all([loadMonthly(defaultTo), loadTrend(defaultFrom, defaultTo)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
  }

  async function loadAll() {
    if (!month || !from || !to) {
      return;
    }

    setError(null);
    try {
      await Promise.all([loadMonthly(month), loadTrend(from, to)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
  }

  useEffect(() => {
    void initialize();
    // We intentionally initialize once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpis = useMemo(() => {
    if (!monthly) {
      return [] as Array<[string, number]>;
    }

    return [
      ["Einnahmen", monthly.totals.incomeTotal],
      ["Ausgaben", monthly.totals.expenseTotal],
      ["Gewinn", monthly.totals.profitTotal],
      ["NFT Pool", monthly.totals.nftProfitPool],
      ["Team Pool", monthly.totals.teamPool],
      ["Treasury", monthly.totals.treasuryPool],
    ];
  }, [monthly]);

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="panel">
        <h2>Monatsübersicht</h2>
        <div className="form-grid" style={{ marginTop: 10 }}>
          <div>
            <label>Monat</label>
            <select value={month} onChange={(event) => setMonth(event.target.value)} disabled={monthOptions.length === 0}>
              {monthOptions.length === 0 ? <option value="">Keine Monate verfügbar</option> : null}
              {monthOptions.map((optionMonth) => (
                <option key={optionMonth} value={optionMonth}>
                  {optionMonth}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Trend von</label>
            <input type="month" value={from} onChange={(event) => setFrom(event.target.value)} disabled={!from} />
          </div>
          <div>
            <label>Trend bis</label>
            <input type="month" value={to} onChange={(event) => setTo(event.target.value)} disabled={!to} />
          </div>
          <div style={{ alignSelf: "end" }}>
            <button type="button" onClick={loadAll} disabled={!month || !from || !to}>
              Aktualisieren
            </button>
          </div>
        </div>
        {monthOptions.length === 0 ? (
          <div className="alert">Noch keine freigegebenen Monatsdaten vorhanden.</div>
        ) : null}
        {error ? <div className="alert error">{error}</div> : null}
      </div>

      <div className="grid grid-2">
        {kpis.map(([label, value]) => (
          <div className="panel" key={label}>
            <p>{label}</p>
            <h3>${value.toLocaleString("de-DE", { maximumFractionDigits: 2 })}</h3>
          </div>
        ))}
      </div>

      {monthly ? (
        <div className="panel">
          <h3>NFT Profit je Tier ({monthly.month})</h3>
          <table>
            <thead>
              <tr>
                <th>Tier</th>
                <th>Anzahl</th>
                <th>Profit je NFT</th>
                <th>Gesamtprofit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bronze</td>
                <td>{monthly.nftProfit.bronze.count}</td>
                <td>${monthly.nftProfit.bronze.perNft}</td>
                <td>${monthly.nftProfit.bronze.total}</td>
              </tr>
              <tr>
                <td>Silber</td>
                <td>{monthly.nftProfit.silver.count}</td>
                <td>${monthly.nftProfit.silver.perNft}</td>
                <td>${monthly.nftProfit.silver.total}</td>
              </tr>
              <tr>
                <td>Gold</td>
                <td>{monthly.nftProfit.gold.count}</td>
                <td>${monthly.nftProfit.gold.perNft}</td>
                <td>${monthly.nftProfit.gold.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}

      {monthly ? (
        <div className="panel">
          <h3>Team-Auszahlung ({monthly.month})</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Quote</th>
                <th>Auszahlung USD</th>
              </tr>
            </thead>
            <tbody>
              {monthly.teamPayouts.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{(row.payoutPct * 100).toFixed(2)}%</td>
                  <td>${row.payoutUsd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="panel">
        <h3>Trend</h3>
        <table>
          <thead>
            <tr>
              <th>Monat</th>
              <th>Einnahmen</th>
              <th>Ausgaben</th>
              <th>Gewinn</th>
              <th>NFT Pool</th>
              <th>Team Pool</th>
              <th>Treasury</th>
            </tr>
          </thead>
          <tbody>
            {trend.map((row) => (
              <tr key={String(row.month)}>
                <td>{String(row.month)}</td>
                <td>${Number(row.incomeTotal).toFixed(2)}</td>
                <td>${Number(row.expenseTotal).toFixed(2)}</td>
                <td>${Number(row.profitTotal).toFixed(2)}</td>
                <td>${Number(row.nftProfitPool).toFixed(2)}</td>
                <td>${Number(row.teamPool).toFixed(2)}</td>
                <td>${Number(row.treasuryPool).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
