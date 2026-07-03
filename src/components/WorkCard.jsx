import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';

/* Home + About works-grid is flexbox — the link must stretch to fill the row.
   Case study Other Works uses CSS grid and passes its own linkStyle. */
const FLEX_LINK_STYLE = { flex: 1, alignSelf: 'stretch', display: 'flex', textDecoration: 'none', color: 'inherit' };

/**
 * One project card in a works grid — image, coming-soon badge, title, subtitle.
 * Wrapped in a Link when the project is available.
 *
 * Props
 *   project    object  — { slug, title, subtitle, image, available }
 *   entrance   object  — extra motion props (e.g. fadeUp spread + stagger delay);
 *                        spread last so they can override the hover defaults
 *   linkStyle  object  — style for the wrapping Link
 */
export function WorkCard({ project, entrance, linkStyle = FLEX_LINK_STYLE }) {
  const card = (
    <m.div
      className="work-card"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 200 }}
      {...entrance}
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
    </m.div>
  );

  return project.available
    ? <Link to={`/work/${project.slug}`} style={linkStyle}>{card}</Link>
    : card;
}
