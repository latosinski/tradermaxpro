import Header from "@/components/Header";
import ContactForm from "@/components/ContactForm";
import {
  Calculator,
  ChartLineUp,
  Notepad,
  Export,
  Gauge,
  Target,
  Wallet,
  CheckCircle,
  WhatsappLogo,
  DownloadSimple,
} from "@/components/Icons";

export default function Home() {
  return (
    <>
      <Header />

      <section className="hero">
        <div className="hero-text" data-aos="fade-right">
          <h1>Software Profissional para<span> Gerenciamento Financeiro</span> e Performance de Operações</h1>
          <p>Software completo com cálculos automáticos de IRRF/DARF, com compensação de imposto, curva de capital e métricas de performance. Licença vitalícia, instalação rápida.</p>
          <div className="hero-buttons">
            <a href="#preco" className="btn btn-primary">Comprar Agora</a>
            <a href="/sistema/tradermaxpro.html" className="btn btn-outline" target="_blank">
              <DownloadSimple size={20} /> Testar Grátis
            </a>
          </div>
        </div>
        <div className="hero-image" data-aos="fade-left" data-aos-delay="200">
          <img src="/img/tela.jpg" alt="Tela do TraderMaxPro" />
        </div>
      </section>

      <div className="wave-divider"></div>

      <section id="recursos" className="features">
        <h2 className="section-title" data-aos="fade-up">Tudo que você precisa em um único software</h2>
        <p className="section-subtitle" data-aos="fade-up">Ferramentas que realmente fazem diferença nos resultados.</p>
        <div className="features-grid">
          <div className="feature-card" data-aos="zoom-in">
            <Calculator size={44} color="#00e676" weight="regular" className="feature-icon" />
            <h3>Cálculos Tributários</h3>
            <p>IRRF e DARF automáticos com compensação de perdas.</p>
          </div>
          <div className="feature-card" data-aos="zoom-in" data-aos-delay="100">
            <ChartLineUp size={44} color="#00e676" weight="regular" className="feature-icon" />
            <h3>Curva de Capital</h3>
            <p>Acompanhe a evolução do seu patrimônio em tempo real.</p>
          </div>
          <div className="feature-card" data-aos="zoom-in" data-aos-delay="200">
            <Notepad size={44} color="#00e676" weight="regular" className="feature-icon" />
            <h3>Gestão de Operações</h3>
            <p>Cadastre, edite e analise cada operação com detalhes.</p>
          </div>
          <div className="feature-card" data-aos="zoom-in" data-aos-delay="300">
            <Export size={44} color="#00e676" weight="regular" className="feature-icon" />
            <h3>Exportação de Dados</h3>
            <p>Relatórios em Excel CSV ou PDF.</p>
          </div>
        </div>
      </section>

      <section className="overview">
        <h2 className="section-title" data-aos="fade-up">Visão geral do sistema</h2>
        <p className="section-subtitle" data-aos="fade-up">Indicadores e métricas que realmente importam.</p>
        <div className="cards-container">
          <div className="overview-card" data-aos="fade-up">
            <Gauge size={32} color="#00e676" weight="regular" />
            <h3>Dashboard Financeiro</h3>
            <p>Indicadores, saldo e rentabilidade separados mês à mês.</p>
          </div>
          <div className="overview-card" data-aos="fade-up" data-aos-delay="150">
            <Target size={32} color="#00e676" weight="regular" />
            <h3>Centro de Performance</h3>
            <p>Taxa de acerto, payoff, drawdown e muito mais.</p>
          </div>
          <div className="overview-card" data-aos="fade-up" data-aos-delay="300">
            <Wallet size={32} color="#00e676" weight="regular" />
            <h3>Controle de Capital</h3>
            <p>Aportes, saques e projeção de crescimento patrimonial.</p>
          </div>
        </div>
      </section>

      <section id="preco" className="demo-price">
        <h2 className="section-title" data-aos="fade-up">Veja o sistema e garanta o seu</h2>
        <p className="section-subtitle" data-aos="fade-up">Imagem real do software. Licença vitalícia com atualizações gratuitas.</p>
        <div className="demo-container">
          <div className="demo-screenshot" data-aos="fade-right">
            <img src="/img/performance.jpg" alt="Tela do TraderMaxPro" />
          </div>
          <div className="price-box" data-aos="fade-left">
            <p className="price-old">De R$ 897,90</p>
            <div className="price-tag">R$ 129,90</div>
            <p style={{ marginBottom: "16px" }}>Pagamento via PIX</p>
            <ul>
              <li><CheckCircle size={20} color="#00e676" weight="fill" /> Licença vitalícia</li>
              <li><CheckCircle size={20} color="#00e676" weight="fill" /> Atualizações gratuitas</li>
              <li><CheckCircle size={20} color="#00e676" weight="fill" /> Suporte via WhatsApp</li>
              <li><CheckCircle size={20} color="#00e676" weight="fill" /> Instalação em 1 PC</li>
            </ul>
            <a
              href="https://wa.me/5551982127790?text=Olá! Tenho interesse no TraderMaxPro, quero comprar."
              target="_blank"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <WhatsappLogo size={20} weight="fill" /> Comprar pelo WhatsApp
            </a>
            <a href="/sistema/tradermaxpro.html" className="demo-link" target="_blank">
              ou teste antes de comprar (versão demo)
            </a>
          </div>
        </div>
        <p className="price-note" data-aos="fade-up" data-aos-delay="200">
          *Este sistema destina-se ao controle de operações de DAY TRADE. Devido aos cálculos tributários específicos, não é possível utilizá-lo para SWING TRADE e POSITION TRADE (em qualquer ativo). Requer um computador com Windows.
        </p>
      </section>

      <section id="depoimentos" className="testimonials">
        <h2 className="section-title" data-aos="fade-up">Quem usa, aprova</h2>
        <p className="section-subtitle" data-aos="fade-up">Veja o que nossos clientes estão dizendo.</p>
        <div className="testimonials-grid">
          <div className="testimonial-card" data-aos="flip-left">
            <img src="https://i.pravatar.cc/150?img=11" alt="João" className="testimonial-avatar" />
            <p className="testimonial-text">"Economizei horas com os cálculos fiscais. Finalmente não erro mais DARF."</p>
            <p className="testimonial-name">João M.</p>
            <p className="testimonial-role">Day Trader há 3 anos</p>
          </div>
          <div className="testimonial-card" data-aos="flip-left" data-aos-delay="150">
            <img src="https://i.pravatar.cc/150?img=28" alt="Fernanda" className="testimonial-avatar" />
            <p className="testimonial-text">"Visual limpo e rápido, perfeito para o dia a dia do pregão."</p>
            <p className="testimonial-name">Fernanda S.</p>
            <p className="testimonial-role">Day trader de índice</p>
          </div>
          <div className="testimonial-card" data-aos="flip-left" data-aos-delay="300">
            <img src="https://i.pravatar.cc/150?img=53" alt="Ricardo" className="testimonial-avatar" />
            <p className="testimonial-text">"Métricas detalhadas melhoraram minha consistência."</p>
            <p className="testimonial-name">Ricardo L.</p>
            <p className="testimonial-role">Day Trader de dólar</p>
          </div>
        </div>
      </section>

      <section id="contato" className="contact">
        <h2 className="section-title" data-aos="fade-up">Fale com a gente</h2>
        <p className="section-subtitle" data-aos="fade-up">Dúvidas sobre o software? Envie uma mensagem.</p>
        <div className="contact-form" data-aos="fade-up" data-aos-delay="100">
          <ContactForm />
        </div>
      </section>

      <section className="cta-final">
        <h2 data-aos="fade-up">Leve o controle total para sua mesa de operação</h2>
        <p data-aos="fade-up">Adquira agora e transforme sua gestão de trades.</p>
        <a href="#preco" className="btn btn-primary" data-aos="zoom-in">Ver Preço e Comprar</a>
      </section>

      <footer>
        <p>© 2026 TraderMaxPro | <a href="/documentacao/tradermaxpro.pdf" target="_blank">Documentação</a></p>
      </footer>

      <a
        href="https://wa.me/5551982127790?text=Olá! Quero saber mais sobre o TraderMaxPro."
        target="_blank"
        className="whatsapp-float"
        aria-label="Comprar via WhatsApp"
      >
        <WhatsappLogo size={28} weight="fill" color="#ffffff" />
      </a>
    </>
  );
}