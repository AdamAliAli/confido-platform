export const metadata = { title: 'Privacy Policy — Confido' };

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#0b2420] px-6 py-12 text-white md:py-20">
      <article className="mx-auto max-w-[760px]">
        <a href="/" className="inline-block text-sm text-white/70 transition-colors hover:text-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b2420]">
          ← Back to home
        </a>

        <header className="mb-14 mt-12 md:mb-20">
          <h1 className="text-[40px] font-medium leading-tight tracking-[-0.04em] md:text-[64px]">Privacy Policy</h1>
          <p className="mt-5 text-sm text-white/60">Last updated: <time dateTime="2026-10-22">22 October 2026</time></p>
        </header>

        <div className="space-y-12 text-[16px] leading-relaxed text-white/85 md:space-y-14 md:text-[18px]">
          <section aria-labelledby="who-we-are">
            <h2 id="who-we-are" className="mb-4 text-2xl font-medium text-mint">Who we are</h2>
            <p>Confido SDN BHD is a company based in Malaysia. We handle personal data in accordance with Malaysia’s Personal Data Protection Act 2010 (PDPA). This policy explains how we collect, use and look after personal data through our website and communications.</p>
            <p className="mt-4">You can contact us about privacy at <a className="break-words text-mint underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint" href="mailto:admin@confido-agency.com">admin@confido-agency.com</a>.</p>
          </section>

          <section aria-labelledby="what-we-collect">
            <h2 id="what-we-collect" className="mb-4 text-2xl font-medium text-mint">What we collect</h2>
            <ul className="list-disc space-y-3 pl-6">
              <li>Emails you send us, including your email address and the information you choose to include.</li>
              <li>Your newsletter email address, if you subscribe.</li>
              <li>Basic server logs, such as your IP address and browser information, for security.</li>
            </ul>
            <p className="mt-4">We do not use tracking or advertising cookies.</p>
          </section>

          <section aria-labelledby="why-we-use-it">
            <h2 id="why-we-use-it" className="mb-4 text-2xl font-medium text-mint">Why we use it</h2>
            <p>We use your information to reply to your messages, send the newsletter you asked for, and keep our website secure.</p>
          </section>

          <section aria-labelledby="who-we-share-it-with">
            <h2 id="who-we-share-it-with" className="mb-4 text-2xl font-medium text-mint">Who we share it with</h2>
            <p>We share personal data only with service providers that host our website, database and media, as needed to operate these services. Some of these providers may store data outside Malaysia. We never sell your personal data.</p>
          </section>

          <section aria-labelledby="how-long-we-keep-it">
            <h2 id="how-long-we-keep-it" className="mb-4 text-2xl font-medium text-mint">How long we keep it</h2>
            <p>We keep your personal data until you unsubscribe or ask us to delete it. Basic server logs are kept for up to 90 days.</p>
          </section>

          <section aria-labelledby="your-rights">
            <h2 id="your-rights" className="mb-4 text-2xl font-medium text-mint">Your rights</h2>
            <p>You can ask to access, correct or delete your personal data. You can also withdraw your consent and unsubscribe from our newsletter at any time.</p>
            <p className="mt-4">To exercise these rights, email <a className="break-words text-mint underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint" href="mailto:admin@confido-agency.com">admin@confido-agency.com</a>.</p>
          </section>

          <section aria-labelledby="policy-changes">
            <h2 id="policy-changes" className="mb-4 text-2xl font-medium text-mint">Changes to this policy</h2>
            <p>We may update this policy from time to time. We will publish any changes on this page and update the “Last updated” date above.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
