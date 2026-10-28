import { ClaritySection } from './sections/clarity-section';
import { ContactSection } from './sections/contact-section';
import { HeroSection } from './sections/hero-section';
import { ProjectsSection } from './sections/projects-section';
import { ServicesSection } from './sections/services-section';
import { LocationSection } from './sections/location-section';
import { TeamSection } from './sections/team-section';
import { ProcessSection } from './sections/process-section';
import { FAQSection } from './sections/faq-section';
import type { TeamMember } from '@/lib/api';

type Block = { id: string; type: string; data: Record<string, any> };

export function BlockRenderer({ blocks = [], members = [] }: { blocks: Block[]; members?: TeamMember[] }) {
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
          case 'contact':
            return <ContactSection key={block.id} data={block.data} />;
          case 'location':
            return <LocationSection key={block.id} data={block.data} />;
          case 'team':
            return <TeamSection key={block.id} data={block.data} members={members} />;
          case 'process':
            return <ProcessSection key={block.id} data={block.data} />;
          case 'faq':
            return <FAQSection key={block.id} data={block.data} />;
          default:
            return null;
        }
      })}
    </>
  );
}
