import { ArrowRight, Heart } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { NftSummary } from '@/shared/api/contracts';

export function NftCard({ nft, compact = false }: { nft: NftSummary; compact?: boolean }) {
  return (
    <article className={`visual-nft-card${compact ? ' is-compact' : ''}`}>
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        className="visual-nft-card-link"
        aria-label={`Ver ${nft.name}`}
      >
        <div className="visual-nft-image">
          <img src={nft.imageUrl} alt={`Arte de ${nft.name}`} loading="lazy" />
          <span className="visual-nft-badge">
            {nft.availableEditions > 0 ? 'RARO' : 'ESGOTADO'}
          </span>
          <button
            type="button"
            className="visual-heart"
            aria-label={`Favoritar ${nft.name}`}
            onClick={(event) => event.preventDefault()}
          >
            <Heart size={15} />
          </button>
        </div>
        <div className="visual-nft-meta">
          <div>
            <span>{nft.collection}</span>
            <h3>{nft.name}</h3>
          </div>
          <strong>{nft.priceEth} ETH</strong>
        </div>
        {!compact && (
          <div className="visual-nft-footer">
            <small>Ed. 1/{nft.availableEditions}</small>
            <span>
              Ver peça <ArrowRight size={12} />
            </span>
          </div>
        )}
      </Link>
    </article>
  );
}
