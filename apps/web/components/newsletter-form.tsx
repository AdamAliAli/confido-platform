'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { API } from '@/lib/api';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);

  async function subscribe() {
    setPending(true);
    setMessage('');
    setFailed(false);
    try {
      const response = await fetch(`${API}/newsletter`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) throw new Error(response.status === 429 ? 'Too many attempts. Please try again in a minute.' : 'Could not subscribe. Please try again.');
      setMessage("Thanks, you're subscribed.");
      setEmail('');
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Could not subscribe. Please try again.');
    } finally { setPending(false); }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); if (!pending) void subscribe(); }}>
      <div className="mt-8 flex h-14 border-b border-white/[0.06] md:mt-10 md:h-[60px]">
        <input type="email" aria-label="Email address for newsletter" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending} placeholder="Enter Your Email" className="min-w-0 flex-1 bg-transparent pr-4 text-[16px] text-white opacity-100 placeholder:text-white disabled:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint md:text-[18px]" />
        <button type="submit" disabled={pending} aria-label={pending ? 'Subscribing…' : 'Subscribe to newsletter'} className="grid aspect-square h-full shrink-0 place-items-center bg-mint text-[#070908] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white">
          <ArrowRight className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
      {message && <p role={failed ? 'alert' : 'status'} className={`mt-4 text-[14px] ${failed ? 'text-red-300' : 'text-mint'}`}>{message}</p>}
    </form>
  );
}
