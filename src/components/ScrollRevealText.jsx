import React, { useMemo, useRef } from 'react';
import { m, useScroll, useTransform, useReducedMotion } from 'framer-motion';

import { tokenizeParagraph } from '../utils/markdown';

/* ── AnimatedWord — must be its own component so useTransform (hook) can be called ── */
function AnimatedWord({ scrollYProgress, wordIndex, totalWords, scrollStart, scrollWindow, colorMuted, colorActive, children }) {
  const t0 = scrollStart + (wordIndex / totalWords) * scrollWindow;
  const t1 = scrollStart + ((wordIndex + 1) / totalWords) * scrollWindow;
  const color = useTransform(scrollYProgress, [t0, t1], [colorMuted, colorActive]);
  return <m.span style={{ color }}>{children}</m.span>;
}

/* ── ScrollRevealText ─────────────────────────────────────────────────────────── */
/**
 * Renders paragraphs of text where each word progressively shifts from
 * colorMuted → colorActive as the element travels through the viewport.
 * Directly scrubbed to scroll position (no one-shot trigger).
 *
 * Supports inline markdown: **bold**, *italic*, [label](url)
 */
export const ScrollRevealText = React.memo(function ScrollRevealText({
  paragraphs,
  className,
  colorMuted  = '#aaa',
  colorActive = '#111',
  scrollStart = 0.15,
  scrollWindow = 0.55,
}) {
  const containerRef        = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] });

  const { paragraphTokens, totalWords } = useMemo(() => {
    const tokens = paragraphs.map(p => tokenizeParagraph(p));
    return {
      paragraphTokens: tokens,
      totalWords: tokens.flat().filter(t => t.type !== 'space').length,
    };
  }, [paragraphs]);

  // Reduced-motion: render static text with markdown preserved, no animation
  if (prefersReducedMotion) {
    return (
      <div className={className} ref={containerRef}>
        {paragraphTokens.map((tokens, pIdx) => (
          <p key={pIdx}>
            {tokens.map((token, tIdx) => {
              if (token.type === 'space')   return <React.Fragment key={tIdx}>{token.text}</React.Fragment>;
              if (token.type === 'bold')    return <strong key={tIdx}>{token.text}</strong>;
              if (token.type === 'italic')  return <em key={tIdx}>{token.text}</em>;
              if (token.type === 'link')    return <a key={tIdx} href={token.href} target="_blank" rel="noreferrer">{token.text}</a>;
              return <React.Fragment key={tIdx}>{token.text}</React.Fragment>;
            })}
          </p>
        ))}
      </div>
    );
  }

  let wordCounter = 0;

  return (
    <div className={className} ref={containerRef}>
      {paragraphTokens.map((tokens, pIdx) => (
        <p key={pIdx}>
          {tokens.map((token, tIdx) => {
            if (token.type === 'space') return <React.Fragment key={tIdx}>{token.text}</React.Fragment>;

            const idx     = wordCounter++;
            const animWord = (
              <AnimatedWord
                scrollYProgress={scrollYProgress}
                wordIndex={idx}
                totalWords={totalWords}
                scrollStart={scrollStart}
                scrollWindow={scrollWindow}
                colorMuted={colorMuted}
                colorActive={colorActive}
              >
                {token.text}
              </AnimatedWord>
            );

            if (token.type === 'bold')   return <strong key={tIdx}>{animWord}</strong>;
            if (token.type === 'italic') return <em key={tIdx}>{animWord}</em>;
            if (token.type === 'link')   return <a key={tIdx} href={token.href} target="_blank" rel="noreferrer">{animWord}</a>;
            return <React.Fragment key={tIdx}>{animWord}</React.Fragment>;
          })}
        </p>
      ))}
    </div>
  );
});
