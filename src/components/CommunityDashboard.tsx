import { buildCommunityDashboardData } from "@/lib/community-dashboard";
import { dashboardMessages, getNumberLocale, type PublicLang } from "@/lib/public-i18n";

function formatUsd(value: number, locale: string): string {
  return `$${value.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatToken(value: number, locale: string): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

type Props = {
  lang: PublicLang;
};

export async function CommunityDashboard({ lang }: Props) {
  let data: Awaited<ReturnType<typeof buildCommunityDashboardData>> | null = null;

  try {
    data = await buildCommunityDashboardData();
  } catch (error) {
    console.error("[community-dashboard] render failed", error);
    return <div className="alert error public-alert">{dashboardMessages[lang].errorLoad}</div>;
  }

  const t = dashboardMessages[lang];
  const locale = getNumberLocale(lang);

  if (!data.months.length) {
    return (
      <section className="public-card public-state-card">
        <h2>{t.emptyTitle}</h2>
        <p>{t.emptyText}</p>
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
        <p className="public-chip">{t.heroChip}</p>
        <h1>{t.heroTitle}</h1>
        <p>{t.heroText}</p>
      </section>

      <section className="public-kpi-grid">
        <article className="public-card public-kpi-card">
          <p className="public-kpi-label">{t.kpiTotalProfit}</p>
          <h3 className="public-kpi-value">{formatUsd(data.totals.profitAllMonths, locale)}</h3>
        </article>
        <article className="public-card public-kpi-card">
          <p className="public-kpi-label">{t.kpiNftPool}</p>
          <h3 className="public-kpi-value">{formatUsd(data.totals.nftPoolAllMonths, locale)}</h3>
        </article>
        <article className="public-card public-kpi-card">
          <p className="public-kpi-label">{t.kpiBronze}</p>
          <h3 className="public-kpi-value">{formatUsd(data.totals.profitBronzeAllMonths, locale)}</h3>
        </article>
        <article className="public-card public-kpi-card">
          <p className="public-kpi-label">{t.kpiSilver}</p>
          <h3 className="public-kpi-value">{formatUsd(data.totals.profitSilverAllMonths, locale)}</h3>
        </article>
        <article className="public-card public-kpi-card">
          <p className="public-kpi-label">{t.kpiGold}</p>
          <h3 className="public-kpi-value">{formatUsd(data.totals.profitGoldAllMonths, locale)}</h3>
        </article>
        <article className="public-card public-kpi-card">
          <p className="public-kpi-label">{t.kpiBurning}</p>
          <h3 className="public-kpi-value public-kpi-multi">
            <span>{t.tokenUtt}: {formatToken(data.totals.burningTotalUtt, locale)}</span>
            <span>{t.tokenUshark}: {formatToken(data.totals.burningTotalUshark, locale)}</span>
          </h3>
        </article>
      </section>

      <section className="public-card public-chart-card">
        <h3>{t.chartTitle}</h3>
        <p className="public-chart-subtitle">{t.chartText}</p>
        <div className="community-tier-legend">
          <span className="community-tier-pill bronze">{t.tierBronze}</span>
          <span className="community-tier-pill silver">{t.tierSilver}</span>
          <span className="community-tier-pill gold">{t.tierGold}</span>
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
              <div className="community-chart-value">{formatUsd(row.nftPoolTotal, locale)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="public-card public-table-card">
        <h3>{t.nftTableTitle}</h3>
        <div className="public-table-wrap">
          <table className="public-table">
            <thead>
              <tr>
                <th>{t.columnMonth}</th>
                <th>{t.columnNftPoolTotal}</th>
                <th>{t.columnBronze}</th>
                <th>{t.columnSilver}</th>
                <th>{t.columnGold}</th>
                <th>{t.columnBronzePerNft}</th>
                <th>{t.columnSilverPerNft}</th>
                <th>{t.columnGoldPerNft}</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyNftPool.map((row) => (
                <tr key={row.month}>
                  <td data-label={t.columnMonth}>{row.month}</td>
                  <td data-label={t.columnNftPoolTotal}>{formatUsd(row.nftPoolTotal, locale)}</td>
                  <td data-label={t.columnBronze}>{formatUsd(row.bronzeTotal, locale)}</td>
                  <td data-label={t.columnSilver}>{formatUsd(row.silverTotal, locale)}</td>
                  <td data-label={t.columnGold}>{formatUsd(row.goldTotal, locale)}</td>
                  <td data-label={t.columnBronzePerNft}>{formatUsd(row.bronzePerNft, locale)}</td>
                  <td data-label={t.columnSilverPerNft}>{formatUsd(row.silverPerNft, locale)}</td>
                  <td data-label={t.columnGoldPerNft}>{formatUsd(row.goldPerNft, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="public-mobile-accordion">
          {data.monthlyNftPool.map((row) => (
            <details key={row.month} className="public-mobile-item">
              <summary>
                <span>{row.month}</span>
                <strong>{formatUsd(row.nftPoolTotal, locale)}</strong>
              </summary>
              <div className="public-mobile-grid">
                <div><span>{t.columnBronze}</span><strong>{formatUsd(row.bronzeTotal, locale)}</strong></div>
                <div><span>{t.columnSilver}</span><strong>{formatUsd(row.silverTotal, locale)}</strong></div>
                <div><span>{t.columnGold}</span><strong>{formatUsd(row.goldTotal, locale)}</strong></div>
                <div><span>{t.columnBronzePerNft}</span><strong>{formatUsd(row.bronzePerNft, locale)}</strong></div>
                <div><span>{t.columnSilverPerNft}</span><strong>{formatUsd(row.silverPerNft, locale)}</strong></div>
                <div><span>{t.columnGoldPerNft}</span><strong>{formatUsd(row.goldPerNft, locale)}</strong></div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="public-card public-table-card">
        <h3>{t.burningTableTitle}</h3>
        <div className="public-table-wrap">
          <table className="public-table">
            <thead>
              <tr>
                <th>{t.columnMonth}</th>
                <th>{t.columnUttAmount}</th>
                <th>{t.columnUttLinks}</th>
                <th>{t.columnUsharkAmount}</th>
                <th>{t.columnUsharkLinks}</th>
              </tr>
            </thead>
            <tbody>
              {data.burningMonthly.map((row) => (
                <tr key={row.month}>
                  <td data-label={t.columnMonth}>{row.month}</td>
                  <td data-label={t.columnUttAmount}>{formatToken(row.uttAmount, locale)}</td>
                  <td data-label={t.columnUttLinks}>
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
                              {t.open}
                            </a>
                          ))}
                        </div>
                      )}
                  </td>
                  <td data-label={t.columnUsharkAmount}>{formatToken(row.usharkAmount, locale)}</td>
                  <td data-label={t.columnUsharkLinks}>
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
                              {t.open}
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
        <div className="public-mobile-accordion">
          {data.burningMonthly.map((row) => (
            <details key={row.month} className="public-mobile-item">
              <summary>
                <span>{row.month}</span>
                <strong>{t.tokenUtt} {formatToken(row.uttAmount, locale)} | {t.tokenUshark} {formatToken(row.usharkAmount, locale)}</strong>
              </summary>
              <div className="public-mobile-grid">
                <div><span>{t.columnUttAmount}</span><strong>{formatToken(row.uttAmount, locale)}</strong></div>
                <div>
                  <span>{t.columnUttLinks}</span>
                  {row.txLinksUtt.length === 0
                    ? <strong>-</strong>
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
                            {t.open}
                          </a>
                        ))}
                      </div>
                    )}
                </div>
                <div><span>{t.columnUsharkAmount}</span><strong>{formatToken(row.usharkAmount, locale)}</strong></div>
                <div>
                  <span>{t.columnUsharkLinks}</span>
                  {row.txLinksUshark.length === 0
                    ? <strong>-</strong>
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
                            {t.open}
                          </a>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
