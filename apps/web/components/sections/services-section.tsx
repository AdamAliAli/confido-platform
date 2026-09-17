'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useState } from 'react';

type Service = { title: string; description: string; icon: string };

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const x = useSpring(cursorX, { stiffness: 90, damping: 24, mass: 0.9 });
  const y = useSpring(cursorY, { stiffness: 90, damping: 24, mass: 0.9 });
  const [hovered, setHovered] = useState(false);

  const moveCursor = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    cursorX.set(event.clientX - bounds.left);
    cursorY.set(event.clientY - bounds.top);
  };

  return (
    <motion.article
      className="expertise-card"
      onPointerEnter={(event) => { moveCursor(event); if (event.pointerType !== 'touch') setHovered(true); }}
      onPointerMove={moveCursor}
      onPointerLeave={() => setHovered(false)}
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="expertise-card-top">
        <span>Service 0{index + 1}</span>
        <span className="expertise-icon" aria-hidden="true">{service.icon}</span>
      </div>
      <div className="expertise-card-copy">
        <h3>{service.title}</h3>
        <p>{service.description}</p>
      </div>
      <motion.span
        className="expertise-cursor"
        aria-hidden="true"
        style={{ x, y }}
        initial={false}
        animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.6 }}
        transition={{ opacity: { duration: 0.24 }, scale: { duration: 0.3 } }}
      >↗</motion.span>
    </motion.article>
  );
}

export function ServicesSection({ data }: { data: Record<string, any> }) {
  const fallback: Service[] = [
    { title: 'Strategy', description: 'Clarity before complexity.', icon: '✳' },
    { title: 'Positioning', description: 'Stand for something, or disappear.', icon: '✎' },
    { title: 'Systems', description: 'Built to scale, built to last.', icon: '◇' },
  ];
  const services: Service[] = Array.isArray(data.services) && data.services.length
    ? data.services.slice(0, 3).map((item: any, index: number) => ({
        title: typeof item?.title === 'string' ? item.title : fallback[index].title,
        description: typeof item?.description === 'string' ? item.description : fallback[index].description,
        icon: fallback[index].icon,
      }))
    : fallback;

  return (
    <section id="services" className="expertise-section" aria-labelledby="expertise-title">
      <div className="expertise-heading">
        <motion.span className="expertise-kicker" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <i /> OUR SERVICES
        </motion.span>
        <motion.h2 id="expertise-title" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          What<br /><span>Our Expertise</span>
        </motion.h2>
      </div>
      <div className="expertise-grid">
        {services.map((service, index) => <ServiceCard key={service.title} service={service} index={index} />)}
      </div>
    </section>
  );
}
