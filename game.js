const canvas = document.querySelector('#arena');
const context = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const gameOver = document.querySelector('#game-over');
const jumpscare = document.querySelector('#jumpscare');
const healthLabel = document.querySelector('#health');
const scoreLabel = document.querySelector('#score');
const timerLabel = document.querySelector('#timer');
const fearLabel = document.querySelector('#fear-level');
const crosshair = document.querySelector('#crosshair');
const keys = new Set();
const pointer = { x: canvas.width / 2, y: canvas.height / 2, down: false };
const player = { x: canvas.width / 2, y: canvas.height / 2, radius: 12, speed: 270, health: 100, fireCooldown: 0 };
let enemies = [];
let shots = [];
let sparks = [];
let score = 0;
let elapsed = 0;
let lastTime = 0;
let spawnTimer = 0;
let running = false;
let audioContext;
let heartbeatTimer = 0;
let lastHeartbeat = 0;
let musicTimer;
let musicStep = 0;
let musicBus;
let audioMaster;
let distortion;

const random = (min, max) => Math.random() * (max - min) + min;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function startAudio() {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return;
  audioContext = new AudioEngine();
  audioMaster = audioContext.createGain();
  audioMaster.gain.value = .78;
  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 10;
  compressor.ratio.value = 10;
  compressor.attack.value = .006;
  compressor.release.value = .18;
  distortion = audioContext.createWaveShaper();
  distortion.curve = makeDistortionCurve(260);
  distortion.oversample = '4x';
  audioMaster.connect(distortion).connect(compressor).connect(audioContext.destination);
  musicBus = audioContext.createGain();
  musicBus.gain.value = .12;
  musicBus.connect(audioMaster);
  startMusic();
}

function makeDistortionCurve(amount) {
  const curve = new Float32Array(44100);
  const intensity = amount * Math.PI / 180;
  for (let index = 0; index < curve.length; index += 1) {
    const x = index * 2 / curve.length - 1;
    curve[index] = (3 + intensity) * x * 20 * Math.PI / (Math.PI + intensity * Math.abs(x));
  }
  return curve;
}

function tone(frequency, duration, type = 'sine', volume = .025) {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioMaster);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function startMusic() {
  if (!audioContext || musicTimer) return;
  const playStep = () => {
    if (!audioContext || audioContext.state === 'closed') return;
    const now = audioContext.currentTime;
    const bassNotes = [41.2, 41.2, 46.25, 38.9, 41.2, 49, 46.25, 38.9];
    const bass = audioContext.createOscillator();
    const bassGain = audioContext.createGain();
    bass.type = 'sawtooth';
    bass.frequency.setValueAtTime(bassNotes[musicStep % bassNotes.length], now);
    bass.detune.value = -7;
    bassGain.gain.setValueAtTime(.001, now);
    bassGain.gain.exponentialRampToValueAtTime(.22, now + .025);
    bassGain.gain.exponentialRampToValueAtTime(.001, now + .28);
    bass.connect(bassGain).connect(musicBus);
    bass.start(now);
    bass.stop(now + .31);

    if (musicStep % 2 === 0) {
      const note = [164.8, 155.6, 138.6, 123.5][Math.floor(musicStep / 2) % 4];
      const pad = audioContext.createOscillator();
      const padGain = audioContext.createGain();
      pad.type = 'triangle';
      pad.frequency.setValueAtTime(note, now);
      pad.detune.value = musicStep % 4 === 0 ? -19 : 23;
      padGain.gain.setValueAtTime(.001, now);
      padGain.gain.exponentialRampToValueAtTime(.055, now + .08);
      padGain.gain.exponentialRampToValueAtTime(.001, now + .6);
      pad.connect(padGain).connect(musicBus);
      pad.start(now);
      pad.stop(now + .65);
    }
    musicStep += 1;
  };
  playStep();
  musicTimer = window.setInterval(playStep, 310);
}

function stopMusic() {
  if (musicTimer) window.clearInterval(musicTimer);
  musicTimer = undefined;
  musicStep = 0;
}

function resetGame() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.health = 100;
  player.fireCooldown = 0;
  enemies = [];
  shots = [];
  sparks = [];
  score = 0;
  elapsed = 0;
  spawnTimer = 0;
  heartbeatTimer = 0;
  lastHeartbeat = 0;
  running = true;
  if (audioContext && !musicTimer) startMusic();
  overlay.hidden = true;
  gameOver.hidden = true;
  requestAnimationFrame(loop);
}

