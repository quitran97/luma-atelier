# Contributing to Luma

Thanks for stopping by. Bug fixes, thoughtful polish, and playful little experiments are all welcome.

## Get started

1. Fork the repository and create a branch for your change.
2. Install dependencies with `bun install`.
3. Run `bun run dev` and make your changes.
4. Run `bun run build` before opening a pull request.

## Keep the room calm

- Keep the lamp at the center of the experience. Prefer direct interaction and small controls over extra text or panels.
- Stay with the existing JavaScript, Canvas, and CSS approach when practical. Discuss larger architectural changes in an issue first.
- Make new controls keyboard-accessible and keep touch devices in mind.
- Respect `prefers-reduced-motion`, avoid flashing effects, and keep particle or animation work bounded.
- Use Bun and include `bun.lock` if you change dependencies.

## Check your change

There isn't a committed automated test suite yet. Alongside a successful build, check the interactions your change touches in a browser:

- Desktop and mobile-sized layouts, including short landscape screens.
- Dragging the shade, pulling the cord, and using the dock.
- Settings, brightness, themes, and materials.
- Keyboard navigation, Escape to dismiss settings, and reduced-motion mode.
- No unexpected browser console errors.

For visual changes, a screenshot or short recording in your pull request helps a lot. Include what changed and how you checked it. Small, focused pull requests are easier to review.

For bug reports, share the browser/device, steps to reproduce, and what you expected to happen. No need for a perfect report — a clear starting point is enough.
