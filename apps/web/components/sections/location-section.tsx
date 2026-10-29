'use client';

import { SECTION_DEFAULTS } from '@/lib/section-defaults';


import { motion } from 'framer-motion';
import { imageUrl, safeHref, siteImage, text } from '@/lib/media-url';

const MAP_URL = SECTION_DEFAULTS.location.mapUrl;

const LOCATION_PHOTOS = SECTION_DEFAULTS.location.photos;

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

function LocationPhoto({ photo, index }: { photo: { src: string; alt: string }; index: number }) {
  return (
    <motion.figure className={`location-photo location-photo-${index + 1}`} {...reveal} transition={{ ...reveal.transition, delay: index * 0.08 }}>
      <div className="location-photo-frame">
        <motion.img src={siteImage(photo.src, 1000)} alt={photo.alt} loading="lazy" decoding="async" whileHover={{ scale: 1.035 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </motion.figure>
  );
}

export function LocationSection({ data = {} }: { data?: Record<string, unknown> }) {
  const supplied = Array.isArray(data.photos) ? data.photos : [];
  const photos = LOCATION_PHOTOS.map((fallback, index) => ({
    src: imageUrl(supplied[index]?.src, fallback.src),
    alt: text(supplied[index]?.alt, fallback.alt),
  }));
  const city = text(data.city, SECTION_DEFAULTS.location.city);
  const cityParts = city.split(/,\s*/);
  const mapUrl = safeHref(text(data.mapUrl, MAP_URL));
  return (
    <section id="about-us" className="location-section" aria-labelledby="location-heading">
      <div className="location-more">
        <i aria-hidden="true" />
        <span>{text(data.label, SECTION_DEFAULTS.location.label)}</span>
      </div>

      <div className="location-showcase">
        <LocationPhoto photo={photos[0]} index={0} />

        <motion.a className="location-place-card" href={mapUrl} target="_blank" rel="noreferrer" aria-label="Open Confido Agency in Google Maps" {...reveal} transition={{ ...reveal.transition, delay: 0.08 }}>
          <span className="location-place-frame">
            <span className="location-place-label"><i aria-hidden="true" />{text(data.placeLabel, SECTION_DEFAULTS.location.placeLabel)}</span>
            <svg className="location-pin" viewBox="0 0 120 160" aria-hidden="true">
              <path d="M60 8C30.2 8 6 32.2 6 62c0 43.1 54 90 54 90s54-46.9 54-90C114 32.2 89.8 8 60 8Z" />
              <circle cx="60" cy="62" r="21" />
            </svg>
            <span className="location-address">
              <small>{text(data.country, SECTION_DEFAULTS.location.country)}</small>
              <strong id="location-heading">{cityParts.map((part, index) => <span key={index}>{index > 0 && <br />}{part}{index < cityParts.length - 1 ? ',' : ''}</span>)}</strong>
              <em>VIEW ON MAPS ↗</em>
            </span>
          </span>
        </motion.a>

        <LocationPhoto photo={photos[1]} index={1} />
        <LocationPhoto photo={photos[2]} index={2} />
      </div>
    </section>
  );
}
