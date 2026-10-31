export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="footer-benefits">
        <article>
          <span>W</span>
          <div>
            <strong>Segurança da carteira</strong>
            <p>Proteja sua carteira e arte digital verificada com confiança.</p>
          </div>
        </article>
        <article>
          <span>C</span>
          <div>
            <strong>Criadores em destaque</strong>
            <p>Conheça artistas, estúdios e comunidades que moldam a cultura digital.</p>
          </div>
        </article>
        <article>
          <span>D</span>
          <div>
            <strong>Alertas de lançamentos</strong>
            <p>Receba novidades de cunhagem, novidades de listas e acesso antecipado.</p>
          </div>
        </article>
        <form className="footer-newsletter">
          <strong>Antecipe-se ao próximo lançamento</strong>
          <div>
            <input
              aria-label="Seu e-mail para novidades"
              placeholder="Digite seu e-mail..."
              type="email"
            />
            <button type="button">Enviar</button>
          </div>
          <p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
        </form>
      </div>
      <div className="footer-bar">
        <strong>KURIO</strong>
        <span>Feito para colecionadores, criadores e cultura</span>
        <span>contato@email.com</span>
        <span>+55 11 4002 8922</span>
      </div>
      <div className="footer-links">
        <section>
          <strong>Meu perfil</strong>
          <a href="/account/profile">Meu perfil</a>
          <a href="/account/profile">Minha coleção</a>
          <a href="/account/profile">Atividade</a>
          <a href="/account/profile">Estúdio de criador</a>
        </section>
        <section>
          <strong>Central de ajuda</strong>
          <a href="#ajuda">Central de ajuda</a>
          <a href="#ajuda">Como comprar NFTs</a>
          <a href="/account/wallets">Carteiras e segurança</a>
          <a href="#ajuda">Política de mercado</a>
        </section>
        <section>
          <strong>Coleções</strong>
          <a href="/#catalogo">Arte digital</a>
          <a href="/#catalogo">Fotografia</a>
          <a href="/#catalogo">Música</a>
          <a href="/#catalogo">Arte 3D</a>
        </section>
        <section>
          <strong>Redes sociais</strong>
          <div className="footer-socials">
            <a href="#social" aria-label="Instagram">
              ◎
            </a>
            <a href="#social" aria-label="Facebook">
              f
            </a>
            <a href="#social" aria-label="LinkedIn">
              in
            </a>
            <a href="#social" aria-label="YouTube">
              ▶
            </a>
          </div>
          <strong>Carteiras compatíveis</strong>
          <small>METAMASK · WALLETCONNECT · COINBASE</small>
        </section>
      </div>
      <small className="footer-copyright">© 2026 Kurio · Propriedade digital para todos.</small>
    </footer>
  );
}
