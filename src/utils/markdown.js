import React from 'react';

/* Shared inline-markdown parsing for case study content.
   Supports: [label](https://url) · **bold** · *italic* */

export const TOKEN_REGEX = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;

/**
 * Renders a string with inline markdown into an array of React nodes.
 * Non-string input is returned untouched.
 */
export function renderInlineMarkdown(text) {
  if (typeof text !== 'string' || !text.length) return text;

  const nodes = [];
  let lastIndex = 0;
  let tokenMatch;
  TOKEN_REGEX.lastIndex = 0;

  while ((tokenMatch = TOKEN_REGEX.exec(text)) !== null) {
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

    lastIndex = TOKEN_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/**
 * Tokenizes a paragraph string into word-level descriptors for per-word
 * animation: { text, type: 'plain'|'bold'|'italic'|'link'|'space', href? }
 */
export function tokenizeParagraph(str) {
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