function spawnEnemy() {
  const edge = Math.floor(random(0, 4));
  const enemy = { x: edge === 1 ? canvas.width + 20 : edge === 3 ? -20 : random(0, canvas.width), y: edge === 0 ? -20 : edge === 2 ? canvas.height + 20 : random(0, canvas.height), radius: random(12, 22), speed: random(35, 65) + elapsed * 1.8, phase: random(0, Math.PI * 2), stalker: Math.random() < .16 + elapsed / 500 };
  enemies.push(enemy);
}

function createSpark(x, y, color = '#ff183f', amount = 5) {
  for (let index = 0; index < amount; index += 1) sparks.push({ x, y, dx: random(-90, 90), dy: random(-90, 90), life: random(.2, .55), color });
}

function shoot() {
  if (!running || player.fireCooldown > 0) return;
  const angle = Math.atan2(pointer.y - player.y, pointer.x - player.x);
  shots.push({ x: player.x, y: player.y, dx: Math.cos(angle) * 650, dy: Math.sin(angle) * 650, life: 1.1 });
  player.fireCooldown = .16;
  createSpark(player.x + Math.cos(angle) * 18, player.y + Math.sin(angle) * 18, '#ffd3da', 3);
  tone(150, .06, 'square', .018);
}

function damagePlayer(amount) {
  player.health = Math.max(0, player.health - amount);
  document.body.classList.remove('is-hit');
  void document.body.offsetWidth;
  document.body.classList.add('is-hit');
  createSpark(player.x, player.y, '#ff183f', 12);
  tone(65, .18, 'sawtooth', .04);
  if (player.health <= 0) triggerDeath();
}

function triggerDeath() {
  running = false;
  stopMusic();
  jumpscare.hidden = false;
  jumpscare.setAttribute('aria-hidden', 'false');
  playJumpscareSound();
  window.setTimeout(() => finish(false), 950);
}

function playJumpscareSound() {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const scream = audioContext.createOscillator();
  const screamGain = audioContext.createGain();
  const screamFilter = audioContext.createBiquadFilter();
  scream.type = 'sawtooth';
  scream.frequency.setValueAtTime(780, now);
  scream.frequency.exponentialRampToValueAtTime(92, now + 1.25);
  screamFilter.type = 'bandpass';
  screamFilter.frequency.setValueAtTime(1700, now);
  screamFilter.frequency.exponentialRampToValueAtTime(180, now + 1.1);
  screamFilter.Q.value = 8;
  screamGain.gain.setValueAtTime(.001, now);
  screamGain.gain.exponentialRampToValueAtTime(.42, now + .025);
  screamGain.gain.exponentialRampToValueAtTime(.001, now + 1.35);
  scream.connect(screamFilter).connect(screamGain).connect(audioMaster);
  scream.start(now);
  scream.stop(now + 1.4);

  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 1.1, audioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let index = 0; index < noiseData.length; index += 1) noiseData[index] = Math.random() * 2 - 1;
  const noise = audioContext.createBufferSource();
  const noiseFilter = audioContext.createBiquadFilter();
  const noiseGain = audioContext.createGain();
  noise.buffer = noiseBuffer;
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 900;
  noiseGain.gain.setValueAtTime(.001, now);
  noiseGain.gain.exponentialRampToValueAtTime(.34, now + .02);
  noiseGain.gain.exponentialRampToValueAtTime(.001, now + 1.05);
  noise.connect(noiseFilter).connect(noiseGain).connect(audioMaster);
  noise.start(now);

  const impact = audioContext.createOscillator();
  const impactGain = audioContext.createGain();
  impact.type = 'square';
  impact.frequency.setValueAtTime(54, now);
  impact.frequency.exponentialRampToValueAtTime(24, now + .55);
  impactGain.gain.setValueAtTime(.34, now);
  impactGain.gain.exponentialRampToValueAtTime(.001, now + .6);
  impact.connect(impactGain).connect(audioMaster);
  impact.start(now);
  impact.stop(now + .65);
}

