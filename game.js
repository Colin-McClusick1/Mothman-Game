const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ---------- ASSET HELPERS ----------
function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

// ---------- BACKGROUND LAYERS ----------
const bgLayers = [
  { img: loadImage("bg_layer1.png"), speed: 0.2, offset: 0 },
  { img: loadImage("bg_layer2.png"), speed: 0.4, offset: 0 },
  { img: loadImage("bg_layer3.png"), speed: 0.6, offset: 0 },
  { img: loadImage("bg_layer4.png"), speed: 0.8, offset: 0 },
  { img: loadImage("bg_layer5.png"), speed: 1.0, offset: 0 }
];

// ---------- BRIDGE FRAMES ----------
const bridgeFrames = [
  loadImage("bridge1.png"), // intact
  loadImage("bridge2.png"), // cracking
  loadImage("bridge3.png"), // breaking
  loadImage("bridge4.png")  // destroyed
];

let bridgeActive = false;
let bridgeFrameIndex = -1; // -1 = hidden

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
let score = 0;

let trees = [
  { x: canvas.width, y: randomTreeY() }
];

function randomTreeY() {
  return Math.floor(Math.random() * (canvas.height - 200)) + 100;
}

// ---------- INPUT ----------
function flap() {
  mothVelocity = -10;
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    flap();
  }
});

document.addEventListener("click", flap);

// ---------- UPDATE ----------
function update() {
  // Moth physics
  mothVelocity += gravity;
  mothY += mothVelocity;

  // Parallax background
  bgLayers.forEach(layer => {
    layer.offset -= layer.speed;
    if (layer.offset <= -canvas.width) {
      layer.offset += canvas.width;
    }
  });

  // Trees (obstacles)
  trees.forEach(tree => {
    tree.x -= 3;

    // Recycle tree when off-screen
    if (tree.x + 50 < 0) {
      tree.x = canvas.width;
      tree.y = randomTreeY();
      score++;

      // Bridge logic tied to score
      if (score === 10) {
        bridgeActive = true;
        bridgeFrameIndex = 0; // show intact bridge
      } else if (bridgeActive && score > 10 && score % 2 === 0 && bridgeFrameIndex < 3) {
        bridgeFrameIndex++;
      }
    }

    // Collision with tree
    const mothX = 60;
    const mothWidth = 40;
    const mothHeight = 40;
    const treeWidth = 50;
    const treeHeight = 100;

    if (
      mothX < tree.x + treeWidth &&
      mothX + mothWidth > tree.x &&
      mothY < tree.y + treeHeight &&
      mothY + mothHeight > tree.y
    ) {
      resetGame();
    }
  });

  // Collision with top/bottom
  if (mothY > canvas.height || mothY + 40 < 0) {
    resetGame();
  }
}

// ---------- RESET ----------
function resetGame() {
  mothY = 150;
  mothVelocity = 0;
  score = 0;
  trees = [{ x: canvas.width, y: randomTreeY() }];
  bridgeActive = false;
  bridgeFrameIndex = -1;
}

// ---------- DRAW ----------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background layers
  bgLayers.forEach(layer => {
    const { img, offset } = layer;
    ctx.drawImage(img, offset, 0, canvas.width, canvas.height);
    ctx.drawImage(img, offset + canvas.width, 0, canvas.width, canvas.height);
  });

  // Bridge (Layer 3-ish)
  if (bridgeActive && bridgeFrameIndex >= 0) {
    const bridgeImg = bridgeFrames[bridgeFrameIndex];
    ctx.drawImage(bridgeImg, 0, 0, canvas.width, canvas.height);
  }

  // Moth
  const mothImg = mothFrames[Math.floor(frameIndex / 10) % mothFrames.length];
  ctx.drawImage(mothImg, 60, mothY, 40, 40);
  frameIndex++;

  // Trees
  trees.forEach(tree => {
    ctx.drawImage(treeImage, tree.x, tree.y, 50, 100);
  });

  // UI
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
