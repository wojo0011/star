(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const ui = {
    score: document.getElementById("scoreValue"),
    highScore: document.getElementById("highScoreValue"),
    wave: document.getElementById("waveValue"),
    health: document.getElementById("healthValue"),
    healthBar: document.getElementById("healthBar"),
    threats: document.getElementById("threatCount"),
    radar: document.getElementById("radar"),
    start: document.getElementById("startOverlay"),
    pause: document.getElementById("pauseOverlay"),
    gameOver: document.getElementById("gameOverOverlay"),
    finalScore: document.getElementById("finalScore"),
    announcer: document.getElementById("announcer"),
    sound: document.getElementById("soundButton"),
  };

  const TAU = Math.PI * 2;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const random = (min, max) => Math.random() * (max - min) + min;
  const distanceSq = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  const padScore = (value) => String(Math.max(0, Math.round(value))).padStart(6, "0");

  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let lastTime = performance.now();
  let state = "idle";
  let score = 0;
  let highScore = Number(localStorage.getItem("starfall-high-score") || 0);
  let health = 100;
  let weapon = "laser";
  let lastShot = 0;
  let elapsed = 0;
  let spawnClock = 0;
  let screenShake = 0;
  let soundEnabled = true;
  let audioContext = null;
  let radarClock = 0;
  let mobileFiring = false;

  const keys = new Set();
  const stars = [];
  const asteroids = [];
  const projectiles = [];
  const particles = [];
  const shockwaves = [];
  const mobileVector = { x: 0, y: 0 };

  const ship = {
    x: width / 2,
    y: height * 0.82,
    vx: 0,
    vy: 0,
    radius: 18,
    speed: 410,
    invulnerable: 0,
    tilt: 0,
  };

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ship.x = clamp(ship.x, ship.radius + 8, width - ship.radius - 8);
    ship.y = clamp(ship.y, 100 + ship.radius, height - ship.radius - 18);
    seedStars();
  }

  function seedStars() {
    const desired = clamp(Math.round((width * height) / 9200), 75, 210);
    while (stars.length < desired) stars.push(createStar(true));
    stars.length = desired;
  }

  function createStar(anywhere = false) {
    const depth = Math.random();
    return {
      x: random(0, width),
      y: anywhere ? random(0, height) : random(-30, -4),
      length: random(5, 18) * (0.35 + depth),
      speed: random(18, 54) * (0.45 + depth),
      alpha: random(0.16, 0.72),
      width: depth > 0.86 ? 1.4 : 0.65,
    };
  }

  function resetGame() {
    score = 0;
    health = 100;
    elapsed = 0;
    spawnClock = 0;
    lastShot = 0;
    screenShake = 0;
    asteroids.length = 0;
    projectiles.length = 0;
    particles.length = 0;
    shockwaves.length = 0;
    ship.x = width / 2;
    ship.y = height * 0.82;
    ship.vx = 0;
    ship.vy = 0;
    ship.invulnerable = 0;
    selectWeapon("laser", false);
    updateHud(true);
  }

  function startGame() {
    if (state === "running") return;
    unlockAudio();
    resetGame();
    state = "running";
    ui.start.classList.remove("visible");
    ui.pause.classList.remove("visible");
    ui.gameOver.classList.remove("visible");
    ui.announcer.textContent = "Mission launched";
    lastTime = performance.now();
  }

  function togglePause(forceResume = false) {
    if (state === "idle" || state === "gameover") return;
    if (state === "paused" || forceResume) {
      state = "running";
      ui.pause.classList.remove("visible");
      lastTime = performance.now();
      ui.announcer.textContent = "Mission resumed";
    } else {
      state = "paused";
      ui.pause.classList.add("visible");
      ui.announcer.textContent = "Mission paused";
    }
  }

  function endGame() {
    state = "gameover";
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("starfall-high-score", String(highScore));
    }
    ui.finalScore.textContent = padScore(score);
    ui.highScore.textContent = padScore(highScore);
    ui.gameOver.classList.add("visible");
    ui.announcer.textContent = `Ship destroyed. Final score ${score}`;
    playTone("explosion");
  }

  function selectWeapon(next, announce = true) {
    weapon = next;
    document.querySelectorAll(".weapon-card").forEach((card) => {
      card.classList.toggle("active", card.dataset.weapon === weapon);
      card.setAttribute("aria-pressed", String(card.dataset.weapon === weapon));
    });
    if (announce) {
      ui.announcer.textContent = weapon === "laser" ? "Photon laser selected" : "Seeker missile selected";
      playTone("switch");
    }
  }

  function switchWeapon() {
    selectWeapon(weapon === "laser" ? "missile" : "laser");
  }

  function getWave() {
    return Math.floor(elapsed / 22) + 1;
  }

  function spawnAsteroid() {
    const roll = Math.random();
    const type = roll < 0.48 ? "small" : roll < 0.82 ? "medium" : "large";
    const config = {
      small: { radius: random(14, 20), hp: 1, speed: random(105, 165), score: 100 },
      medium: { radius: random(24, 32), hp: 3, speed: random(76, 120), score: 260 },
      large: { radius: random(38, 52), hp: 6, speed: random(50, 82), score: 600 },
    }[type];
    const radius = config.radius;
    const vertexCount = Math.floor(random(8, 13));
    const vertices = Array.from({ length: vertexCount }, (_, i) => ({
      angle: (i / vertexCount) * TAU,
      radius: radius * random(0.78, 1.1),
    }));
    const craters = Array.from({ length: Math.floor(random(2, type === "large" ? 6 : 4)) }, () => ({
      x: random(-0.45, 0.45) * radius,
      y: random(-0.45, 0.45) * radius,
      r: random(0.09, 0.22) * radius,
    }));
    asteroids.push({
      x: random(radius + 8, width - radius - 8),
      y: -radius - random(10, 100),
      vx: random(-18, 18),
      vy: config.speed * (1 + (getWave() - 1) * 0.055),
      radius,
      hp: config.hp,
      maxHp: config.hp,
      score: config.score,
      type,
      rotation: random(0, TAU),
      rotationSpeed: random(-0.7, 0.7),
      vertices,
      craters,
      flash: 0,
    });
  }

  function fire(now) {
    if (state !== "running") return;
    const delay = weapon === "laser" ? 135 : 540;
    if (now - lastShot < delay) return;
    lastShot = now;
    if (weapon === "laser") {
      projectiles.push(
        { type: "laser", x: ship.x - 10, y: ship.y - 18, vx: 0, vy: -690, radius: 3, damage: 1, life: 1.5 },
        { type: "laser", x: ship.x + 10, y: ship.y - 18, vx: 0, vy: -690, radius: 3, damage: 1, life: 1.5 },
      );
      playTone("laser");
    } else {
      projectiles.push({
        type: "missile",
        x: ship.x,
        y: ship.y - 24,
        vx: 0,
        vy: -355,
        radius: 6,
        damage: 3,
        life: 3.6,
        trailClock: 0,
      });
      playTone("missile");
    }
  }

  function damageAsteroid(asteroid, damage, projectileType) {
    asteroid.hp -= damage;
    asteroid.flash = 0.09;
    createSparks(asteroid.x, asteroid.y, projectileType === "missile" ? 10 : 4, projectileType === "missile" ? "#ff8a45" : "#71f7ff");
    if (asteroid.hp <= 0) destroyAsteroid(asteroid, projectileType);
  }

  function destroyAsteroid(asteroid, cause = "impact") {
    const index = asteroids.indexOf(asteroid);
    if (index === -1) return;
    asteroids.splice(index, 1);
    const strength = asteroid.type === "large" ? 1.7 : asteroid.type === "medium" ? 1.2 : 0.8;
    createExplosion(asteroid.x, asteroid.y, asteroid.radius, strength);
    screenShake = Math.max(screenShake, 3.5 * strength);
    if (cause !== "ship") {
      score += asteroid.score;
      if (cause === "missile") {
        for (const nearby of [...asteroids]) {
          const blast = asteroid.radius + 66;
          if (distanceSq(asteroid, nearby) < blast * blast) damageAsteroid(nearby, 1, "missile-blast");
        }
      }
    }
    playTone("impact", strength);
  }

  function createSparks(x, y, count, color) {
    for (let i = 0; i < count; i += 1) {
      const angle = random(0, TAU);
      const speed = random(40, 180);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: random(0.18, 0.5),
        maxLife: 0.5,
        size: random(1, 2.5),
        color,
        drag: 0.96,
      });
    }
  }

  function createExplosion(x, y, radius, strength = 1) {
    const count = Math.round(clamp(radius * 0.75, 12, 42));
    shockwaves.push({ x, y, radius: 2, maxRadius: radius * 1.75, life: 0.38, maxLife: 0.38 });
    for (let i = 0; i < count; i += 1) {
      const angle = random(0, TAU);
      const speed = random(45, 220) * strength;
      const hot = Math.random() > 0.42;
      particles.push({
        x: x + random(-4, 4),
        y: y + random(-4, 4),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: random(0.3, 0.85),
        maxLife: 0.85,
        size: random(1.4, 4.2) * strength,
        color: hot ? "#ffbb55" : "#ff4f20",
        drag: 0.975,
      });
    }
  }

  function damageShip(amount, x, y) {
    if (ship.invulnerable > 0 || state !== "running") return;
    health = Math.max(0, health - amount);
    ship.invulnerable = 1.05;
    screenShake = Math.max(screenShake, 11);
    createExplosion(x, y, 26, 1.25);
    playTone("damage");
    if (health <= 0) {
      createExplosion(ship.x, ship.y, 56, 2.4);
      endGame();
    }
  }

  function update(dt, now) {
    updateStars(dt);
    if (state !== "running") return;

    elapsed += dt;
    ship.invulnerable = Math.max(0, ship.invulnerable - dt);
    const wave = getWave();
    const spawnDelay = Math.max(0.34, 1.05 - (wave - 1) * 0.055);
    spawnClock += dt;
    if (spawnClock >= spawnDelay) {
      spawnClock -= spawnDelay;
      spawnAsteroid();
      if (wave >= 4 && Math.random() < 0.12) spawnAsteroid();
    }

    let dx = 0;
    let dy = 0;
    if (keys.has("ArrowLeft") || keys.has("KeyA")) dx -= 1;
    if (keys.has("ArrowRight") || keys.has("KeyD")) dx += 1;
    if (keys.has("ArrowUp") || keys.has("KeyW")) dy -= 1;
    if (keys.has("ArrowDown") || keys.has("KeyS")) dy += 1;
    dx += mobileVector.x;
    dy += mobileVector.y;
    const magnitude = Math.hypot(dx, dy);
    if (magnitude > 1) {
      dx /= magnitude;
      dy /= magnitude;
    }
    const response = 1 - Math.exp(-dt * 13);
    ship.vx += (dx * ship.speed - ship.vx) * response;
    ship.vy += (dy * ship.speed - ship.vy) * response;
    if (Math.abs(dx) < 0.02) ship.vx *= Math.pow(0.02, dt);
    if (Math.abs(dy) < 0.02) ship.vy *= Math.pow(0.02, dt);
    ship.x = clamp(ship.x + ship.vx * dt, ship.radius + 10, width - ship.radius - 10);
    ship.y = clamp(ship.y + ship.vy * dt, 104 + ship.radius, height - ship.radius - 18);
    ship.tilt += (clamp(ship.vx / ship.speed, -1, 1) * 0.32 - ship.tilt) * response;

    if (keys.has("Space") || mobileFiring) fire(now);

    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = projectiles[i];
      projectile.life -= dt;
      if (projectile.type === "missile") {
        let target = null;
        let nearest = Infinity;
        for (const asteroid of asteroids) {
          if (asteroid.y >= projectile.y + 20) continue;
          const d = distanceSq(projectile, asteroid);
          if (d < nearest) {
            nearest = d;
            target = asteroid;
          }
        }
        if (target) {
          const angle = Math.atan2(target.y - projectile.y, target.x - projectile.x);
          projectile.vx += (Math.cos(angle) * 390 - projectile.vx) * Math.min(1, dt * 3.4);
          projectile.vy += (Math.sin(angle) * 390 - projectile.vy) * Math.min(1, dt * 3.4);
        }
        projectile.trailClock += dt;
        if (projectile.trailClock > 0.025) {
          projectile.trailClock = 0;
          particles.push({
            x: projectile.x,
            y: projectile.y + 7,
            vx: random(-12, 12),
            vy: random(40, 85),
            life: 0.28,
            maxLife: 0.28,
            size: random(1.5, 3.3),
            color: Math.random() > 0.5 ? "#ff8a3d" : "#ffc95a",
            drag: 0.96,
          });
        }
      }
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      if (projectile.life <= 0 || projectile.y < -30 || projectile.x < -30 || projectile.x > width + 30) {
        projectiles.splice(i, 1);
        continue;
      }
      for (const asteroid of [...asteroids]) {
        const hitRadius = projectile.radius + asteroid.radius;
        if (distanceSq(projectile, asteroid) <= hitRadius * hitRadius) {
          projectiles.splice(i, 1);
          damageAsteroid(asteroid, projectile.damage, projectile.type);
          if (projectile.type === "missile") {
            shockwaves.push({ x: projectile.x, y: projectile.y, radius: 3, maxRadius: 74, life: 0.32, maxLife: 0.32 });
          }
          break;
        }
      }
    }

    for (const asteroid of [...asteroids]) {
      asteroid.x += asteroid.vx * dt;
      asteroid.y += asteroid.vy * dt;
      asteroid.rotation += asteroid.rotationSpeed * dt;
      asteroid.flash = Math.max(0, asteroid.flash - dt);
      if (asteroid.x < asteroid.radius) asteroid.vx = Math.abs(asteroid.vx);
      if (asteroid.x > width - asteroid.radius) asteroid.vx = -Math.abs(asteroid.vx);
      const collisionRadius = asteroid.radius * 0.77 + ship.radius;
      if (distanceSq(asteroid, ship) <= collisionRadius * collisionRadius) {
        destroyAsteroid(asteroid, "ship");
        damageShip(asteroid.type === "large" ? 42 : asteroid.type === "medium" ? 28 : 18, asteroid.x, asteroid.y);
        continue;
      }
      if (asteroid.y - asteroid.radius > height) {
        asteroids.splice(asteroids.indexOf(asteroid), 1);
        damageShip(7, clamp(asteroid.x, 20, width - 20), height - 8);
      }
    }

    updateEffects(dt);
    screenShake *= Math.pow(0.02, dt);
    radarClock += dt;
    updateHud(radarClock > 0.18);
    if (radarClock > 0.18) radarClock = 0;
  }

  function updateStars(dt) {
    for (const star of stars) {
      star.y += star.speed * dt;
      if (star.y - star.length > height) Object.assign(star, createStar(false));
    }
    if (state !== "running") updateEffects(dt);
  }

  function updateEffects(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(particle.drag, dt * 60);
      particle.vy *= Math.pow(particle.drag, dt * 60);
      if (particle.life <= 0) particles.splice(i, 1);
    }
    for (let i = shockwaves.length - 1; i >= 0; i -= 1) {
      const wave = shockwaves[i];
      wave.life -= dt;
      wave.radius += ((wave.maxRadius - wave.radius) * dt) / Math.max(wave.life, 0.05);
      if (wave.life <= 0) shockwaves.splice(i, 1);
    }
  }

  function updateHud(forceRadar = false) {
    ui.score.textContent = padScore(score);
    ui.highScore.textContent = padScore(Math.max(highScore, score));
    ui.wave.textContent = String(getWave()).padStart(2, "0");
    ui.health.textContent = `${Math.round(health)}%`;
    ui.healthBar.style.width = `${health}%`;
    const healthColor = health > 55 ? "#43ffc0" : health > 25 ? "#ffb347" : "#ff3f57";
    ui.health.style.color = healthColor;
    ui.healthBar.style.background = healthColor;
    ui.threats.textContent = `${asteroids.length} ${asteroids.length === 1 ? "CONTACT" : "CONTACTS"}`;
    if (forceRadar) updateRadar();
  }

  function updateRadar() {
    ui.radar.querySelectorAll(".radar-dot").forEach((dot) => dot.remove());
    for (const asteroid of asteroids.slice(0, 18)) {
      const dot = document.createElement("i");
      dot.className = "radar-dot";
      dot.style.left = `${clamp((asteroid.x / width) * 60 + 4, 3, 64)}px`;
      dot.style.top = `${clamp((asteroid.y / height) * 54 + 4, 3, 57)}px`;
      ui.radar.appendChild(dot);
    }
  }

  function draw() {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.28, 0, width * 0.5, height * 0.28, height * 0.85);
    gradient.addColorStop(0, "#071526");
    gradient.addColorStop(0.42, "#030916");
    gradient.addColorStop(1, "#01030a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    drawNebula();
    drawStars();

    const shakeX = screenShake ? random(-screenShake, screenShake) : 0;
    const shakeY = screenShake ? random(-screenShake, screenShake) : 0;
    ctx.translate(shakeX, shakeY);
    drawGuideLines();
    for (const asteroid of asteroids) drawAsteroid(asteroid);
    for (const projectile of projectiles) drawProjectile(projectile);
    drawEffects();
    if (state !== "gameover") drawShip();
    ctx.restore();
  }

  function drawNebula() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const haze = ctx.createLinearGradient(0, 0, width, height);
    haze.addColorStop(0, "rgba(9, 72, 92, 0.04)");
    haze.addColorStop(0.5, "rgba(20, 84, 128, 0.09)");
    haze.addColorStop(1, "rgba(70, 16, 91, 0.03)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function drawStars() {
    ctx.save();
    for (const star of stars) {
      const alpha = star.alpha * (state === "running" ? 1 : 0.72);
      const gradient = ctx.createLinearGradient(star.x, star.y - star.length, star.x, star.y);
      gradient.addColorStop(0, "rgba(135, 220, 255, 0)");
      gradient.addColorStop(1, `rgba(191, 239, 255, ${alpha})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = star.width;
      ctx.beginPath();
      ctx.moveTo(star.x, star.y - star.length);
      ctx.lineTo(star.x, star.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGuideLines() {
    ctx.save();
    ctx.strokeStyle = "rgba(83, 205, 237, 0.035)";
    ctx.lineWidth = 1;
    const spacing = Math.max(100, width / 9);
    for (let x = spacing; x < width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 86);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAsteroid(asteroid) {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.rotation);
    ctx.shadowBlur = 24;
    ctx.shadowColor = asteroid.flash > 0 ? "rgba(120, 247, 255, .75)" : "rgba(255, 104, 45, .08)";
    const gradient = ctx.createRadialGradient(-asteroid.radius * 0.35, -asteroid.radius * 0.4, 1, 0, 0, asteroid.radius * 1.1);
    gradient.addColorStop(0, asteroid.flash > 0 ? "#c8fdff" : "#89919a");
    gradient.addColorStop(0.35, asteroid.flash > 0 ? "#6feeff" : "#4c535c");
    gradient.addColorStop(1, "#171c23");
    ctx.fillStyle = gradient;
    ctx.strokeStyle = asteroid.flash > 0 ? "#b7fbff" : "rgba(172, 194, 211, 0.42)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    asteroid.vertices.forEach((vertex, index) => {
      const x = Math.cos(vertex.angle) * vertex.radius;
      const y = Math.sin(vertex.angle) * vertex.radius;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    for (const crater of asteroid.craters) {
      ctx.fillStyle = "rgba(5, 8, 13, 0.42)";
      ctx.strokeStyle = "rgba(190, 206, 220, 0.13)";
      ctx.beginPath();
      ctx.ellipse(crater.x, crater.y, crater.r, crater.r * 0.7, 0.4, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    if (asteroid.maxHp > 1 && asteroid.hp < asteroid.maxHp) {
      const ratio = asteroid.hp / asteroid.maxHp;
      ctx.rotate(-asteroid.rotation);
      ctx.fillStyle = "rgba(0,0,0,.5)";
      ctx.fillRect(-asteroid.radius, asteroid.radius + 8, asteroid.radius * 2, 3);
      ctx.fillStyle = ratio > 0.5 ? "#56f4ff" : "#ff6b2c";
      ctx.fillRect(-asteroid.radius, asteroid.radius + 8, asteroid.radius * 2 * ratio, 3);
    }
    ctx.restore();
  }

  function drawProjectile(projectile) {
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    if (projectile.type === "laser") {
      ctx.shadowBlur = 13;
      ctx.shadowColor = "#56f4ff";
      const beam = ctx.createLinearGradient(0, -18, 0, 9);
      beam.addColorStop(0, "rgba(86,244,255,0)");
      beam.addColorStop(0.45, "#56f4ff");
      beam.addColorStop(1, "#fff");
      ctx.strokeStyle = beam;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 9);
      ctx.lineTo(0, -18);
      ctx.stroke();
    } else {
      const angle = Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2;
      ctx.rotate(angle);
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ff6b2c";
      ctx.fillStyle = "#e8f7ff";
      ctx.strokeStyle = "#ff8a45";
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(5, 6);
      ctx.lineTo(0, 4);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEffects() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const wave of shockwaves) {
      const alpha = clamp(wave.life / wave.maxLife, 0, 1);
      ctx.strokeStyle = `rgba(255, 133, 65, ${alpha * 0.7})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, TAU);
      ctx.stroke();
    }
    for (const particle of particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 10;
      ctx.shadowColor = particle.color;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, Math.max(0.2, particle.size * alpha), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawShip() {
    if (ship.invulnerable > 0 && Math.floor(ship.invulnerable * 14) % 2 === 0) return;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.tilt);
    const thrust = state === "running" ? random(17, 29) : 12;
    const flame = ctx.createLinearGradient(0, 12, 0, 12 + thrust);
    flame.addColorStop(0, "#ecffff");
    flame.addColorStop(0.3, "#56f4ff");
    flame.addColorStop(1, "rgba(50, 114, 255, 0)");
    ctx.fillStyle = flame;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#48caff";
    ctx.beginPath();
    ctx.moveTo(-7, 11);
    ctx.lineTo(0, 13 + thrust);
    ctx.lineTo(7, 11);
    ctx.closePath();
    ctx.fill();

    const hull = ctx.createLinearGradient(-18, -25, 18, 20);
    hull.addColorStop(0, "#eefbff");
    hull.addColorStop(0.42, "#7d9aac");
    hull.addColorStop(1, "#263642");
    ctx.fillStyle = hull;
    ctx.strokeStyle = "rgba(153, 241, 255, 0.82)";
    ctx.lineWidth = 1;
    ctx.shadowBlur = 16;
    ctx.shadowColor = "rgba(61, 220, 255, 0.24)";
    ctx.beginPath();
    ctx.moveTo(0, -27);
    ctx.lineTo(8, -7);
    ctx.lineTo(24, 15);
    ctx.lineTo(9, 11);
    ctx.lineTo(0, 19);
    ctx.lineTo(-9, 11);
    ctx.lineTo(-24, 15);
    ctx.lineTo(-8, -7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 11;
    ctx.shadowColor = "#56f4ff";
    ctx.fillStyle = "#0c5368";
    ctx.strokeStyle = "#8df8ff";
    ctx.beginPath();
    ctx.moveTo(0, -19);
    ctx.lineTo(6, 2);
    ctx.lineTo(0, 8);
    ctx.lineTo(-6, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ff6b2c";
    ctx.shadowColor = "#ff6b2c";
    ctx.fillRect(-18, 9, 4, 2);
    ctx.fillRect(14, 9, 4, 2);
    ctx.restore();
  }

  function unlockAudio() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioContext = new AudioCtx();
    }
    if (audioContext?.state === "suspended") audioContext.resume();
  }

  function playTone(type, strength = 1) {
    if (!soundEnabled || !audioContext) return;
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const settings = {
      laser: [760, 240, 0.075, "sawtooth", 0.025],
      missile: [150, 70, 0.18, "square", 0.035],
      impact: [90, 34, 0.16 * strength, "sawtooth", 0.04],
      explosion: [74, 24, 0.6, "sawtooth", 0.06],
      damage: [120, 45, 0.28, "square", 0.05],
      switch: [330, 520, 0.06, "sine", 0.018],
    }[type];
    if (!settings) return;
    const [start, end, duration, shape, volume] = settings;
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(start, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, end), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  function frame(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.035);
    lastTime = now;
    update(dt, now);
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("blur", () => {
    keys.clear();
    if (state === "running") togglePause();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "running") togglePause();
  });

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) event.preventDefault();
    if ((event.code === "AltLeft" || event.code === "AltRight" || event.key === "Meta") && !event.repeat) {
      event.preventDefault();
      if (state === "running") switchWeapon();
      return;
    }
    if (event.code === "KeyP" && !event.repeat) {
      togglePause();
      return;
    }
    if (event.code === "Space" && state === "idle") {
      startGame();
      return;
    }
    if (event.code === "Space" && state === "gameover") {
      startGame();
      return;
    }
    if (event.code === "Escape" && state === "paused") {
      togglePause(true);
      return;
    }
    keys.add(event.code);
  });

  window.addEventListener("keyup", (event) => keys.delete(event.code));

  document.getElementById("startButton").addEventListener("click", startGame);
  document.getElementById("restartButton").addEventListener("click", startGame);
  document.getElementById("resumeButton").addEventListener("click", () => togglePause(true));
  document.getElementById("pauseButton").addEventListener("click", () => togglePause());
  document.querySelectorAll(".weapon-card").forEach((card) => {
    card.addEventListener("click", () => selectWeapon(card.dataset.weapon));
  });
  ui.sound.addEventListener("click", () => {
    unlockAudio();
    soundEnabled = !soundEnabled;
    ui.sound.classList.toggle("muted", !soundEnabled);
    ui.sound.textContent = soundEnabled ? "SFX" : "OFF";
    ui.sound.setAttribute("aria-label", soundEnabled ? "Mute sound" : "Enable sound");
    if (soundEnabled) playTone("switch");
  });

  const movePad = document.getElementById("movePad");
  const moveStick = document.getElementById("moveStick");
  function updateMovePad(event) {
    const rect = movePad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = event.clientX - centerX;
    const y = event.clientY - centerY;
    const max = rect.width * 0.31;
    const length = Math.hypot(x, y);
    const scale = length > max ? max / length : 1;
    const limitedX = x * scale;
    const limitedY = y * scale;
    mobileVector.x = limitedX / max;
    mobileVector.y = limitedY / max;
    moveStick.style.transform = `translate(${limitedX}px, ${limitedY}px)`;
  }
  function resetMovePad() {
    mobileVector.x = 0;
    mobileVector.y = 0;
    moveStick.style.transform = "translate(0, 0)";
  }
  movePad.addEventListener("pointerdown", (event) => {
    movePad.setPointerCapture(event.pointerId);
    updateMovePad(event);
  });
  movePad.addEventListener("pointermove", (event) => {
    if (movePad.hasPointerCapture(event.pointerId)) updateMovePad(event);
  });
  movePad.addEventListener("pointerup", resetMovePad);
  movePad.addEventListener("pointercancel", resetMovePad);

  const mobileFire = document.getElementById("mobileFire");
  mobileFire.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    mobileFire.setPointerCapture(event.pointerId);
    mobileFiring = true;
    unlockAudio();
  });
  mobileFire.addEventListener("pointerup", () => { mobileFiring = false; });
  mobileFire.addEventListener("pointercancel", () => { mobileFiring = false; });
  document.getElementById("mobileSwitch").addEventListener("click", switchWeapon);

  highScore = Number.isFinite(highScore) ? highScore : 0;
  ui.highScore.textContent = padScore(highScore);
  resize();
  updateHud(true);
  requestAnimationFrame(frame);
})();
