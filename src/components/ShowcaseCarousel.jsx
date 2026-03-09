import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

const GAP_FALLBACK = 16; // default gap — CSS may override on mobile (e.g. 8px)

/* ── Arrow icons ─────────────────────────────────────── */
function IconChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── ShowcaseCarousel ────────────────────────────────── */
/*
 * Layout: viewport = 8 cols (right column full width)
 *         current slide = 7/8 of viewport width
 *         peek = remaining 1/8 - gap/2 shows the leading edge of the next slide
 *
 * Infinite loop: clone array [last, ...original, first]
 *   pos=1 → first real slide. After animating to pos=0 (clone of last),
 *   silently snap to pos=total. Vice-versa at the right end.
 */
function ShowcaseCarousel({ screens }) {
  const total = screens.length;

  // Extended slides with head/tail clones for seamless infinite loop
  const slides = [screens[total - 1], ...screens, screens[0]];

  const [pos, setPos]         = useState(1);    // track position (1 = first real slide)
  const [animated, setAnimated] = useState(true); // CSS transition enabled
  const [slideW, setSlideW]   = useState(0);    // current slide pixel width

  const viewportRef = useRef(null);
  const trackRef    = useRef(null);
  const posRef      = useRef(1);          // always in sync with pos, readable without stale closure
  const moving      = useRef(false);
  const gapRef      = useRef(GAP_FALLBACK); // current gap read from CSS, updated on resize
  const touchStartX = useRef(null);        // x position of touch-start for swipe detection

  // Keep posRef current
  useEffect(() => { posRef.current = pos; }, [pos]);

  // Measure viewport and derive slide width: 7/8 of viewport - half of gap.
  // Gap is read from CSS (column-gap on .cs-showcase-track) so the JS step
  // stays in sync when the mobile stylesheet overrides gap to 8px.
  useEffect(() => {
    const measure = () => {
      if (!viewportRef.current || !trackRef.current) return;
      const cssGap = parseInt(getComputedStyle(trackRef.current).columnGap) || GAP_FALLBACK;
      gapRef.current = cssGap;
      setSlideW(viewportRef.current.offsetWidth * (7 / 8) - cssGap / 2);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, []);

  const step = slideW + gapRef.current; // pixels per slide advance

  // ── Navigation ───────────────────────────────────────
  const navigate = useCallback((dir) => {
    if (moving.current || slideW === 0) return;
    moving.current = true;
    setAnimated(true);
    setPos(p => {
      const next = p + dir;
      posRef.current = next;
      return next;
    });
  }, [slideW]);

  // ── Silent snap after landing on a clone ─────────────
  const snapTo = useCallback((target) => {
    setAnimated(false);
    requestAnimationFrame(() => {
      setPos(target);
      posRef.current = target;
      requestAnimationFrame(() => setAnimated(true));
    });
  }, []);

  const onTransitionEnd = useCallback((e) => {
    if (e.target !== trackRef.current) return; // ignore children
    moving.current = false;
    const p = posRef.current;
    if (p === 0)         snapTo(total);
    if (p === total + 1) snapTo(1);
  }, [total, snapTo]);

  // ── Touch / swipe ────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 30) return; // ignore taps / micro-drags
    navigate(dx < 0 ? 1 : -1);
  }, [navigate]);

  // ── Derived values ───────────────────────────────────
  let realIndex;
  if (pos === 0)         realIndex = total - 1;
  else if (pos === total + 1) realIndex = 0;
  else                   realIndex = pos - 1;

  const screen = screens[realIndex];

  return (
    <div className="cs-showcase">

      {/* ── Viewport (clips track, exposes peek) ────────── */}
      <div
        ref={viewportRef}
        className="cs-showcase-viewport"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        {/* Sliding track */}
        <div
          ref={trackRef}
          className="cs-showcase-track"
          style={{
            transform: slideW > 0 ? `translateX(${-pos * step}px)` : 'none',
            transition: animated && slideW > 0
              ? 'transform 0.48s cubic-bezier(0.4, 0, 0.2, 1)'
              : 'none',
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              className="cs-showcase-slide"
              style={slideW > 0 ? { width: slideW } : undefined}
            >
              <img src={slide.image} alt={slide.title} loading="lazy" />
            </div>
          ))}
        </div>

        {/* Blur-circle arrow buttons — anchored within the current slide */}
        <div className="cs-carousel-controls">
          <button className="cs-carousel-btn" onClick={() => navigate(-1)} aria-label="Previous slide">
            <IconChevronLeft />
          </button>
          <button className="cs-carousel-btn" onClick={() => navigate(1)} aria-label="Next slide">
            <IconChevronRight />
          </button>
        </div>

      </div>

      {/* ── Text — re-keyed per slide to retrigger fade+drop animation ── */}
      <motion.div
        key={realIndex}
        className="cs-showcase-text"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="cs-showcase-header">
          <h3 className="cs-showcase-title">{screen.title}</h3>
          <span className="cs-showcase-counter">{realIndex + 1} of {total}</span>
        </div>
        <p className="cs-showcase-caption">{screen.caption}</p>
      </motion.div>

    </div>
  );
}

export default ShowcaseCarousel;
