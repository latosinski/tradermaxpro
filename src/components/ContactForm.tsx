"use client";

import { useState } from "react";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";

export default function ContactForm() {
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<{
    ok: boolean;
    mensagem: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    setSending(true);
    setResponse(null);

    try {
      const res = await fetch("/api/enviar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.ok) {
        setResponse({ ok: true, mensagem: data.mensagem });
        form.reset();
      } else {
        setResponse({ ok: false, mensagem: data.mensagem });
      }
    } catch {
      setResponse({
        ok: false,
        mensagem: "Erro de conexão. Tente novamente.",
      });
    } finally {
      setSending(false);
    }
  };

  if (response) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        {response.ok ? (
          <CheckCircle size={48} color="#00e676" weight="fill" />
        ) : (
          <WarningCircle size={48} color="#e74c3c" weight="fill" />
        )}
        <p style={{ marginTop: "16px", fontWeight: "600" }}>
          {response.mensagem}
        </p>
        {response.ok && (
          <p style={{ marginTop: "8px", color: "#64748b" }}>
            Responderemos em breve.
          </p>
        )}
      </div>
    );
  }

  return (
    <form id="contactForm" onSubmit={handleSubmit}>
      <div style={{ display: "none" }} aria-hidden="true">
        <input type="text" name="url" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-group">
        <input type="text" name="nome" placeholder="Seu nome" required />
      </div>
      <div className="form-group">
        <input type="email" name="email" placeholder="E-mail" required />
      </div>
      <div className="form-group">
        <input type="tel" name="whatsapp" placeholder="WhatsApp" />
      </div>
      <div className="form-group">
        <textarea name="mensagem" placeholder="Sua mensagem"></textarea>
      </div>
      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center" }}
        disabled={sending}
      >
        {sending ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}