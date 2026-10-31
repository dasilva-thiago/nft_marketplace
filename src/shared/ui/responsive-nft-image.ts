const imageWidths: Record<string, number> = {
  monkey1: 2048,
  monkey2: 2098,
  monkey3: 2048,
  monkey4: 2084,
};

export function getResponsiveNftImageSrcSet(imageUrl: string): string | undefined {
  const match = /^\/assets\/(monkey[1-4])\.webp$/.exec(imageUrl);
  if (!match) return undefined;

  const [, basename] = match;
  return [
    `/assets/${basename}-320.webp 320w`,
    `/assets/${basename}-480.webp 480w`,
    `/assets/${basename}-640.webp 640w`,
    `/assets/${basename}-1200.webp 1200w`,
    `${imageUrl} ${imageWidths[basename]}w`,
  ].join(', ');
}
