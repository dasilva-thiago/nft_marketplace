import type { Nft } from '@/shared/contracts';
import { NftSchema } from '@/shared/contracts/schemas';

const monkey1 = '/assets/monkey1.webp';
const monkey2 = '/assets/monkey2.webp';
const monkey3 = '/assets/monkey3.webp';
const monkey4 = '/assets/monkey4.webp';
const rawNfts: Nft[] = [
  {
    id: 'emerald-ape-042',
    name: 'Emerald Ape #042',
    imageUrl: monkey3,
    collection: 'Neo Apes',
    priceEth: '1.45',
    availableEditions: 5,
    network: 'Ethereum',
    version: 1,
    description: 'Uma peça da coleção Neo Apes, com jaqueta verde e óculos de aviador.',
    gallery: [monkey3],
    edition: 42,
    totalEditions: 200,
    attributes: [
      { trait: 'Background', value: 'Cream' },
      { trait: 'Clothing', value: 'Emerald Jacket' },
    ],
  },
  {
    id: 'desert-ape-117',
    name: 'Desert Ape #117',
    imageUrl: monkey2,
    collection: 'Neo Apes',
    priceEth: '0.82',
    availableEditions: 12,
    network: 'Ethereum',
    version: 1,
    description: 'Aventureiro do deserto, integrante da coleção Neo Apes.',
    gallery: [monkey2],
    edition: 117,
    totalEditions: 250,
    attributes: [
      { trait: 'Background', value: 'Sand' },
      { trait: 'Clothing', value: 'Purple Hoodie' },
    ],
  },
  {
    id: 'cyber-ape-008',
    name: 'Cyber Ape #008',
    imageUrl: monkey4,
    collection: 'Neo Apes',
    priceEth: '2.10',
    availableEditions: 1,
    network: 'Polygon',
    version: 1,
    description: 'Edição cibernética rara da coleção Neo Apes.',
    gallery: [monkey4],
    edition: 8,
    totalEditions: 100,
    attributes: [
      { trait: 'Background', value: 'Night' },
      { trait: 'Accessory', value: 'Cyber Visor' },
    ],
  },
  {
    id: 'golden-ape-301',
    name: 'Golden Ape #301',
    imageUrl: monkey1,
    collection: 'Neo Apes',
    priceEth: '3.25',
    availableEditions: 0,
    network: 'Ethereum',
    version: 2,
    description: 'Edição esgotada da coleção Neo Apes.',
    gallery: [monkey1],
    edition: 301,
    totalEditions: 301,
    attributes: [
      { trait: 'Background', value: 'Gold' },
      { trait: 'Clothing', value: 'Royal Coat' },
    ],
  },
  {
    id: 'lunar-ape-077',
    name: 'Lunar Ape #077',
    imageUrl: monkey4,
    collection: 'Neo Apes',
    priceEth: '0.65',
    availableEditions: 8,
    network: 'Polygon',
    version: 1,
    description: 'Colecionável lunar de uma edição limitada.',
    gallery: [monkey4],
    edition: 77,
    totalEditions: 180,
    attributes: [
      { trait: 'Background', value: 'Moon' },
      { trait: 'Accessory', value: 'Silver Helmet' },
    ],
  },
  {
    id: 'pixel-cat-014',
    name: 'Pixel Cat #014',
    imageUrl: monkey4,
    collection: 'Pixel Friends',
    priceEth: '0.12',
    availableEditions: 32,
    network: 'Polygon',
    version: 1,
    description: 'Gato pixelado da coleção Pixel Friends.',
    gallery: [monkey4],
    edition: 14,
    totalEditions: 500,
    attributes: [
      { trait: 'Background', value: 'Blue' },
      { trait: 'Species', value: 'Cat' },
    ],
  },
  {
    id: 'pixel-fox-033',
    name: 'Pixel Fox #033',
    imageUrl: monkey3,
    collection: 'Pixel Friends',
    priceEth: '0.18',
    availableEditions: 15,
    network: 'Polygon',
    version: 1,
    description: 'Raposa pixelada da coleção Pixel Friends.',
    gallery: [monkey3],
    edition: 33,
    totalEditions: 400,
    attributes: [
      { trait: 'Background', value: 'Orange' },
      { trait: 'Species', value: 'Fox' },
    ],
  },
  {
    id: 'pixel-owl-052',
    name: 'Pixel Owl #052',
    imageUrl: monkey2,
    collection: 'Pixel Friends',
    priceEth: '0.24',
    availableEditions: 4,
    network: 'Ethereum',
    version: 1,
    description: 'Coruja pixelada da coleção Pixel Friends.',
    gallery: [monkey2],
    edition: 52,
    totalEditions: 300,
    attributes: [
      { trait: 'Background', value: 'Violet' },
      { trait: 'Species', value: 'Owl' },
    ],
  },
  {
    id: 'samurai-021',
    name: 'Neon Samurai #021',
    imageUrl: monkey1,
    collection: 'Neon Legends',
    priceEth: '1.05',
    availableEditions: 3,
    network: 'Ethereum',
    version: 1,
    description: 'Samurai digital da coleção Neon Legends.',
    gallery: [monkey1],
    edition: 21,
    totalEditions: 120,
    attributes: [
      { trait: 'Background', value: 'Neon City' },
      { trait: 'Weapon', value: 'Katana' },
    ],
  },
  {
    id: 'ronin-064',
    name: 'Neon Ronin #064',
    imageUrl: monkey4,
    collection: 'Neon Legends',
    priceEth: '0.93',
    availableEditions: 9,
    network: 'Polygon',
    version: 1,
    description: 'Ronin digital em uma edição limitada.',
    gallery: [monkey4],
    edition: 64,
    totalEditions: 150,
    attributes: [
      { trait: 'Background', value: 'Rainy Street' },
      { trait: 'Weapon', value: 'Twin Blades' },
    ],
  },
  {
    id: 'astral-dragon-009',
    name: 'Astral Dragon #009',
    imageUrl: monkey1,
    collection: 'Mythic Worlds',
    priceEth: '4.80',
    availableEditions: 2,
    network: 'Ethereum',
    version: 1,
    description: 'Dragão astral da coleção Mythic Worlds.',
    gallery: [monkey1],
    edition: 9,
    totalEditions: 50,
    attributes: [
      { trait: 'Background', value: 'Galaxy' },
      { trait: 'Element', value: 'Cosmic' },
    ],
  },
  {
    id: 'forest-spirit-026',
    name: 'Forest Spirit #026',
    imageUrl: monkey2,
    collection: 'Mythic Worlds',
    priceEth: '0.57',
    availableEditions: 7,
    network: 'Polygon',
    version: 1,
    description: 'Espírito guardião da coleção Mythic Worlds.',
    gallery: [monkey2],
    edition: 26,
    totalEditions: 90,
    attributes: [
      { trait: 'Background', value: 'Forest' },
      { trait: 'Element', value: 'Nature' },
    ],
  },
];

// Validação imediata: fixtures incorretas falham durante o desenvolvimento, não numa tela do usuário.
export const nftFixtures: Nft[] = rawNfts.map((nft) => NftSchema.parse(nft));

const initialMarketData = new Map(
  nftFixtures.map((nft) => [
    nft.id,
    { priceEth: nft.priceEth, availableEditions: nft.availableEditions, version: nft.version },
  ]),
);

export function updateMockNftMarketData(
  nftId: string,
  input: Pick<Nft, 'priceEth' | 'availableEditions' | 'version'>,
): boolean {
  const nft = nftFixtures.find((candidate) => candidate.id === nftId);
  if (!nft) return false;
  if (input.version <= nft.version) return true;
  nft.priceEth = input.priceEth;
  nft.availableEditions = input.availableEditions;
  nft.version = input.version;
  return true;
}

export function resetMockNftMarketData(): void {
  for (const nft of nftFixtures) {
    const initial = initialMarketData.get(nft.id);
    if (!initial) continue;
    Object.assign(nft, initial);
  }
}
