const backgroundImage = new Image();
backgroundImage.src = "image/background.png";
backgroundImage.onload = function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const Collisioncanvas = document.getElementById("Collisioncanvas");
  const CollisioncanvasCtx = Collisioncanvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  Collisioncanvas.width = window.innerWidth;
  Collisioncanvas.height = window.innerHeight;

  const runButton = document.getElementById("runButton");
  const pauseButton = document.getElementById("pauseButton");
  const QuiteButton = document.getElementById("QuiteButton");

  let score = 0;
  let level = 1;
  let gameSpeed = 1;
  let gameOver = false;
  let ravens = [];
  let explosion = [];
  let timeToNextRaven = 0;
  let ravenInterval = 900;
  let lastTime = 0;
  let isPaused = false;
  ctx.font = "50px Impact";

  class Raven {
    constructor() {
      this.x = canvas.width;
      this.y = Math.random() * (canvas.height - 100);
      this.directionX = Math.random() * 5 + 3;
      this.directionY = Math.random() * 5 - 2.5;
      this.image = new Image();
      this.image.src = "image/raven.png";
      this.spriteWidth = 271;
      this.spriteHeight = 194;
      this.sizeModifier = Math.random() * 0.2 + 0.4;
      this.width = this.spriteWidth * this.sizeModifier;
      this.height = this.spriteHeight * this.sizeModifier;
      this.frame = 0;
      this.maxFrame = 5;
      this.markedForDeletion = false;
      this.timeSinceFlap = 0;
      this.flapInterval = Math.random() * 50 + 50;
      this.randomColors = [
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255)
      ];
      this.color =
        "rgb(" +
        this.randomColors[0] +
        "," +
        this.randomColors[1] +
        "," +
        this.randomColors[2] +
        ")";
    }

    update(deltaTime) {
      if (this.y < 0 || this.y > canvas.height - this.height) {
        this.directionY = -this.directionY;
      }
      this.x -= this.directionX * gameSpeed;
      this.y += this.directionY * gameSpeed;

      if (this.x + this.width < 0) this.markedForDeletion = true;

      this.timeSinceFlap += deltaTime;

      if (this.timeSinceFlap > this.flapInterval) {
        this.frame = (this.frame + 1) % (this.maxFrame + 1);
        this.timeSinceFlap = 0;
      }
      if (this.x < 0 - this.width) gameOver = true;
    }

    draw() {
      CollisioncanvasCtx.fillStyle = this.color;
      CollisioncanvasCtx.fillRect(this.x, this.y, this.width, this.height);
      ctx.drawImage(
        this.image,
        this.frame * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  class Explosion {
    constructor(x, y, size) {
      this.spriteWidth = 200;
      this.spriteHeight = 179;
      this.x = x;
      this.y = y;
      this.size = size;
      this.image = new Image();
      this.image.src = "image/boom.png";
      this.frame = 0;
      this.sound = new Audio();
      this.sound.src = "shimmer_1.flac";
      this.timeSinceLastFrame = 0;
      this.frameInterval = 200;
      this.markedForDeletion = false;
    }
    update(deltaTime) {
      if (this.frame === 0) this.sound.play();

      this.timeSinceLastFrame += deltaTime;
      if (this.timeSinceLastFrame > this.frameInterval) {
        this.frame++;
        if (this.frame > 5) this.markedForDeletion = true;
        this.timeSinceLastFrame = 0;
      }
    }
    draw() {
      ctx.drawImage(
        this.image,
        this.frame * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y - this.size / 2,
        this.size,
        this.size
      );
    }
  }
  function Button() {
    function togglePause() {
      isPaused = !isPaused;
      if (!isPaused) {
        requestAnimationFrame(animation);
      }
    }
    pauseButton.style.top = "5%";
    pauseButton.style.left = "5%";
    pauseButton.style.transform = "translate(-50%, -50%)";
    pauseButton.onclick = togglePause;

    runButton.onclick = function () {
      if (isPaused) {
        togglePause();
      }
    };

    runButton.style.top = "5%";
    runButton.style.left = "14%";
    runButton.style.transform = "translate(-50%, -50%)";

    function Quit() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      gameOver = true;
    }

    QuiteButton.style.top = "5%";
    QuiteButton.style.left = "10%";
    QuiteButton.style.transform = "translate(-50%, -50%)";
    QuiteButton.onclick = Quit;
  }
  Button();

  function drawScore() {
    ctx.fillStyle = "black";
    ctx.fillText("Score: " + score, 100, 160);
    ctx.fillStyle = "white";
    ctx.fillText("Score: " + score, 100, 165);
  }

  function drawlevel(level) {
    ctx.fillStyle = "black";
    ctx.fillText("Level: " + level, 300, 160);
    ctx.fillStyle = "white";
    ctx.fillText("Level: " + level, 300, 165);
  }

  const gameOverSound = new Audio("Healing_Sound.wav");

  function drawGameOver() {
    ctx.textAlign = "center";
    ctx.fillStyle = "black";
    ctx.fillText("Game is Over ", canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillStyle = "white";
    ctx.fillText("Game is Over ", canvas.width / 2, canvas.height / 2 - 45);

    gameOverSound.play();
  }

  function handleRavenHit(x, y) {
    const detectPixelColor = CollisioncanvasCtx.getImageData(x, y, 1, 1).data;
    ravens.forEach((raven) => {
      if (
        raven.randomColors[0] === detectPixelColor[0] &&
        raven.randomColors[1] === detectPixelColor[1] &&
        raven.randomColors[2] === detectPixelColor[2]
      ) {
        raven.markedForDeletion = true;

        score++;
        explosion.push(new Explosion(raven.x, raven.y, raven.width));
      }
    });

    ravens = ravens.filter((raven) => !raven.markedForDeletion);
  }

  window.addEventListener("click", function (e) {
    if (!isPaused) handleRavenHit(e.x, e.y);
  });

  function animation(timestamp) {
    if (isPaused) {
      ctx.font = "70px Arial";
      ctx.fillStyle = "white";
      ctx.fillText("Paused", canvas.width / 2, canvas.height / 2);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    CollisioncanvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    timeToNextRaven += deltaTime;

    if (score >= level * 30) {
      level++;
      gameSpeed += 0.5;
      ravenInterval = Math.max(300, ravenInterval / gameSpeed);
      console.log("Level Up! Level:", level, "Speed:", gameSpeed);
    }
    if (timeToNextRaven > ravenInterval / gameSpeed) {
      ravens.push(new Raven());
      timeToNextRaven = 0;
      ravens.sort((a, b) => a.width - b.width);
    }
    drawScore();
    drawlevel(level);
    [...ravens, ...explosion].forEach((raven, index) => {
      raven.update(deltaTime * gameSpeed);
      raven.draw();
    });

    explosion = explosion.filter((raven) => !raven.markedForDeletion);

    if (!gameOver) requestAnimationFrame(animation);
    else drawGameOver();
  }

  animation(0);
};
