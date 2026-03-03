"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await response.json();
      if (!response.ok) {
        setIsError(true);
        setMessage(json.error ?? "Login fehlgeschlagen");
        return;
      }

      setIsError(false);
      setMessage("Login erfolgreich. Weiterleitung...");
      router.push("/admin/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel" onSubmit={onSubmit} style={{ maxWidth: 420, margin: "0 auto" }}>
      <h2>Admin Login</h2>
      <p style={{ marginBottom: 16 }}>
        Melde dich mit deinem internen Account an.
      </p>

      <div style={{ marginBottom: 10 }}>
        <label htmlFor="email">E-Mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor="password">Passwort</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Prüfe..." : "Einloggen"}
      </button>

      {message ? <div className={`alert ${isError ? "error" : ""}`}>{message}</div> : null}
    </form>
  );
}
