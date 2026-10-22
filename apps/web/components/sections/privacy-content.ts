export type PolicySection = { heading: string; paragraphs: string[]; bullets?: string[] };

// Update this date whenever you revise the policy below.
export const LAST_UPDATED = '22nd October 2026';

// Introductory text appears before the numbered content sections, without a heading.
export const POLICY_INTRO = 'At Confido SDN BHD, Malaysia, we value your privacy. This policy explains how we collect, use and protect your personal data in line with Malaysia’s Personal Data Protection Act 2010 (PDPA).';

// Edit the plain text here. Add paragraphs or optional bullets to any section.
// Sections appear in the order listed; email addresses become mailto links on the page.
export const POLICY_SECTIONS: PolicySection[] = [
  {
    heading: 'Information We Collect',
    paragraphs: [
      'We collect details you choose to send us by email, such as your name, email address, company and project details. If you subscribe to our newsletter, we collect your email address.',
      'We also keep basic server logs, including IP addresses, browser information and pages requested, for security. We do not collect sensitive personal data.',
    ],
  },
  {
    heading: 'How We Use Your Information',
    paragraphs: ['We use your information to reply to enquiries and deliver our services, send the newsletter you asked for, and keep our site secure.'],
    bullets: ['Reply to your enquiries', 'Send updates only with your consent', 'Your data is never sold or misused'],
  },
  {
    heading: 'Cookies and Tracking Technologies',
    paragraphs: ['We do not use advertising or tracking cookies. We use only what the site needs to work. If we add analytics later, we will update this policy first.'],
  },
  {
    heading: 'Sharing and Storage',
    paragraphs: [
      'We share personal data only with service providers that host our website, database and media. Some of these providers may store data outside Malaysia.',
      'Newsletter data is kept until you unsubscribe. Server logs are kept for up to 90 days.',
    ],
  },
  {
    heading: 'Your Rights and Choices',
    paragraphs: ['You can access, correct or delete your personal data, withdraw consent and unsubscribe at any time by emailing admin@confido-agency.com.'],
    bullets: ['Access, update, or delete your data', 'Unsubscribe from emails anytime', 'Full transparency and control'],
  },
  {
    heading: 'Changes to This Policy',
    paragraphs: ['We will post updates on this page and change the date above. If you have questions about this policy, contact admin@confido-agency.com.'],
  },
];
