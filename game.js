// ---------- CANVAS SETUP ----------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreText = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");
const tapButton = document.getElementById("tapButton");

let gameRunning = false;

// Virtual resolution
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;

// Resize canvas to fit screen
function resizeCanvas() {
  const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
  canvas.width = GAME_WIDTH * scale;
  canvas.height = GAME_HEIGHT * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ---------- ASSET HELPERS ----------
function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

// ---------- BRIDGE ANIMATION STATE ----------
let bridgeX = GAME_WIDTH;      // starts off-screen to the right
const BRIDGE_SPEED = 2;        // slide speed
let bridgeState = "hidden";    // hidden → entering → collapsing → exiting
let collapseTimer = 0;

// ---------- BACKGROUND LAYERS ----------
const bgLayers = [
  { img: loadImage("bg_layer1.png"), speed: 0.2, offset: 0, y: 0 },
  { img: loadImage("bg_layer2.png"), speed: 0.4, offset: 0, y: 40 },
  { img: loadImage("bg_layer3.png"), speed: 0.6, offset: 0, y: 80 },
  { img: loadImage("bg_layer4.png"), speed: 0.8, offset: 0, y: 120 },
  { img: loadImage("bg_layer5.png"), speed: 1.0, offset: 0, y: 180 }
];

// ---------- BRIDGE FRAMES ----------
const bridgeFrames = [
  loadImage("bridge1.png"),
  loadImage("bridge2.png"),
  loadImage("bridge3.png"),
  loadImage("bridge4.png")
];

let bridgeFrameIndex = -1;

// ---------- MOTH + TREES ----------
const mothFrames = [
  loadImage("moth1.png"),
  loadImage("moth2.png")
];

const treeImage = loadImage("tree.png");

// ---------- GAME STATE ----------
let mothY = 150;
let mothVelocity = 0;
const gravity = 0.6;
let frameIndex = 0;
let flapAnimTimer = 0; // counts down wing-flap frames
let score = 0;

const GAP_SIZE = 140;

let trees = [
  { x: GAME_WIDTH, gapY: randomGapY() }
];

function randomGapY() {
  return Math.floor(Math.random() * 200) + 100;
}

// ---------- INPUT ----------
function flap() {
  if (!gameRunning) return;
  mothVelocity = -10;
  flapAnimTimer = 10; // wings flap for 10 frames
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") flap();
});

document.addEventListener("touchstart", flap);
tapButton.addEventListener("click", flap);

// ---------- START GAME ----------
startScreen.style.display = "flex";

startScreen.addEventListener("click", () => {
  startScreen.style.display = "none";
  tapButton.style.display = "flex";
  gameRunning = true;
});

// ---------- UPDATE ----------
function update() {
  if (!gameRunning) return;

  // Moth physics
  mothVelocity += gravity;
  mothY += mothVelocity;

  if (mothY < 0) {
    mothY = 0;
    mothVelocity = 0;
  }

  // Parallax background
  bgLayers.forEach(layer => {
    layer.offset -= layer.speed;
    if (layer.offset <= -GAME_WIDTH) layer.offset += GAME_WIDTH;
  });

  // Trees
  trees.forEach(tree => {
    tree.x -= 3;

    // Recycle tree
    if (tree.x + 80 < 0) {
      tree.x = GAME_WIDTH;
      tree.gapY = randomGapY();
      score++;
    }

    // Collision detection
    const mothX = 60;
    const mothW = 40;
    const mothH = 40;

    const topTreeBottom = tree.gapY - GAP_SIZE;
    const bottomTreeTop = tree.gapY + GAP_SIZE;

    const hitTop = mothY < topTreeBottom;
    const hitBottom = mothY + mothH > bottomTreeTop;
    const hitX = mothX + mothW > tree.x && mothX < tree.x + 80;

    if (hitX && (hitTop || hitBottom)) {
      endGame();
    }
  });

  // ---------- BRIDGE LOGIC ----------
  if (bridgeState === "hidden" && score === 10) {
    bridgeState = "entering";
    bridgeFrameIndex = 0;
    bridgeX = GAME_WIDTH;
  }

  if (bridgeState === "entering") {
    bridgeX -= BRIDGE_SPEED;

    if (bridgeX <= 0) {
      bridgeX = 0;
      bridgeState = "collapsing";
      collapseTimer = 0;
    }
  }

  if (bridgeState === "collapsing") {
    collapseTimer++;

    if (collapseTimer % 60 === 0 && bridgeFrameIndex < 3) {
      bridgeFrameIndex++;
    }

    if (bridgeFrameIndex === 3) {
      bridgeState = "exiting";
    }
  }

  if (bridgeState === "exiting") {
    bridgeX -= BRIDGE_SPEED;

    if (bridgeX <= -GAME_WIDTH) {
      bridgeState = "hidden";
      bridgeFrameIndex = -1;
    }
  }

  // Bottom kills player
  if (mothY > GAME_HEIGHT) endGame();
}

// ---------- END GAME ----------
function endGame() {
  gameRunning = false;
  tapButton.style.display = "none";
  finalScoreText.textContent = "Score: " + score;
  gameOverScreen.style.display = "flex";
}

// ---------- RESET ----------
function resetGame() {
  mothY = 150;
  mothVelocity = 0;
  score = 0;
  trees = [{ x: GAME_WIDTH, gapY: randomGapY() }];
  bridgeState = "hidden";
  bridgeFrameIndex = -1;
  gameOverScreen.style.display = "none";
  tapButton.style.display = "flex";
  gameRunning = true;
}

restartBtn.addEventListener("click", resetGame);

// ---------- DRAW ----------
function draw() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Draw layers 1–3
bgLayers.slice(0, 3).forEach(layer => {
  ctx.drawImage(layer.img, layer.offset, layer.y, GAME_WIDTH, GAME_HEIGHT);
  ctx.drawImage(layer.img, layer.offset + GAME_WIDTH, layer.y, GAME_WIDTH, GAME_HEIGHT);
});

// Draw bridge as a true parallax layer
if (bridgeState !== "hidden" && bridgeFrameIndex >= 0) {
  ctx.drawImage(
    bridgeFrames[bridgeFrameIndex],
    bridgeX,
    80,   // vertical offset to match layer 3
    GAME_WIDTH,
    GAME_HEIGHT
  );
}

// Draw layers 4–5
bgLayers.slice(3).forEach(layer => {
  ctx.drawImage(layer.img, layer.offset, layer.y, GAME_WIDTH, GAME_HEIGHT);
  ctx.drawImage(layer.img, layer.offset + GAME_WIDTH, layer.y, GAME_WIDTH, GAME_HEIGHT);
});
;


  // Moth
let mothImg;

if (flapAnimTimer > 0) {
  mothImg = mothFrames[1]; // wings open
  flapAnimTimer--;
} else {
  mothImg = mothFrames[0]; // wings closed
}

  ctx.drawImage(mothImg, 60, mothY, 40, 40);
  frameIndex++;

  // Trees
  trees.forEach(tree => {
    ctx.drawImage(treeImage, tree.x, tree.gapY - GAP_SIZE - 200, 80, 200);
    ctx.drawImage(treeImage, tree.x, tree.gapY + GAP_SIZE, 80, 200);
  });

  // Score
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Score: " + score, 20, 40);
}

// ---------- GAME LOOP ----------
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
