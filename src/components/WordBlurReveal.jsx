import React from 'react';
import { motion } from 'framer-motion';

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
 * with opacity, translateY, rotate, and blur on mount.
 *
 * Preserves className from wrapper spans (e.g. text-light / text-bold),
 * so mixed-colour hero text keeps its styling word-by-word.
 *
 * Props
 *   children   ReactNode  — styled spans or plain text
 *   className  string     — applied to the rendered <h2>
 */
export function WordBlurReveal({ children, className }) {
  const wordList = React.Children.toArray(children).flatMap(extractWords);

  return (
    <h2 className={className}>
      {wordList.map(({ word, spanClass }, i) => {
        const animated = (
          <motion.span
            style={{ display: 'inline-block' }}
            initial={{ opacity: 0, y: 24, rotate: 6, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0,  rotate: 0, filter: 'blur(0px)' }}
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
    </h2>
  );
}
