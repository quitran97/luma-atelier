// Small, bounded particle systems. All coordinates are local to the studio canvas.
export function createAtmosphere(reducedMotion) {
  let width = 1, height = 1, time = 0;
  let particles = [], ripples = [], gusts = [];
  const pointer = { x: 0, y: 0, active: false };
  const flies = Array.from({ length: reducedMotion ? 14 : 38 }, (_, i) => ({
    x: 0, y: 0, vx: 0, vy: 0, phase: i * 2.399, radius: 40 + (i % 9) * 12, opacity: 0,
  }));

  function resize(w, h) {
    const sx = w / width, sy = h / height;
    flies.forEach(f => { f.x *= sx; f.y *= sy; });
    width = w; height = h;
    if (flies.every(f => f.x === 0)) flies.forEach((f, i) => { f.x = width * (.15 + i % 7 / 10); f.y = height * (.35 + i % 5 / 10); });
    particles = []; ripples = []; gusts = []; pointer.active = false;
  }
  function burst(x, y, wish = false) {
    const count = reducedMotion ? (wish ? 24 : 6) : (wish ? 150 : 18);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = (wish ? 40 + Math.random() * 190 : 18 + Math.random() * 70) * (reducedMotion ? .4 : 1);
      const life = wish ? 2.5 + Math.random() * 3 : .6 + Math.random() * .5;
      particles.push({ x, y, px: x, py: y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - (wish ? 55 : 0), life, max: life, phase: a, wish, hue: Math.random() * 75 + 25 });
    }
    particles = particles.slice(-220);
  }
  function ripple(x, y, hue = 35) {
    ripples.push({ x, y, age: 0, hue }); ripples = ripples.slice(-12);
  }
  function gust(direction = 1) {
    gusts.push({ direction, age: 0, y: height * (.35 + Math.random() * .3) }); gusts = gusts.slice(-5);
  }
  function update(dt, state, light) {
    time += dt;
    const ease = 1 - Math.exp(-dt * 2);
    flies.forEach((f, index) => {
      const enabled = state.fireflies;
      f.opacity += ((enabled ? 1 : 0) - f.opacity) * ease;
      if (f.opacity < .005) return;
      const center = pointer.active && state.powered ? pointer : light;
      const radius = state.powered ? f.radius * .7 : Math.min(width, height) * .42;
      const angularSpeed = reducedMotion ? .035 : .18 + index % 4 * .035;
      const phase = f.phase + time * angularSpeed;
      const tx = Math.max(18, Math.min(width - 18, center.x + Math.cos(phase) * radius));
      const ty = state.powered ? center.y + 55 + Math.sin(phase * 1.3) * radius * .65 : height * .65 + Math.sin(phase) * radius * .5;
      f.vx += ((tx - f.x) * 2 - f.vx * 2.2) * dt;
      f.vy += ((ty - f.y) * 2 - f.vy * 2.2) * dt;
      f.x += f.vx * dt; f.y += f.vy * dt;
    });
    particles.forEach(p => {
      p.px = p.x; p.py = p.y; p.life -= dt;
      if (p.wish) { p.vx += Math.sin(time * 2 + p.phase) * dt * 18; p.vy -= dt * 12; }
      else p.vy += dt * 25;
      p.vx *= Math.exp(-dt * .2); p.vy *= Math.exp(-dt * .2);
      p.x += p.vx * dt; p.y += p.vy * dt;
    });
    particles = particles.filter(p => p.life > 0);
    ripples.forEach(r => { r.age += dt; }); ripples = ripples.filter(r => r.age < 1.5);
    gusts.forEach(g => { g.age += dt; }); gusts = gusts.filter(g => g.age < 1.6);
  }
  function draw(ctx, state) {
    ctx.save();
    const dark = state.mood === 'midnight';
    for (const g of gusts) {
      const progress = g.age / 1.6;
      ctx.strokeStyle = dark ? `rgba(182,216,214,${Math.sin(progress * Math.PI) * .32})` : `rgba(98,126,105,${Math.sin(progress * Math.PI) * .24})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const x = g.direction > 0 ? progress * (width + 180) - 180 : width - progress * (width + 180) + 180;
        const y = g.y + i * 14;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x - 35 * g.direction, y - 25, x - 85 * g.direction, y + 20, x - 140 * g.direction, y); ctx.stroke();
      }
    }
    for (const r of ripples) {
      const life = 1 - r.age / 1.5, radius = 24 + r.age * (reducedMotion ? 23 : 72);
      ctx.strokeStyle = `hsla(${r.hue},${dark ? 70 : 45}%,${dark ? 76 : 45}%,${life * .45})`; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.ellipse(r.x, r.y, radius, radius * .48, 0, 0, Math.PI * 2); ctx.stroke();
      if (r.age > .15) { ctx.beginPath(); ctx.ellipse(r.x, r.y, Math.max(1, radius - 16), Math.max(1, radius - 16) * .48, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    for (const f of flies) {
      if (f.opacity < .01) continue;
      const twinkle = reducedMotion ? .7 : .6 + Math.sin(time * 2.1 + f.phase) * .3;
      ctx.globalAlpha = f.opacity * twinkle;
      const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 13);
      glow.addColorStop(0, dark ? '#fff4b28a' : '#e4c75b70'); glow.addColorStop(1, '#e4c75b00');
      ctx.fillStyle = glow; ctx.fillRect(f.x - 13, f.y - 13, 26, 26);
      ctx.fillStyle = dark ? '#ffefab' : '#9b802d'; ctx.beginPath(); ctx.arc(f.x, f.y, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = dark ? '#f8edbc90' : '#a9945460'; ctx.lineWidth = .6;
      const wing = 3 + Math.sin(time * 28 + f.phase) * 1.5;
      ctx.beginPath(); ctx.moveTo(f.x - wing, f.y - 2); ctx.lineTo(f.x, f.y); ctx.lineTo(f.x + wing, f.y - 2); ctx.stroke();
    }
    for (const p of particles) {
      ctx.globalAlpha = Math.min(1, p.life) * .85;
      ctx.strokeStyle = `hsl(${p.hue},65%,${dark ? 78 : 45}%)`; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .045, p.y - p.vy * .045); ctx.stroke();
      if (p.wish) {
        const size = 1.5 + Math.sin(p.life * 3 + p.phase) * .7;
        ctx.beginPath(); ctx.moveTo(p.x - size * 2, p.y); ctx.lineTo(p.x + size * 2, p.y); ctx.moveTo(p.x, p.y - size * 2); ctx.lineTo(p.x, p.y + size * 2); ctx.stroke();
      } else { ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }
  return {
    resize, update, draw, burst, ripple, gust,
    point(x, y, active = true) { pointer.x = x; pointer.y = y; pointer.active = active; },
    reset() { particles = []; ripples = []; gusts = []; pointer.active = false; flies.forEach(f => { f.opacity = 0; }); },
  };
}
