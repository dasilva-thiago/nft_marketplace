import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Facebook, Search } from 'lucide-react';
import { LoginRequestSchema, RegisterRequestSchema } from '@/shared/contracts/schemas';
import { readApiError } from '../api/auth-api';
import { useLoginMutation, useRegisterMutation } from '../queries';
import { safeReturnTo } from '../return-to';

type AuthMode = 'login' | 'register';
type FormValues = { name: string; email: string; password: string };
type FieldName = keyof FormValues;
const initialValues: FormValues = { name: '', email: '', password: '' };
function fieldId(field: FieldName): string {
  return `auth-${field}`;
}
function errorId(field: FieldName): string {
  return `${fieldId(field)}-error`;
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const search = useSearch({ from: mode === 'login' ? '/login' : '/register' });
  const returnTo = safeReturnTo(search.returnTo);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [localErrors, setLocalErrors] = useState<Partial<Record<FieldName | 'form', string>>>({});
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const mutation = mode === 'login' ? loginMutation : registerMutation;
  const apiError = readApiError(mutation.error);

  const updateField = (field: FieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setLocalErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const onInvalid = (issues: Array<{ path: PropertyKey[]; message: string }>) =>
      setLocalErrors(
        Object.fromEntries(issues.map((issue) => [String(issue.path[0] ?? 'form'), issue.message])),
      );
    const onSuccess = () => void navigate({ to: returnTo });
    if (mode === 'login') {
      const parsed = LoginRequestSchema.safeParse({
        email: values.email,
        password: values.password,
      });
      if (!parsed.success) return onInvalid(parsed.error.issues);
      setLocalErrors({});
      loginMutation.mutate(parsed.data, { onSuccess });
      return;
    }
    const parsed = RegisterRequestSchema.safeParse(values);
    if (!parsed.success) return onInvalid(parsed.error.issues);
    setLocalErrors({});
    registerMutation.mutate(parsed.data, { onSuccess });
  };
  const pageError = localErrors.form ?? apiError?.message;
  const isLogin = mode === 'login';
  const fieldError = (field: FieldName) => localErrors[field] ?? apiError?.fields?.[field];

  return (
    <section className="auth-screen" aria-labelledby="auth-title">
      <div className="auth-scene" aria-hidden="true">
        <div className="auth-scene-copy">
          <span>Bem-vindo à Kurio</span>
          <strong>
            SEJA DONO DO
            <br />
            DA ARTE DIGITAL
          </strong>
          <p>Descubra NFTs selecionados de criadores do mundo todo.</p>
          <button type="button">EXPLORAR</button>
        </div>
        <div className="auth-scene-art">
          <img src="/placeholders/nft-placeholder.svg" alt="" />
        </div>
        <div className="auth-scene-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <img src="/placeholders/nft-placeholder.svg" alt="" key={index} />
          ))}
        </div>
        <div className="auth-scene-search">
          <Search size={13} /> Buscar no mercado
        </div>
      </div>
      <div className="auth-modal">
        <div className="auth-modal-header">
          <span>Kurio</span>
          <Link
            to="/"
            search={{
              page: 1,
              search: '',
              collection: '',
              network: '',
              trait: '',
              priceMin: '',
              priceMax: '',
              sort: 'priceEth',
              sortOrder: 'asc',
            }}
            aria-label="Fechar"
          >
            ×
          </Link>
        </div>
        <div className="auth-tabs">
          <Link className={isLogin ? 'is-active' : ''} to="/login" search={{ returnTo }}>
            Entrar
          </Link>
          <Link className={!isLogin ? 'is-active' : ''} to="/register" search={{ returnTo }}>
            Criar conta
          </Link>
        </div>
        <p className="auth-modal-description">
          {isLogin
            ? 'Entre para continuar sua descoberta e acompanhar seus itens.'
            : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
        </p>
        <form className="auth-form" onSubmit={submit} noValidate>
          {mode === 'register' && (
            <label className="auth-field" htmlFor={fieldId('name')}>
              <span>Nome de usuário</span>
              <input
                id={fieldId('name')}
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Nome de usuário"
                value={values.name}
                onChange={(event) => updateField('name', event.target.value)}
                aria-invalid={Boolean(fieldError('name'))}
                aria-describedby={fieldError('name') ? errorId('name') : undefined}
              />
              {fieldError('name') && (
                <small id={errorId('name')} className="field-error">
                  {fieldError('name')}
                </small>
              )}
            </label>
          )}
          <label className="auth-field" htmlFor={fieldId('email')}>
            <span>E-mail</span>
            <input
              id={fieldId('email')}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Digite seu e-mail"
              value={values.email}
              onChange={(event) => updateField('email', event.target.value)}
              aria-invalid={Boolean(fieldError('email'))}
              aria-describedby={fieldError('email') ? errorId('email') : undefined}
            />
            {fieldError('email') && (
              <small id={errorId('email')} className="field-error">
                {fieldError('email')}
              </small>
            )}
          </label>
          <label className="auth-field" htmlFor={fieldId('password')}>
            <span>Senha</span>
            <input
              id={fieldId('password')}
              name="password"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder={isLogin ? '••••••••••' : 'Senha'}
              value={values.password}
              onChange={(event) => updateField('password', event.target.value)}
              aria-invalid={Boolean(fieldError('password'))}
              aria-describedby={fieldError('password') ? errorId('password') : undefined}
            />
            {fieldError('password') && (
              <small id={errorId('password')} className="field-error">
                {fieldError('password')}
              </small>
            )}
          </label>
          {mode === 'register' && (
            <label className="auth-field" htmlFor="auth-password-confirmation">
              <span>Confirmar senha</span>
              <input
                id="auth-password-confirmation"
                name="passwordConfirmation"
                aria-label="Confirmação"
                type="password"
                placeholder="Confirmar senha"
                autoComplete="new-password"
              />
            </label>
          )}
          {pageError && (
            <p className="form-error" role="alert">
              {pageError}
            </p>
          )}
          {isLogin && (
            <Link className="forgot-password" to="/login" search={{ returnTo }}>
              Esqueceu a senha?
            </Link>
          )}
          <button
            type="submit"
            aria-label={isLogin ? 'Entrar na conta' : 'Criar conta'}
            className="primary-button auth-submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Validando…' : isLogin ? 'Entrar' : 'Criar perfil'}
          </button>
        </form>
        <div className="auth-social-divider">
          <span>Ou continue com</span>
        </div>
        <div className="auth-socials">
          <button type="button">
            <strong>G</strong> Continuar com Google
          </button>
          <button type="button">
            <Facebook size={15} fill="currentColor" /> Continuar com Facebook
          </button>
        </div>
        <p className="auth-switch">
          {isLogin ? 'Novo na Kurio?' : 'Já tem uma conta?'}{' '}
          <Link to={isLogin ? '/register' : '/login'} search={{ returnTo }}>
            {isLogin ? 'Crie uma conta' : 'Entre'}
          </Link>
        </p>
      </div>
    </section>
  );
}
export function LoginPage() {
  return <AuthPage mode="login" />;
}
export function RegisterPage() {
  return <AuthPage mode="register" />;
}
