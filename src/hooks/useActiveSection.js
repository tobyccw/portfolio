import { useState, useEffect } from 'react';

/**
 * Tracks which section (by id) is active based on scroll position.
 * A section becomes active the moment its top edge reaches the header
 * bottom (triggerY). This gives the "just hit the top of the area" feel.
 *
 * @param {string[]} ids  - Ordered array of element IDs to track
 * @param {number}   headerHeight - Height of sticky header in px (default 80)
 */
function useActiveSection(ids, headerHeight = 80) {
  const [activeId, setActiveId] = useState(ids[0] || '');
  const idsKey = ids.join('|');

  useEffect(() => {
    if (!ids.length) return;
    setActiveId(ids[0]);

    // The trigger line: sections become active when their top edge
    // scrolls UP to this Y position (1px below the header bottom).
    const triggerY = headerHeight + 1;
    let rafId = 0;
    let ticking = false;

    function update() {
      // Walk sections top-to-bottom; keep advancing `current` as long
      // as a section's top has met or passed the trigger line.
      let current = ids[0];

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= triggerY) {
          current = id;   // this section has reached the top → make it active
        } else {
          break;          // sections below haven't arrived yet, stop early
        }
      }

      setActiveId(current);
    }

    function handleScroll() {
      if (ticking) return;
      ticking = true;
      rafId = window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    update(); // set correct initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [ids, idsKey, headerHeight]);

  return activeId;
}

export default useActiveSection;
