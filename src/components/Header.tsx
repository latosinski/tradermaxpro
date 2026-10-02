"use client";

import { useState, useEffect, useRef } from "react";
import { List, X } from "@phosphor-icons/react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024 && menuOpen) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [menuOpen]);

  return (
    <header id="top">
      <div className="logo">TraderMaxPro</div>

      <button
        type="button"
        className="menu-toggle"
        onClick={toggleMenu}
        aria-label="Abrir menu"
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={28} /> : <List size={28} />}
      </button>

      <nav ref={navRef} className={menuOpen ? "active" : ""}>
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
            <a href="#conheca" onClick={closeMenu}>
              Conheça o sistema
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

      <a href="#preco" className="btn btn-primary header-cta" onClick={closeMenu}>
        Quero Comprar
      </a>
    </header>
  );
}