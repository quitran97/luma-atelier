import { createAtmosphere } from './atmosphere.js';
import { createLighting } from './lighting.js';

const canvas = document.querySelector('#lamp');
const context = canvas.getContext('2d');
const studio = document.querySelector('.studio');
const power = document.querySelector('#power');
const slider = document.querySelector('#brightness');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { powered: true, brightness: .75, mood: 'midnight', sound: false, angle: 0, speed: 0, pull: 0, glow: 0, material: 'clay', breeze: false, fireflies: false, wind: 0 };
const atmosphere = createAtmosphere(reducedMotion);
const lighting = createLighting(reducedMotion);
const materials = {
  clay: { colors: ['#9f452c', '#cf603d', '#e28558', '#cf613b', '#99462e'], rim: '#9c452d' },
  brass: { colors: ['#755126', '#bc944d', '#f6dc99', '#b18a40', '#71512c'], rim: '#94713d' },
  glass: { colors: ['#abcac17a', '#deeee657', '#ffffffa8', '#bad8d343', '#93b7b77a'], rim: '#c2e0d3a0' },
};
let feedbackTimer, wishTimer, sceneTime = 0, nextWind = 0;
const palettes = {
  daylight: { theme: '#f2f0e9' },
  golden: { theme: '#eedcca' },
  midnight: { theme: '#192628' },
};
let width = 0, height = 0, scale = 1, dpr = 1, maxSwing = .7, drag = null, audio = null;
let lastTime = 0, simulationTime = 0, animationId;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function announce(message) { document.querySelector('#announcement').textContent = message; }
const settings = document.querySelector('#settings');
settings.addEventListener('toggle', event => {
  document.querySelector('#settings-toggle').setAttribute('aria-expanded', String(event.newState === 'open'));
  atmosphere.point(0, 0, false);
});
function hideHint() { document.querySelector('#drag-hint').style.opacity = '0'; }
function feedback(message) {
  hideHint();
  const el = document.querySelector('#scene-feedback');
  el.textContent = message; el.classList.add('visible');
  clearTimeout(feedbackTimer); feedbackTimer = setTimeout(() => el.classList.remove('visible'), 2400);
}
function lightPosition() {
  const g = geometry(), distance = (g.cable + 80) * scale;
  return { x: g.x - Math.sin(state.angle) * distance, y: g.y + Math.cos(state.angle) * distance };
}
function playWishNote(index, delay = 0) {
  if (!state.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') void audio.resume();
    const frequencies = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
    const now = audio.currentTime + delay;
    [1, 2, 4].forEach((ratio, i) => {
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = 'sine'; osc.frequency.value = frequencies[index % frequencies.length] * ratio;
      const duration = 1.8 / (1 + i * .25);
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.075 / (1 + i * 3), now + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      osc.connect(gain).connect(audio.destination); osc.start(now); osc.stop(now + duration + .02);
    });
  } catch { /* Wishes also work without audio support. */ }
}
function setMaterial(material) {
  state.material = material;
  document.querySelectorAll('.material-option').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.material === material)));
}
document.querySelectorAll('.material-option').forEach(button => button.addEventListener('click', () => {
  setMaterial(button.dataset.material);
}));
function setFireflies(enabled) {
  state.fireflies = enabled;
  document.querySelector('#fireflies').setAttribute('aria-pressed', String(enabled));
}
document.querySelector('#fireflies').addEventListener('click', () => {
  setFireflies(!state.fireflies);
  feedback(state.fireflies ? 'They follow your touch.' : 'Fireflies off');
  announce(state.fireflies ? 'Fireflies invited. Move your pointer or touch the room to guide them.' : 'Fireflies dismissed.');
});
document.querySelector('#breeze').addEventListener('click', () => {
  state.breeze = !state.breeze; document.querySelector('#breeze').setAttribute('aria-pressed', String(state.breeze));
  if (state.breeze) { state.wind = .9; atmosphere.gust(1); }
  feedback(state.breeze ? 'Breeze on' : 'Breeze off');
  announce(state.breeze ? 'Breeze enabled.' : 'Breeze disabled.');
});
document.querySelector('#wish').addEventListener('click', () => {
  const button = document.querySelector('#wish');
  state.powered = true; state.brightness = 1; slider.value = '100';
  setMood('midnight', false); setFireflies(true); updateControls();
  state.speed += reducedMotion ? .05 : .25;
  const light = lightPosition(); atmosphere.burst(light.x, light.y, true); atmosphere.ripple(light.x, light.y, 45);
  [0, 2, 3, 4, 5].forEach((note, index) => playWishNote(note, index * .14));
  hideHint(); announce('Your wish becomes a sky of light. Midnight atmosphere and fireflies enabled.');
  button.disabled = true; button.setAttribute('aria-busy', 'true');
  wishTimer = setTimeout(() => { button.disabled = false; button.removeAttribute('aria-busy'); }, 3500);
});
function playTone(type) {
  if (!state.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') void audio.resume();
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    const now = audio.currentTime;
    oscillator.type = 'sine';
    const notes = { on: [660, 880], off: [440, 220], nudge: [330, 495], mood: [523, 784] };
    const [start, end] = notes[type];
    oscillator.frequency.setValueAtTime(start, now);
    oscillator.frequency.exponentialRampToValueAtTime(end, now + .2);
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(.055, now + .012);
    envelope.gain.exponentialRampToValueAtTime(.0001, now + .35);
    oscillator.connect(envelope).connect(audio.destination);
    oscillator.start(now); oscillator.stop(now + .36);
  } catch { /* Audio is an optional accompaniment to the studio. */ }
}
function updateControls() {
  power.setAttribute('aria-checked', String(state.powered));
  document.querySelector('#brightness-value').textContent = `${Math.round(state.brightness * 100)}%`;
  slider.style.setProperty('--fill', `${(state.brightness * 100 - 10) / 90 * 100}%`);
}
function togglePower() {
  hideHint();
  state.powered = !state.powered;
  playTone(state.powered ? 'on' : 'off');
  updateControls(); announce(state.powered ? 'The pendant is on.' : 'The pendant is off.');
}
function setMood(mood, audible = true) {
  state.mood = mood; document.body.dataset.mood = mood;
  document.querySelectorAll('.mood').forEach((button) => {
    const active = button.dataset.mood === mood;
    button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
  });
  document.querySelector('meta[name="theme-color"]').content = palettes[mood].theme;
  if (audible) playTone('mood');
}
power.addEventListener('click', togglePower);
slider.addEventListener('input', () => { state.brightness = Number(slider.value) / 100; updateControls(); });
document.querySelectorAll('.mood').forEach((button) => button.addEventListener('click', () => setMood(button.dataset.mood)));
document.querySelector('#sound').addEventListener('click', () => {
  state.sound = !state.sound;
  document.querySelector('#sound').setAttribute('aria-pressed', String(state.sound));
  document.querySelector('#sound').dataset.tip = state.sound ? 'Sound on' : 'Sound off';
  if (state.sound) playTone('on');
});
document.querySelector('#nudge').addEventListener('click', () => {
  settings.hidePopover();
  state.speed += state.angle > 0 ? -.9 : .9;
  document.querySelector('#drag-hint').style.opacity = '0'; playTone('nudge');
  announce('The pendant is gently swinging.');
});
document.querySelector('#reset').addEventListener('click', () => {
  settings.hidePopover();
  cancelDrag(); state.powered = true; state.brightness = .75; state.angle = 0; state.speed = 0; state.pull = 0;
  state.breeze = false; state.wind = 0; setFireflies(false); setMaterial('clay'); atmosphere.reset();
  document.querySelector('#breeze').setAttribute('aria-pressed', 'false');
  document.querySelector('#scene-feedback').classList.remove('visible'); clearTimeout(feedbackTimer); clearTimeout(wishTimer);
  document.querySelector('#wish').disabled = false; document.querySelector('#wish').removeAttribute('aria-busy');
  slider.value = '75'; setMood('midnight', false); updateControls();
  document.querySelector('#drag-hint').style.opacity = '1'; announce('The studio has been reset.');
});

