import './globals.css';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});

export const metadata = {
  title: 'Confido — Strategic Brand Advisory',
  description: 'Brands with direction.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={`${poppins.variable} ${poppins.className}`}>{children}</body></html>;
}
