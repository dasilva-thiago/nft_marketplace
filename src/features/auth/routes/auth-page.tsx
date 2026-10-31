import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { LoginRequestSchema, RegisterRequestSchema } from '@/shared/api/schemas';
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
    const onInvalid = (issues: Array<{ path: PropertyKey[]; message: string }>) => {
      const errors = Object.fromEntries(issues.map((issue) => [String(issue.path[0] ?? 'form'), issue.message]));
      setLocalErrors(errors);
    };
    const onSuccess = () => void navigate({ to: returnTo });
    if (mode === 'login') {
      const parsed = LoginRequestSchema.safeParse({ email: values.email, password: values.password });
      if (!parsed.success) {
        onInvalid(parsed.error.issues);
        return;
      }
      setLocalErrors({});
      loginMutation.mutate(parsed.data, { onSuccess });
      return;
    }
    const parsed = RegisterRequestSchema.safeParse(values);
    if (!parsed.success) {
      onInvalid(parsed.error.issues);
      return;
    }
    setLocalErrors({});
    registerMutation.mutate(parsed.data, { onSuccess });
  };

  const title = mode === 'login' ? 'Acesse sua coleção' : 'Crie sua conta';
  const description = mode === 'login'
    ? 'Entre para continuar sua descoberta e acompanhar seus itens.'
    : 'Cadastre-se para salvar favoritos e continuar sua jornada no mercado.';
  const oppositePath = mode === 'login' ? '/register' : '/login';
  const oppositeLabel = mode === 'login' ? 'Criar uma conta' : 'Já tenho uma conta';
  const pageError = localErrors.form ?? apiError?.message;

  return (
    <section className="auth-page" aria-labelledby="auth-title">
      <div className="auth-card">
        <p className="eyebrow">KURIO / ACCOUNT</p>
        <h1 id="auth-title">{title}</h1>
        <p className="auth-description">{description}</p>
        <form className="auth-form" onSubmit={submit} noValidate>
          {mode === 'register' ? (
            <label className="auth-field" htmlFor={fieldId('name')}>
              <span>Nome</span>
              <input id={fieldId('name')} name="name" type="text" autoComplete="name" value={values.name} onChange={(event) => updateField('name', event.target.value)} aria-invalid={Boolean(localErrors.name || apiError?.fields?.name)} aria-describedby={(localErrors.name || apiError?.fields?.name) ? `${fieldId('name')}-error` : undefined} />
              {(localErrors.name || apiError?.fields?.name) ? <small id={`${fieldId('name')}-error`} className="field-error">{localErrors.name ?? apiError?.fields?.name}</small> : null}
            </label>
          ) : null}
          <label className="auth-field" htmlFor={fieldId('email')}>
            <span>E-mail</span>
            <input id={fieldId('email')} name="email" type="email" autoComplete="email" value={values.email} onChange={(event) => updateField('email', event.target.value)} aria-invalid={Boolean(localErrors.email || apiError?.fields?.email)} aria-describedby={(localErrors.email || apiError?.fields?.email) ? `${fieldId('email')}-error` : undefined} />
            {(localErrors.email || apiError?.fields?.email) ? <small id={`${fieldId('email')}-error`} className="field-error">{localErrors.email ?? apiError?.fields?.email}</small> : null}
          </label>
          <label className="auth-field" htmlFor={fieldId('password')}>
            <span>Senha</span>
            <input id={fieldId('password')} name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={values.password} onChange={(event) => updateField('password', event.target.value)} aria-invalid={Boolean(localErrors.password || apiError?.fields?.password)} aria-describedby={(localErrors.password || apiError?.fields?.password) ? `${fieldId('password')}-error` : undefined} />
            {(localErrors.password || apiError?.fields?.password) ? <small id={`${fieldId('password')}-error`} className="field-error">{localErrors.password ?? apiError?.fields?.password}</small> : null}
          </label>
          {pageError ? <p className="form-error" role="alert">{pageError}</p> : null}
          <button type="submit" className="primary-button auth-submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Validando…' : mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? 'Ainda não faz parte da coleção?' : 'Já possui acesso?'}{' '}
          <Link to={oppositePath} search={{ returnTo }}>{oppositeLabel}</Link>
        </p>
        <p className="auth-demo-note">Demonstração com dados fictícios. Senhas não são retornadas pela API nem armazenadas no navegador.</p>
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
