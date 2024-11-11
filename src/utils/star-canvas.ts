const canvas = document.getElementById("starCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const breakpointMobile = 640;
const isMobile = window.innerWidth < breakpointMobile;

const scale = isMobile ? 1.5 : 3;
const canvasSize = scale * 220;
canvas.width = canvasSize;
canvas.height = canvasSize;

type Line = {
  originalX: number;
  originalY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const lines: Line[][] = [];
const numLines = 8; // Number of lines
let lineLength = scale * 100; // Length of each line
const starColor = "#fffceb";
const centerX = Math.round(canvas.width / 2);
const centerY = Math.round(canvas.height / 2);
const pointSize = scale * 3; // Size of each square point
const gridSize = scale * 5; // Size of each grid block

let initialRotationAngle = Math.PI / 4;
let lineThickness = 5.5;
let lineWidth = lineThickness / 1.67;

let mouseX = -100;
let mouseY = -100;

function createLines() {
  const angleStep = (Math.PI * 2) / numLines;

  for (let i = 0; i < numLines; i++) {
    const angle = i * angleStep + initialRotationAngle;

    for (let offset = -lineWidth / 2; offset <= lineWidth / 2; offset++) {
      const line = [];

      for (let j = 0; j < lineLength; j += lineThickness) {
        const x =
          centerX + Math.cos(angle) * j - Math.sin(angle) * offset * gridSize;
        const y =
          centerY + Math.sin(angle) * j + Math.cos(angle) * offset * gridSize;

        line.push({
          originalX: x,
          originalY: y,
          x: x,
          y: y,
          vx: 0,
          vy: 0,
        });
      }
      lines.push(line);
    }
  }
}

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  // Recalculate positions for the lines
  lines.length = 0;
  createLines();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function snapToGrid(value: number, gridSize: number) {
  return Math.floor(value / gridSize) * gridSize;
}

function updatePoints() {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line) continue;

    for (let j = 0; j < line.length; j++) {
      const point = line[j];

      if (!point) continue;

      const dx = point.x - mouseX;
      const dy = point.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // const attractionDistance = 200 / (1 + Math.exp(-(0.1 * (window.innerWidth - 350) / 3.3))) + 30;
      const attractionDistance = 40 * scale;
      let force = 0;
      if (distance < attractionDistance) {
        force = (attractionDistance - distance) / attractionDistance;
      }

      const angleToMouse = Math.atan2(dy, dx);
      point.vx = (point.vx + Math.cos(angleToMouse) * force * 2) * 0.9;
      point.vy = (point.vy + Math.sin(angleToMouse) * force * 2) * 0.9;

      // Calculate the return force to the target position
      const x = point.originalX;
      const y = point.originalY;
      const returnDx = x - point.x;
      const returnDy = y - point.y;
      const returnDistance = Math.sqrt(
        returnDx * returnDx + returnDy * returnDy
      );
      const returnForce = Math.min(0.1, returnDistance / 100);
      point.x += point.vx + returnDx * returnForce;
      point.y += point.vy + returnDy * returnForce;
    }
  }
}

function drawLines() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  ctx.fillStyle = starColor;

  for (const line of lines) {
    for (const point of line) {
      // Snap to grid during drawing
      const snappedX = snapToGrid(point.x, gridSize);
      const snappedY = snapToGrid(point.y, gridSize);
      ctx.fillRect(
        snappedX - pointSize / 2,
        snappedY - pointSize / 2,
        pointSize,
        pointSize
      );
    }
  }
}

canvas.addEventListener("mousemove", (event) => {
  mouseX = event.offsetX;
  mouseY = event.offsetY;
});
canvas.addEventListener("mouseleave", () => {
  mouseX = -100;
  mouseY = -100;
});

// Handle dragging on mobile
let isDragging = false;
let touchX = -100;
let touchY = -100;

function handleTouchStart(event: TouchEvent) {
  isDragging = true;

  const touch = event.touches[0];
  if (!touch) return;

  const rect = canvas.getBoundingClientRect(); // Get canvas position
  touchX = touch.clientX - rect.left; // Calculate relative X
  touchY = touch.clientY - rect.top; // Calculate relative Y

  mouseX = touchX;
  mouseY = touchY;
}

function handleTouchMove(event: TouchEvent) {
  if (!isDragging) return;

  event.preventDefault(); // Prevent scrolling during touch move
  const touch = event.touches[0];
  if (!touch) return;

  const rect = canvas.getBoundingClientRect(); // Get canvas position
  touchX = touch.clientX - rect.left; // Calculate relative X
  touchY = touch.clientY - rect.top; // Calculate relative Y

  mouseX = touchX;
  mouseY = touchY;
}

function handleTouchEnd() {
  isDragging = false;
  mouseX = -100;
  mouseY = -100;
}

canvas.addEventListener("touchstart", handleTouchStart);
canvas.addEventListener("touchmove", handleTouchMove);
canvas.addEventListener("touchend", handleTouchEnd);

function animate() {
  updatePoints();
  drawLines();
  requestAnimationFrame(animate);
}

createLines();
animate();