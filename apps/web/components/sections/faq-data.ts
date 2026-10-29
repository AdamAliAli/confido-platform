import { SECTION_DEFAULTS } from '@/lib/section-defaults';

export type FAQ = { question: string; answer: string };
// FAQ content now lives with the other section defaults.
export const FAQS: FAQ[] = SECTION_DEFAULTS.faq.faqs;
