"use client";

import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [clientName, setClientName] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [generatedToken, setGeneratedToken] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.ok) {
        setAuthenticated(true);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setGeneratedToken("");
    setGeneratedLink("");
    setCopyMessage("");

    try {
      const res = await fetch("/api/admin/gerar-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, minutes }),
      });

      const data = await res.json();

      if (data.ok) {
        setGeneratedToken(data.token);
        setGeneratedLink(
          `${window.location.origin}/restrito?token=${data.token}`
        );
      } else {
        setError(data.message);
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopyMessage("Link copiado!");
      setTimeout(() => setCopyMessage(""), 3000);
    } catch {
      setCopyMessage("Não foi possível copiar.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backgroundColor: "#0b1a2b",
      }}
    >
      {!authenticated ? (
        <div
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "16px",
            maxWidth: "400px",
            width: "100%",
            boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
          }}
        >
          <h1 style={{ marginBottom: "24px", color: "#0b1a2b" }}>
            Área Admin
          </h1>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "16px" }}>
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            </div>
            {error && (
              <p style={{ color: "#e74c3c", marginBottom: "16px" }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#00e676",
                color: "#0b1a2b",
                border: "none",
                borderRadius: "10px",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "1rem",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "16px",
            maxWidth: "500px",
            width: "100%",
            boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
          }}
        >
          <h1 style={{ marginBottom: "24px", color: "#0b1a2b" }}>
            Gerar Token de Download
          </h1>
          <form onSubmit={handleGenerate}>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#0b1a2b",
                }}
              >
                Nome do Cliente
              </label>
              <input
                type="text"
                placeholder="Ex.: João Silva"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#0b1a2b",
                }}
              >
                Validade do Token
              </label>
              <select
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <option value={30}>30 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={120}>120 minutos</option>
              </select>
            </div>
            {error && (
              <p style={{ color: "#e74c3c", marginBottom: "16px" }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#00e676",
                color: "#0b1a2b",
                border: "none",
                borderRadius: "10px",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "1rem",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {loading ? "Gerando..." : "Gerar Token"}
            </button>
          </form>

          {generatedToken && (
            <div style={{ marginTop: "24px" }}>
              <p
                style={{
                  fontWeight: "600",
                  color: "#0b1a2b",
                  marginBottom: "8px",
                }}
              >
                Token Gerado:
              </p>
              <div
                style={{
                  backgroundColor: "#f1f5f9",
                  padding: "12px",
                  borderRadius: "8px",
                  wordBreak: "break-all",
                  marginBottom: "16px",
                  fontFamily: "monospace",
                }}
              >
                {generatedToken}
              </div>
              <p
                style={{
                  fontWeight: "600",
                  color: "#0b1a2b",
                  marginBottom: "8px",
                }}
              >
                Link para o Cliente:
              </p>
              <div
                style={{
                  backgroundColor: "#f1f5f9",
                  padding: "12px",
                  borderRadius: "8px",
                  wordBreak: "break-all",
                  marginBottom: "16px",
                  fontFamily: "monospace",
                }}
              >
                {generatedLink}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Copiar Link
              </button>
              {copyMessage && (
                <p style={{ color: "#00e676", marginTop: "8px" }}>
                  {copyMessage}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}