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
              disabled
              aria-describedby="newsletter-unavailable"
            />
            <button type="button" disabled aria-describedby="newsletter-unavailable">
              Enviar
            </button>
          </div>
          <p id="newsletter-unavailable">
            Inscrição indisponível nesta demonstração; newsletters não fazem parte do desafio.
          </p>
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
          <span aria-disabled="true">Minha coleção</span>
          <span aria-disabled="true">Atividade · fora do escopo</span>
          <span aria-disabled="true">Estúdio de criador · fora do escopo</span>
        </section>
        <section>
          <strong>Central de ajuda</strong>
          <span aria-disabled="true">Central de ajuda · fora do escopo</span>
          <span aria-disabled="true">Como comprar NFTs · fora do escopo</span>
          <a href="/account/wallets">Carteiras e segurança</a>
          <span aria-disabled="true">Política de mercado · fora do escopo</span>
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
            <span aria-hidden="true">◎</span>
            <span aria-hidden="true">f</span>
            <span aria-hidden="true">in</span>
            <span aria-hidden="true">▶</span>
          </div>
          <strong>Carteiras compatíveis</strong>
          <small>METAMASK · WALLETCONNECT · COINBASE</small>
        </section>
      </div>
      <small className="footer-copyright">© 2026 Kurio · Propriedade digital para todos.</small>
    </footer>
  );
}
