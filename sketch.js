let loops = [];
let agudos = [];

let filter;
let started = false;
let loaded = false;

// play area (responsiva)
let centerX, centerY, radius;

let currentLoop = null;

// para velocidade do rato
let prevX = 0;
let prevY = 0;

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

  [...loops, ...agudos].forEach(s => {
    s.disconnect();
    s.connect(filter);
    s.setVolume(0);
  });

  calculateCircle();
  loaded = true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateCircle();
}

function calculateCircle() {
  radius = min(windowWidth, windowHeight) * 0.25;
  centerX = radius + 20;
  centerY = radius + 20;
}

function draw() {
  clear();

  noFill();
  stroke(57, 255, 20);
  strokeWeight(3);
  ellipse(centerX, centerY, radius * 2, radius * 2);

  let d = dist(mouseX, mouseY, centerX, centerY);
  let inside = d < radius;

  // velocidade do rato
  let speed = dist(mouseX, mouseY, prevX, prevY);
  prevX = mouseX;
  prevY = mouseY;

  if (started && inside) {
    // filtro radial
    let baseFreq = map(d, 0, radius, 1200, 300);

    // influência da velocidade
    let speedInfluence = map(speed, 0, 20, 0, 1000, true);

    filter.freq(baseFreq + speedInfluence);

    // pan horizontal
    let pan = map(mouseX, centerX - radius, centerX + radius, -1, 1);

    if (!currentLoop) {
      startNewLoop(pan);
    } else {
      currentLoop.pan(pan);
    }

    noStroke();
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
    return;
  }

  let d = dist(mouseX, mouseY, centerX, centerY);
  let inside = d < radius;

  if (inside) {
    let s = random(agudos);
    s.stop();
    s.setVolume(0.8);
    s.play();

    stopCurrentLoop();
    let pan = map(mouseX, centerX - radius, centerX + radius, -1, 1);
    startNewLoop(pan);
  }
}

function startNewLoop(pan) {
  currentLoop = random(loops);
  currentLoop.loop();
  currentLoop.pan(pan);
  currentLoop.setVolume(0.6, 0.5);
}

function stopCurrentLoop() {
  if (currentLoop) {
    currentLoop.stop();
    currentLoop = null;
  }
}


