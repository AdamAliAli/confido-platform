import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { JsonLd } from '@/components/json-ld';
import { CaseStudyReveal } from '@/components/sections/case-study-reveal';
import { SectionHeader } from '@/components/sections/section-header';
import { ContactSection } from '@/components/sections/contact-section';
import { getHomeBlocks } from '@/lib/api';
import { caseImageSrcSet, getCaseStudies, paragraphs, type CaseStudy } from '@/lib/case-studies';
import { siteImage } from '@/lib/media-url';
import { SITE_URL } from '@/lib/seo';

export const revalidate = 300;
export const dynamicParams = true;
type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const blocks = await getHomeBlocks();
  return getCaseStudies(blocks.projects?.projects).map(({ slug }) => ({ slug }));
}

async function findStudy(params: Props['params']) {
  const [{ slug }, blocks] = await Promise.all([params, getHomeBlocks()]);
  const studies = getCaseStudies(blocks.projects?.projects);
  const study = studies.find(item => item.slug === slug);
  if (!study) notFound();
  return { study, studies, blocks };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { study } = await findStudy(params);
  const title = `${study.title} — Case Study`;
  const description = study.summary.slice(0, 155);
  return {
    title, description,
    alternates: { canonical: `/work/${study.slug}` },
    openGraph: { title, description, url: `/work/${study.slug}`, images: study.image ? [{ url: siteImage(study.image, 1200), alt: study.title }] : [] },
  };
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em]"><span className="h-2 w-2 shrink-0 bg-mint" aria-hidden="true" />{children}</p>;
}

function StorySection({ title, label, content, id }: { title: string; label: string; content: string; id: string }) {
  const parts = paragraphs(content);
  if (!parts.length) return null;
  return <section aria-labelledby={id} className="border-t border-white/[0.06] px-6 py-16 md:px-[50px] md:py-[90px]">
    <CaseStudyReveal>
      <SectionHeader label={label} title={title} accent="" headingId={id} padded={false} />
      <div className="mt-10 max-w-[760px] space-y-6 text-base leading-relaxed text-white/80 md:ml-[35%]">
        {parts.map((part, index) => <p key={index}>{part}</p>)}
      </div>
    </CaseStudyReveal>
  </section>;
}

function StudySchema({ study }: { study: CaseStudy }) {
  const url = new URL(`/work/${study.slug}`, SITE_URL).href;
  return <>
    <JsonLd data={{
      '@context': 'https://schema.org', '@type': 'CreativeWork', name: study.title,
      description: study.summary, ...(study.image ? { image: new URL(siteImage(study.image, 1200), SITE_URL).href } : {}),
      author: { '@type': 'Organization', name: 'Confido', url: new URL('/', SITE_URL).href },
      about: study.client, url,
    }} />
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: new URL('/', SITE_URL).href },
      { '@type': 'ListItem', position: 2, name: 'Work', item: new URL('/work', SITE_URL).href },
      { '@type': 'ListItem', position: 3, name: study.title, item: url },
    ] }} />
  </>;
}

export default async function CaseStudyPage({ params }: Props) {
  const { study, studies, blocks } = await findStudy(params);
  const next = studies[(studies.indexOf(study) + 1) % studies.length];
  const facts = [['Client', study.client], ['Market', study.market], ['Period', study.period], ['Services', study.services]].filter(([, value]) => value);
  return <main id="top" className="overflow-x-clip bg-[#0b2420] text-white">
    <SiteHeader />
    <StudySchema study={study} />
    <header className="px-6 pb-12 pt-[140px] md:px-[50px] md:pt-[170px]">
      <CaseStudyReveal>
        <Label>Case study</Label>
        <h1 className="mt-10 break-words text-[clamp(40px,5vw,80px)] font-light leading-[1.05] tracking-[-0.04em]">{study.title}</h1>
        {study.summary && <p className="mt-6 max-w-[620px] break-words text-base leading-relaxed text-white/80">{study.summary}</p>}
        {!!facts.length && <dl className="mt-12 grid min-w-0 grid-cols-2 gap-8 border-t border-white/[0.06] pt-6 md:grid-cols-4">
          {facts.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-white/50">{label}</dt><dd className="mt-2 break-words text-base">{value}</dd></div>)}
        </dl>}
      </CaseStudyReveal>
    </header>
    {study.image && <CaseStudyReveal className="px-6 pb-16 md:px-[50px]">
      <img src={siteImage(study.image, 1200)} srcSet={caseImageSrcSet(study.image)} sizes="(max-width: 767px) calc(100vw - 48px), calc(100vw - 100px)" width={study.width} height={study.height} alt={study.title} fetchPriority="high" className="h-auto w-full rounded-lg" />
    </CaseStudyReveal>}
    <StorySection id="challenge-title" label="THE CHALLENGE" title="The Challenge" content={study.challenge} />
    <StorySection id="approach-title" label="OUR APPROACH" title="Our Approach" content={study.approach} />
    {!!study.results.length && <section aria-label="Results" className="border-t border-white/[0.06] px-6 py-16 md:px-[50px] md:py-[90px]">
      <CaseStudyReveal>
        <Label>Results</Label>
        <div className="mt-10 grid min-w-0 grid-cols-2 gap-4 md:grid-cols-3">
          {study.results.map((result, index) => <div key={index} className="min-w-0 border border-white/[0.06] p-4 md:p-8"><p className="break-words text-[clamp(40px,5vw,72px)] font-light leading-tight tracking-[-0.04em] text-mint">{result.value}</p><p className="mt-4 break-words text-sm text-white/70">{result.label}</p></div>)}
        </div>
        {study.resultsNote && <p className="mt-6 whitespace-pre-line break-words text-xs leading-relaxed text-white/50">{study.resultsNote}</p>}
      </CaseStudyReveal>
    </section>}
    {!!study.gallery.length && <section aria-label="Project gallery" className="px-6 py-12 md:px-[50px]">
      <CaseStudyReveal className="columns-1 gap-4 md:columns-2">
        {study.gallery.map((photo, index) => <img key={index} src={siteImage(photo.src, 1200)} srcSet={caseImageSrcSet(photo.src)} sizes="(max-width: 767px) calc(100vw - 48px), 50vw" width={1200} height={800} alt={photo.alt} loading="lazy" decoding="async" className="mb-4 h-auto w-full break-inside-avoid rounded-lg" />)}
      </CaseStudyReveal>
    </section>}
    <nav aria-label="Case studies" className="border-y border-white/[0.06] px-6 py-12 md:px-[50px]">
      <CaseStudyReveal className="flex flex-wrap items-center justify-between gap-6 text-mint">
        <a href="/work" className="rounded underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-mint">← All work</a>
        <a href={`/work/${next.slug}`} className="max-w-full break-words rounded text-right underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-mint">Next project → <span className="block text-sm text-white/70">{next.title}</span></a>
      </CaseStudyReveal>
    </nav>
    <ContactSection data={blocks.contact || {}} />
    <SiteFooter />
  </main>;
}
