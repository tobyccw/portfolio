import React, { lazy, Suspense, useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation
} from 'react-router-dom';
import { motion } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';

import Header from './components/Header';
import projects from './data/projects';
import './App.css';

const CaseStudy = lazy(() => import('./pages/CaseStudy'));
const About     = lazy(() => import('./pages/About'));

const companies = [
  { name: 'Capital.com', logo: '/images/logo-capital.png' },
  { name: 'iFAST Global Bank', logo: '/images/logo-ifast.png' },
  { name: 'livi Bank', logo: '/images/logo-livi.png' },
  { name: 'HSBC', logo: '/images/logo-hsbc.png' },
  { name: 'MTR Hong Kong', logo: '/images/logo-mtr.png' },
  { name: 'South China Morning Post', logo: '/images/logo-scmp.png' },
  { name: 'Cathay Pacific', logo: '/images/logo-cathay.png' }
];

const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/tobyccw/' },
  { label: 'Email', href: 'mailto:tobyccw@gmail.com' },
  { label: 'Are.na', href: 'https://www.are.na/toby-c/channels' }
];

function ScrollToHash() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const id = hash.slice(1);
    const rafId = requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [hash, pathname]);

  return null;
}

/* ── Animation preset ──────────────────────────────────── */
const fadeUp = {
  initial:     { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.12 },
  transition:  { duration: 0.75, ease: [0.25, 0.1, 0.25, 1] },
};