// Geometry is expressed in a local design space, then rotated around the ceiling hook.
function geometry() { return { x: width * .5, y: -14, cable: (height * .42 + 14 - 40 * scale) / scale }; }
function toLocal(x, y) {
  const g = geometry(), dx = (x - g.x) / scale, dy = (y - g.y) / scale;
  return { x: dx * Math.cos(state.angle) + dy * Math.sin(state.angle), y: -dx * Math.sin(state.angle) + dy * Math.cos(state.angle) - g.cable };
}
function pointerPosition(event) {
  const bounds = canvas.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}
function targetAt(position) {
  const p = toLocal(position.x, position.y);
  if (Math.abs(p.x - 74) < 23 && p.y > 80 && p.y < 193 + state.pull) return 'cord';
  if ((p.x / 116) ** 2 + ((p.y - 43) / 68) ** 2 < 1) return 'shade';
  return null;
}
canvas.addEventListener('pointerdown', (event) => {
  if (drag || (event.pointerType === 'mouse' && event.button !== 0)) return;
  const p = pointerPosition(event), target = targetAt(p) || 'air';
  atmosphere.point(p.x, p.y);
  const g = geometry();
  drag = { id: event.pointerId, target, startX: p.x, startY: p.y, moved: 0, x: p.x, y: p.y, offset: Math.atan2(p.x - g.x, p.y - g.y) + state.angle };
  canvas.setPointerCapture(event.pointerId); canvas.style.cursor = 'grabbing';
  document.querySelector('#drag-hint').style.opacity = '0';
});
canvas.addEventListener('pointermove', (event) => {
  const p = pointerPosition(event);
  if (drag && drag.id !== event.pointerId) return;
  atmosphere.point(p.x, p.y);
  if (drag?.id === event.pointerId) {
    drag.moved = Math.max(drag.moved, Math.hypot(p.x - drag.startX, p.y - drag.startY));
    if (drag.target === 'air') state.wind = clamp(state.wind + (p.x - drag.x) * .012, -2.5, 2.5);
    drag.x = p.x; drag.y = p.y;
    if (drag.target === 'cord') state.pull = clamp((p.y - drag.startY) / scale, 0, 55);
  }
  else if (!drag) canvas.style.cursor = targetAt(p) ? 'grab' : 'default';
});
canvas.addEventListener('pointerleave', () => { if (!drag) atmosphere.point(0, 0, false); });
function cancelDrag() {
  if (!drag) return;
  const id = drag.id; drag = null; canvas.style.cursor = 'default';
  if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
}
function release(event, cancelled = false) {
  if (drag?.id !== event.pointerId) return;
  if (drag.target === 'cord' && !cancelled) togglePower();
  if (!cancelled && drag.target === 'air' && drag.moved > 22) {
    atmosphere.gust(drag.x >= drag.startX ? 1 : -1); feedback('A little breeze.');
  }
  if (event.pointerType !== 'mouse' || cancelled) atmosphere.point(0, 0, false);
  cancelDrag();
}
canvas.addEventListener('pointerup', (event) => release(event));
canvas.addEventListener('pointercancel', (event) => release(event, true));
canvas.addEventListener('lostpointercapture', (event) => release(event, true));

