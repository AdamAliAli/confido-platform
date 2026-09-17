'use client';

import { motion } from 'framer-motion';
import { PROJECT_IMAGES } from './constants';

type Project = { title: string; category: string; image: string; year?: string; href?: string };

const FALLBACK_PROJECTS: Project[] = [
  { title: 'Mathew Company Branding', category: 'Art Direction', image: PROJECT_IMAGES[0], year: '2023' },
  { title: 'Hilltodo Agency Branding', category: 'Marketing', image: PROJECT_IMAGES[1], year: '2023' },
  { title: 'Krea Klock Branding', category: 'Branding', image: PROJECT_IMAGES[2], year: '2023' },
];

function projectImage(value: any): string | undefined {
  const candidate = [value?.image, value?.imageUrl, value?.cover, value?.thumbnail, value?.coverImage, value?.galleryImages?.[0]]
    .find((item) => typeof item === 'string' && (item.startsWith('https://') || item.startsWith('http://')));
  return candidate;
}

export function ProjectsSection({ data }: { data: Record<string, any> }) {
  const projectItems = Array.isArray(data.projects) ? data.projects : [];
  const projects: Project[] = projectItems
    .filter((item: any) => item && projectImage(item))
    .map((item: any, index: number) => ({
      title: typeof item.title === 'string' ? item.title : typeof item.name === 'string' ? item.name : `Project ${index + 1}`,
      category: typeof item.category === 'string' ? item.category : 'Branding',
      year: typeof item.year === 'string' || typeof item.year === 'number' ? String(item.year) : undefined,
      image: projectImage(item)!,
      href: typeof item.href === 'string' ? item.href : typeof item.url === 'string' ? item.url : undefined,
    }));
  const visibleProjects = projects.length ? projects : FALLBACK_PROJECTS;

  return (
    <section id="projects" className="projects-section" aria-labelledby="projects-title">
      <div className="projects-heading">
        <span className="projects-kicker"><i /> PROJECTS</span>
        <h2 id="projects-title">View Our <span>Works</span></h2>
      </div>
      <div className="projects-stack">
        {visibleProjects.map((project, index) => (
          <motion.article
            className="project-card"
            key={`${project.image}-${index}`}
            style={{ zIndex: index + 1 }}
            initial={{ opacity: 0, y: 65 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={project.image} alt={project.title} loading={index === 0 ? 'eager' : 'lazy'} />
            <div className="project-caption">
              <span className="project-category">{project.category}<i /></span>
              <div>
                <h3>{project.href ? <a href={project.href}>{project.title}</a> : project.title}</h3>
                {project.year && <p>{project.year} — By Confido Studio</p>}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
