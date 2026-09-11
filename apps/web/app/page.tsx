import { BlockRenderer } from '@/components/block-renderer';
import { getPage } from '@/lib/api';

const fallback = {
  blocks: [
    {
      id: 'hero',
      type: 'hero',
      data: {
        eyebrow: 'Strategic brand consultancy',
        title: 'Brands',
        accent: 'With',
        subtitle: 'Direction',
        description:
          'Confido helps businesses build clear positioning, strong direction, and scalable brand systems.',
      },
    },
  ],
};

export default async function Home() {
  const page = (await getPage()) || fallback;
  const hero = page.blocks.find((block: { type: string }) => block.type === 'hero');

  return (
    <main>
      <BlockRenderer blocks={hero ? [hero] : fallback.blocks} />
    </main>
  );
}
