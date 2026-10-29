'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import { API } from '@/lib/api';
import { INQUIRY_INTERESTS } from '@/lib/inquiries';

const inputStyle = 'w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-[14px] text-white outline-none placeholder:text-white/40 focus:border-mint focus:ring-0 disabled:opacity-60';

export function ContactForm({ initialInterest = '' }: { initialInterest?: string }) {
  const prefix = useId();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState<string>(INQUIRY_INTERESTS.some(value => value === initialInterest) ? initialInterest : '');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const validity = (field: string, value: boolean) => setInvalid(current => ({ ...current, [field]: value }));

  async function send() {
    if (pending) return;
    if (message.trim().length < 10) { validity('message', true); setError('Please add at least 10 characters about your project.'); return; }
    setPending(true); setError('');
    try {
      const response = await fetch(`${API}/inquiries`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim() || undefined, interest, message: message.trim(), website }),
      });
      if (!response.ok) { setError(response.status === 429 ? 'Too many attempts. Please try again in a minute.' : 'Could not send your message. Please try again.'); return; }
      const result = await response.json();
      if (result.ok !== true) throw new Error();
      setSuccess(true);
    } catch { setError('Could not send your message. Please try again.'); }
    finally { setPending(false); }
  }

  return (
    <section id="contact-form" aria-labelledby={`${prefix}-heading`} className="grid gap-16 bg-[#0b2420] px-6 py-[90px] text-white md:grid-cols-2 md:px-[50px]">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em]"><span className="h-2 w-2 bg-mint" aria-hidden="true" />CONTACT FORM</div>
        <h2 id={`${prefix}-heading`} className="mt-10 break-words text-[clamp(40px,4vw,64px)] font-light leading-tight tracking-[-0.04em]">
          <span className="block">Get in Touch</span><span className="block font-semibold text-mint">With Confido</span>
        </h2>
        <Image src="/images/ribbon.webp" width={90} height={88} alt="" aria-hidden="true" className="mt-10 h-auto w-[90px] -rotate-[10deg] -scale-x-100" />
      </div>
      <div className="min-w-0 md:w-full md:max-w-[520px] md:justify-self-end">
        {success ? <p role="status" className="text-xl leading-relaxed text-mint">Thanks, we&apos;ll get back to you within 2 working days.</p> : <form onSubmit={event => { event.preventDefault(); void send(); }}>
          <fieldset disabled={pending} className="space-y-8">
            <div><label htmlFor={`${prefix}-email`} className="block text-[14px] font-medium">Your Email</label>
              <input id={`${prefix}-email`} name="email" type="email" autoComplete="email" required maxLength={254} placeholder="Your Email" className={inputStyle} value={email} aria-invalid={!!invalid.email} onInvalid={() => validity('email', true)} onChange={event => { setEmail(event.target.value); validity('email', false); }} /></div>
            <div><label htmlFor={`${prefix}-phone`} className="block text-[14px] font-medium">Your Phone <span className="font-normal text-white/50">(optional)</span></label>
              <input id={`${prefix}-phone`} name="phone" type="tel" autoComplete="tel" maxLength={30} pattern="[0-9 +\(\)\-]*" placeholder="Your Phone" className={inputStyle} value={phone} aria-invalid={!!invalid.phone} onInvalid={() => validity('phone', true)} onChange={event => { setPhone(event.target.value); validity('phone', false); }} /></div>
            <div><label htmlFor={`${prefix}-interest`} className="block text-[14px] font-medium">I&apos;m interested in…</label>
              <select id={`${prefix}-interest`} name="interest" required className={`${inputStyle} cursor-pointer`} value={interest} aria-invalid={!!invalid.interest} onInvalid={() => validity('interest', true)} onChange={event => { setInterest(event.target.value); validity('interest', false); }}>
                <option value="" disabled className="bg-[#0b2420]">Select</option>
                {INQUIRY_INTERESTS.map(value => <option key={value} value={value} className="bg-[#0b2420] text-white">{value}</option>)}
              </select></div>
            <div><label htmlFor={`${prefix}-message`} className="block text-[14px] font-medium">More About The Project</label>
              <textarea id={`${prefix}-message`} name="message" required minLength={10} maxLength={3000} rows={5} placeholder="Type Here…" className={`${inputStyle} resize-y`} value={message} aria-invalid={!!invalid.message} onInvalid={() => validity('message', true)} onChange={event => { setMessage(event.target.value); validity('message', false); }} /></div>
            <div className="sr-only" aria-hidden="true"><label htmlFor={`${prefix}-website`}>Leave this field empty</label><input id={`${prefix}-website`} name="website" tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></div>
            <button type="submit" disabled={pending} className="h-12 w-full bg-mint text-[14px] font-medium text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b2420] disabled:opacity-60">{pending ? 'Sending…' : 'Submit'}</button>
          </fieldset>
          {error && <p role="alert" className="mt-4 text-[14px] text-red-300">{error}</p>}
        </form>}
      </div>
    </section>
  );
}