function HomePage() {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const getTranslateX = (el) => new DOMMatrix(window.getComputedStyle(el).transform).m41;

    let startX = 0;
    let startTranslate = 0;
    let dragging = false;

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startTranslate = getTranslateX(track);
      // Fully remove the CSS animation so the inline transform can take effect.
      // (animationPlayState: paused still wins over inline style.transform)
      track.style.animation = 'none';
      track.style.transform = `translateX(${startTranslate}px)`;
      dragging = true;
    };

    const onTouchMove = (e) => {
      if (!dragging || e.touches.length !== 1) return;
      track.style.transform = `translateX(${startTranslate + e.touches[0].clientX - startX}px)`;
    };

    const onTouchEnd = () => {
      if (!dragging) return;
      dragging = false;
      // Calculate where we are within one loop cycle
      const halfWidth = track.scrollWidth / 2;
      let pos = getTranslateX(track) % halfWidth;
      if (pos > 0) pos -= halfWidth; // keep negative
      const delay = (pos / halfWidth) * 28; // negative seconds = start midway
      // Set the FULL animation shorthand so delay is never overridden by a
      // stale sub-property left behind from the earlier animation:none shorthand.
      track.style.transform = '';
      track.style.animation = `marquee-logos 28s linear ${delay}s infinite`;
    };

    track.addEventListener('touchstart', onTouchStart, { passive: true });
    track.addEventListener('touchmove', onTouchMove, { passive: true });
    track.addEventListener('touchend', onTouchEnd);
    return () => {
      track.removeEventListener('touchstart', onTouchStart);
      track.removeEventListener('touchmove', onTouchMove);
      track.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <div className="App">
      <Header navActive="home" />

      <section className="hero" id="home">
        <div className="container">
          <motion.h2
            className="hero-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span className="text-light">
              Product Designer. Connecting polished interfaces with meaningful
              experiences. Currently designing trading platforms at{' '}
            </span>
            <span className="text-bold">Capital.com</span>
            <span className="text-light">, serving 6M+ users globally.</span>
          </motion.h2>
        </div>
      </section>

      <section className="companies">
        <div className="container">
          <motion.h3 className="companies-intro" {...fadeUp}>
            <span className="text-light">
              Since 2011, I've designed digital products across finance, media,
              transport and more, crafting experiences that feel both{' '}
            </span>
            <span className="text-bold">intuitive</span>
            <span className="text-light"> and </span>
            <span className="text-bold">true to the brand</span>
            <span className="text-light">.</span>
          </motion.h3>

          <motion.div className="companies-logos" {...fadeUp}
            transition={{ duration: 0.75, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
          >
            <div className="companies-logos-track" ref={trackRef}>
              {companies.map((company, index) => (
                <div key={`a-${index}`} className="company-logo">
                  {company.logo && (
                    <img src={company.logo} alt={company.name} className="company-logo-img" loading="lazy" />
                  )}
                  <span className="company-name">{company.name}</span>
                </div>
              ))}
              {companies.map((company, index) => (
                <div key={`b-${index}`} className="company-logo company-logo-repeat" aria-hidden="true">
                  {company.logo && (
                    <img src={company.logo} alt="" className="company-logo-img" loading="lazy" />
                  )}
                  <span className="company-name">{company.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="works" id="work">
        <div className="container">
          <motion.h3 className="section-title" {...fadeUp}>Selected Works</motion.h3>

          <div className="works-grid">
            {projects.slice(0, 4).map((project, i) => {
              const card = (
                <motion.div
                  className="work-card"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.75, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.08 }}
                >
                  <div className="work-image">
                    {project.image ? (
                      <img src={project.image} alt={project.title} loading="lazy" />
                    ) : (
                      <div className="work-image-placeholder">
                        <span>{project.title}</span>
                      </div>
                    )}
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

              return project.available ? (
                <Link
                  key={project.slug}
                  to={`/work/${project.slug}`}
                  style={{
                    flex: 1,
                    alignSelf: 'stretch',
                    display: 'flex',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  {card}
                </Link>
              ) : (
                <React.Fragment key={project.slug}>{card}</React.Fragment>
              );
            })}
          </div>

          <motion.div {...fadeUp} transition={{ duration: 0.75, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}>
          <Link to="/work/livi-app-revamp" className="see-more">
            See more of my works
            <span className="see-more-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.2426 12.9393C16.8284 13.5251 16.8284 14.4748 16.2426 15.0606L9.87868 21.4246C9.2929 22.0104 8.34315 22.0104 7.75736 21.4246C7.17158 20.8388 7.17158 19.889 7.75736 19.3032L13.0607 13.9999L7.75736 8.69665C7.17158 8.11086 7.17158 7.16111 7.75736 6.57533C8.34315 5.98954 9.2929 5.98954 9.87868 6.57533L16.2426 12.9393Z" fill="currentColor" />
              </svg>
            </span>
          </Link>
          </motion.div>
        </div>
      </section>

      <section className="connect" id="connect">
        <div className="container">
          <motion.h3 className="section-title" {...fadeUp}>Let's connect!</motion.h3>
          <div className="social-links">
            {socialLinks.map(({ label, href }, i) => {
              const isExternal = href.startsWith('http');
              return (
                <motion.a
                  key={label}
                  href={href}
                  className="social-link"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.75, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.08 }}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noreferrer' : undefined}
                >
                  {label}
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about" id="about">
        <div className="container">
          <div className="about-content">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.75, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ position: 'absolute', top: 'clamp(40px, 6vh, 60px)', left: 24, zIndex: 2 }}
            >
            <Link to="/about" className="about-title" style={{ textDecoration: 'none', position: 'static' }}>
              About me
              <span className="about-arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.2426 12.9393C16.8284 13.5251 16.8284 14.4748 16.2426 15.0606L9.87868 21.4246C9.2929 22.0104 8.34315 22.0104 7.75736 21.4246C7.17158 20.8388 7.17158 19.889 7.75736 19.3032L13.0607 13.9999L7.75736 8.69665C7.17158 8.11086 7.17158 7.16111 7.75736 6.57533C8.34315 5.98954 9.2929 5.98954 9.87868 6.57533L16.2426 12.9393Z" fill="currentColor" />
                </svg>
              </span>
            </Link>
            </motion.div>
            <div
              className="about-image"
              style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/about_bg.jpg)` }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="App">
      <Header navActive="home" />
      <main className="cs-not-found">
        <h1>Page Not Found</h1>
        <p>The page you requested does not exist.</p>
        <Link to="/">Go to homepage</Link>
      </main>
    </div>
  );
}

function App() {
  // Prevent pinch-to-zoom site-wide.
  // viewport user-scalable=no is silently ignored by Safari iOS 10+ —
  // calling preventDefault() on touchmove is the only reliable block.
  useEffect(() => {
    const blockPinch = (e) => { if (e.touches.length > 1) e.preventDefault(); };
    document.addEventListener('touchmove', blockPinch, { passive: false });
    return () => document.removeEventListener('touchmove', blockPinch);
  }, []);

  return (
    <BrowserRouter>
      <ScrollToHash />
      <Suspense fallback={<div className="container" style={{ padding: '40px 24px' }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<About />} />
          <Route path="/work/:slug" element={<CaseStudy />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
