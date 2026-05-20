import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

/* ── Inline markdown tokenizer (mirrors renderInlineMarkdown in CaseStudy.jsx) ── */
const TOKEN_REGEX = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;

function tokenizeParagraph(str) {
  const tokens = [];
  let lastIndex = 0;
  TOKEN_REGEX.lastIndex = 0;
  let m;

  while ((m = TOKEN_REGEX.exec(str)) !== null) {
    if (m.index > lastIndex) addWords(str.slice(lastIndex, m.index), 'plain', null, tokens);
    const [, , linkLabel, linkHref, boldText, italicText] = m;
    if (linkLabel)    addWords(linkLabel,   'link',   linkHref, tokens);
    else if (boldText)   addWords(boldText,   'bold',   null,     tokens);
    else if (italicText) addWords(italicText, 'italic', null,     tokens);
    lastIndex = TOKEN_REGEX.lastIndex;
  }
  if (lastIndex < str.length) addWords(str.slice(lastIndex), 'plain', null, tokens);
  return tokens;
}

function addWords(text, type, href, out) {
  text.split(/(\s+)/).forEach(part => {
    if (/\S/.test(part)) out.push({ text: part, type, href });
    else if (part.length) out.push({ text: part, type: 'space' });
  });
}

/* ── AnimatedWord — must be its own component so useTransform (hook) can be called ── */
function AnimatedWord({ scrollYProgress, wordIndex, totalWords, scrollStart, scrollWindow, colorMuted, colorActive, children }) {
  const t0 = scrollStart + (wordIndex / totalWords) * scrollWindow;
  const t1 = scrollStart + ((wordIndex + 1) / totalWords) * scrollWindow;
  const color = useTransform(scrollYProgress, [t0, t1], [colorMuted, colorActive]);
  return <motion.span style={{ color }}>{children}</motion.span>;
}

/* ── ScrollRevealText ─────────────────────────────────────────────────────────── */
/**
 * Renders paragraphs of text where each word progressively shifts from
 * colorMuted → colorActive as the element travels through the viewport.
 * Directly scrubbed to scroll position (no one-shot trigger).
 *
 * Supports inline markdown: **bold**, *italic*, [label](url)
 */
export function ScrollRevealText({
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

  const paragraphTokens = paragraphs.map(p => tokenizeParagraph(p));
  const totalWords      = paragraphTokens.flat().filter(t => t.type !== 'space').length;

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
}
