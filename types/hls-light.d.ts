/**
 * Type declarations for hls.js's `light` entry point.
 *
 * The package's `exports` map has no `types` condition for the `./light`
 * subpath, so TypeScript cannot resolve it even though the JavaScript is real.
 * The light build's public surface is identical to the full one — it drops the
 * alternate-audio and subtitle controllers, neither of which this player uses —
 * so re-exporting the full build's types is accurate rather than a convenient
 * approximation.
 *
 * Importing the light build is deliberate: it is roughly 40% smaller, and it is
 * already the largest dependency in the app.
 */
declare module 'hls.js/light' {
  export * from 'hls.js';
  export { default } from 'hls.js';
}
