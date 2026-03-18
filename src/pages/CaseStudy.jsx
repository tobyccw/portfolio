import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import Header from '../components/Header';
import Footer from '../components/Footer';
import ShowcaseCarousel from '../components/ShowcaseCarousel';
import caseStudies from '../data/case-studies/index';
import projects from '../data/projects';
import useActiveSection from '../hooks/useActiveSection';

import '../css/case-study.css';

/* ── Animation preset ─────────────────────────────────── */
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
};

function renderInlineMarkdown(text) {
  if (typeof text !== 'string' || !text.length) return text;

  const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  const nodes = [];
  let lastIndex = 0;
  let tokenMatch;

  while ((tokenMatch = tokenRegex.exec(text)) !== null) {
    const [matched, , linkLabel, linkHref, boldText, italicText] = tokenMatch;
    const { index } = tokenMatch;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    if (linkLabel && linkHref) {
      nodes.push(
        <a
          key={`link-${index}`}
          href={linkHref}
          target="_blank"
          rel="noreferrer"
        >
          {linkLabel}
        </a>
      );
    } else if (boldText) {
      nodes.push(<strong key={`bold-${index}`}>{boldText}</strong>);
    } else if (italicText) {
      nodes.push(<em key={`italic-${index}`}>{italicText}</em>);
    } else {
      nodes.push(matched);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/* ── Sub-components ──────────────────────────────────────*/

/** Hover overlay with zoom icon — wraps a single image */
function ZoomWrapper({ src, onImageClick, children }) {
  return (
    <div
      className="cs-img-zoomable"
      onClick={() => onImageClick && src && onImageClick(src)}
    >
      {children}
      <div className="cs-img-zoom-badge">
        <img src="/images/icn_zoom.svg" alt="" className="cs-img-zoom-icon" aria-hidden="true" />
      </div>
    </div>
  );
}

/** Single full-width or dual side-by-side images */
function ImageBlock({ images, onImageClick }) {
  if (!images) return null;

  if (images.type === 'full') {
    const cls = `cs-block-image-full${images.border ? ' cs-img-bordered' : ''}`;
    return (
      <div className={cls}>
        {images.src
          ? (
            <ZoomWrapper src={images.src} onImageClick={onImageClick}>
              <img src={images.src} alt="" loading="lazy" />
            </ZoomWrapper>
          )
          : <div className="cs-img-placeholder" />
        }
      </div>
    );
  }

  // type === 'dual'
  const srcs = Array.isArray(images.src) ? images.src : [images.src];
  return (
    <div className="cs-block-images-dual">
      {srcs.map((src, i) => (
        <div key={i} className="cs-block-image-dual-item">
          {src
            ? (
              <ZoomWrapper src={src} onImageClick={onImageClick}>
                <img src={src} alt="" loading="lazy" />
              </ZoomWrapper>
            )
            : <div className="cs-img-placeholder" />
          }
        </div>
      ))}
    </div>
  );
}

/** One transformation block (text + image) */
function TransformationBlock({ data, onImageClick }) {
  return (
    <motion.div id={data.id} className="cs-block" {...fadeUp}>
      <div className="cs-block-text">
        <h3 className="cs-block-title">{renderInlineMarkdown(data.title)}</h3>
        <div className="cs-block-body">
          {data.content.map((para, i) => (
            <p key={i}>{renderInlineMarkdown(para)}</p>
          ))}
        </div>
      </div>
      <ImageBlock images={data.images} onImageClick={onImageClick} />
    </motion.div>
  );
}

/** Individual metric card */
function MetricCard({ data, index }) {
  return (
    <motion.div
      className="cs-metric-card"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.08 }}
    >
      <span className="cs-metric-number">{data.number}</span>
      <span className="cs-metric-label">{data.label}</span>
    </motion.div>
  );
}

// Fixed curated set — defines which 5 projects appear in the Other Works module
// and in what order. Excluding the current slug always leaves exactly 4.
const CURATED_SLUGS = [
  'capitalcom-app-evolution',
  'capitalcom-ai-graphics',
  'livi-app-revamp',
  'livi-invest',
  'livi-paylater',
];

/** Reusable selected-works grid */
function OtherWorksSection({ excludeSlug }) {
  const curatedProjects = CURATED_SLUGS
    .map(slug => projects.find(p => p.slug === slug))
    .filter(Boolean);

  // Current page is one of the curated 5 → show the other 4 in order
  // Otherwise (non-curated page, or no excludeSlug) → show first 4 of curated list
  const visible = (excludeSlug && CURATED_SLUGS.includes(excludeSlug))
    ? curatedProjects.filter(p => p.slug !== excludeSlug)
    : curatedProjects.slice(0, 4);

  return (
    <section className="cs-other-works">
      <div className="container">
        <h2 className="section-title">Other Selected Works</h2>
        <div className="works-grid">
          {visible.map((project) => {
            const card = (
              <motion.div
                className="work-card"
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="work-image">
                  {project.image
                    ? <img src={project.image} alt={project.title} loading="lazy" />
                    : <div className="work-image-placeholder"><span>{project.title}</span></div>
                  }
                  {!project.available && (
                    <div className="work-coming-soon">
                      <span>Coming Soon</span>
                    </div>
                  )}
                </div>
                <h4 className="work-title">{project.title}</h4>
                <p className="work-subtitle">{project.subtitle}</p>
              </motion.div>
            );

            return project.available
              ? (
                <Link key={project.slug} to={`/work/${project.slug}`} style={{ textDecoration: 'none' }}>
                  {card}
                </Link>
              )
              : <React.Fragment key={project.slug}>{card}</React.Fragment>;
          })}
        </div>
      </div>
    </section>
  );
}

/** Fullscreen lightbox overlay */
function Lightbox({ src, onClose }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    // Re-enable pinch-to-zoom inside the lightbox so users can inspect images.
    // Strategy: stop multi-touch touchmove events from bubbling to the
    // document-level blockPinch handler in App.jsx. With no preventDefault()
    // called, the browser allows its native pinch-zoom gesture.
    const el = containerRef.current;
    const allowPinch = (e) => { if (e.touches.length > 1) e.stopPropagation(); };
    el?.addEventListener('touchmove', allowPinch, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      el?.removeEventListener('touchmove', allowPinch);
    };
  }, [onClose]);

  return (
    <div ref={containerRef} className="cs-lightbox" onClick={onClose}>
      <button className="cs-lightbox-close" onClick={onClose} aria-label="Close lightbox">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <img
        src={src}
        alt=""
        className="cs-lightbox-img"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}

