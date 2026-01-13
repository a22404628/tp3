let loops = [];
let agudos = [];

let filter;
let started = false;
let loaded = false;

// play area circular
let centerX = 300;
let centerY = 200;
let radius = 150;

let currentLoop = null;

function preload() {
  soundFormats('mp3');

  loops[0] = loadSound("sounds/loop1.mp3");
  loops[1] = loadSound("sounds/loop2.mp3");
  loops[2] = loadSound("sounds/loop3.mp3");

  agudos[0] = loadSound("sounds/agudo1.mp3");
}

function setup() {
  createCanvas(600, 400);

  filter = new p5.LowPass();

  [...loops, ...agudos].forEach(s => {
    s.disconnect();
    s.connect(filter);
    s.setVolume(0);
  });

  loaded = true;
}

function draw() {
  background(230);

  // desenhar play area
  noFill();
  stroke(0);
  ellipse(centerX, centerY, radius * 2, radius * 2);

  let d = dist(mouseX, mouseY, centerX, centerY);
  let inside = d < radius;

  if (started && inside) {
    // filtro radial (centro = neutro)
    let freq = map(d, 0, radius, 1200, 300);
    filter.freq(freq);

    // pan horizontal
    let pan = map(mouseX, centerX - radius, centerX + radius, -1, 1);

    if (!currentLoop) {
      startNewLoop(pan);
    } else {
      currentLoop.pan(pan);
    }

    // indicador visual
    fill(0);
    ellipse(mouseX, mouseY, 16, 16);

  } else {
    stopCurrentLoop();
  }
}

function mousePressed() {
  if (!loaded) return;

  if (!started) {
    userStartAudio();
    started = true;
    return; // primeiro clique só ativa áudio
  }

  let d = dist(mouseX, mouseY, centerX, centerY);
  let inside = d < radius;

  if (inside) {
    // evento agudo
    let s = random(agudos);
    s.stop();
    s.setVolume(0.8);
    s.play();

    // muda o loop
    stopCurrentLoop();

    let pan = map(mouseX, centerX - radius, centerX + radius, -1, 1);
    startNewLoop(pan);
  }
}

function startNewLoop(pan) {
  currentLoop = random(loops);
  currentLoop.loop();
  currentLoop.pan(pan);
  currentLoop.setVolume(0.6, 0.5); // fade in
}

function stopCurrentLoop() {
  if (currentLoop) {
    currentLoop.stop();
    currentLoop = null;
  }
}