function resize() {
  cancelDrag();
  const bounds = studio.getBoundingClientRect();
  width = bounds.width; height = bounds.height;
  scale = clamp(Math.min(width / 360, height / 480), .5, 1.75);
  dpr = Math.min(devicePixelRatio || 1, 2);
  const g = geometry();
  maxSwing = Math.min(.7, Math.asin(clamp((width * .5 - 115 * scale) / (g.cable * scale), .12, .7)));
  state.angle = clamp(state.angle, -maxSwing, maxSwing);
  studio.style.setProperty('--hint-y', `${Math.min(height - 145, g.y + (g.cable + 218) * scale)}px`);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  atmosphere.resize(width, height);
  lighting.resize(width, height);
}
new ResizeObserver(resize).observe(studio);
function integrate(dt) {
  sceneTime += dt;
  let force = -5.7 * Math.sin(state.angle) - state.speed * .56;
  if (state.breeze) force += Math.sin(sceneTime * 1.3) * (reducedMotion ? .12 : .65) + Math.sin(sceneTime * 2.7) * .15;
  force -= state.wind; state.wind *= Math.exp(-dt * 1.7);
  if (drag?.target === 'shade') {
    const g = geometry();
    const target = clamp(-Math.atan2(drag.x - g.x, drag.y - g.y) + drag.offset, -maxSwing, maxSwing);
    force += (target - state.angle) * 95 - state.speed * 13;
  }
  state.speed += force * dt; state.angle += state.speed * dt;
  if (Math.abs(state.angle) > maxSwing) { state.angle = clamp(state.angle, -maxSwing, maxSwing); state.speed *= -.2; }
  if (drag?.target !== 'cord') state.pull *= Math.exp(-dt * 15);
  const targetGlow = state.powered ? state.brightness : 0;
  state.glow += (targetGlow - state.glow) * (1 - Math.exp(-dt * (targetGlow > state.glow ? 4.5 : 3.5)));
}
function oval(x, y, rx, ry, fill) {
  context.beginPath(); context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); context.fillStyle = fill; context.fill();
}
function path(points, color, weight = 1) {
  context.beginPath(); points.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y));
  context.strokeStyle = color; context.lineWidth = weight; context.stroke();
}
function draw() {
  context.setTransform(dpr, 0, 0, dpr, 0, 0); context.clearRect(0, 0, width, height);
  const g = geometry();
  lighting.drawRoom(context, state, lightPosition(), scale, sceneTime);
  context.save(); context.translate(g.x, g.y); context.scale(scale, scale); context.rotate(state.angle);
  path([[0, 0], [0, g.cable]], state.mood === 'midnight' ? '#878674' : '#7e7764', 2.2);
  path([[-1, 0], [-1, g.cable]], '#ffffff30', .6);
  context.translate(0, g.cable);
  // The shade is a custom shallow dome with a rolled rim and brushed brass collar.
  const brass = context.createLinearGradient(-12, 0, 12, 0);
  brass.addColorStop(0, '#8f6940'); brass.addColorStop(.4, '#d7b878'); brass.addColorStop(.6, '#e4c990'); brass.addColorStop(1, '#92714b');
  context.fillStyle = brass; context.beginPath(); context.roundRect(-11, -13, 22, 28, [5, 5, 2, 2]); context.fill();
  const shell = context.createLinearGradient(-108, 0, 108, 60);
  const material = materials[state.material];
  [0, .24, .44, .7, 1].forEach((stop, i) => shell.addColorStop(stop, material.colors[i]));
  if (state.material === 'glass') {
    path([[-5, 0], [-5, 48], [5, 48], [5, 0]], '#a8b3a7', 1.2);
    const bulbGlow = context.createRadialGradient(0, 46, 0, 0, 46, 45);
    bulbGlow.addColorStop(0, `rgba(255,242,192,${state.glow * .85})`); bulbGlow.addColorStop(1, '#fff2c000');
    oval(0, 46, 45, 45, bulbGlow);
    oval(0, 46, 14, 21, '#a2b4a74a');
    oval(0, 46, 14, 21, `rgba(255,242,207,${state.glow})`);
    path([[-4, 39], [-3, 53], [3, 53], [4, 39]], '#b58e55', .7);
  }
  context.save(); context.shadowColor = '#66311820'; context.shadowBlur = 20; context.shadowOffsetY = 11;
  context.fillStyle = shell; context.beginPath(); context.moveTo(-110, 73); context.bezierCurveTo(-106, 42, -62, 1, -12, 1); context.bezierCurveTo(48, -4, 99, 31, 110, 73); context.closePath(); context.fill(); context.restore();
  context.save(); context.beginPath(); context.moveTo(-110, 73); context.bezierCurveTo(-106, 42, -62, 1, -12, 1); context.bezierCurveTo(48, -4, 99, 31, 110, 73); context.closePath(); context.clip();
  for (let i = 0; i < 36; i++) path([[-112, 5 + i * 2], [112, 5 + i * 2]], i % 2 ? '#fff0d603' : '#77321905', .6);
  if (state.material === 'glass') {
    for (let i = -100; i <= 100; i += 10) {
      context.beginPath(); context.moveTo(i * .2, 0); context.quadraticCurveTo(i * .88, 18, i, 83);
      context.strokeStyle = '#f4fff173'; context.lineWidth = 1.2; context.stroke();
      context.beginPath(); context.moveTo(i * .2 + 2, 0); context.quadraticCurveTo(i * .88 + 2, 18, i + 2, 83);
      context.strokeStyle = '#749c931c'; context.lineWidth = 1; context.stroke();
    }
  }
  if (state.material === 'brass') {
    const shine = context.createLinearGradient(-40 + state.angle * 60, 0, 30 + state.angle * 60, 0);
    shine.addColorStop(0, '#fff1cd00'); shine.addColorStop(.5, '#fff1cd50'); shine.addColorStop(1, '#fff1cd00');
    context.fillStyle = shine; context.fillRect(-110, 0, 220, 75);
  }
  if (state.mood === 'midnight') {
    const shade = context.createLinearGradient(0, 0, 0, 80);
    shade.addColorStop(0, `rgba(7,14,15,${.12 * (1 - state.glow)})`);
    shade.addColorStop(1, `rgba(7,14,15,${.48 * (1 - state.glow)})`);
    context.fillStyle = shade; context.fillRect(-112, 0, 224, 90);
  }
  context.restore();
  oval(0, 73, 111, 15, material.rim);
  const warmColor = (cold, hot) => `rgb(${cold.map((value, i) => Math.round(value + (hot[i] - value) * state.glow)).join(',')})`;
  const inner = context.createRadialGradient(0, 72, 3, 0, 72, 106);
  inner.addColorStop(0, warmColor([76, 61, 43], [255, 250, 218]));
  inner.addColorStop(.5, warmColor([68, 52, 37], [255, 224, 156]));
  inner.addColorStop(1, warmColor([92, 59, 38], [240, 178, 95]));
  oval(0, 75, 104, 10, inner);
  oval(0, 80, 24, 7, warmColor([109, 101, 80], [255, 252, 226]));
  lighting.drawEmitter(context, state);
  // The hanging pull has a larger invisible hit area for touch and pen input.
  const cordY = 168 + state.pull;
  path([[74, 81], [74, cordY]], '#978766', 1);
  for (let i = 87; i < cordY - 2; i += 5) oval(74, i, 1.25, 1.25, '#b49a71');
  context.fillStyle = brass; context.beginPath(); context.roundRect(69, cordY - 1, 10, 20, 5); context.fill();
  path([[72, cordY + 3], [72, cordY + 14]], '#fff1bd60', 1);
  context.restore();
  atmosphere.draw(context, state);
}
function frame(time) {
  const elapsed = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0; lastTime = time;
  simulationTime += elapsed;
  while (simulationTime >= 1 / 120) { integrate(1 / 120); simulationTime -= 1 / 120; }
  if (state.breeze && sceneTime > nextWind) {
    atmosphere.gust(Math.sin(sceneTime * 1.3) > 0 ? -1 : 1); nextWind = sceneTime + (reducedMotion ? 5 : 2.3);
  }
  atmosphere.update(elapsed, state, lightPosition());
  draw(); animationId = requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => {
  cancelAnimationFrame(animationId); lastTime = 0; simulationTime = 0;
  if (!document.hidden) animationId = requestAnimationFrame(frame);
});
resize(); updateControls(); animationId = requestAnimationFrame(frame);
