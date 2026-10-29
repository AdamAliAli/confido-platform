import { ChevronUp } from 'lucide-react';
import { NewsletterForm } from './newsletter-form';

const focusStyle = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-4 focus-visible:ring-offset-[#102521]';

function FooterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 self-start text-[14px] font-medium text-white/65 md:text-[16px]">
      <span className="h-2 w-2 bg-mint" aria-hidden="true" />
      {children}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-20 overflow-hidden bg-[#102521] text-white">
      <div className="pointer-events-none absolute -left-24 -top-64 h-[600px] w-[900px] max-w-[120vw] bg-[radial-gradient(ellipse,rgba(19,187,161,0.12)_0%,transparent_65%)]" aria-hidden="true" />

      <div className="relative grid gap-10 border-b border-white/[0.06] px-6 py-12 md:grid-cols-2 md:gap-0 md:px-[clamp(50px,4.7vw,90px)] md:py-14">
        <FooterLabel>Links</FooterLabel>
        <div className="grid grid-cols-2 gap-6">
          <nav aria-label="Footer menu">
            <h2 className="text-[16px] font-medium text-white/50 md:text-[18px]">Menu</h2>
            <ul className="mt-8 space-y-6 text-[16px] md:mt-12 md:text-[18px]">
              <li><a href="/" className={`transition-colors hover:text-mint ${focusStyle}`}>Home</a></li>
              <li><a href="/services" className={`transition-colors hover:text-mint ${focusStyle}`}>Services</a></li>
              <li><a href="/#projects" className={`transition-colors hover:text-mint ${focusStyle}`}>Projects</a></li>
            </ul>
          </nav>
          <nav aria-label="Footer legal and contact">
            <h2 className="text-[16px] font-medium text-white/50 md:text-[18px]">Legal</h2>
            <ul className="mt-8 space-y-6 text-[16px] md:mt-12 md:text-[18px]">
              <li><a href="/pricing" className={`transition-colors hover:text-mint ${focusStyle}`}>Pricing</a></li>
              <li><a href="/privacy-policy" className={`transition-colors hover:text-mint ${focusStyle}`}>Privacy Policy</a></li>
              <li><a href="/contact" className={`transition-colors hover:text-mint ${focusStyle}`}>Contact Us</a></li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="relative grid gap-10 border-b border-white/[0.06] px-6 py-12 md:grid-cols-2 md:gap-0 md:px-[clamp(50px,4.7vw,90px)] md:py-14">
        <FooterLabel>Subscribe</FooterLabel>
        <div className="min-w-0 max-w-[710px]">
          <h2 className="text-[16px] font-medium text-white/50 md:text-[18px]">Newsletter</h2>
          <NewsletterForm />
          <p className="mt-8 text-[14px] leading-relaxed text-white/55 md:text-[16px]">
            No noise. Just clarity <span className="text-white">on branding and strategy.</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 bg-[#0b2420] px-6 py-10 md:px-[clamp(50px,4.7vw,90px)] md:py-12">
        <p className="text-[12px] text-white/65 md:text-[16px]">© {new Date().getFullYear()} <span className="text-white">Confido.</span> All rights reserved.</p>
        <a href="#top" aria-label="Back to top" className={`grid h-11 w-11 shrink-0 place-items-center transition-colors hover:text-mint ${focusStyle}`}>
          <ChevronUp className="h-6 w-6" aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}
