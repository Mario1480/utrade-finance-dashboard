"use client";

import { useEffect, useMemo, useState } from "react";

type CommunityResponse = {
  months: string[];
  monthlyNftPool: Array<{
    month: string;
    nftPoolTotal: number;
    bronzeTotal: number;
    silverTotal: number;
    goldTotal: number;
    bronzePerNft: number;
    silverPerNft: number;
    goldPerNft: number;
  }>;
  burningMonthly: Array<{
    month: string;
    uttAmount: number;
    usharkAmount: number;
    txLinksUtt: string[];
    txLinksUshark: string[];
  }>;
  totals: {
    profitAllMonths: number;
    nftPoolAllMonths: number;
    profitBronzeAllMonths: number;
    profitSilverAllMonths: number;
    profitGoldAllMonths: number;
    burningTotalUtt: number;
    burningTotalUshark: number;
  };
};

function formatUsd(value: number): string {
  return `$${value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatToken(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

export function CommunityDashboard() {
  const [data, setData] = useState<CommunityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/public/community-dashboard");
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error ?? "Community-Daten konnten nicht geladen werden");
        }

        setData(json.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unbekannter Fehler beim Laden",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const maxNftPool = useMemo(() => {
    if (!data || data.monthlyNftPool.length === 0) {
      return 1;
    }

    return Math.max(...data.monthlyNftPool.map((row) => row.nftPoolTotal), 1);
  }, [data]);

  const maxTierValue = useMemo(() => {
    if (!data || data.monthlyNftPool.length === 0) {
      return 1;
    }

    return Math.max(
      ...data.monthlyNftPool.flatMap((row) => [
        row.bronzeTotal,
        row.silverTotal,
        row.goldTotal,
      ]),
      1,
    );
  }, [data]);

  if (loading) {
    return (
      <div className="panel">
        <h2>Community Dashboard</h2>
        <p>Daten werden geladen...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert error">{error}</div>;
  }

  if (!data || data.months.length === 0) {
    return (
      <div className="panel">
        <h2>Community Dashboard</h2>
        <p>Aktuell sind keine geschlossenen Monate für die Community freigegeben.</p>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="panel">
        <h1>uTrade Community Dashboard</h1>
        <p>
          Veröffentlicht werden nur geschlossene Monate mit freigegebenen Werten.
        </p>
      </div>

      <div className="grid grid-2">
        <div className="panel">
          <p>Gesamt Profit (alle veröffentlichten Monate)</p>
          <h3>{formatUsd(data.totals.profitAllMonths)}</h3>
        </div>
        <div className="panel">
          <p>NFT Pool Gesamt</p>
          <h3>{formatUsd(data.totals.nftPoolAllMonths)}</h3>
        </div>
        <div className="panel">
          <p>Profit Bronze Gesamt</p>
          <h3>{formatUsd(data.totals.profitBronzeAllMonths)}</h3>
        </div>
        <div className="panel">
          <p>Profit Silber Gesamt</p>
          <h3>{formatUsd(data.totals.profitSilverAllMonths)}</h3>
        </div>
        <div className="panel">
          <p>Profit Gold Gesamt</p>
          <h3>{formatUsd(data.totals.profitGoldAllMonths)}</h3>
        </div>
        <div className="panel">
          <p>Gesamt Burning</p>
          <h3>
            UTT: {formatToken(data.totals.burningTotalUtt)} | USHARK: {formatToken(data.totals.burningTotalUshark)}
          </h3>
        </div>
      </div>

      <div className="panel">
        <h3>Monatlicher NFT Pool (Chart)</h3>
        <p style={{ marginBottom: 10 }}>
          Pro Monat: Gesamtpool sowie Tier-Balken (Bronze, Silber, Gold).
        </p>
        <div className="community-tier-legend">
          <span className="community-tier-pill bronze">Bronze</span>
          <span className="community-tier-pill silver">Silber</span>
          <span className="community-tier-pill gold">Gold</span>
        </div>
        <div className="community-chart">
          {data.monthlyNftPool.map((row) => (
            <div className="community-chart-row" key={row.month}>
              <div className="community-chart-label">{row.month}</div>
              <div className="community-chart-multi">
                <div className="community-chart-bar-wrap">
                  <div
                    className="community-chart-bar"
                    style={{ width: `${(row.nftPoolTotal / maxNftPool) * 100}%` }}
                  />
                </div>
                <div className="community-tier-bars">
                  <div className="community-tier-bar-wrap">
                    <div
                      className="community-tier-bar bronze"
                      style={{ width: `${(row.bronzeTotal / maxTierValue) * 100}%` }}
                    />
                  </div>
                  <div className="community-tier-bar-wrap">
                    <div
                      className="community-tier-bar silver"
                      style={{ width: `${(row.silverTotal / maxTierValue) * 100}%` }}
                    />
                  </div>
                  <div className="community-tier-bar-wrap">
                    <div
                      className="community-tier-bar gold"
                      style={{ width: `${(row.goldTotal / maxTierValue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="community-chart-value">{formatUsd(row.nftPoolTotal)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Monatliche NFT-Pool-Aufteilung nach Tier</h3>
        <table>
          <thead>
            <tr>
              <th>Monat</th>
              <th>NFT Pool Gesamt</th>
              <th>Bronze</th>
              <th>Silber</th>
              <th>Gold</th>
              <th>Bronze je NFT</th>
              <th>Silber je NFT</th>
              <th>Gold je NFT</th>
            </tr>
          </thead>
          <tbody>
            {data.monthlyNftPool.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{formatUsd(row.nftPoolTotal)}</td>
                <td>{formatUsd(row.bronzeTotal)}</td>
                <td>{formatUsd(row.silverTotal)}</td>
                <td>{formatUsd(row.goldTotal)}</td>
                <td>{formatUsd(row.bronzePerNft)}</td>
                <td>{formatUsd(row.silverPerNft)}</td>
                <td>{formatUsd(row.goldPerNft)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3>Monatliche Burnings</h3>
        <table>
          <thead>
            <tr>
              <th>Monat</th>
              <th>UTT Amount</th>
              <th>UTT Links</th>
              <th>USHARK Amount</th>
              <th>USHARK Links</th>
            </tr>
          </thead>
          <tbody>
            {data.burningMonthly.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{formatToken(row.uttAmount)}</td>
                <td>
                  {row.txLinksUtt.length === 0
                    ? "-"
                    : (
                      <div className="link-button-group">
                        {row.txLinksUtt.map((link, index) => (
                          <a
                            key={link}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-button"
                          >
                            UTT Tx {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                </td>
                <td>{formatToken(row.usharkAmount)}</td>
                <td>
                  {row.txLinksUshark.length === 0
                    ? "-"
                    : (
                      <div className="link-button-group">
                        {row.txLinksUshark.map((link, index) => (
                          <a
                            key={link}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-button"
                          >
                            USHARK Tx {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
