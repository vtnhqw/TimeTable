# Image scanning and interface redesign

Intent: replace the extraction spinner with an image-shaped thinking animation and bring the whole app into a coherent Apple-inspired visual system.

Design: uploaded image remains recognizable inside a floating rounded rectangle. A canvas particle field follows the image pixels, with a subtle scan sweep and blue/violet light. Real preparation/reading/checking states replace misleading percentages. File identity and cancel remain visible. Use system typography, blue actions, grouped neutral surfaces, continuous rounded corners, consistent 44px controls, and light/dark themes. Respect reduced motion and pause animation in hidden tabs.

- [x] Browser regressions: actual uploaded preview, indeterminate status, cancellation, reduced motion, narrow layouts.
- [x] Implement ImageScanVisual and extraction screen; keep pending upload separate from committed source image.
- [x] Update shared visual tokens, navigation, upload hero, editor surfaces and controls consistently.
- [x] Verify tests, screenshot review, formatting, type checks, production build and independent code review.

No new dependencies. Existing schedule, persistence, editing and export behavior remain intact. Reference: Apple HIG Motion, Progress indicators and Accessibility, consulted November 24, 2026.

Verification: 26 Node tests plus utility/regression checks, all 14 browser tests against production, TypeScript, formatting, diff checks and production build passed. Visually inspected landing, scanner, review and styling in light/dark/mobile states. Independent review found portrait canvas alignment on mobile; reproduced with a failing browser assertion, fixed using one responsive height variable, then verified passing. Reduced-motion test verifies the sweep pseudo-element and unchanged canvas pixels. No outstanding review findings.
