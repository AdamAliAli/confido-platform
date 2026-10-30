import { PROJECT_IMAGES } from '../components/sections/constants';

// Shared public content and editor defaults. Edit text/images here, or save overrides in the CMS.
const CLARITY_ART = 'https://framerusercontent.com/images/LtwdL5pxo7YbkmSPBJn6shHk9pw.png?width=2740&height=1683';
export const SECTION_DEFAULTS = {
  hero: { eyebrow: 'Strategic brand consultancy', title: 'Brands', accent: 'With', subtitle: 'Direction', description: 'Confido helps businesses build clear positioning, strong direction, and scalable brand systems.', galleryImages: PROJECT_IMAGES },
  services: { services: [
    { title: 'Strategy', description: 'Clarity before complexity.' },
    { title: 'Positioning', description: 'Stand for something, or disappear.' },
    { title: 'Systems', description: 'Built to scale, built to last.' },
  ] },
  projects: { projects: [
  { title: 'Mathew Company Branding', category: 'Art Direction', image: PROJECT_IMAGES[0], year: '2023' },
  { title: 'Hilltodo Agency Branding', category: 'Marketing', image: PROJECT_IMAGES[1], year: '2023' },
  { title: 'Krea Klock Branding', category: 'Branding', image: PROJECT_IMAGES[2], year: '2023' },
] },
  clarity: { heading: 'Built on Clarity — Built to Scale', metrics: [
  { label: 'Strategic Partners', value: '98+', image: CLARITY_ART },
  { label: 'Value Created', value: '200M', image: CLARITY_ART },
  { label: 'Client Retention', value: '99%', image: CLARITY_ART },
] },
  location: { label: 'MORE ABOUT US', placeLabel: 'OUR PLACE', city: 'Kuala Lumpur, Malaysia', country: 'BASED IN MY', mapUrl: 'https://maps.app.goo.gl/gvksn5TNcgMmMP2h7?g_st=ac', photos: [
  { src: 'https://lh3.googleusercontent.com/gps-cs-s/ANWiy9SNDoO_lBBIlrFalSBp_X6jNKlLydmaGwt2ri9OfoGBkmWu25hrz5T6ULSRKDkY_4G9j6YeGk_rY4Z0-s36MqC_chObCHi9PjxAM5pvgOYP7k8IPEiNTEWwLLcXffo07klTF8Q=s1200-k-no', alt: 'Confido brand identity workspace' },
  { src: '/images/location/reference-forest.png', alt: 'Sunlit forest landscape' },
  { src: '/images/location/reference-traveler.png', alt: 'Traveler walking through the city' },
] },
  team: { label: 'TEAM MEMBERS' },
  process: { label: 'PROCESS', title: 'A Process Built', accent: 'on Clarity', steps: [
  {
    step: 'Step 1',
    title: 'Discover',
    description: 'We dive deep into your business, market, and gaps.',
    image: '/images/Process-1.avif',
  },
  {
    step: 'Step 2',
    title: 'Define',
    description: 'We build your positioning and strategic direction.',
    image: '/images/Process-2.avif',
  },
  {
    step: 'Step 3',
    title: 'Design',
    description: 'We translate strategy into a clear brand identity.',
    image: '/images/Process-3.avif',
  },
] },
  faq: { label: 'FAQ', title: 'Frequently', accent: 'Asked Questions', faqs: [
  {
    question: 'What do you actually do?',
    answer: 'We help businesses define their brand strategy, positioning, and direction before any design begins.',
  },
  {
    question: 'Do you only work on design?',
    answer: 'No. Design is the result. We focus on strategy first, then translate it into a clear brand system.',
  },
  {
    question: 'How do we start working together?',
    answer: 'We begin with a discovery call to understand your business, then define the right approach for your brand.',
  },
  {
    question: 'How long does a project take?',
    answer: 'It depends on the scope, but most projects range between 2–6 weeks.',
  },
  {
    question: 'Who do you work with?',
    answer: 'We work with businesses that are serious about building a strong and scalable brand.',
  },
  {
    question: 'What makes Confido different?',
    answer: 'We don’t start with design. We start with clarity — and build everything on top of it.',
  },
] },
  contact: { title: 'Let’s Build Something', accent: 'That Lasts', description: 'We work with a limited number of clients to ensure clarity, focus, and real impact.', email: 'info@confido-agency.com' },
};
