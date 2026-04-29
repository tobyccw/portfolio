import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/* ── Animation constants (tweak here) ────────────────────── */
const STAGGER  = 0.06;   // seconds between each word
const DURATION = 0.6;    // seconds per word

/**
 * Extracts { word, spanClass } pairs from a React child.
 * Handles string children and single-level element children (e.g. <span className="text-bold">).
 */
function extractWords(child) {
  if (typeof child === 'string') {
    return child
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(word => ({ word, spanClass: null }));
  }

  if (!React.isValidElement(child)) return [];

  const spanClass = child.props.className || null;
  const kids      = child.props.children;

  // Flatten children to a single string (handles text + {' '} pairs)
  const text = typeof kids === 'string'
    ? kids
    : Array.isArray(kids)
      ? kids.map(k => (typeof k === 'string' ? k : '')).join('')
      : '';

  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => ({ word, spanClass }));
}

/**
 * WordBlurReveal — splits children text into words and animates each one
 * with opacity, translateY, rotate, and blur.
 *
 * Preserves className from wrapper spans (e.g. text-light / text-bold),
 * so mixed-colour text keeps its styling word-by-word.
 *
 * Props
 *   children   ReactNode  — styled spans or plain text
 *   className  string     — applied to the rendered heading element
 *   as         string     — HTML tag to render: 'h2' (default) or 'h3', etc.
 *   inView     boolean    — false (default): animate on mount (hero)
 *                           true: animate when scrolled into view
 */
export function WordBlurReveal({ children, className, as: Tag = 'h2', inView = false }) {
  const ref      = useRef(null);
  // amount: 0.12 mirrors the fadeUp viewport setting used elsewhere
  const visible  = useInView(ref, { once: true, amount: 0.12 });

  // If inView mode, wait until element enters viewport; otherwise fire immediately
  const shouldAnimate = inView ? visible : true;

  const wordList  = React.Children.toArray(children).flatMap(extractWords);
  const targetAnim = { opacity: 1, y: 0,  rotate: 0, filter: 'blur(0px)' };
  const hiddenAnim = { opacity: 0, y: 24, rotate: 6, filter: 'blur(8px)' };

  return (
    <Tag className={className} ref={ref}>
      {wordList.map(({ word, spanClass }, i) => {
        const animated = (
          <motion.span
            style={{ display: 'inline-block' }}
            initial={hiddenAnim}
            animate={shouldAnimate ? targetAnim : hiddenAnim}
            transition={{
              duration: DURATION,
              delay:    i * STAGGER,
              ease:     [0.25, 0.1, 0.25, 1],
            }}
          >
            {word}
          </motion.span>
        );

        return (
          <React.Fragment key={i}>
            {spanClass
              ? <span className={spanClass}>{animated}</span>
              : animated
            }
            {/* Plain space between words; omitted after the last word */}
            {i < wordList.length - 1 && ' '}
          </React.Fragment>
        );
      })}
    </Tag>
  );
}
