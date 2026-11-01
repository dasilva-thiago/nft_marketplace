import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Eye, EyeOff, Search } from 'lucide-react';

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
import { catalogListQuery } from '@/features/catalog/queries';
import { LoginRequestSchema, RegisterRequestSchema } from '@/shared/contracts/schemas';
import { Button } from '@/shared/ui/button';
import { readApiError } from '../api/auth-api';
import { useLoginMutation, useRegisterMutation } from '../queries';
import { safeReturnTo } from '../return-to';

type AuthMode = 'login' | 'register';
type FieldName = 'name' | 'email' | 'password' | 'passwordConfirmation';
type FormValues = Record<FieldName, string>;
const initialValues: FormValues = { name: '', email: '', password: '', passwordConfirmation: '' };
const homeSearch = {
  page: 1,
  search: '',
  collection: '',
  network: '',
  trait: '',
  priceMin: '',
  priceMax: '',
  sort: 'priceEth' as const,
  sortOrder: 'asc' as const,
};
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
  const modalRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [isDesktopDialog, setIsDesktopDialog] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 621px)').matches,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [localErrors, setLocalErrors] = useState<Partial<Record<FieldName | 'form', string>>>({});
  const sceneQuery = useQuery(
    catalogListQuery({ page: 1, pageSize: 6, sort: 'priceEth', sortOrder: 'desc' }),
  );
  const sceneNfts = sceneQuery.data?.items ?? [];
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const mutation = mode === 'login' ? loginMutation : registerMutation;
  const apiError = readApiError(mutation.error);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 621px)');
    const update = () => setIsDesktopDialog(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isDesktopDialog) return;
    const modal = modalRef.current;
    if (!modal) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () =>
      Array.from(
        modal.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getAttribute('aria-hidden') !== 'true');
    focusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        void navigate({ to: '/', search: homeSearch });
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || !modal.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !modal.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isDesktopDialog, navigate]);

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
    const parsed = RegisterRequestSchema.safeParse({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    if (!parsed.success) return onInvalid(parsed.error.issues);
    if (values.password !== values.passwordConfirmation) {
      setLocalErrors({ passwordConfirmation: 'As senhas não coincidem.' });
      return;
    }
    setLocalErrors({});
    registerMutation.mutate(parsed.data, { onSuccess });
  };
  const pageError = localErrors.form ?? apiError?.message;
  const isLogin = mode === 'login';
  const fieldError = (field: FieldName) => localErrors[field] ?? apiError?.fields?.[field];
  const featureImage = sceneNfts[0]?.imageUrl ?? '/placeholders/nft-placeholder.svg';

  return (
    <section
      className="auth-screen"
      aria-label={isDesktopDialog ? undefined : 'Autenticação Kurio'}
    >
      <div className="auth-scene" aria-hidden="true">
        <div className="auth-scene-copy">
          <span>Bem-vindo à Kurio</span>
          <strong>
            SEJA DONO DO
            <br />
            DA ARTE DIGITAL
          </strong>
          <p>Descubra NFTs selecionados de criadores do mundo todo.</p>
          <span className="auth-scene-cta">EXPLORAR</span>
        </div>
        <div className="auth-scene-art">
          <img src={featureImage} alt="" />
        </div>
        <div className="auth-scene-grid">
          {sceneNfts.map((nft) => (
            <img src={nft.imageUrl} alt="" key={nft.id} />
          ))}
        </div>
        <div className="auth-scene-search">
          <Search size={13} /> Buscar no mercado
        </div>
      </div>
      <div
        className="auth-modal"
        ref={modalRef}
        role={isDesktopDialog ? 'dialog' : undefined}
        aria-modal={isDesktopDialog ? true : undefined}
        aria-labelledby="auth-title"
      >
        <div className="auth-modal-header">
          <span>KURIO</span>
          <Link to="/" search={homeSearch} aria-label="Fechar autenticação">
            ×
          </Link>
        </div>
        <h1 className="sr-only" id="auth-title">
          {isLogin ? 'Entrar na Kurio' : 'Criar perfil de colecionador'}
        </h1>
        <h2 className="auth-mobile-title">{isLogin ? 'Entrar' : 'Criar perfil de colecionador'}</h2>
        <div className="auth-tabs" aria-label="Acesso à conta">
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
          <div className="auth-field auth-password-field">
            <label htmlFor={fieldId('password')}>Senha</label>
            <div className="auth-password-control">
              <input
                id={fieldId('password')}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder={isLogin ? '••••••••••' : 'Senha'}
                value={values.password}
                onChange={(event) => updateField('password', event.target.value)}
                aria-invalid={Boolean(fieldError('password'))}
                aria-describedby={fieldError('password') ? errorId('password') : undefined}
              />
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
            {fieldError('password') && (
              <small id={errorId('password')} className="field-error">
                {fieldError('password')}
              </small>
            )}
          </div>
          {mode === 'register' && (
            <div className="auth-field auth-password-field">
              <label htmlFor={fieldId('passwordConfirmation')}>Confirmar senha</label>
              <div className="auth-password-control">
                <input
                  id={fieldId('passwordConfirmation')}
                  name="passwordConfirmation"
                  type={showPasswordConfirmation ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirmar senha"
                  value={values.passwordConfirmation}
                  onChange={(event) => updateField('passwordConfirmation', event.target.value)}
                  aria-invalid={Boolean(fieldError('passwordConfirmation'))}
                  aria-describedby={
                    fieldError('passwordConfirmation') ? errorId('passwordConfirmation') : undefined
                  }
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={
                    showPasswordConfirmation
                      ? 'Ocultar confirmação de senha'
                      : 'Mostrar confirmação de senha'
                  }
                  aria-pressed={showPasswordConfirmation}
                  onClick={() => setShowPasswordConfirmation((visible) => !visible)}
                >
                  {showPasswordConfirmation ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
              {fieldError('passwordConfirmation') && (
                <small id={errorId('passwordConfirmation')} className="field-error">
                  {fieldError('passwordConfirmation')}
                </small>
              )}
            </div>
          )}
          {pageError && (
            <p className="form-error" role="alert">
              {pageError}
            </p>
          )}
          {isLogin && (
            <span
              className="forgot-password"
              aria-disabled="true"
              title="Recuperação de senha não faz parte desta demonstração."
            >
              Esqueceu a senha?
            </span>
          )}
          <Button
            type="submit"
            aria-label={
              isLogin ? 'Entrar na conta' : isDesktopDialog ? 'Criar conta' : 'Criar perfil'
            }
            className="primary-button auth-submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? 'Validando…'
              : isLogin
                ? 'Entrar'
                : isDesktopDialog
                  ? 'Criar conta'
                  : 'Criar perfil'}
          </Button>
        </form>
        <div className="auth-social-divider">
          <span>Ou continue com</span>
        </div>
        <div className="auth-socials" aria-label="Provedores sociais indisponíveis na demonstração">
          <button type="button" disabled title="Login social não disponível nesta demonstração.">
            <GoogleIcon /> Continuar com Google
          </button>
          <button type="button" disabled title="Login social não disponível nesta demonstração.">
            <FacebookIcon /> Continuar com Facebook
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