function finish(won) {
  running = false;
  jumpscare.hidden = true;
  jumpscare.setAttribute('aria-hidden', 'true');
  gameOver.hidden = false;
  document.querySelector('#result-label').textContent = won ? 'SIGNAL STABLE' : 'SIGNAL LOST';
  document.querySelector('#result-title').textContent = won ? 'You held the room.' : 'The room won.';
  document.querySelector('#result-copy').textContent = won ? `Final score: ${String(score).padStart(6, '0')}. The blackout is yours.` : `You lasted ${elapsed.toFixed(1)} seconds. Final score: ${String(score).padStart(6, '0')}.`;
  tone(won ? 440 : 90, .5, won ? 'sine' : 'sawtooth', .04);
}

function update(delta) {
  elapsed += delta;
  if (elapsed >= 60) { elapsed = 60; finish(true); return; }
  player.fireCooldown = Math.max(0, player.fireCooldown - delta);
  heartbeatTimer += delta;
  const fear = Math.min(1, elapsed / 60 + enemies.length / 18);
  if (heartbeatTimer > Math.max(.34, .92 - fear * .4)) {
    heartbeatTimer = 0;
    tone(48 + fear * 18, .16, 'sine', .09);
    if (fear > .55) tone(72 + fear * 15, .1, 'triangle', .055);
    lastHeartbeat = performance.now();
  }
  let moveX = 0;
  let moveY = 0;
  if (keys.has('w') || keys.has('arrowup')) moveY -= 1;
  if (keys.has('s') || keys.has('arrowdown')) moveY += 1;
  if (keys.has('a') || keys.has('arrowleft')) moveX -= 1;
  if (keys.has('d') || keys.has('arrowright')) moveX += 1;
  const length = Math.hypot(moveX, moveY) || 1;
  player.x = clamp(player.x + moveX / length * player.speed * delta, 24, canvas.width - 24);
  player.y = clamp(player.y + moveY / length * player.speed * delta, 24, canvas.height - 24);
  if (keys.has(' ') || pointer.down) shoot();
  spawnTimer -= delta;
  if (spawnTimer <= 0) { spawnEnemy(); spawnTimer = Math.max(.22, .8 - elapsed * .008); }
  shots.forEach(shot => { shot.x += shot.dx * delta; shot.y += shot.dy * delta; shot.life -= delta; });
  shots = shots.filter(shot => shot.life > 0 && shot.x > -30 && shot.x < canvas.width + 30 && shot.y > -30 && shot.y < canvas.height + 30);
  enemies.forEach(enemy => { const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x); enemy.x += Math.cos(angle) * enemy.speed * delta; enemy.y += Math.sin(angle) * enemy.speed * delta; enemy.phase += delta * 4; });
  enemies = enemies.filter(enemy => {
    if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < enemy.radius + player.radius) { damagePlayer(8); return false; }
    for (const shot of shots) if (Math.hypot(enemy.x - shot.x, enemy.y - shot.y) < enemy.radius + 5) { score += 100; createSpark(enemy.x, enemy.y, '#ff183f', 10); shot.life = 0; return false; }
    return true;
  });
  sparks.forEach(spark => { spark.x += spark.dx * delta; spark.y += spark.dy * delta; spark.life -= delta; });
  sparks = sparks.filter(spark => spark.life > 0);
  healthLabel.textContent = String(player.health).padStart(3, '0');
  scoreLabel.textContent = String(score).padStart(6, '0');
  timerLabel.textContent = (60 - elapsed).toFixed(1).padStart(4, '0');
  fearLabel.style.transform = `scaleX(${Math.max(.08, fear)})`;
  document.querySelector('.game-frame').classList.toggle('is-panicked', fear > .72);
  document.querySelector('.game-frame').classList.toggle('is-dark', fear > .48);
}

