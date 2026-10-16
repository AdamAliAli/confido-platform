'use client';

import { motion } from 'framer-motion';

const MAP_URL = 'https://maps.app.goo.gl/gvksn5TNcgMmMP2h7?g_st=ac';

const LOCATION_PHOTOS = [
  { src: 'https://lh3.googleusercontent.com/gps-cs-s/ANWiy9SNDoO_lBBIlrFalSBp_X6jNKlLydmaGwt2ri9OfoGBkmWu25hrz5T6ULSRKDkY_4G9j6YeGk_rY4Z0-s36MqC_chObCHi9PjxAM5pvgOYP7k8IPEiNTEWwLLcXffo07klTF8Q=s1200-k-no', alt: 'Confido brand identity workspace' },
  { src: '/images/location/reference-forest.png', alt: 'Sunlit forest landscape' },
  { src: '/images/location/reference-traveler.png', alt: 'Traveler walking through the city' },
] as const;

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

function LocationPhoto({ photo, index }: { photo: (typeof LOCATION_PHOTOS)[number]; index: number }) {
  return (
    <motion.figure className={`location-photo location-photo-${index + 1}`} {...reveal} transition={{ ...reveal.transition, delay: index * 0.08 }}>
      <div className="location-photo-frame">
        <motion.img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" whileHover={{ scale: 1.035 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </motion.figure>
  );
}

export function LocationSection() {
  return (
    <section id="about-us" className="location-section" aria-labelledby="location-heading">
      <div className="location-more">
        <i aria-hidden="true" />
        <span>MORE ABOUT US</span>
      </div>

      <div className="location-showcase">
        <div className="location-empty-cell" aria-hidden="true" />
        <LocationPhoto photo={LOCATION_PHOTOS[0]} index={0} />

        <motion.a className="location-place-card" href={MAP_URL} target="_blank" rel="noreferrer" aria-label="Open Confido Agency in Google Maps" {...reveal} transition={{ ...reveal.transition, delay: 0.08 }}>
          <span className="location-place-frame">
            <span className="location-place-label"><i aria-hidden="true" />OUR PLACE</span>
            <svg className="location-pin" viewBox="0 0 120 160" aria-hidden="true">
              <path d="M60 8C30.2 8 6 32.2 6 62c0 43.1 54 90 54 90s54-46.9 54-90C114 32.2 89.8 8 60 8Z" />
              <circle cx="60" cy="62" r="21" />
            </svg>
            <span className="location-address">
              <small>BASED IN MY</small>
              <strong id="location-heading">Kuala Lumpur,<br />Malaysia</strong>
              <em>VIEW ON MAPS ↗</em>
            </span>
          </span>
        </motion.a>

        <LocationPhoto photo={LOCATION_PHOTOS[1]} index={1} />
        <LocationPhoto photo={LOCATION_PHOTOS[2]} index={2} />
      </div>
    </section>
  );
}
