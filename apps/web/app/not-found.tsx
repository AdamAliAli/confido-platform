import { ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export default function NotFound() {
  return <main id="top" className="bg-[#0b2420] text-white">
    <SiteHeader />
    <section aria-labelledby="not-found-heading" className="flex min-h-[75vh] flex-col items-center justify-center px-6 pb-24 pt-32 text-center md:px-[50px]">
      <p className="text-[clamp(120px,24vw,260px)] font-light leading-none tracking-[-0.06em] text-mint">404</p>
      <h1 id="not-found-heading" className="mt-8 text-[clamp(28px,4vw,48px)] font-normal leading-tight">This page doesn&apos;t exist</h1>
      <a href="/" className="group mt-12 inline-flex h-9 max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b2420] md:h-16 md:w-[354px]">
        <span className="flex w-[155px] items-center justify-center bg-mint text-[13px] text-[#070908] md:min-w-0 md:w-[290px] md:flex-1 md:text-[20px]">Back to home</span>
        <span aria-hidden="true" className="flex w-9 shrink-0 items-center justify-center bg-[#d9eee9] text-[#070908] md:w-16"><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none md:h-5 md:w-5" /></span>
      </a>
    </section>
    <SiteFooter />
  </main>;
}
