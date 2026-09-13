'use client';

import { motion, MotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';

const CLARITY_ART = 'https://framerusercontent.com/images/LtwdL5pxo7YbkmSPBJn6shHk9pw.png?width=2740&height=1683';

type RawMetric = {
  label?: unknown;
  value?: unknown;
  image?: unknown;
};

type Metric = {
  label: string;
  value: string;
  image: string;
};

const DEFAULT_METRICS: Metric[] = [
  { label: 'Strategic Partners', value: '98+', image: CLARITY_ART },
  { label: 'Value Created', value: '200M', image: CLARITY_ART },
  { label: 'Client Retention', value: '99%', image: CLARITY_ART },
];

function normalizeMetrics(data: Record<string, any>): Metric[] {
  const supplied = Array.isArray(data.metrics) ? data.metrics as RawMetric[] : [];
  const source = supplied.length ? supplied : DEFAULT_METRICS;

  return source.map((item, index) => {
    const fallback = DEFAULT_METRICS[index] ?? {
      label: `Metric ${index + 1}`,
      value: '0',
      image: CLARITY_ART,
    };

    return {
      label: typeof item.label === 'string' ? item.label : fallback.label,
      value: typeof item.value === 'string' || typeof item.value === 'number' ? String(item.value) : fallback.value,
      image: typeof item.image === 'string' && item.image.startsWith('http') ? item.image : fallback.image,
    };
  });
}

function splitMetric(value: string) {
  const match = value.trim().match(/^([\d,.]+)\s*(.*)$/);
  if (!match) return { target: 0, suffix: value, decimals: 0 };

  const numeric = Number(match[1].replace(/,/g, ''));
  const decimalPart = match[1].split('.')[1];
  return {
    target: Number.isFinite(numeric) ? numeric : 0,
    suffix: match[2],
    decimals: decimalPart?.length ?? 0,
  };
}

function AnimatedMetric({ value, progress, index }: { value: string; progress: MotionValue<number>; index: number }) {
  const { target, suffix, decimals } = splitMetric(value);
  const end = [0.48, 0.62, 0.54][index] ?? Math.min(0.48 + index * 0.07, 0.78);
  const raw = useTransform(progress, [0.22, end], [0, target], { clamp: true });
  const smooth = useSpring(raw, { stiffness: 115, damping: 28, mass: 0.45 });
  const display = useTransform(smooth, (current) => `${current.toFixed(decimals)}${suffix}`);

  return <motion.strong>{display}</motion.strong>;
}

function ClarityCard({
  metric,
  index,
  progress,
}: {
  metric: Metric;
  index: number;
  progress: MotionValue<number>;
}) {
  const [hovered, setHovered] = useState(false);
  const usesTriptych = metric.image === CLARITY_ART;

  return (
    <motion.article
      className="clarity-card"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, y: 45 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="clarity-card-art"
        style={{
          backgroundImage: `url("${metric.image}")`,
          backgroundPosition: usesTriptych ? `${index * 50}% center` : 'center',
          backgroundSize: usesTriptych ? `${Math.max(3, DEFAULT_METRICS.length) * 100}% auto` : 'cover',
        }}
        animate={{
          scale: hovered ? 1.16 : 1,
          filter: hovered ? 'blur(25px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
        role="img"
        aria-label={`Confido visual for ${metric.label}`}
      />
      <div className="clarity-card-copy">
        <span><i />{metric.label}</span>
        <AnimatedMetric value={metric.value} progress={progress} index={index} />
      </div>
    </motion.article>
  );
}

export function ClaritySection({ data }: { data: Record<string, any> }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const headingX = useTransform(scrollYProgress, [0.05, 0.58], ['10vw', '-17vw'], { clamp: true });
  const metrics = normalizeMetrics(data);

  return (
    <section id="clarity" className="clarity-section" ref={sectionRef} aria-labelledby="clarity-heading">
      <motion.h2 id="clarity-heading" className="clarity-heading" style={{ x: headingX }}>
        {typeof data.heading === 'string' ? data.heading : 'Built on Clarity — Built to Scale'}
      </motion.h2>

      <div className="clarity-grid">
        {metrics.map((metric, index) => (
          <ClarityCard
            key={`${metric.label}-${index}`}
            metric={metric}
            index={index}
            progress={scrollYProgress}
          />
        ))}
      </div>

      <a className="clarity-more" href={typeof data.ctaHref === 'string' ? data.ctaHref : '#about-us'}>
        <i /> {typeof data.ctaLabel === 'string' ? data.ctaLabel : 'MORE ABOUT US'}
      </a>
    </section>
  );
}