/* ── Password Gate ────────────────────────────────────────
   Overlays the full page (position:fixed, z-95) so the header
   (z-100) remains visible above it. On correct password the
   unlocked state is persisted in sessionStorage so the user
   doesn't need to re-enter within the same browser session.   */
function PasswordGate({ slug, password, onUnlock }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (value === password) {
      try { sessionStorage.setItem(`unlocked_${slug}`, '1'); } catch (_) {}
      onUnlock();
    } else {
      setError(true);
      setValue('');
    }
  };

  return (
    <div className="cs-password-gate">
      <div className="cs-password-panel">
        {/* mingcute:lock-line */}
        <svg className="cs-password-lock-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path d="M16 22v-6a8 8 0 1 1 16 0v6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="10" y="22" width="28" height="21" rx="4" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="24" cy="33" r="2.5" fill="currentColor" />
          <path d="M24 35.5v3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        <p className="cs-password-message">
          This project contains confidential work.{'\n'}
          Enter password to unlock.
        </p>

        <form className="cs-password-input-row" onSubmit={handleSubmit} noValidate>
          <input
            className="cs-password-input"
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            autoComplete="current-password"
            aria-label="Password"
          />
          <button
            type="submit"
            className={`cs-password-submit${value ? ' cs-password-submit--active' : ''}`}
            aria-label="Unlock"
          >
            {/* clarity:arrow-line */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 7l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>

        {error && <p className="cs-password-error">Incorrect password. Try again.</p>}
      </div>
    </div>
  );
}

