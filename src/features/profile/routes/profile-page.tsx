import { useEffect, useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import {
  useChangePasswordMutation,
  useProfileQuery,
  useUpdateProfileMutation,
} from '@/features/profile/queries';

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
  const profileQuery = useProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (profileQuery.data) setName(profileQuery.data.name);
  }, [profileQuery.data]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateProfileMutation.mutateAsync({ name });
    if (currentPassword || newPassword) {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
    }
  }

  const feedback =
    updateProfileMutation.isSuccess && !changePasswordMutation.isError
      ? 'Perfil atualizado.'
      : updateProfileMutation.isError || changePasswordMutation.isError
        ? 'Não foi possível salvar as alterações.'
        : null;

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
      <form className="account-form" onSubmit={(event) => void submit(event)}>
        <h1>Perfil do colecionador</h1>
        <div className="form-grid">
          <label>
            Nome de exibição*
            <input required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Nome de usuário*
            <input defaultValue="collector" />
          </label>
          <label>
            E-mail*
            <input value={profileQuery.data?.email ?? ''} readOnly type="email" />
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
              <span>{name.slice(0, 2).toUpperCase() || 'CU'}</span>
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
            <input
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              type="password"
              minLength={8}
            />
          </label>
          <label>
            Nova senha
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              minLength={8}
            />
          </label>
          <label>
            Confirmar nova senha
            <input type="password" minLength={8} />
          </label>
        </fieldset>
        {feedback ? (
          <p
            role="status"
            className={feedback === 'Perfil atualizado.' ? 'form-success' : 'form-error'}
          >
            {feedback}
          </p>
        ) : null}
        <button
          className="primary-button"
          type="submit"
          disabled={
            profileQuery.isPending ||
            updateProfileMutation.isPending ||
            changePasswordMutation.isPending
          }
        >
          {updateProfileMutation.isPending || changePasswordMutation.isPending
            ? 'Salvando…'
            : 'Salvar'}
        </button>
      </form>
    </section>
  );
}
