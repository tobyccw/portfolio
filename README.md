# Toby Cheng Portfolio Website (Optimized Copy)

This is an optimized clone of the original portfolio project.

## Stack

- React 18
- React Router
- Framer Motion
- Create React App (`react-scripts`)

## What was optimized

- Replaced hard-reload internal anchors with SPA links (`Link`) for smoother navigation.
- Added route fallback (`*`) so unknown URLs render a proper page.
- Replaced placeholder `href="#"` links with valid destinations.
- Added lazy route loading for case studies.
- Reduced mobile logo-strip scroll overhead (moved from fixed `setInterval` to `requestAnimationFrame` with pause/resume guards).
- Optimized section tracking hook with `requestAnimationFrame` throttling.
- Added weather caching in header (`localStorage`) to reduce repeated API calls.
- Added a typography token system in [`src/styles/tokens.css`](src/styles/tokens.css) and removed duplicated font declarations.
- Converted large PNG content images to compressed JPEG assets and updated references.
- Added a basic app smoke test.

## Getting started

```bash
npm install
npm start
```

## Build

```bash
npm run build
```

## Test

```bash
npm test -- --watch=false
```