function draw() {
  context.fillStyle = '#030204';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const chaos = elapsed / 60;
  context.strokeStyle = `rgba(101,30,42,${.12 + chaos * .08})`;
  context.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 64) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, canvas.height); context.stroke(); }
  for (let y = 0; y < canvas.height; y += 64) { context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke(); }
  context.strokeStyle = 'rgba(255,24,63,.16)';
  context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
  context.fillStyle = `rgba(255,0,50,${.015 + chaos * .08})`;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(255,24,63,.08)';
  for (let index = 0; index < 7; index += 1) { const x = 70 + index * 145; context.fillRect(x, 40, 3, 90 + index % 3 * 35); }
  shots.forEach(shot => { context.fillStyle = '#ffd3da'; context.shadowBlur = 15; context.shadowColor = '#ff183f'; context.fillRect(shot.x - 3, shot.y - 3, 6, 6); context.shadowBlur = 0; });
  enemies.forEach(enemy => { context.save(); context.translate(enemy.x, enemy.y); context.rotate(enemy.phase); context.fillStyle = enemy.stalker ? '#090609' : '#390b16'; context.shadowBlur = enemy.stalker ? 28 : 16; context.shadowColor = '#ff183f'; context.beginPath(); context.moveTo(0, -enemy.radius * 1.4); context.quadraticCurveTo(enemy.radius * 1.3, -enemy.radius * .4, enemy.radius * .8, enemy.radius * 1.3); context.lineTo(0, enemy.radius * .85); context.lineTo(-enemy.radius * .8, enemy.radius * 1.3); context.quadraticCurveTo(-enemy.radius * 1.3, -enemy.radius * .4, 0, -enemy.radius * 1.4); context.fill(); context.fillStyle = '#ff183f'; context.shadowBlur = 8; context.fillRect(-enemy.radius * .42, -enemy.radius * .2, 4, 2); context.fillRect(enemy.radius * .2, -enemy.radius * .2, 4, 2); context.restore(); });
  const aim = Math.atan2(pointer.y - player.y, pointer.x - player.x);
  context.save(); context.translate(player.x, player.y); context.rotate(aim); const beam = context.createRadialGradient(25, 0, 2, 120, 0, 220); beam.addColorStop(0, 'rgba(255,220,225,.16)'); beam.addColorStop(1, 'rgba(255,24,63,0)'); context.fillStyle = beam; context.beginPath(); context.moveTo(5, 0); context.arc(5, 0, 230, -.3, .3); context.closePath(); context.fill(); context.fillStyle = '#f6eef0'; context.shadowBlur = 22; context.shadowColor = '#ff183f'; context.beginPath(); context.moveTo(20, 0); context.lineTo(-10, 10); context.lineTo(-5, 0); context.lineTo(-10, -10); context.closePath(); context.fill(); context.restore();
  const vignette = context.createRadialGradient(player.x, player.y, 80, player.x, player.y, 520); vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(.58, `rgba(0,0,0,${.18 + chaos * .18})`); vignette.addColorStop(1, 'rgba(0,0,0,.92)'); context.fillStyle = vignette; context.fillRect(0, 0, canvas.width, canvas.height);
  sparks.forEach(spark => { context.globalAlpha = Math.max(0, spark.life * 2); context.fillStyle = spark.color; context.fillRect(spark.x, spark.y, 3, 3); });
  context.globalAlpha = 1;
}

function loop(timestamp) {
  if (!running) return;
  const delta = Math.min((timestamp - lastTime) / 1000 || 0, .033);
  lastTime = timestamp;
  update(delta);
  draw();
  if (running) requestAnimationFrame(loop);
}

function setPointer(event) {
  const bounds = canvas.getBoundingClientRect();
  pointer.x = (event.clientX - bounds.left) / bounds.width * canvas.width;
  pointer.y = (event.clientY - bounds.top) / bounds.height * canvas.height;
  crosshair.style.display = 'block';
  crosshair.style.left = `${event.clientX - bounds.left}px`;
  crosshair.style.top = `${event.clientY - bounds.top}px`;
}

document.addEventListener('keydown', event => { keys.add(event.key.toLowerCase()); if (event.key === ' ') event.preventDefault(); });
document.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
canvas.addEventListener('pointermove', setPointer);
canvas.addEventListener('pointerdown', event => { pointer.down = true; setPointer(event); shoot(); });
window.addEventListener('pointerup', () => { pointer.down = false; });
document.querySelector('#start-button').addEventListener('click', () => { startAudio(); resetGame(); });
document.querySelector('#restart-button').addEventListener('click', () => { if (!audioContext) startAudio(); resetGame(); });
document.querySelector('#touch-fire').addEventListener('pointerdown', event => { event.preventDefault(); pointer.down = true; });
document.querySelector('#touch-fire').addEventListener('pointerup', () => { pointer.down = false; });
document.querySelector('#touch-pad').addEventListener('pointermove', event => { if (event.buttons) { keys.add('d'); } });