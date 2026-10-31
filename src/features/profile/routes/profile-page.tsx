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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const avatarOptions = ['/assets/monkey1.webp', '/assets/monkey2.webp', '/assets/monkey3.webp'];

  useEffect(() => {
    if (profileQuery.data) {
      setName(profileQuery.data.name);
      setAvatarUrl(profileQuery.data.avatarUrl);
    }
  }, [profileQuery.data]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);
    if (currentPassword || newPassword || passwordConfirmation) {
      if (!currentPassword || !newPassword || !passwordConfirmation) {
        setValidationError('Preencha a senha atual, a nova senha e a confirmação.');
        return;
      }
      if (newPassword !== passwordConfirmation) {
        setValidationError('A confirmação da nova senha não confere.');
        return;
      }
    }
    await updateProfileMutation.mutateAsync({ name, avatarUrl });
    if (currentPassword || newPassword) {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirmation('');
    }
  }

  const feedback = validationError
    ? validationError
    : updateProfileMutation.isSuccess && !changePasswordMutation.isError
      ? 'Perfil atualizado.'
      : updateProfileMutation.isError || changePasswordMutation.isError
        ? 'Não foi possível salvar as alterações.'
        : null;

  return (
    <section className="account-page visual-page-shell">
      <nav className="account-sidebar" aria-label="Navegação da conta">
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
      </nav>
      <form
        className="account-form"
        aria-labelledby="profile-form-title"
        onSubmit={(event) => void submit(event)}
      >
        <h1 id="profile-form-title">Perfil do colecionador</h1>
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
          <div className="auth-field">
            <span id="avatar-field-label">Avatar</span>
            <div className="avatar-control">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar selecionado" />
              ) : (
                <span>{name.slice(0, 2).toUpperCase() || 'CU'}</span>
              )}
              <button type="button" onClick={() => setAvatarPickerOpen((open) => !open)}>
                Alterar
              </button>
              <button type="button" className="text-button" onClick={() => setAvatarUrl(null)}>
                Remover
              </button>
            </div>
            {avatarPickerOpen ? (
              <fieldset className="avatar-picker">
                <legend>Escolha um avatar</legend>
                <div role="radiogroup" aria-label="Avatares disponíveis">
                  {avatarOptions.map((option) => {
                    const absoluteOption = new URL(option, window.location.origin).toString();
                    return (
                      <button
                        type="button"
                        key={option}
                        aria-label={`Selecionar avatar ${option.split('/').pop()}`}
                        aria-pressed={avatarUrl === absoluteOption}
                        onClick={() => {
                          setAvatarUrl(absoluteOption);
                          setAvatarPickerOpen(false);
                        }}
                      >
                        <img src={option} alt="" />
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}
          </div>
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
              aria-describedby="new-password-help"
            />
          </label>
          <label>
            Confirmar nova senha
            <input
              type="password"
              minLength={8}
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
            />
          </label>
        </fieldset>
        {newPassword ? (
          <small id="new-password-help" className="field-help">
            Use pelo menos 8 caracteres.
          </small>
        ) : null}
        {feedback ? (
          <p
            role="status"
            aria-live="polite"
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
