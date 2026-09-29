// Volumetric light is drawn at half resolution; the pendant stays crisp at full DPR.
export function createLighting(reducedMotion) {
  const haze = document.createElement('canvas');
  const fog = haze.getContext('2d');
  let width = 1, height = 1;
  const random = seed => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
  const motes = Array.from({ length: 22 }, (_, i) => ({
    u: random(i + 1) * 2 - 1,
    v: random(i + 53),
    size: .45 + (i % 3) * .25,
  }));

  function glow(ctx, x, y, rx, ry, color, strength) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    gradient.addColorStop(0, `rgba(${color},${strength})`);
    gradient.addColorStop(.25, `rgba(${color},${strength * .64})`);
    gradient.addColorStop(.6, `rgba(${color},${strength * .15})`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = gradient; ctx.fillRect(-rx, -rx, rx * 2, rx * 2); ctx.restore();
  }

  function drawRoom(ctx, state, light, scale, time) {
    const energy = state.glow;
    const night = state.mood === 'midnight';
    if (night) {
      ctx.fillStyle = `rgba(3,8,10,${.48 * (1 - energy)})`;
      ctx.fillRect(0, 0, width, height);
    }
    if (energy < .002) return;
    const strength = energy * (night ? 1 : .6);
    const floorY = height * .79;
    const reach = Math.max(50, (floorY - light.y) / Math.cos(state.angle));
    const floorX = light.x - Math.sin(state.angle) * reach;
    const spread = Math.min(width * .7, 125 * scale + reach * .48);

    fog.setTransform(.5, 0, 0, .5, 0, 0);
    fog.clearRect(0, 0, width, height);
    fog.globalCompositeOperation = 'source-over';
    // Wide reflected light gives the room a warm cast, not just a bright bulb.
    glow(fog, light.x, light.y + reach * .3, 340 * scale, 300 * scale, '246,163,70', strength * .13);
    fog.save(); fog.translate(light.x, light.y); fog.rotate(state.angle);
    fog.filter = 'blur(9px)';
    const beam = fog.createLinearGradient(0, -12 * scale, 0, reach + 40 * scale);
    beam.addColorStop(0, `rgba(255,228,160,${strength * .33})`);
    beam.addColorStop(.25, `rgba(255,219,141,${strength * .22})`);
    beam.addColorStop(.7, `rgba(248,204,128,${strength * .09})`);
    beam.addColorStop(1, 'rgba(248,204,128,0)');
    fog.fillStyle = beam;
    fog.beginPath(); fog.moveTo(-96 * scale, -6 * scale); fog.lineTo(96 * scale, -6 * scale);
    fog.lineTo(spread, reach + 40 * scale); fog.quadraticCurveTo(0, reach + 65 * scale, -spread, reach + 40 * scale);
    fog.closePath(); fog.fill();
    // A brighter inner shaft softly separates from the surrounding haze.
    const shaft = fog.createRadialGradient(0, 4, 0, 0, 4, reach + 70 * scale);
    shaft.addColorStop(0, `rgba(255,246,210,${strength * .15})`);
    shaft.addColorStop(.6, `rgba(255,226,159,${strength * .045})`);
    shaft.addColorStop(1, 'rgba(255,226,159,0)');
    fog.fillStyle = shaft; fog.beginPath(); fog.moveTo(-24 * scale, 0); fog.lineTo(24 * scale, 0);
    fog.lineTo(spread * .55, reach); fog.lineTo(-spread * .55, reach); fog.closePath(); fog.fill();
    fog.restore();
    ctx.drawImage(haze, 0, 0, width, height);

    // The pool follows the optical axis of the swinging lamp.
    ctx.save(); ctx.globalCompositeOperation = night ? 'screen' : 'source-over';
    glow(ctx, floorX, floorY, spread * 1.35, 68 * scale, '236,170,78', strength * .2);
    glow(ctx, floorX, floorY, spread, 25 * scale, '255,217,143', strength * .38);
    glow(ctx, floorX, floorY - 1, spread * .53, 9 * scale, '255,244,203', strength * .48);
    if (state.material === 'glass') {
      ctx.save(); ctx.translate(floorX, floorY); ctx.scale(1, .22); ctx.filter = 'blur(0.7px)';
      for (let i = 0; i < 7; i++) {
        ctx.strokeStyle = `hsla(${i * 27 + 15},70%,75%,${strength * .16})`;
        ctx.lineWidth = 1.5 + i * .3;
        ctx.beginPath(); ctx.ellipse(0, 0, (65 + i * 9) * scale, (65 + i * 9) * scale, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();

    // Sparse dust is visible only inside the beam. No flashes or random flicker.
    ctx.save(); ctx.translate(light.x, light.y); ctx.rotate(state.angle);
    motes.forEach((m, i) => {
      const v = reducedMotion ? m.v : (m.v + time * .018) % 1;
      const x = m.u * (85 * scale + v * (spread * .65 - 85 * scale));
      const y = 12 * scale + v * reach * .87;
      const drift = reducedMotion ? 0 : Math.sin(time * .25 + i) * 5 * scale;
      ctx.fillStyle = `rgba(255,240,194,${strength * Math.sin(v * Math.PI) * .35})`;
      ctx.beginPath(); ctx.arc(x + drift, y, m.size * Math.min(scale, 1.4), 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  function drawEmitter(ctx, state) {
    const energy = state.glow;
    if (energy < .002) return;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    glow(ctx, 0, 81, 190, 120, '255,165,65', energy * .22);
    glow(ctx, 0, 79, 105, 33, '255,212,127', energy * .6);
    glow(ctx, 0, 79, 42, 18, '255,241,199', energy * .95);
    // Thin luminous edge, a hot core, and a small soft reflection on the lip.
    ctx.shadowColor = `rgba(255,211,122,${energy})`; ctx.shadowBlur = 12 * energy;
    ctx.strokeStyle = `rgba(255,237,185,${energy * .85})`; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(0, 75, 103, 10, 0, 0, Math.PI); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(255,253,234,${energy})`;
    ctx.beginPath(); ctx.ellipse(0, 80, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  return {
    resize(w, h) { width = w; height = h; haze.width = Math.ceil(w / 2); haze.height = Math.ceil(h / 2); },
    drawRoom, drawEmitter,
  };
}
