import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import Header from '../components/Header';
import Footer from '../components/Footer';
import projects from '../data/projects';

import '../css/case-study.css';   /* footer + shared cs-* styles */
import '../css/about.css';

/* ── Animation preset ─────────────────────────────────── */
const fadeUp = {
  initial:     { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.12 },
  transition:  { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
};

/* ── Experience data ──────────────────────────────────── */
const experience = [
  {
    title:   'Senior Product Designer',
    company: 'Capital.com',
    period:  'May 2024 – Present',
  },
  {
    title:   'UX Manager',
    company: 'livi Bank Hong Kong',
    period:  'June 2020 – June 2023',
  },
  {
    title:   'Senior Product Designer II',
    company: 'South China Morning Post',
    period:  'June 2018 – June 2020',
  },
];

/* ── About page ───────────────────────────────────────── */
function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  /* Show first 4 curated projects — same as homepage */
  const visibleProjects = projects.slice(0, 4);

  return (
    <div className="App">
      <Header navActive="about" />

      {/* ── Hero / Profile ──────────────────────────── */}
      <motion.section
        className="about-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <img
          src="/images/about_bg.jpg"
          alt="Toby Cheng"
          className="about-hero-img"
          loading="eager"
        />

        {/* Statement overlay */}
        <motion.div
          className="about-statement"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
        >
          <h1 className="about-statement-title">
            Elevating the user experience from accessible to remarkable
          </h1>
          <p className="about-statement-body">
            Good UX is expected. Products that feel frictionless are everywhere.
            But when every app follows the same best practices, they start to look
            and feel the same. I believe the best digital products go further. They
            carry the brand's identity into every interaction, so the experience
            doesn't just work well, it feels like it belongs to that company and no
            one else. That's what I design for.
          </p>
        </motion.div>
      </motion.section>

      {/* ── Recent Adventure ─────────────────────────── */}
      <section className="about-adventure">
        <div className="container">
          <motion.h2 className="about-adventure-heading" {...fadeUp}>
            Recent adventure
          </motion.h2>

          <div className="about-adventure-list">
            {experience.map((job, i) => (
              <motion.div
                key={job.company}
                className="about-adventure-row"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.07 }}
              >
                <div className="about-adventure-info">
                  <span className="about-adventure-title">{job.title}</span>
                  <span className="about-adventure-company">{job.company}</span>
                </div>
                <span className="about-adventure-period">{job.period}</span>
              </motion.div>
            ))}
          </div>

          <motion.a
            href="https://www.linkedin.com/in/tobyccw/"
            target="_blank"
            rel="noreferrer"
            className="btn-connect"
            style={{ textDecoration: 'none', display: 'inline-flex' }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400 }}
            {...{ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, amount: 0.2 },
                  transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.22 } }}
          >
            See my full CV
          </motion.a>
        </div>
      </section>

      {/* ── Selected Works ────────────────────────────── */}
      <section className="about-works">
        <div className="container">
          <motion.h2 className="about-works-heading" {...fadeUp}>
            Selected Works
          </motion.h2>

          <div className="works-grid">
            {visibleProjects.map((project, i) => {
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
                  <Link
                    key={project.slug}
                    to={`/work/${project.slug}`}
                    style={{ flex: 1, alignSelf: 'stretch', display: 'flex', textDecoration: 'none', color: 'inherit' }}
                  >
                    {card}
                  </Link>
                )
                : <React.Fragment key={project.slug}>{card}</React.Fragment>;
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <Footer />
    </div>
  );
}

export default About;
