export const initAOS = async () => {
  const AOS = (await import("aos")).default;
  AOS.init({ duration: 800, once: true, offset: 100 });
};

export const initContactForm = () => {
  const form = document.getElementById("contactForm") as HTMLFormElement | null;

  if (form) {
    form.addEventListener("submit", async (e: Event) => {
      e.preventDefault();

      const dados = new FormData(form);
      const botao = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;

      if (botao) {
        botao.disabled = true;
        botao.textContent = "Enviando...";

        try {
          const resposta = await fetch("/api/enviar", {
            method: "POST",
            body: dados,
          });

          const json = await resposta.json();
          const container = form.parentElement;

          if (container) {
            container.innerHTML = `
              <div style="text-align:center; padding:20px;">
                <i class="ph ph-${json.ok ? "check-circle" : "warning-circle"}" style="font-size:3rem; color:${json.ok ? "var(--verde)" : "#e74c3c"};"></i>
                <p style="margin-top:16px; font-weight:600;">${json.mensagem}</p>
                ${json.ok ? '<p style="margin-top:8px; color:#64748b;">Responderemos em breve.</p>' : ""}
              </div>
            `;
          }
        } catch {
          alert("Erro de conexão. Tente novamente.");
        } finally {
          if (botao) {
            botao.disabled = false;
            botao.textContent = "Enviar";
          }
        }
      }
    });
  }
};

export const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (this: HTMLAnchorElement, e: Event) {
      e.preventDefault();
      const href = this.getAttribute("href");

      if (href === "#top" || href === "#") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (href) {
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });
};