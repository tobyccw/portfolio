import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import Header from '../components/Header';
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

/** Site footer */
function Footer() {
  return (
    <footer className="cs-footer">
      <div className="container">
        <div className="cs-footer-inner">
          <div className="cs-footer-top">
            <Link to="/" className="cs-footer-brand">Toby Cheng</Link>

            <nav className="cs-footer-nav">
              <Link to="/#home">Home</Link>
              <Link to="/#work">Works</Link>
              <Link to="/#about">About</Link>
            </nav>
          </div>

          <div className="cs-footer-social">
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/tobyccw/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="cs-footer-icon"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.0585 1.66662H2.9418C2.78311 1.66442 2.62555 1.69349 2.4781 1.75219C2.33066 1.81089 2.19622 1.89805 2.08246 2.00871C1.96871 2.11937 1.87786 2.25136 1.81512 2.39713C1.75238 2.5429 1.71897 2.6996 1.7168 2.85829V17.1416C1.71897 17.3003 1.75238 17.457 1.81512 17.6028C1.87786 17.7486 1.96871 17.8805 2.08246 17.9912C2.19622 18.1019 2.33066 18.189 2.4781 18.2477C2.62555 18.3064 2.78311 18.3355 2.9418 18.3333H17.0585C17.2171 18.3355 17.3747 18.3064 17.5222 18.2477C17.6696 18.189 17.804 18.1019 17.9178 17.9912C18.0316 17.8805 18.1224 17.7486 18.1851 17.6028C18.2479 17.457 18.2813 17.3003 18.2835 17.1416V2.85829C18.2813 2.6996 18.2479 2.5429 18.1851 2.39713C18.1224 2.25136 18.0316 2.11937 17.9178 2.00871C17.804 1.89805 17.6696 1.81089 17.5222 1.75219C17.3747 1.69349 17.2171 1.66442 17.0585 1.66662ZM6.7418 15.6166H4.2418V8.11662H6.7418V15.6166ZM5.4918 7.06662C5.14702 7.06662 4.81636 6.92966 4.57256 6.68586C4.32876 6.44206 4.1918 6.1114 4.1918 5.76662C4.1918 5.42184 4.32876 5.09118 4.57256 4.84738C4.81636 4.60358 5.14702 4.46662 5.4918 4.46662C5.67488 4.44586 5.86028 4.464 6.03586 4.51986C6.21144 4.57571 6.37325 4.66803 6.51068 4.79076C6.64811 4.91348 6.75807 5.06385 6.83336 5.23202C6.90864 5.40019 6.94756 5.58237 6.94756 5.76662C6.94756 5.95087 6.90864 6.13305 6.83336 6.30122C6.75807 6.46939 6.64811 6.61976 6.51068 6.74249C6.37325 6.86521 6.21144 6.95753 6.03586 7.01338C5.86028 7.06924 5.67488 7.08738 5.4918 7.06662ZM15.7585 15.6166H13.2585V11.5916C13.2585 10.5833 12.9001 9.92495 11.9918 9.92495C11.7107 9.92701 11.437 10.0152 11.2075 10.1776C10.978 10.34 10.8039 10.5688 10.7085 10.8333C10.6433 11.0292 10.615 11.2354 10.6251 11.4416V15.6083H8.12513V8.10829H10.6251V9.16662C10.8522 8.77254 11.1826 8.44789 11.5805 8.22762C11.9784 8.00736 12.4289 7.89983 12.8835 7.91662C14.5501 7.91662 15.7585 8.99162 15.7585 11.3V15.6166Z" fill="currentColor"/>
              </svg>
            </a>

            {/* Mail */}
            <a href="mailto:tobyccw@gmail.com" aria-label="Email" className="cs-footer-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.3332 5.8335L10.8407 10.606C10.5864 10.7537 10.2976 10.8315 10.0036 10.8315C9.70956 10.8315 9.42076 10.7537 9.1665 10.606L1.6665 5.8335" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.6665 3.3335H3.33317C2.4127 3.3335 1.6665 4.07969 1.6665 5.00016V15.0002C1.6665 15.9206 2.4127 16.6668 3.33317 16.6668H16.6665C17.587 16.6668 18.3332 15.9206 18.3332 15.0002V5.00016C18.3332 4.07969 17.587 3.3335 16.6665 3.3335Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>

            {/* Are.na */}
            <a
              href="https://www.are.na/toby-c/channels"
              target="_blank"
              rel="noreferrer"
              aria-label="Are.na"
              className="cs-footer-icon"
            >
              <svg width="26" height="20" viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24.7682 12.8105L21.4412 10.2328C21.2376 10.0754 21.2376 9.8171 21.4412 9.6593L24.7684 7.08224C24.9727 6.92459 25.058 6.65823 24.9583 6.49068C24.8584 6.32359 24.5794 6.26412 24.3391 6.35852L20.3828 7.912C20.1423 8.00734 19.9157 7.87738 19.8796 7.62408L19.2847 3.46035C19.248 3.2072 19.0548 3 18.8549 3C18.6559 3 18.4629 3.2072 18.4272 3.46019L17.8319 7.62424C17.7955 7.87754 17.5692 8.00718 17.3284 7.91215L13.4375 6.38448C13.1962 6.28977 12.8032 6.28977 12.5625 6.38448L8.67103 7.91215C8.43036 8.00718 8.20375 7.87754 8.16768 7.62424L7.5732 3.46019C7.53649 3.2072 7.34371 3 7.14454 3C6.94473 3 6.75146 3.2072 6.71556 3.46019L6.12028 7.62424C6.08421 7.87754 5.85775 8.00718 5.61709 7.91215L1.66098 6.35899C1.42047 6.26412 1.14198 6.32391 1.04208 6.49084C0.942335 6.65855 1.0274 6.92507 1.23104 7.0824L4.55852 9.65946C4.76232 9.81726 4.76232 10.0756 4.55852 10.2331L1.23104 12.8105C1.02676 12.9681 0.942176 13.2504 1.04176 13.4373C1.14182 13.6245 1.42031 13.6997 1.6605 13.6047L5.58118 12.0524C5.82216 11.9576 6.04623 12.0867 6.0799 12.34L6.64549 16.5401C6.67965 16.793 6.90371 17 7.14342 17C7.38281 17 7.60703 16.7931 7.64134 16.5401L8.20789 12.34C8.24141 12.0867 8.46643 11.9577 8.70614 12.0524L12.5625 13.5782C12.8029 13.6736 13.1961 13.6736 13.4366 13.5782L17.2923 12.0524C17.5323 11.9576 17.7567 12.0867 17.791 12.34L18.3576 16.5401C18.3914 16.793 18.6157 17 18.8547 17C19.0944 17 19.3187 16.7931 19.3526 16.5401L19.9192 12.34C19.9537 12.0867 20.1777 11.9577 20.4178 12.0524L24.3389 13.6047C24.5783 13.6997 24.8576 13.6243 24.9575 13.4374C25.0576 13.2508 24.9725 12.9686 24.7684 12.8109L24.7682 12.8105ZM16.3035 10.2655L13.3734 12.4894C13.1683 12.6451 12.8319 12.6451 12.6275 12.4894L9.6964 10.2655C9.49149 10.1097 9.48989 9.85329 9.69321 9.69517L12.6297 7.41499C12.833 7.25687 13.1664 7.25687 13.3699 7.41499L16.3064 9.69517C16.5102 9.85313 16.5086 10.1096 16.3032 10.2657L16.3035 10.2655Z" fill="currentColor"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
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

/* ── Main CaseStudy page ─────────────────────────────────*/

function CaseStudy() {
  const { slug } = useParams();
  const data    = caseStudies[slug];
  // Thumbnail used for the mobile hero (same image as the Selected Works card)
  const project  = projects.find(p => p.slug === slug);

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
