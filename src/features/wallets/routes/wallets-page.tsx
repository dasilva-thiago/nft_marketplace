import { Link } from '@tanstack/react-router';

const menu = [
  'Dados do perfil',
  'Carteiras',
  'Atividade',
  'Lista de interesse',
  'Ofertas',
  'Arquivos baixados',
  'Suporte',
];
export function WalletsPage() {
  return (
    <section className="account-page visual-page-shell">
      <aside className="account-sidebar">
        <h2>Meu perfil</h2>
        {menu.map((item, index) => (
          <Link
            key={item}
            className={index === 1 ? 'is-active' : ''}
            to={index === 1 ? '/account/wallets' : '/account/profile'}
          >
            {item}
          </Link>
        ))}
        <button type="button">Sair</button>
      </aside>
      <form className="account-form wallet-form">
        <div className="account-heading">
          <div>
            <h1>Carteira principal</h1>
            <p>Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
          </div>
          <button type="button" className="text-button">
            Adicionar
          </button>
        </div>
        <div className="form-grid">
          <label>
            Nome de exibição*
            <input defaultValue="Thiago Pavan" />
          </label>
          <label>
            Apelido da carteira*
            <input placeholder="Minha principal" />
          </label>
          <label>
            Rede*
            <select defaultValue="">
              <option value="">Selecione uma rede</option>
              <option>Ethereum</option>
              <option>Polygon</option>
            </select>
          </label>
          <label>
            Nome do perfil*
            <input placeholder="Meu perfil" />
          </label>
          <label>
            Endereço da carteira*
            <input placeholder="Endereço 0x da carteira" />
          </label>
          <label>
            ENS ou carteira secundária (opcional)
            <input placeholder="ENS ou carteira" />
          </label>
          <label>
            Tipo de carteira*
            <select defaultValue="">
              <option value="">Selecione uma carteira</option>
              <option>MetaMask</option>
            </select>
          </label>
          <label>
            Código de indicação*
            <input placeholder="Código" />
          </label>
          <label>
            E-mail*
            <input type="email" defaultValue="contato@email.com" />
          </label>
          <label>
            Nome ENS*
            <select defaultValue=".eth">
              <option>.eth</option>
            </select>
          </label>
        </div>
        <button className="primary-button" type="submit">
          Salvar carteira
        </button>
        <div className="secondary-wallet">
          <strong>Carteira secundária</strong>
          <span>Você ainda não adicionou uma carteira secundária.</span>
          <button type="button" className="text-button">
            Adicionar
          </button>
        </div>
      </form>
    </section>
  );
}
