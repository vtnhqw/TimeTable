# Schedule legibility and alignment

Fix the renderer's arbitrary two-line subject limit and unwrapped rooms. Fit complete subject and room text together using measured wrapping and a bounded font scale. For physically crowded blocks, explicitly indicate shortened labels and make full details available in the editor rather than silently clipping. Improve solid grid contrast, alternate day shading, aligned boundaries and one inset-based corner system. Center 44px review action controls and add short hover/focus/filter transitions with reduced-motion support. Preserve exact times, subject names, colors and export dimensions.

- [ ] Regression tests for long subject/room rendering, long tokens, crowded blocks, and centered actions.
- [ ] Implement measured text layout and visible-grid/corner improvements in the shared renderer.
- [ ] Expose full details for crowded previews; align actions and refine motion.
- [ ] Check realistic long-name wallpapers visually, browser flows, type checks, full tests and production build.
