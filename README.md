# Luma Atelier

**A little light. A little wonder.**

A tiny, interactive lighting playground for the web. No scores, no tasks, no rush — just a pendant lamp, a quiet room, and a few things to discover.

Drag the shade. Pull the cord. Let the wind in. Make a wish.

## A room to play in

- **Light with depth** — a warm core, soft bloom, a volumetric beam, drifting dust, and a pool of light that follows the pendant.
- **A little physics** — swing the shade, pull the brass cord, or swipe the room to create a breeze.
- **Three materials** — terracotta, reflective brass, and ribbed glass with soft spectral patterns on the floor.
- **Three atmospheres** — Day, Dusk, and Night, with a dimmer for finding the right glow. Night is the default.
- **Small surprises** — fireflies follow your pointer or touch; the star releases a little constellation of light.
- **A quiet interface** — a full-screen scene, a small icon dock, and settings tucked away until you need them.

Works with mouse, pen, touch, and keyboard-accessible controls. Sound is optional and off by default. Reduced-motion preferences soften the effects, and animation pauses when the page is hidden.

## Run locally

You'll need [Bun](https://bun.sh/) 1.3.14 or newer.

```sh
git clone https://github.com/quitran97/luma-atelier.git
cd luma-atelier
bun install
bun run dev
```

Open the local URL printed in your terminal.

## Controls

| Interaction | What happens |
| --- | --- |
| Drag the shade | Swing the pendant |
| Pull or click the cord | Toggle the light |
| Swipe the empty room | Create a gust of wind |
| Power icon | Toggle the light with a button |
| Wind icon | Enable a continuous breeze |
| Fireflies icon | Invite fireflies; guide them with your pointer or touch |
| Star icon | Make a wish |
| Settings icon | Adjust brightness, atmosphere, and material; nudge or reset the lamp |
| Sound icon, top right | Enable or mute synthesized audio |

Use **Tab** to navigate controls, **Space/Enter** to activate buttons, and the **arrow keys** to adjust the focused dimmer. Settings close with **Escape**, the close button, or a click outside. More hints live under **Settings → How to play**.

## Build & deploy

```sh
bun run build
bun run preview
```

The production build is written to `dist/`. Deploy that directory to any static host. For a site hosted under a subpath, build with its base path:

```sh
bun run build --base=/luma-atelier/
```

## Under the shade

Built with **vanilla JavaScript, Canvas 2D, CSS, Web Audio, Vite, and Bun**. No UI framework, game engine, or runtime dependencies.

```text
index.html          Minimal interface and accessible controls
src/main.js         Pendulum physics, input, materials, and audio
src/lighting.js     Volumetric light, bloom, reflections, and dust
src/atmosphere.js   Fireflies, wind trails, and wish particles
src/style.css      Layout, themes, and responsive controls
```

Lighting haze renders at half resolution while the pendant stays sharp. Particle counts are bounded, and device pixel ratio is capped to keep rendering costs predictable. Graphics and audio are generated in code. The optional Google Font has a system-font fallback.

## Made to be played with — and contributed to

Found a bug? Have an idea for a nicer reflection, smoother motion, or a small delightful interaction? [Open an issue](https://github.com/quitran97/luma-atelier/issues) or send a pull request.

A few areas where contributions are especially welcome:

- Rendering performance on mobile devices.
- More natural lighting and material details.
- Accessibility, reduced-motion behavior, and browser compatibility.
- Small interactions that fit the calm, minimal experience.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the short version of how to help. Experiments and forks are welcome, too.

## License

[MIT](LICENSE) — use it, learn from it, remix it, and make something lovely.
