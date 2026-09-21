(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const context = canvas.getContext("2d");
  const overlay = document.getElementById("gameOverlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const actionButton = document.getElementById("actionButton");
  const pauseButton = document.getElementById("pauseButton");
  const soundButton = document.getElementById("soundToggle");
  const scoreElement = document.getElementById("score");
  const bestElement = document.getElementById("bestScore");
  const statusElement = document.getElementById("gameStatus");

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const GROUND_HEIGHT = 82;
  const PIPE_WIDTH = 74;
  const PIPE_GAP = 172;
  const PIPE_DISTANCE = 224;
  const STORAGE_KEY = "readforfun-flappy-best";
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const bird = { x: 116, y: HEIGHT * .43, radius: 18, velocity: 0, rotation: 0 };
  let pipes = [];
  let particles = [];
  let score = 0;
  let bestScore = readBest();
  let state = "ready";
  let soundEnabled = true;
  let lastTime = 0;
  let spawnDistance = 0;
  let worldOffset = 0;
  let audioContext = null;

  function readBest() {
    try { return Number(localStorage.getItem(STORAGE_KEY)) || 0; } catch (_) { return 0; }
  }

  function saveBest() {
    try { localStorage.setItem(STORAGE_KEY, String(bestScore)); } catch (_) {}
  }

  function resetGame() {
    bird.y = HEIGHT * .43;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes = [];
    particles = [];
    score = 0;
    spawnDistance = 112;
    worldOffset = 0;
    scoreElement.textContent = "0";
    statusElement.textContent = "飞行开始。按空格键、向上方向键或点击画面拍动翅膀。";
  }

  function startGame() {
    resetGame();
    state = "playing";
    overlay.hidden = true;
    pauseButton.hidden = false;
    lastTime = performance.now();
    bird.velocity = -360;
    chirp(420, .055, "sine", .035);
    canvas.focus({ preventScroll: true });
  }

  function flap() {
    if (state === "ready" || state === "over") {
      startGame();
      return;
    }
    if (state !== "playing") return;
    bird.velocity = -380;
    bird.rotation = -.36;
    if (!reducedMotion) {
      for (let index = 0; index < 4; index += 1) {
        particles.push({ x: bird.x - 15, y: bird.y + 6, life: 1, vx: -45 - Math.random() * 40, vy: (Math.random() - .5) * 40 });
      }
    }
    chirp(540, .045, "sine", .028);
  }

  function togglePause() {
    if (state === "playing") {
      state = "paused";
      showOverlay("暂停片刻", "风停了，准备好再继续", "继续飞行");
      pauseButton.setAttribute("aria-label", "继续游戏");
      statusElement.textContent = "游戏已暂停。";
    } else if (state === "paused") {
      state = "playing";
      overlay.hidden = true;
      pauseButton.setAttribute("aria-label", "暂停游戏");
      statusElement.textContent = `继续飞行。当前得分 ${score}。`;
      lastTime = performance.now();
      canvas.focus({ preventScroll: true });
    }
  }

  function endGame() {
    if (state !== "playing") return;
    state = "over";
    bestScore = Math.max(bestScore, score);
    bestElement.textContent = String(bestScore);
    saveBest();
    pauseButton.hidden = true;
    showOverlay(score ? "落在书页上了" : "差一点点", `本次飞过 ${score} 道书脊 · 最佳 ${bestScore}`, "再飞一次");
    statusElement.textContent = `飞行结束。本次得分 ${score}，最佳得分 ${bestScore}。`;
    chirp(155, .18, "triangle", .05);
  }

  function showOverlay(title, text, buttonText) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    actionButton.textContent = buttonText;
    overlay.hidden = false;
  }

  function addPipe() {
    const topLimit = 105;
    const bottomLimit = HEIGHT - GROUND_HEIGHT - PIPE_GAP - 105;
    const gapTop = topLimit + Math.random() * (bottomLimit - topLimit);
    pipes.push({ x: WIDTH + 16, gapTop, passed: false });
  }

  function update(delta) {
    if (state !== "playing") return;
    const speed = Math.min(186, 146 + score * 2.25);
    worldOffset = (worldOffset + speed * delta) % WIDTH;
    spawnDistance += speed * delta;
    if (spawnDistance >= PIPE_DISTANCE) {
      spawnDistance = 0;
      addPipe();
    }

    bird.velocity += 1040 * delta;
    bird.y += bird.velocity * delta;
    bird.rotation = Math.min(1.18, bird.rotation + 1.9 * delta);

    pipes.forEach((pipe) => {
      pipe.x -= speed * delta;
      if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
        pipe.passed = true;
        score += 1;
        bestScore = Math.max(bestScore, score);
        scoreElement.textContent = String(score);
        bestElement.textContent = String(bestScore);
        statusElement.textContent = `顺利穿过第 ${score} 道书脊。`;
        chirp(760, .07, "sine", .04);
      }
    });
    pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -10);

    particles.forEach((particle) => {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.life -= delta * 2.4;
    });
    particles = particles.filter((particle) => particle.life > 0);

    if (bird.y - bird.radius <= 0 || bird.y + bird.radius >= HEIGHT - GROUND_HEIGHT || pipes.some(collidesWithPipe)) endGame();
  }

  function collidesWithPipe(pipe) {
    const birdLeft = bird.x - bird.radius * .78;
    const birdRight = bird.x + bird.radius * .78;
    if (birdRight < pipe.x || birdLeft > pipe.x + PIPE_WIDTH) return false;
    return bird.y - bird.radius * .72 < pipe.gapTop || bird.y + bird.radius * .72 > pipe.gapTop + PIPE_GAP;
  }

  function draw() {
    context.clearRect(0, 0, WIDTH, HEIGHT);
    drawSky();
    pipes.forEach(drawPipe);
    drawBird();
    drawGround();
    if (state === "playing" && score > 0) drawCanvasScore();
  }

  function drawSky() {
    const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#9eb8b2");
    sky.addColorStop(.58, "#d7c99f");
    sky.addColorStop(1, "#e0bd78");
    context.fillStyle = sky;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.fillStyle = "rgba(249, 237, 199, .85)";
    context.beginPath();
    context.arc(380, 98, 44, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(246, 241, 220, .38)";
    for (let index = 0; index < 5; index += 1) {
      const x = ((index * 154 - worldOffset * .18) % 690) - 80;
      const y = 105 + (index % 3) * 88;
      context.beginPath();
      context.ellipse(x, y, 48, 17, 0, 0, Math.PI * 2);
      context.ellipse(x + 35, y + 2, 35, 13, 0, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = "#718a78";
    context.beginPath();
    context.moveTo(0, 470);
    for (let x = 0; x <= WIDTH; x += 40) {
      const y = 458 + Math.sin((x + worldOffset * .22) * .018) * 27;
      context.lineTo(x, y);
    }
    context.lineTo(WIDTH, HEIGHT);
    context.lineTo(0, HEIGHT);
    context.fill();
  }

  function drawPipe(pipe) {
    const bottomY = pipe.gapTop + PIPE_GAP;
    drawBookSpine(pipe.x, 0, PIPE_WIDTH, pipe.gapTop, true);
    drawBookSpine(pipe.x, bottomY, PIPE_WIDTH, HEIGHT - GROUND_HEIGHT - bottomY, false);
  }

  function drawBookSpine(x, y, width, height, upsideDown) {
    const capHeight = 22;
    context.fillStyle = "#3d594b";
    context.fillRect(x + 6, y, width - 12, height);
    context.fillStyle = "#294238";
    context.fillRect(x + 12, y, 5, height);
    context.fillStyle = "#78916f";
    context.fillRect(x + width - 16, y, 4, height);
    context.fillStyle = "#506b5a";
    const capY = upsideDown ? height - capHeight : y;
    context.fillRect(x, capY, width, capHeight);
    context.fillStyle = "rgba(226, 203, 146, .62)";
    context.fillRect(x + 24, y + (upsideDown ? 15 : 34), 2, Math.max(0, height - 58));
  }

  function drawBird() {
    context.save();
    context.translate(bird.x, bird.y);
    context.rotate(bird.rotation);
    context.fillStyle = "rgba(27, 41, 35, .22)";
    context.beginPath();
    context.ellipse(2, 5, 23, 17, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#e1ad3e";
    context.beginPath();
    context.moveTo(-24, 0);
    context.quadraticCurveTo(-5, -25, 22, -8);
    context.quadraticCurveTo(32, 1, 20, 12);
    context.quadraticCurveTo(-5, 27, -24, 0);
    context.fill();
    context.fillStyle = "#f4d773";
    context.beginPath();
    context.ellipse(-4, 5, 17, 9, -.25, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#a84e35";
    context.beginPath();
    context.moveTo(21, -2);
    context.lineTo(38, 3);
    context.lineTo(21, 8);
    context.closePath();
    context.fill();
    context.fillStyle = "#1d2b25";
    context.beginPath();
    context.arc(13, -8, 3.3, 0, Math.PI * 2);
    context.fill();
    context.restore();

    particles.forEach((particle) => {
      context.globalAlpha = particle.life;
      context.fillStyle = "#f1d27c";
      context.fillRect(particle.x, particle.y, 6, 2);
    });
    context.globalAlpha = 1;
  }

  function drawGround() {
    context.fillStyle = "#d9c6a0";
    context.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT);
    context.fillStyle = "#b59661";
    context.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, 8);
    context.strokeStyle = "rgba(91, 70, 43, .22)";
    context.lineWidth = 1;
    for (let y = HEIGHT - GROUND_HEIGHT + 22; y < HEIGHT; y += 15) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(WIDTH, y);
      context.stroke();
    }
  }

  function drawCanvasScore() {
    context.save();
    context.textAlign = "center";
    context.font = "700 42px 'Iowan Old Style', Baskerville, serif";
    context.lineWidth = 6;
    context.strokeStyle = "rgba(35, 50, 43, .38)";
    context.strokeText(String(score), WIDTH / 2, 66);
    context.fillStyle = "#fff8e9";
    context.fillText(String(score), WIDTH / 2, 66);
    context.restore();
  }

  function chirp(frequency, duration, type, volume) {
    if (!soundEnabled) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gain.gain.setValueAtTime(volume, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (_) {}
  }

  function loop(time) {
    const delta = Math.min((time - lastTime) / 1000 || 0, .034);
    lastTime = time;
    update(delta);
    draw();
    requestAnimationFrame(loop);
  }

  actionButton.addEventListener("click", () => state === "paused" ? togglePause() : startGame());
  pauseButton.addEventListener("click", togglePause);
  document.getElementById("mobileFlap").addEventListener("click", flap);
  canvas.addEventListener("pointerdown", (event) => { event.preventDefault(); flap(); });
  document.addEventListener("keydown", (event) => {
    if (["Space", "ArrowUp"].includes(event.code)) {
      event.preventDefault();
      flap();
    } else if (event.key.toLowerCase() === "p" && ["playing", "paused"].includes(state)) {
      event.preventDefault();
      togglePause();
    }
  });
  soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundButton.setAttribute("aria-pressed", String(soundEnabled));
    soundButton.setAttribute("aria-label", soundEnabled ? "关闭声音" : "打开声音");
    soundButton.textContent = soundEnabled ? "声 · 开" : "声 · 关";
    if (soundEnabled) chirp(520, .045, "sine", .025);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") togglePause();
  });
  bestElement.textContent = String(bestScore);
  draw();
  requestAnimationFrame(loop);
})();
