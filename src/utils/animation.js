/* Shared Framer Motion presets
   Import and spread onto motion.* elements.
   Override individual keys (e.g. viewport, transition) as needed at the call-site. */

export const fadeUp = {
  initial:     { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.12 },
  transition:  { duration: 0.75, ease: [0.25, 0.1, 0.25, 1] },
};
