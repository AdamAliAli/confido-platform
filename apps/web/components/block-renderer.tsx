import { ClaritySection } from './sections/clarity-section';
import { HeroSection } from './sections/hero-section';
import { ProjectsSection } from './sections/projects-section';
import { ServicesSection } from './sections/services-section';

type Block = { id: string; type: string; data: Record<string, any> };

export function BlockRenderer({ blocks = [] }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case 'hero':
            return <HeroSection key={block.id} data={block.data} />;
          case 'services':
            return <ServicesSection key={block.id} data={block.data} />;
          case 'projects':
            return <ProjectsSection key={block.id} data={block.data} />;
          case 'clarity':
            return <ClaritySection key={block.id} data={block.data} />;
          default:
            return null;
        }
      })}
    </>
  );
}
