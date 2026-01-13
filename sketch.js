let loops = [];
let agudos = [];

let filter;
let started = false;
let loaded = false;

// play area (elipse responsiva)
let centerX, centerY;
let radiusX, radiusY;

let currentLoop = null;
let currentLoopIndex = -1;

// cores por loop
let loopColors = [
  [255, 120, 40],   // laranja
  [60, 140, 255],   // azul
  [80, 200, 120]    // verde
];

// velocidade do rato
let prevX = 0;
let prevY = 0;

// rasto
let trail = [];
let maxTrail = 140;

// pulsação
let pulsePhase = 0;

// fundo nublado
let clouds = [];

function preload() {
  soundFormats('mp3');

  loops[0] = loadSound("sounds/loop1.mp3");
  loops[1] = loadSound("sounds/loop2.mp3");
  loops[2] = loadSound("sounds/loop3.mp3");

  agudos[0] = loadSound("sounds/agudo1.mp3");
}

function setup() {
  let c = createCanvas(windowWidth, windowHeight);
  c.parent(document.body);

  filter = new p5.LowPass();

  loops.forEach(s => {
    s.disconnect();
    s.connect(filter);
    s.setVolume(0);
    s.rate(1);
  });

  agudos.forEach(s => {
    s.disconnect();
    s.connect();
    s.setVolume(0);
  });

  calculateEllipse();

  // gerar nuvens (campo geométrico)
  for (let i = 0; i < 30; i++) {
    clouds.push({
      x: random(-radiusX, radiusX),
      y: random(-radiusY, radiusY),
      r: random(40, 120),
      offset: random(1000)
    });
  }

  loaded = true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateEllipse();
}

function calculateEllipse() {
  radiusX = windowWidth * 0.35;
  radiusY = windowHeight * 0.2;

  centerX = radiusX + 20;
  centerY = radiusY + 20;
}

function draw() {
  clear();

  let nx = (mouseX - centerX) / radiusX;
  let ny = (mouseY - centerY) / radiusY;
  let inside = nx * nx + ny * ny < 1;
  let d = sqrt(nx * nx + ny * ny);

  let speed = dist(mouseX, mouseY, prevX, prevY);

  // --- CAMADA 1: COR BASE DA ELIPSE ---
  if (currentLoopIndex !== -1) {
    let col = loopColors[currentLoopIndex];
    let alpha = map(d, 0, 1, 60, 25);

    noStroke();
    fill(col[0], col[1], col[2], alpha);
    ellipse(centerX, centerY, radiusX * 2, radiusY * 2);
  }

  // --- CAMADA 2: FUNDO NUBLADO (SÓ DENTRO DA ELIPSE) ---
  if (currentLoopIndex !== -1 && inside) {
    pulsePhase += 0.01;

    let col = loopColors[currentLoopIndex];
    let motion = map(speed, 0, 30, 0.2, 2.5, true);

    noStroke();
    for (let c of clouds) {
      // deslocamento suave em direção ao rato
      let dx = nx * motion * 10;
      let dy = ny * motion * 10;

      let cx = centerX + c.x + dx * sin(frameCount * 0.01 + c.offset);
      let cy = centerY + c.y + dy * cos(frameCount * 0.01 + c.offset);

      // máscara elíptica manual
      let ex = (cx - centerX) / radiusX;
      let ey = (cy - centerY) / radiusY;
      if (ex * ex + ey * ey < 1) {
        let alpha = 12 + sin(frameCount * 0.02 + c.offset) * 10;
        fill(col[0], col[1], col[2], alpha);
        ellipse(cx, cy, c.r, c.r);
      }
    }
  }

  // contorno da elipse
  noFill();
  stroke(0);
  ellipse(centerX, centerY, radiusX * 2, radiusY * 2);

  // marcador do centro (estado base)
  let cp = sin(frameCount * 0.03) * 2;
  noStroke();
  fill(0);
  ellipse(centerX, centerY, 10 + cp, 10 + cp);

  if (started && inside) {
    // pitch com velocidade
    let pitch = map(speed, 0, 30, 1.0, 2.5, true);
    if (currentLoop) currentLoop.rate(pitch);

    // filtro radial
    let freq = map(d, 0, 1, 4000, 600);
    filter.freq(freq);

    let pan = constrain(nx, -1, 1);

    if (!currentLoop) {
      startNewLoop(pan);
    } else {
      currentLoop.pan(pan);
    }

    // rasto
    let steps = floor(map(speed, 0, 30, 1, 6, true));
    for (let i = 0; i < steps; i++) {
      let t = i / steps;
      trail.push({
        x: lerp(prevX, mouseX, t),
        y: lerp(prevY, mouseY, t),
        life: 255,
        size: map(speed, 0, 30, 5, 18, true)
      });
    }

    if (trail.length > maxTrail) {
      trail.splice(0, trail.length - maxTrail);
    }

  } else {
    stopCurrentLoop();
  }

  prevX = mouseX;
  prevY = mouseY;

  // desenhar rasto
  noStroke();
  for (let i = trail.length - 1; i >= 0; i--) {
    let t = trail[i];
    let col = currentLoopIndex !== -1 ? loopColors[currentLoopIndex] : [0, 0, 0];
    fill(col[0], col[1], col[2], t.life);
    ellipse(t.x, t.y, t.size, t.size);
    t.life -= 4;
    if (t.life <= 0) trail.splice(i, 1);
  }
}

function mousePressed() {
  if (!loaded) return;

  if (!started) {
    userStartAudio();
    started = true;
    return;
  }

  let nx = (mouseX - centerX) / radiusX;
  let ny = (mouseY - centerY) / radiusY;
  let inside = nx * nx + ny * ny < 1;

  if (inside) {
    let s = random(agudos);
    s.stop();
    s.pan(constrain(nx, -1, 1));
    s.setVolume(0.45); // −5 dB aprox
    s.play();

    stopCurrentLoop();
    startNewLoop(constrain(nx, -1, 1));
  }
}

function startNewLoop(pan) {
  currentLoopIndex = floor(random(loops.length));
  currentLoop = loops[currentLoopIndex];
  currentLoop.loop();
  currentLoop.pan(pan);
  currentLoop.rate(1);
  currentLoop.setVolume(0.6, 0.5);
}

function stopCurrentLoop() {
  if (currentLoop) {
    currentLoop.stop();
    currentLoop = null;
    currentLoopIndex = -1;
  }
}
