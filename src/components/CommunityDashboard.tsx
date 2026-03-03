import { buildCommunityDashboardData } from "@/lib/community-dashboard";

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

export async function CommunityDashboard() {
  let data: Awaited<ReturnType<typeof buildCommunityDashboardData>> | null = null;

  try {
    data = await buildCommunityDashboardData();
  } catch (error) {
    console.error("[community-dashboard] render failed", error);
    return <div className="alert error public-alert">Community-Daten konnten nicht geladen werden.</div>;
  }

  if (!data.months.length) {
    return (
      <section className="public-card public-state-card">
        <h2>Community Dashboard</h2>
        <p>Aktuell sind keine geschlossenen Monate für die Community freigegeben.</p>
      </section>
    );
  }

  const maxNftPool = Math.max(...data.monthlyNftPool.map((row) => row.nftPoolTotal), 1);
  const maxTierValue = Math.max(
    ...data.monthlyNftPool.flatMap((row) => [
      row.bronzeTotal,
      row.silverTotal,
      row.goldTotal,
    ]),
    1,
  );

  return (
    <div className="public-stack">
      <section className="public-card public-hero">
        <p className="public-chip">Community Freigabe</p>
        <h1>uTrade Community Dashboard</h1>
        <p>
          Veröffentlicht werden nur geschlossene Monate mit freigegebenen Werten.
        </p>
      </section>

      <section className="public-kpi-grid">
        <article className="public-card public-kpi-card">
          <p className="public-kpi-label">Gesamt Profit (alle veröffentlichten Monate)</p>
          <h3 className="public-kpi-value">{formatUsd(data.totals.profitAllMonths)}</h3>
        </article>
        <article className="public-card public-kpi-card">
          <p className="public-kpi-label">NFT Pool Gesamt</p>
          <h3 className="public-kpi-value">{formatUsd(data.totals.nftPoolAllMonths)}</h3>
        </article>
        <article className="public-card public-kpi-card">
          <p className="public-kpi-label">Profit Bronze Gesamt</p>
          <h3 className="public-kpi-value">{formatUsd(data.totals.profitBronzeAllMonths)}</h3>
        </article>
        <article className="public-card public-kpi-card">
          <p className="public-kpi-label">Profit Silber Gesamt</p>
          <h3 className="public-kpi-value">{formatUsd(data.totals.profitSilverAllMonths)}</h3>
        </article>
        <article className="public-card public-kpi-card">
          <p className="public-kpi-label">Profit Gold Gesamt</p>
          <h3 className="public-kpi-value">{formatUsd(data.totals.profitGoldAllMonths)}</h3>
        </article>
        <article className="public-card public-kpi-card">
          <p className="public-kpi-label">Gesamt Burning</p>
          <h3 className="public-kpi-value public-kpi-multi">
            <span>UTT: {formatToken(data.totals.burningTotalUtt)}</span>
            <span>USHARK: {formatToken(data.totals.burningTotalUshark)}</span>
          </h3>
        </article>
      </section>

      <section className="public-card public-chart-card">
        <h3>Monatlicher NFT Pool (Chart)</h3>
        <p className="public-chart-subtitle">
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
      </section>

      <section className="public-card public-table-card">
        <h3>Monatliche NFT-Pool-Aufteilung nach Tier</h3>
        <div className="public-table-wrap">
          <table className="public-table">
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
      </section>

      <section className="public-card public-table-card">
        <h3>Monatliche Burnings</h3>
        <div className="public-table-wrap">
          <table className="public-table">
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
                      ? <span className="public-muted-cell">-</span>
                      : (
                        <div className="link-button-group">
                          {row.txLinksUtt.map((link) => (
                            <a
                              key={link}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-button public-link-button"
                            >
                              Open
                            </a>
                          ))}
                        </div>
                      )}
                  </td>
                  <td>{formatToken(row.usharkAmount)}</td>
                  <td>
                    {row.txLinksUshark.length === 0
                      ? <span className="public-muted-cell">-</span>
                      : (
                        <div className="link-button-group">
                          {row.txLinksUshark.map((link) => (
                            <a
                              key={link}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-button public-link-button"
                            >
                              Open
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
      </section>
    </div>
  );
}
