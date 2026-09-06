"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function RestritoContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadStarted, setDownloadStarted] = useState(false);
  const validatedRef = useRef(false);

  useEffect(() => {
    if (tokenFromUrl && !validatedRef.current) {
      validatedRef.current = true;
      validateToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const validateToken = async (value: string) => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/restrito/validar-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: value }),
      });

      const data = await res.json();

      if (data.ok) {
        setMessage(data.message);
        setDownloadUrl(data.downloadUrl);
        setDownloadStarted(true);
      } else {
        setMessage(data.message);
        setDownloadStarted(false);
      }
    } catch {
      setMessage("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token && !loading) {
      validateToken(token);
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
      <div
        style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "16px",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "24px", color: "#0b1a2b" }}>
          Área Restrita
        </h1>

        {!downloadStarted ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Digite seu token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
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
            {message && (
              <p style={{ color: "#e74c3c", marginBottom: "16px" }}>
                {message}
              </p>
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
              {loading ? "Validando..." : "Validar Token"}
            </button>
          </form>
        ) : (
          <div>
            <p
              style={{
                color: "#00c853",
                fontWeight: "600",
                marginBottom: "24px",
              }}
            >
              {message}
            </p>
            <a
              href={downloadUrl}
              download
              style={{
                display: "inline-block",
                padding: "14px 28px",
                backgroundColor: "#00e676",
                color: "#0b1a2b",
                borderRadius: "10px",
                fontWeight: "600",
                textDecoration: "none",
                fontSize: "1rem",
              }}
            >
              Baixar Sistema
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RestritoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <RestritoContent />
    </Suspense>
  );
}