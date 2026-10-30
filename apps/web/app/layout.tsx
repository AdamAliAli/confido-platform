import './globals.css';
import { Poppins } from 'next/font/google';
import type { Metadata } from 'next';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { template: '%s — Confido', default: 'Confido — Strategic Brand Advisory' },
  description: 'Confido helps businesses build clear positioning, strong direction, and scalable brand systems.',
  openGraph: { type: 'website', siteName: 'Confido' },
  twitter: { card: 'summary_large_image' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={`${poppins.variable} ${poppins.className}`}>{children}</body></html>;
}
