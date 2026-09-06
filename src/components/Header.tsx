"use client";

import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header id="top">
      <div className="logo">TraderMaxPro</div>

      <button
        type="button"
        className={`menu-toggle ${menuOpen ? "active" : ""}`}
        onClick={toggleMenu}
        aria-label="Abrir menu"
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav className={menuOpen ? "open" : ""}>
        <ul>
          <li>
            <a href="#top" onClick={closeMenu}>
              Início
            </a>
          </li>
          <li>
            <a href="#recursos" onClick={closeMenu}>
              Recursos
            </a>
          </li>
          <li>
            <a href="#preco" onClick={closeMenu}>
              Preço
            </a>
          </li>
          <li>
            <a href="#depoimentos" onClick={closeMenu}>
              Depoimentos
            </a>
          </li>
          <li>
            <a href="#contato" onClick={closeMenu}>
              Contato
            </a>
          </li>
          <li>
            <a
              href="/documentacao/tradermaxpro.pdf"
              target="_blank"
              onClick={closeMenu}
            >
              Documentação
            </a>
          </li>
          <li>
            <a href="/restrito" onClick={closeMenu}>
              Área Restrita
            </a>
          </li>
        </ul>
      </nav>

      <a href="#preco" className="btn btn-primary" onClick={closeMenu}>
        Quero Comprar
      </a>
    </header>
  );
}