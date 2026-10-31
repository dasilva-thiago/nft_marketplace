import { useState } from 'react';
import { Heart, Minus, Plus, Share2, Star, ShoppingCart } from 'lucide-react';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { nftDetailQuery, catalogListQuery } from '@/features/catalog/queries';
import { NftCard } from '@/shared/ui/nft-card';
import { MarketingFooter } from '@/shared/ui/marketing-footer';

export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' });
  const detailQuery = useQuery(nftDetailQuery(nftId));
  const relatedQuery = useQuery(catalogListQuery({ page: 1, pageSize: 5, sort: 'priceEth', sortOrder: 'asc' }));
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const nft = detailQuery.data;

  if (detailQuery.isPending) return <section className="visual-page-shell"><div className="detail-skeleton" /></section>;
  if (detailQuery.isError || !nft) return <section className="visual-page-shell"><Link className="back-link" to="/" search={{ page: 1, search: '', collection: '', sort: 'priceEth', sortOrder: 'asc' }}>← Voltar ao mercado</Link><div className="visual-empty"><strong>NFT não encontrado</strong><span>Essa peça não está disponível no catálogo.</span></div></section>;

  const gallery = nft.gallery.length ? nft.gallery : [nft.imageUrl];
  return <>
    <section className="visual-page-shell detail-page">
      <Link className="back-link" to="/" search={{ page: 1, search: '', collection: '', sort: 'priceEth', sortOrder: 'asc' }}>← Início / Mercado</Link>
      <div className="detail-layout">
        <div className="detail-gallery"><div className="detail-thumbs">{gallery.slice(0, 4).map((image, index) => <button type="button" className={index === galleryIndex ? 'is-active' : ''} key={`${image}-${index}`} onClick={() => setGalleryIndex(index)}><img src={image} alt="" /></button>)}</div><div className="detail-main-image"><img src={gallery[galleryIndex]} alt={`Arte de ${nft.name}`} /></div></div>
        <div className="detail-copy"><div className="detail-title-row"><div><h1>{nft.name}</h1><strong>{nft.priceEth} ETH</strong></div><span className="rating"><Star size={13} fill="currentColor" /> 4.8 (19)</span></div><p className="detail-kicker">Sobre este NFT:</p><p>{nft.description} Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum.</p><div className="detail-edition"><strong>Edição:</strong><div><span>1/1</span><span>1/10</span><span className="is-active">1/{nft.totalEditions}</span><span>ABERTA</span></div></div><div className="detail-purchase"><div className="quantity"><span>Qtd.</span><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Diminuir quantidade"><Minus size={14} /></button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity(Math.min(nft.availableEditions || 1, quantity + 1))} aria-label="Aumentar quantidade"><Plus size={14} /></button></div><strong className="detail-price">{nft.priceEth} ETH</strong></div><div className="detail-actions"><button type="button" className="primary-button">Comprar NFT</button><button type="button" className="secondary-outline"><ShoppingCart size={15} /> Adicionar</button><button type="button" className="secondary-outline"><Heart size={15} /> Favoritar</button></div><dl className="detail-attributes"><div><dt>ID do token:</dt><dd>#{String(nft.edition).padStart(4, '0')}</dd></div><div><dt>Coleção:</dt><dd>{nft.collection}</dd></div><div><dt>Atributos:</dt><dd>{nft.attributes.map((attribute) => attribute.value).join(', ')}</dd></div></dl><button type="button" className="share-button"><Share2 size={13} /> Compartilhar este NFT</button></div>
      </div>
      <div className="detail-description"><div className="detail-tabs"><strong>Detalhes do NFT</strong><span>Avaliações de colecionadores (19)</span></div><p>{nft.name} é uma obra digital da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na rede. A propriedade inclui o certificado de autenticidade e registro permanente de procedência.</p><p>Rede: <strong>{nft.network}</strong></p><p>Contrato: Direitos autorais e registro verificado.</p></div>
      <section className="related-section"><div className="section-line-title">Mais desta coleção</div><div className="related-grid">{relatedQuery.data?.items.map((item) => <NftCard key={item.id} nft={item} compact />)}</div></section>
    </section><MarketingFooter />
  </>;
}
