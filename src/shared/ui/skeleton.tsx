type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = '' }: SkeletonProps) {
  return <span className={`skeleton-shimmer ${className}`} aria-hidden="true" />;
}

export function NftCardSkeleton() {
  return (
    <article className="nft-card-skeleton" aria-hidden="true">
      <Skeleton className="nft-card-skeleton-image" />
      <Skeleton className="nft-card-skeleton-line nft-card-skeleton-line-wide" />
      <Skeleton className="nft-card-skeleton-line nft-card-skeleton-line-short" />
    </article>
  );
}

export function CartLineSkeleton() {
  return (
    <div className="cart-line cart-line-skeleton" aria-hidden="true">
      <Skeleton className="cart-line-skeleton-image" />
      <div className="cart-line-skeleton-name">
        <Skeleton className="cart-line-skeleton-line cart-line-skeleton-line-wide" />
        <Skeleton className="cart-line-skeleton-line cart-line-skeleton-line-short" />
      </div>
      <Skeleton className="cart-line-skeleton-value" />
      <Skeleton className="cart-line-skeleton-value" />
      <Skeleton className="cart-line-skeleton-value cart-line-skeleton-value-total" />
      <Skeleton className="cart-line-skeleton-remove" />
    </div>
  );
}

export function CartSummarySkeleton() {
  return (
    <div className="cart-summary cart-summary-skeleton" aria-hidden="true">
      <Skeleton className="cart-summary-skeleton-title" />
      <Skeleton className="cart-summary-skeleton-input" />
      <div className="cart-summary-skeleton-rows">
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton className="cart-summary-skeleton-total" />
      </div>
      <Skeleton className="cart-summary-skeleton-button" />
    </div>
  );
}
