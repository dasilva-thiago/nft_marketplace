import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, X } from 'lucide-react';

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
import { useNavigate } from '@tanstack/react-router';
import { LoginRequestSchema, RegisterRequestSchema } from '@/shared/contracts/schemas';
import { Button } from '@/shared/ui/button';
import { readApiError } from '../api/auth-api';
import { useLoginMutation, useRegisterMutation } from '../queries';

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

interface AuthModalOverlayProps {
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
  returnTo?: string;
}

export function AuthModalOverlay({ mode, onClose, onSwitchMode, returnTo }: AuthModalOverlayProps) {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [localErrors, setLocalErrors] = useState<Partial<Record<FieldName | 'form', string>>>({});
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const mutation = mode === 'login' ? loginMutation : registerMutation;
  const apiError = readApiError(mutation.error);

  const fieldId = (field: FieldName) => `auth-${field}`;
  const errorId = (field: FieldName) => `${fieldId(field)}-error`;
  const fieldError = (field: FieldName) => localErrors[field] ?? apiError?.fields?.[field];
  const pageError = localErrors.form ?? apiError?.message;
  const isLogin = mode === 'login';

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const focusable = () =>
      Array.from(
        modal.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.getAttribute('aria-hidden') !== 'true');
    focusable()[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const els = focusable();
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const updateField = (field: FieldName, value: string) => {
    setValues((c) => ({ ...c, [field]: value }));
    setLocalErrors((c) => ({ ...c, [field]: undefined, form: undefined }));
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const onInvalid = (issues: Array<{ path: PropertyKey[]; message: string }>) =>
      setLocalErrors(Object.fromEntries(issues.map((i) => [String(i.path[0] ?? 'form'), i.message])));
    const onSuccess = () => {
      onClose();
      if (returnTo) void navigate({ to: returnTo as '/', search: {} as never });
    };
    if (mode === 'login') {
      const parsed = LoginRequestSchema.safeParse({ email: values.email, password: values.password });
      if (!parsed.success) return onInvalid(parsed.error.issues);
      setLocalErrors({});
      loginMutation.mutate(parsed.data, { onSuccess });
      return;
    }
    const parsed = RegisterRequestSchema.safeParse({ name: values.name, email: values.email, password: values.password });
    if (!parsed.success) return onInvalid(parsed.error.issues);
    if (values.password !== values.passwordConfirmation) {
      setLocalErrors({ passwordConfirmation: 'As senhas não coincidem.' });
      return;
    }
    setLocalErrors({});
    registerMutation.mutate(parsed.data, {
      onSuccess: () => {
        onClose();
        void navigate({ to: '/', search: homeSearch });
      },
    });
  };

  return createPortal(
    <div className="auth-modal-backdrop" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="auth-modal auth-modal-portal"
        ref={modalRef}
        role="dialog"
        aria-modal
        aria-labelledby="auth-modal-title"
      >
        <h1 className="sr-only" id="auth-modal-title">
          {isLogin ? 'Entrar na Kurio' : 'Criar perfil de colecionador'}
        </h1>
        <button type="button" className="auth-modal-close" aria-label="Fechar" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="auth-tabs" aria-label="Acesso à conta">
          <button
            type="button"
            className={isLogin ? 'is-active' : ''}
            onClick={() => { onSwitchMode('login'); setLocalErrors({}); setValues(initialValues); }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={!isLogin ? 'is-active' : ''}
            onClick={() => { onSwitchMode('register'); setLocalErrors({}); setValues(initialValues); }}
          >
            Criar conta
          </button>
        </div>
        <p className="auth-modal-description">
          {isLogin
            ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
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
                onChange={(e) => updateField('name', e.target.value)}
                aria-invalid={Boolean(fieldError('name'))}
                aria-describedby={fieldError('name') ? errorId('name') : undefined}
              />
              {fieldError('name') && <small id={errorId('name')} className="field-error">{fieldError('name')}</small>}
            </label>
          )}
          <label className="auth-field" htmlFor={fieldId('email')}>
            <span>E-mail</span>
            <input
              id={fieldId('email')}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="contato@email.com"
              value={values.email}
              onChange={(e) => updateField('email', e.target.value)}
              aria-invalid={Boolean(fieldError('email'))}
              aria-describedby={fieldError('email') ? errorId('email') : undefined}
            />
            {fieldError('email') && <small id={errorId('email')} className="field-error">{fieldError('email')}</small>}
          </label>
          <div className="auth-field auth-password-field">
            <label htmlFor={fieldId('password')}>Senha</label>
            <div className="auth-password-control">
              <input
                id={fieldId('password')}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder="••••••••••"
                value={values.password}
                onChange={(e) => updateField('password', e.target.value)}
                aria-invalid={Boolean(fieldError('password'))}
                aria-describedby={fieldError('password') ? errorId('password') : undefined}
              />
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
            {fieldError('password') && <small id={errorId('password')} className="field-error">{fieldError('password')}</small>}
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
                  onChange={(e) => updateField('passwordConfirmation', e.target.value)}
                  aria-invalid={Boolean(fieldError('passwordConfirmation'))}
                  aria-describedby={fieldError('passwordConfirmation') ? errorId('passwordConfirmation') : undefined}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={showPasswordConfirmation ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                  aria-pressed={showPasswordConfirmation}
                  onClick={() => setShowPasswordConfirmation((v) => !v)}
                >
                  {showPasswordConfirmation ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
              {fieldError('passwordConfirmation') && <small id={errorId('passwordConfirmation')} className="field-error">{fieldError('passwordConfirmation')}</small>}
            </div>
          )}
          {pageError && <p className="form-error" role="alert">{pageError}</p>}
          {isLogin && (
            <span className="forgot-password" aria-disabled="true" title="Recuperação de senha não faz parte desta demonstração.">
              Esqueceu a senha?
            </span>
          )}
          <Button
            type="submit"
            aria-label={isLogin ? 'Entrar na conta' : 'Criar conta'}
            className="primary-button auth-submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Validando…' : isLogin ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>
        <div className="auth-social-divider"><span>Ou continue com</span></div>
        <div className="auth-socials" aria-label="Provedores sociais indisponíveis na demonstração">
          <button type="button" disabled title="Login social não disponível nesta demonstração.">
            <GoogleIcon /> Continuar com Google
          </button>
          <button type="button" disabled title="Login social não disponível nesta demonstração.">
            <FacebookIcon /> Continuar com Facebook
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
