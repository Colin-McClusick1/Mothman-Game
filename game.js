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

// ---------- BRIDGE STATE ----------
let bridgeActive = false;          // Are we in the bridge sequence?
let bridgePanelIndex = 0;          // 0–3 (bridge1–bridge4)
let bridgePointsOnPanel = 0;       // How many points earned on this panel
let bridgeTriggered = false;       // Only trigger once
const BRIDGE_Y = 90;               // Higher so the bridge is more visible

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
let flapAnimTimer = 0;
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
  flapAnimTimer = 10;
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

      // Trigger bridge sequence at score 10
      if (!bridgeTriggered && score === 10) {
        bridgeTriggered = true;
        bridgeActive = true;
        bridgePanelIndex = 0;
        bridgePointsOnPanel = 0;
      }

      // Advance bridge panels per point
      if (bridgeActive) {
        bridgePointsOnPanel++;

        if (bridgePointsOnPanel >= 1) {
          bridgePointsOnPanel = 0;

          if (bridgePanelIndex < 3) {
            bridgePanelIndex++; // bridge1 → bridge2 → bridge3 → bridge4
          } else {
            // After bridge4 has been shown for a full point,
            // we simply let it scroll out naturally.
            // No state change needed.
          }
        }
      }
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

  // End bridge sequence naturally when bridge4 scrolls offscreen
  if (bridgeActive) {
    const layer4 = bgLayers[3];
    const bridgeRightEdge = layer4.offset + GAME_WIDTH + GAME_WIDTH;

    if (bridgeRightEdge < 0) {
      bridgeActive = false;
      bridgePanelIndex = 0;
      bridgePointsOnPanel = 0;
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

  bridgeActive = false;
  bridgePanelIndex = 0;
  bridgePointsOnPanel = 0;
  bridgeTriggered = false;

  gameOverScreen.style.display = "none";
  tapButton.style.display = "flex";
  gameRunning = true;
}

restartBtn.addEventListener("click", resetGame);

// ---------- DRAW ----------
function draw() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Draw layers 1–3 (tall parallax images)
  bgLayers.slice(0, 3).forEach(layer => {
    ctx.drawImage(layer.img, layer.offset, 0);
    ctx.drawImage(layer.img, layer.offset + GAME_WIDTH, 0);
  });

  // Draw layer 4 (also tall)
  const layer4 = bgLayers[3];
  ctx.drawImage(layer4.img, layer4.offset, 0);
  ctx.drawImage(layer4.img, layer4.offset + GAME_WIDTH, 0);

  // Draw bridge OVER layer 4
  if (bridgeActive) {
    const bridgeImg = bridgeFrames[bridgePanelIndex];
    ctx.drawImage(bridgeImg, layer4.offset, BRIDGE_Y);
    ctx.drawImage(bridgeImg, layer4.offset + GAME_WIDTH, BRIDGE_Y);
  }

  // Draw layer 5 (ground)
  const layer5 = bgLayers[4];
  ctx.drawImage(layer5.img, layer5.offset, 0);
  ctx.drawImage(layer5.img, layer5.offset + GAME_WIDTH, 0);

  // Moth
  let mothImg = flapAnimTimer > 0 ? mothFrames[1] : mothFrames[0];
  if (flapAnimTimer > 0) flapAnimTimer--;
  ctx.drawImage(mothImg, 60, mothY, 40, 40);

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
