import Link from "next/link";

export default function Home() {
  return (
    <main className="container">
      <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
        <h1>uTrade Finance Dashboard</h1>
        <p style={{ marginBottom: 16 }}>
          Interne Finanzverwaltung mit Gewinnverteilung, NFT-Statistiken und Team-Workflow.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Link href="/admin/login">
            <button>Anmelden</button>
          </Link>
          <Link href="/dashboard">
            <button className="secondary">Community Dashboard</button>
          </Link>
        </div>
      </div>
    </main>
  );
}
