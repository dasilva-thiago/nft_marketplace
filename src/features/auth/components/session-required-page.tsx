import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Lock } from 'lucide-react';
import { catalogListQuery } from '@/features/catalog/queries';

interface SessionRequiredPageProps {
  returnTo: string;
  onOpenModal?: () => void;
}

export function SessionRequiredPage({ returnTo, onOpenModal }: SessionRequiredPageProps) {
  const sceneQuery = useQuery(
    catalogListQuery({ page: 1, pageSize: 6, sort: 'priceEth', sortOrder: 'desc' }),
  );
  const nfts = sceneQuery.data?.items ?? [];

  return (
    <section className="session-required-page" aria-label="Acesso restrito">
      <div className="session-required-bg" aria-hidden="true">
        {nfts.slice(0, 6).map((nft, i) => (
          <div key={nft.id} className="session-required-bg-tile" style={{ '--tile-index': i } as React.CSSProperties}>
            <img src={nft.imageUrl} alt="" />
          </div>
        ))}
        <div className="session-required-bg-overlay" />
      </div>

      <div className="session-required-card">
        <div className="session-required-lock" aria-hidden="true">
          <Lock size={28} strokeWidth={1.5} />
        </div>

        <p className="session-required-eyebrow">ÁREA RESTRITA</p>

        <h1 className="session-required-title">
          Faça login para<br />visualizar essa área
        </h1>

        <p className="session-required-desc">
          Esta página é exclusiva para colecionadores cadastrados. Entre na sua conta para continuar de onde parou.
        </p>

        <div className="session-required-actions">
          {onOpenModal ? (
            <button type="button" className="primary-button" onClick={onOpenModal}>
              Entrar
            </button>
          ) : (
            <Link className="primary-button" to="/login" search={{ returnTo }}>
              Entrar
            </Link>
          )}
          <Link className="session-required-register" to="/register" search={{ returnTo }}>
            Criar conta gratuita
          </Link>
        </div>

        <p className="session-required-hint">
          Novo na Kurio?{' '}
          <Link to="/register" search={{ returnTo }}>
            Cadastre-se grátis
          </Link>{' '}
          e comece a coletar agora.
        </p>
      </div>
    </section>
  );
}
