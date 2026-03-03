import Link from "next/link";

export default function Home() {
  return (
    <main className="public-theme">
      <div className="container public-shell">
        <section className="public-card public-home-hero">
          <p className="public-chip">uTrade Finance</p>
          <h1>uTrade Finance Dashboard</h1>
          <p className="public-home-subtitle">
            Interne Finanzverwaltung mit Gewinnverteilung, NFT-Statistiken und Team-Workflow.
          </p>
          <div className="public-home-actions">
            <Link className="public-btn primary" href="/admin/login">
              Admin Login
            </Link>
            <Link className="public-btn ghost" href="/dashboard">
              Community Dashboard
            </Link>
          </div>
          <div className="public-home-meta">
            <span>Monatliche Pools</span>
            <span>Burning Reports</span>
            <span>NFT Tier Insights</span>
          </div>
        </section>
        <section className="public-card public-home-note">
          <h2>Community Bereich</h2>
          <p>
            Unter <strong>/dashboard</strong> werden nur freigegebene Monate angezeigt.
            Aktuelle Monate bleiben bis zum Abschluss verborgen.
          </p>
        </section>
      </div>
    </main>
  );
}
