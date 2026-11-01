import type { ReactNode } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useSessionQuery } from '@/features/auth/queries';
import { PlaceholderPage } from '@/shared/ui/placeholder-page';
import { SessionRequiredPage } from './session-required-page';

type ProtectedProps = { title?: string; children?: ReactNode };

export function ProtectedPlaceholderPage({ title = 'Área privada', children }: ProtectedProps) {
  const sessionQuery = useSessionQuery();
  const location = useLocation();
  const returnTo = location.pathname;

  if (sessionQuery.isPending)
    return (
      <section className="page-shell" aria-busy="true">
        <p className="eyebrow">SESSION / CHECK</p>
        <h1>Verificando sua sessão…</h1>
        <p className="lead">Aguarde enquanto confirmamos seu acesso.</p>
      </section>
    );
  if (sessionQuery.isError)
    return (
      <section className="page-shell">
        <p className="eyebrow">SESSION / ERROR</p>
        <h1>Não foi possível validar o acesso</h1>
        <p className="lead">Tente novamente antes de continuar.</p>
        <button
          type="button"
          className="primary-button"
          onClick={() => void sessionQuery.refetch()}
        >
          Tentar novamente
        </button>
      </section>
    );
  if (!sessionQuery.data)
    return <SessionRequiredPage returnTo={returnTo} />;
  return children ?? <PlaceholderPage title={title} />;
}
