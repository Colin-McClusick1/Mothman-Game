// ---------- CANVAS SETUP ----------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreText = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");
const tapButton = document.getElementById("tapButton");

const initialEntry = document.getElementById("initialEntry");
const initialInput = document.getElementById("initialInput");
const saveInitialsBtn = document.getElementById("saveInitialsBtn");
const highScoreDisplay = document.getElementById("highScoreDisplay");

let gameRunning = false;

// High Score System
let highScore = localStorage.getItem("highScore") || 0;
let highScoreName = localStorage.getItem("highScoreName") || "---";

// Virtual resolution
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;

// Resize canvas
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
  { img: loadImage("bg_layer5.png"), speed: 1.0, offset: 0, y: 240 }
];

// ---------- BRIDGE ----------
const bridgeFrames = [
  loadImage("bridge1.png"),
  loadImage("bridge2.png"),
  loadImage("bridge3.png"),
  loadImage("bridge4.png")
];

let bridgeState = "inactive";
let bridgeX = GAME_WIDTH;
const BRIDGE_SCROLL_SPEED = 0.8;
const BRIDGE_Y = 90;
let bridgePanelIndex = 0;
let bridgeTriggered = false;

// ---------- MOTH + TREES ----------
const mothFrames = [loadImage("moth1.png"), loadImage("moth2.png")];
const treeImage = loadImage("tree.png");

let mothY = 150;
let mothVelocity = 0;
const gravity = 0.6;
let flapAnimTimer = 0;
let score = 0;

const GAP_SIZE = 140;

let trees = [{ x: GAME_WIDTH, gapY: randomGapY() }];

function randomGapY() {
  return Math.floor(Math.random() * 200) + 100;
}

// ---------- INPUT ----------
function flap() {
  if (!gameRunning) return;
  mothVelocity = -10;
  flapAnimTimer = 10;
}

document.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") flap();
});
document.addEventListener("touchstart", flap);
document.addEventListener("mousedown", flap);


// ---------- START GAME ----------
startScreen.addEventListener("click", () => {
  startScreen.classList.add("hidden");
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

  // Background
  bgLayers.forEach(layer => {
    layer.offset -= layer.speed;
    if (layer.offset <= -GAME_WIDTH) layer.offset += GAME_WIDTH;
  });

  // Trees
  trees.forEach(tree => {
    tree.x -= 3.5;

    if (tree.x + 80 < 0) {
      tree.x = GAME_WIDTH;
      tree.gapY = randomGapY();
      score++;

      if (!bridgeTriggered && score === 10) {
        bridgeTriggered = true;
        bridgeState = "active";
        bridgeX = GAME_WIDTH;
        bridgePanelIndex = 0;
      }

      if (bridgeState !== "inactive" && score >= 12 && bridgePanelIndex < 3) {
        bridgePanelIndex++;
      }
    }

    // Collision
    const mothX = 60;
    const mothW = 40;
    const mothH = 40;

    const topTreeBottom = tree.gapY - GAP_SIZE;
    const bottomTreeTop = tree.gapY + GAP_SIZE;

    const hitTop = mothY < topTreeBottom;
    const hitBottom = mothY + mothH > bottomTreeTop;
    const hitX = mothX + mothW > tree.x && mothX < tree.x + 80;

    if (hitX && (hitTop || hitBottom)) endGame();
  });

  // Bridge movement
  if (bridgeState !== "inactive") {
    bridgeX -= BRIDGE_SCROLL_SPEED;

    if (bridgeX <= -GAME_WIDTH) {
      bridgeState = "inactive";
      bridgePanelIndex = 0;
    }
  }

  // Bottom death
  if (mothY > GAME_HEIGHT) endGame();
}

// ---------- END GAME ----------
function endGame() {
  gameRunning = false;
  tapButton.style.display = "none";

  finalScoreText.textContent = "Score: " + score;

  if (score > highScore) {
    initialEntry.style.display = "block";
    highScoreDisplay.textContent = "";
  } else {
    initialEntry.style.display = "none";
    highScoreDisplay.textContent = "High Score: " + highScoreName + " – " + highScore;
  }

  gameOverScreen.style.display = "flex";
}

// ---------- SAVE INITIALS ----------
saveInitialsBtn.addEventListener("click", () => {
  const initials = initialInput.value.toUpperCase();
  if (initials.length === 0) return;

  highScore = score;
  highScoreName = initials;

  localStorage.setItem("highScore", highScore);
  localStorage.setItem("highScoreName", highScoreName);

  initialEntry.style.display = "none";
  highScoreDisplay.textContent = "High Score: " + highScoreName + " – " + highScore;
});

// ---------- RESET ----------
function resetGame() {
  mothY = 150;
  mothVelocity = 0;
  score = 0;
  trees = [{ x: GAME_WIDTH, gapY: randomGapY() }];

  bridgeState = "inactive";
  bridgeX = GAME_WIDTH;
  bridgePanelIndex = 0;
  bridgeTriggered = false;

  initialInput.value = "";
  gameOverScreen.style.display = "none";
  tapButton.style.display = "flex";
  gameRunning = true;
}

restartBtn.addEventListener("click", resetGame);

// ---------- DRAW ----------
function draw() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Background layers
  bgLayers.slice(0, 3).forEach(layer => {
    ctx.drawImage(layer.img, layer.offset, layer.y, GAME_WIDTH, GAME_HEIGHT);
    ctx.drawImage(layer.img, layer.offset + GAME_WIDTH, layer.y, GAME_WIDTH, GAME_HEIGHT);
  });

  const layer4 = bgLayers[3];
  ctx.drawImage(layer4.img, layer4.offset, layer4.y, GAME_WIDTH, GAME_HEIGHT);
  ctx.drawImage(layer4.img, layer4.offset + GAME_WIDTH, layer4.y, GAME_WIDTH, GAME_HEIGHT);

  // Bridge
  if (bridgeState !== "inactive") {
    const bridgeImg = bridgeFrames[bridgePanelIndex];
    if (bridgeImg.complete && bridgeImg.naturalWidth > 0) {
      ctx.drawImage(bridgeImg, bridgeX, BRIDGE_Y, GAME_WIDTH, GAME_HEIGHT);
    }
  }

  // Trees
  trees.forEach(tree => {
    ctx.drawImage(treeImage, tree.x, tree.gapY - GAP_SIZE - 200, 80, 200);
    ctx.drawImage(treeImage, tree.x, tree.gapY + GAP_SIZE, 80, 200);
  });

  // Ground
  const layer5 = bgLayers[4];
  if (layer5.img.complete && layer5.img.naturalWidth > 0) {
    ctx.drawImage(layer5.img, layer5.offset, layer5.y, GAME_WIDTH, GAME_HEIGHT);
    ctx.drawImage(layer5.img, layer5.offset + GAME_WIDTH, layer5.y, GAME_WIDTH, GAME_HEIGHT);
  }

  // Moth
  let mothImg = flapAnimTimer > 0 ? mothFrames[1] : mothFrames[0];
  if (flapAnimTimer > 0) flapAnimTimer--;
  ctx.drawImage(mothImg, 60, mothY, 40, 40);

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