/* ── Main CaseStudy page ─────────────────────────────────*/

function CaseStudy() {
  const { slug } = useParams();
  const data    = caseStudies[slug];
  // Thumbnail used for the mobile hero (same image as the Selected Works card)
  const project  = projects.find(p => p.slug === slug);

  // Password gate — stays locked until correct password is entered.
  // Uses sessionStorage so the user doesn't need to re-enter within the session.
  const [isLocked, setIsLocked] = useState(() => {
    if (!project?.password) return false;
    try { return !sessionStorage.getItem(`unlocked_${slug}`); } catch (_) { return true; }
  });

  // Always start at the top when the page loads or slug changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Mobile sticky anchor nav — visible only after the section heading
  // scrolls past the header, and hidden again once the section exits.
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(60);

  // Lightbox — null means closed; a src string means that image is open
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const transformationsSectionRef = useRef(null);

  useEffect(() => {
    const header = document.querySelector('.header');
    if (header) setHeaderHeight(header.offsetHeight);
  }, []);

  useEffect(() => {
    const section = transformationsSectionRef.current;
    if (!section) return;

    const update = () => {
      const sectionRect = section.getBoundingClientRect();
      // Find the section heading ("How I Built It") inside the section
      const headingEl = section.querySelector('.cs-sidebar-heading');
      const triggerRect = headingEl
        ? headingEl.getBoundingClientRect()
        : sectionRect;

      // Show: heading has scrolled above the header bottom AND the last
      // transformation block is still on screen (not scrolled past yet).
      const headingPast = triggerRect.bottom <= headerHeight;
      const lastId = data?.transformations?.[data.transformations.length - 1]?.id;
      const lastBlock = lastId ? document.getElementById(lastId) : null;
      const lastBlockVisible = lastBlock
        ? lastBlock.getBoundingClientRect().bottom > headerHeight
        : sectionRect.bottom > headerHeight;
      setShowMobileNav(headingPast && lastBlockVisible);
    };

    window.addEventListener('scroll', update, { passive: true });
    update(); // set correct initial state on mount / slug change
    return () => window.removeEventListener('scroll', update);
  }, [data, headerHeight]);

  // IDs for the transformation blocks (used by anchor nav + IntersectionObserver)
  const transformationIds = useMemo(
    () => data?.transformations?.map(t => t.id) || [],
    [data]
  );

  // On mobile, the sticky section nav sits below the header, so the effective
  // "scroll-to" offset is headerHeight + navHeight + 24px buffer. We pass this
  // as the trigger to useActiveSection so sections are marked active as soon as
  // they are scrolled into view (not only after they reach the header bottom).
  const [sectionTriggerY, setSectionTriggerY] = useState(80);
  useEffect(() => {
    const stickyNav = document.querySelector('.cs-mobile-transformations-nav');
    const navH = (showMobileNav && stickyNav) ? stickyNav.offsetHeight : 0;
    // Subtract 1 because useActiveSection adds 1 internally (triggerY = passed + 1)
    setSectionTriggerY(headerHeight + navH + 24 - 1);
  }, [showMobileNav, headerHeight]);

  const activeId = useActiveSection(transformationIds, sectionTriggerY);

  // When the active section changes, scroll its anchor tab to the left
  // edge of the mobile sticky nav so it's always visible.
  useEffect(() => {
    if (!activeId || !showMobileNav) return;
    const navLinks = document.querySelector('.cs-mob-nav-links');
    if (!navLinks) return;
    const activeLink = navLinks.querySelector(`[href="#${activeId}"]`);
    if (!activeLink) return;
    // Scroll so the active link aligns with the left padding of the nav
    navLinks.scrollTo({ left: activeLink.offsetLeft - 16, behavior: 'smooth' });
  }, [activeId, showMobileNav]);

  // Smooth-scroll to a transformation block when an anchor is clicked.
  // On mobile the sticky section nav sits below the header, so we add
  // its height to the scroll offset so the block isn't hidden behind it.
  const handleAnchorClick = useCallback((e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const header   = document.querySelector('.header');
    const stickyNav = document.querySelector('.cs-mobile-transformations-nav');
    const headerH  = header   ? header.offsetHeight   : 60;
    const navH     = stickyNav && showMobileNav ? stickyNav.offsetHeight : 0;
    const offset   = headerH + navH + 24;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }, [showMobileNav]);

  /* ── 404 state ──────────────────────────────────────── */
  if (!data) {
    return (
      <div className="App">
        <Header navActive="work" />
        <div className="cs-not-found">
          <h1>Case Study Not Found</h1>
          <p>This project doesn't have a case study yet.</p>
          <Link to="/#work">← Back to Selected Works</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="App">
      <Header navActive="work" />

      {/* Password gate — renders on top of everything (z-95, below header z-100) */}
      {isLocked && project?.password && (
        <PasswordGate
          slug={slug}
          password={project.password}
          onUnlock={() => setIsLocked(false)}
        />
      )}

      {/* ── Hero ─────────────────────────────────────── */}
      {/* Desktop: full hero_image. Mobile: project thumbnail (square full-bleed). */}
      <motion.section
        className="cs-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {(data.hero_image || project?.image)
          ? <>
              <img
                src={data.hero_image || project?.image}
                alt={data.title}
                loading="eager"
                className="cs-hero-img-desktop"
              />
              <img
                src={project?.image || data.hero_image}
                alt={data.title}
                loading="eager"
                className="cs-hero-img-mobile"
              />
            </>
          : <div className="cs-hero-placeholder"><span>{data.title}</span></div>
        }
      </motion.section>

      {/* ── Intro: Title & Meta ───────────────────────── */}
      {/* Figma "Led in": justify-between, left = title, right = Disciplines|MyRole|Year */}
      <section className="cs-intro">
        <div className="container">
          <div className="cs-intro-layout">
            {/* Left: title + subtitle */}
            <motion.div className="cs-title-block" {...fadeUp}>
              <h1 className="cs-title">{renderInlineMarkdown(data.title)}</h1>
              <p className="cs-subtitle">{renderInlineMarkdown(data.subtitle)}</p>
            </motion.div>

            {/* Right: Disciplines | My Role | Year — horizontal flex row, gap 48px */}
            <motion.div
              className="cs-meta-block"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
            >
              {/* Disciplines: label + tag pills */}
              <div className="cs-meta-group">
                <span className="cs-meta-label">Disciplines</span>
                <div className="cs-disciplines">
                  {data.disciplines.map(d => (
                    <span key={d} className="cs-tag">{d}</span>
                  ))}
                </div>
              </div>

              {/* My Role: label + value */}
              <div className="cs-meta-group">
                <span className="cs-meta-label">My Role</span>
                <span className="cs-meta-value">{renderInlineMarkdown(data.role)}</span>
              </div>

              {/* Year: label + value */}
              <div className="cs-meta-group">
                <span className="cs-meta-label">Year</span>
                <span className="cs-meta-value">{renderInlineMarkdown(data.year)}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Problem Statement ─────────────────────────── */}
      {data.problem_statement?.length > 0 && (
        <section className="cs-problem">
          <div className="container">
            <div className="cs-layout">
              {/* Left: section heading */}
              <motion.div className="cs-col-left" {...fadeUp}>
                <h2 className="cs-section-heading">What's wrong?</h2>
              </motion.div>

              {/* Right: body text */}
              <motion.div
                className="cs-col-right cs-body-text"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
              >
                {data.problem_statement.map((para, i) => (
                  <p key={i}>{renderInlineMarkdown(para)}</p>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ── Key Transformations ───────────────────────── */}
      {/* cs-sticky-layout makes left col stretch full height → enables position:sticky */}
      {/* Mobile sticky anchor nav — fixed below header while transformations section is on screen */}
      {data.transformations?.length > 0 && showMobileNav && (
        <nav
          className="cs-mobile-transformations-nav"
          style={{ top: headerHeight }}
          aria-label="Section navigation"
        >
          {/* Section heading row — "How I Built It" */}
          <div className="cs-mob-nav-heading">
            {data.transformations_heading || 'Key Transformations'}
          </div>
          {/* Anchor links row — horizontal scroll */}
          <div className="cs-mob-nav-links">
            {data.transformations.map(t => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={`cs-anchor-link${activeId === t.id ? ' active' : ''}`}
                onClick={e => handleAnchorClick(e, t.id)}
              >
                {t.title}
              </a>
            ))}
          </div>
        </nav>
      )}

      {data.transformations?.length > 0 && (
        <section ref={transformationsSectionRef} className="cs-transformations" id="transformations">
          <div className="container">
            <div className="cs-layout cs-sticky-layout">
              {/* Left: sticky sidebar with anchor nav */}
              <div className="cs-col-left">
                <div className="cs-sticky-sidebar">
                  <h2 className="cs-sidebar-heading">
                    {data.transformations_heading || 'Key Transformations'}
                  </h2>
                  <nav className="cs-anchor-nav" aria-label="Section navigation">
                    {data.transformations.map(t => (
                      <a
                        key={t.id}
                        href={`#${t.id}`}
                        className={`cs-anchor-link${activeId === t.id ? ' active' : ''}`}
                        onClick={e => handleAnchorClick(e, t.id)}
                      >
                        {t.title}
                      </a>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Right: transformation blocks */}
              <div className="cs-col-right cs-transformations-content">
                {data.transformations.map(t => (
                  <TransformationBlock key={t.id} data={t} onImageClick={setLightboxSrc} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Results / Metrics ────────────────────────── */}
      {data.metrics?.length > 0 && (
        <section className="cs-results">
          <div className="container">
            <div className="cs-layout">
              {/* Left: section heading */}
              <motion.div className="cs-col-left" {...fadeUp}>
                <h2 className="cs-section-heading">{data.results_heading}</h2>
              </motion.div>

              {/* Right: metric cards */}
              <div className="cs-col-right">
                <div className="cs-metrics-grid">
                  {data.metrics.map((m, i) => (
                    <MetricCard key={i} data={m} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Reflection ───────────────────────────────── */}
      {data.reflection && (
        <section className="cs-problem">
          <div className="container">
            <div className="cs-layout">
              <motion.div className="cs-col-left" {...fadeUp}>
                <h2 className="cs-section-heading">Reflection</h2>
              </motion.div>
              <motion.div
                className="cs-col-right cs-body-text"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
              >
                <p>{renderInlineMarkdown(data.reflection)}</p>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ── Showcase Screens ─────────────────────────── */}
      {data.showcase_screens?.length > 0 && (
        <section className="cs-showcase-section">
          <div className="container">
            <div className="cs-layout">
              {/* Left: section heading */}
              <motion.div className="cs-col-left" {...fadeUp}>
                <h2 className="cs-section-heading">
                  {data.showcase_heading || 'Showcase'}
                </h2>
              </motion.div>

              {/* Right: carousel */}
              <motion.div
                className="cs-col-right"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
              >
                <ShowcaseCarousel screens={data.showcase_screens} onImageClick={setLightboxSrc} />
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ── Other Selected Works ─────────────────────── */}
      <OtherWorksSection excludeSlug={slug} />

      {/* ── Footer ───────────────────────────────────── */}
      <Footer />

      {/* ── Lightbox ─────────────────────────────────── */}
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}

export default CaseStudy;
