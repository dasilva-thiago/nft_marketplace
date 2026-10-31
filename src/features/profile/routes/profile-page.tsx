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
export function ProfilePage() {
  return (
    <section className="account-page visual-page-shell">
      <aside className="account-sidebar">
        <h2>Meu perfil</h2>
        {menu.map((item, index) => (
          <Link
            key={item}
            className={index === 0 ? 'is-active' : ''}
            to={index === 1 ? '/account/wallets' : '/account/profile'}
          >
            {item}
          </Link>
        ))}
        <button type="button">Sair</button>
      </aside>
      <form className="account-form">
        <h1>Perfil do colecionador</h1>
        <div className="form-grid">
          <label>
            Nome de exibição*
            <input defaultValue="Thiago Pavan" />
          </label>
          <label>
            Nome de usuário*
            <input defaultValue="thiago" />
          </label>
          <label>
            E-mail*
            <input defaultValue="contato@email.com" type="email" />
          </label>
          <label>
            Nome ENS*
            <select defaultValue=".eth">
              <option>.eth</option>
            </select>
          </label>
          <label>
            Apelido da carteira*
            <input placeholder="Minha carteira" />
          </label>
          <label>
            Avatar
            <div className="avatar-control">
              <span>TP</span>
              <button type="button">Alterar</button>
              <button type="button" className="text-button">
                Remover
              </button>
            </div>
          </label>
        </div>
        <fieldset className="password-fields">
          <legend>Alterar senha</legend>
          <label>
            Senha atual
            <input type="password" />
          </label>
          <label>
            Nova senha
            <input type="password" />
          </label>
          <label>
            Confirmar nova senha
            <input type="password" />
          </label>
        </fieldset>
        <button className="primary-button" type="submit">
          Salvar
        </button>
      </form>
    </section>
  );
}
