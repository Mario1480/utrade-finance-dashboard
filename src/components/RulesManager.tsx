"use client";

import { FormEvent, useEffect, useState } from "react";

export function RulesManager({ isSuperadmin }: { isSuperadmin: boolean }) {
  const [allocationRows, setAllocationRows] = useState<Array<Record<string, unknown>>>([]);
  const [tierRows, setTierRows] = useState<Array<Record<string, unknown>>>([]);
  const [splitRows, setSplitRows] = useState<Array<Record<string, unknown>>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [allocation, setAllocation] = useState({
    validFrom: new Date().toISOString().slice(0, 7),
    nftPoolPct: "0.50",
    buybackUttPct: "0.05",
    buybackUsharkPct: "0.05",
    teamPct: "0.20",
    treasuryPct: "0.20",
  });

  const [tiers, setTiers] = useState({
    validFrom: new Date().toISOString().slice(0, 7),
    bronzeMultiplier: "1",
    silverMultiplier: "2",
    goldMultiplier: "4",
  });

  const [split, setSplit] = useState({
    validFrom: new Date().toISOString().slice(0, 7),
    tradingPct: "0.75",
    infrastructurePct: "0.15",
    operationsPct: "0.10",
  });

  async function load() {
    const [aRes, tRes, sRes] = await Promise.all([
      fetch("/api/rules/allocation"),
      fetch("/api/rules/nft-tier"),
      fetch("/api/rules/sale-split"),
    ]);

    const [aJson, tJson, sJson] = await Promise.all([aRes.json(), tRes.json(), sRes.json()]);

    if (!aRes.ok) {
      throw new Error(aJson.error ?? "Allocation laden fehlgeschlagen");
    }
    if (!tRes.ok) {
      throw new Error(tJson.error ?? "Tier laden fehlgeschlagen");
    }
    if (!sRes.ok) {
      throw new Error(sJson.error ?? "Sale-Split laden fehlgeschlagen");
    }

    setAllocationRows(aJson.data);
    setTierRows(tJson.data);
    setSplitRows(sJson.data);
  }

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);

  async function submitAllocation(event: FormEvent) {
    event.preventDefault();

    const res = await fetch("/api/rules/allocation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        validFrom: allocation.validFrom,
        nftPoolPct: Number(allocation.nftPoolPct),
        buybackUttPct: Number(allocation.buybackUttPct),
        buybackUsharkPct: Number(allocation.buybackUsharkPct),
        teamPct: Number(allocation.teamPct),
        treasuryPct: Number(allocation.treasuryPct),
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Speichern fehlgeschlagen");
      return;
    }

    setMessage("Allocation Rule gespeichert");
    await load();
  }

  async function submitTiers(event: FormEvent) {
    event.preventDefault();

    const res = await fetch("/api/rules/nft-tier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        validFrom: tiers.validFrom,
        bronzeMultiplier: Number(tiers.bronzeMultiplier),
        silverMultiplier: Number(tiers.silverMultiplier),
        goldMultiplier: Number(tiers.goldMultiplier),
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Speichern fehlgeschlagen");
      return;
    }

    setMessage("NFT-Tier Rule gespeichert");
    await load();
  }

  async function submitSplit(event: FormEvent) {
    event.preventDefault();

    const res = await fetch("/api/rules/sale-split", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        validFrom: split.validFrom,
        tradingPct: Number(split.tradingPct),
        infrastructurePct: Number(split.infrastructurePct),
        operationsPct: Number(split.operationsPct),
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Speichern fehlgeschlagen");
      return;
    }

    setMessage("Sale-Split Rule gespeichert");
    await load();
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      {isSuperadmin ? (
        <>
          <form className="panel" onSubmit={submitAllocation}>
            <h2>Allocation Rule</h2>
            <div className="form-grid">
              <div>
                <label>Gültig ab</label>
                <input type="month" value={allocation.validFrom} onChange={(event) => setAllocation({ ...allocation, validFrom: event.target.value })} />
              </div>
              <div>
                <label>NFT Pool</label>
                <input value={allocation.nftPoolPct} onChange={(event) => setAllocation({ ...allocation, nftPoolPct: event.target.value })} />
              </div>
              <div>
                <label>Buyback UTT</label>
                <input value={allocation.buybackUttPct} onChange={(event) => setAllocation({ ...allocation, buybackUttPct: event.target.value })} />
              </div>
              <div>
                <label>Buyback USHARK</label>
                <input value={allocation.buybackUsharkPct} onChange={(event) => setAllocation({ ...allocation, buybackUsharkPct: event.target.value })} />
              </div>
              <div>
                <label>Team</label>
                <input value={allocation.teamPct} onChange={(event) => setAllocation({ ...allocation, teamPct: event.target.value })} />
              </div>
              <div>
                <label>Treasury</label>
                <input value={allocation.treasuryPct} onChange={(event) => setAllocation({ ...allocation, treasuryPct: event.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <button type="submit">Speichern</button>
            </div>
          </form>

          <form className="panel" onSubmit={submitTiers}>
            <h2>NFT Multipliers</h2>
            <div className="form-grid">
              <div>
                <label>Gültig ab</label>
                <input type="month" value={tiers.validFrom} onChange={(event) => setTiers({ ...tiers, validFrom: event.target.value })} />
              </div>
              <div>
                <label>Bronze</label>
                <input value={tiers.bronzeMultiplier} onChange={(event) => setTiers({ ...tiers, bronzeMultiplier: event.target.value })} />
              </div>
              <div>
                <label>Silber</label>
                <input value={tiers.silverMultiplier} onChange={(event) => setTiers({ ...tiers, silverMultiplier: event.target.value })} />
              </div>
              <div>
                <label>Gold</label>
                <input value={tiers.goldMultiplier} onChange={(event) => setTiers({ ...tiers, goldMultiplier: event.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <button type="submit">Speichern</button>
            </div>
          </form>

          <form className="panel" onSubmit={submitSplit}>
            <h2>NFT Sale Split Rule</h2>
            <div className="form-grid">
              <div>
                <label>Gültig ab</label>
                <input type="month" value={split.validFrom} onChange={(event) => setSplit({ ...split, validFrom: event.target.value })} />
              </div>
              <div>
                <label>Trading</label>
                <input value={split.tradingPct} onChange={(event) => setSplit({ ...split, tradingPct: event.target.value })} />
              </div>
              <div>
                <label>Infrastructure</label>
                <input value={split.infrastructurePct} onChange={(event) => setSplit({ ...split, infrastructurePct: event.target.value })} />
              </div>
              <div>
                <label>Operations</label>
                <input value={split.operationsPct} onChange={(event) => setSplit({ ...split, operationsPct: event.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <button type="submit">Speichern</button>
            </div>
          </form>
        </>
      ) : null}

      {message ? <div className="alert">{message}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      <div className="panel">
        <h3>Allocation Rules</h3>
        <pre style={{ overflowX: "auto" }}>{JSON.stringify(allocationRows, null, 2)}</pre>
      </div>
      <div className="panel">
        <h3>NFT-Tier Rules</h3>
        <pre style={{ overflowX: "auto" }}>{JSON.stringify(tierRows, null, 2)}</pre>
      </div>
      <div className="panel">
        <h3>Sale-Split Rules</h3>
        <pre style={{ overflowX: "auto" }}>{JSON.stringify(splitRows, null, 2)}</pre>
      </div>
    </div>
  );
}
