import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
// Add verified social profile URLs here when they are available.
const SAME_AS: string[] = [];

export function pageMetadata(title: string, description: string, path: string, absolute = false): Metadata {
  return {
    title: absolute ? { absolute: title } : title,
    description,
    openGraph: { title, description, url: path },
    alternates: { canonical: path },
  };
}

export const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'ProfessionalService'],
  '@id': new URL('/#organization', SITE_URL).href,
  name: 'Confido', legalName: 'Confido SDN BHD',
  url: new URL('/', SITE_URL).href,
  logo: new URL('/icon.png', SITE_URL).href,
  email: 'info@confido-agency.com',
  address: { '@type': 'PostalAddress', addressLocality: 'Kuala Lumpur', addressCountry: 'MY' },
  areaServed: ['MY', 'SA', 'SY', 'AE'], sameAs: SAME_AS,
};

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question', name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

export function serviceSchema(includeBrandServices = false) {
  const service = (name: string) => ({
    '@type': 'Service', name,
    provider: { '@id': ORGANIZATION['@id'] },
    areaServed: ['MY', 'SA', 'SY', 'AE'],
  });
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { ...service('Social Media Management'), offers: {
        '@type': 'Offer', price: 1000, priceCurrency: 'USD',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: 1000, priceCurrency: 'USD', unitText: 'MONTH' },
        url: new URL('/pricing', SITE_URL).href,
      } },
      ...(includeBrandServices ? ['Brand Strategy', 'Positioning', 'Brand Systems'].map(service) : []),
    ],
  };
}
