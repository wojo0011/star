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
    shield: document.getElementById("shieldValue"),
    shieldBar: document.getElementById("shieldBar"),
    threats: document.getElementById("threatCount"),
    radar: document.getElementById("radar"),
    start: document.getElementById("startOverlay"),
    pause: document.getElementById("pauseOverlay"),
    gameOver: document.getElementById("gameOverOverlay"),
    finalScore: document.getElementById("finalScore"),
    announcer: document.getElementById("announcer"),
    sound: document.getElementById("soundButton"),
    upgradeList: document.getElementById("upgradeList"),
    upgradeToast: document.getElementById("upgradeToast"),
    upgradeToastTitle: document.getElementById("upgradeToastTitle"),
    activeWeaponIcon: document.getElementById("activeWeaponIcon"),
    activeWeaponName: document.getElementById("activeWeaponName"),
    activeWeaponStats: document.getElementById("activeWeaponStats"),
    configButton: document.getElementById("configButton"),
    configPopover: document.getElementById("configPopover"),
  };

  const TAU = Math.PI * 2;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const random = (min, max) => Math.random() * (max - min) + min;
  const distanceSq = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  const padScore = (value) => String(Math.max(0, Math.round(value))).padStart(6, "0");
  const weaponOrder = ["laser", "missile", "plasma", "railgun"];
  const weaponDefinitions = {
    laser: { name: "Photon Laser", description: "Rapid fire · 1 DMG", delay: 150 },
    missile: { name: "Seeker Missile", description: "Homing · 3 DMG", delay: 560 },
    plasma: { name: "Plasma Cannon", description: "Piercing energy orb", delay: 310 },
    railgun: { name: "Rail Driver", description: "Heavy piercing shot", delay: 760 },
  };

  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let lastTime = performance.now();
  let state = "idle";
  let score = 0;
  let highScore = Number(localStorage.getItem("starfall-high-score") || 0);
  let health = 100;
  let shield = 0;
  let shieldMax = 0;
  let weapon = "laser";
  let lastShot = 0;
  let elapsed = 0;
  let spawnClock = 0;
  let screenShake = 0;
  let soundEnabled = true;
  let audioContext = null;
  let radarClock = 0;
  let mobileFiring = false;
  let asteroidSequence = 0;
  let destroyedCount = 0;
  let toastTimer = 0;

  const keys = new Set();
  const stars = [];
  const asteroids = [];
  const projectiles = [];
  const particles = [];
  const shockwaves = [];
  const powerUps = [];
  const mobileVector = { x: 0, y: 0 };
  const upgrades = {
    fireRate: 0,
    wideShot: 0,
    shield: 0,
    missile: 0,
    plasma: 0,
    railgun: 0,
  };
  const unlockedWeapons = new Set(["laser"]);

  const ship = {
    x: width / 2,
    y: height * 0.82,
    vx: 0,
    vy: 0,
    radius: 20,
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
    shield = 0;
    shieldMax = 0;
    elapsed = 0;
    spawnClock = 0;
    lastShot = 0;
    screenShake = 0;
    destroyedCount = 0;
    toastTimer = 0;
    asteroids.length = 0;
    projectiles.length = 0;
    particles.length = 0;
    shockwaves.length = 0;
    powerUps.length = 0;
    Object.keys(upgrades).forEach((key) => { upgrades[key] = 0; });
    unlockedWeapons.clear();
    unlockedWeapons.add("laser");
    ship.x = width / 2;
    ship.y = height * 0.82;
    ship.vx = 0;
    ship.vy = 0;
    ship.invulnerable = 0;
    selectWeapon("laser", false);
    updateUpgradeUi();
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
    setConfigOpen(false);
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

  function setConfigOpen(open) {
    ui.configPopover.hidden = !open;
    ui.configButton.classList.toggle("active", open);
    ui.configButton.setAttribute("aria-expanded", String(open));
    ui.configButton.setAttribute("aria-label", open ? "Hide ship configuration" : "Show ship configuration");
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
    if (!unlockedWeapons.has(next)) return;
    weapon = next;
    document.querySelectorAll(".weapon-slot").forEach((card) => {
      const unlocked = unlockedWeapons.has(card.dataset.weapon);
      card.classList.toggle("active", card.dataset.weapon === weapon);
      card.disabled = !unlocked;
      card.hidden = !unlocked;
      card.setAttribute("aria-pressed", String(card.dataset.weapon === weapon));
    });
    ui.activeWeaponName.textContent = weaponDefinitions[weapon].name.toUpperCase();
    ui.activeWeaponStats.textContent = weaponDefinitions[weapon].description;
    ui.activeWeaponIcon.className = `weapon-icon ${weapon === "railgun" ? "rail-icon" : `${weapon}-icon`}`;
    if (announce) {
      ui.announcer.textContent = `${weaponDefinitions[weapon].name} selected`;
      playTone("switch");
    }
  }

  function switchWeapon() {
    const unlocked = weaponOrder.filter((candidate) => unlockedWeapons.has(candidate));
    const nextIndex = (unlocked.indexOf(weapon) + 1) % unlocked.length;
    selectWeapon(unlocked[nextIndex]);
  }

  function getWave() {
    return Math.floor(elapsed / 28) + 1;
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
      id: ++asteroidSequence,
      x: random(radius + 8, width - radius - 8),
      y: -radius - random(10, 100),
      vx: random(-18, 18),
      vy: config.speed * (1 + (getWave() - 1) * 0.04),
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
    const delay = weaponDefinitions[weapon].delay * Math.pow(0.86, upgrades.fireRate);
    if (now - lastShot < delay) return;
    lastShot = now;
    const wide = upgrades.wideShot;
    if (weapon === "laser") {
      const count = 2 + wide;
      const spread = wide * 0.075;
      for (let i = 0; i < count; i += 1) {
        const ratio = count === 1 ? 0 : i / (count - 1) - 0.5;
        const angle = ratio * spread * 2;
        projectiles.push({
          type: "laser",
          x: ship.x + ratio * (22 + wide * 5),
          y: ship.y - 25 + Math.abs(ratio) * 4,
          vx: Math.sin(angle) * 710,
          vy: -Math.cos(angle) * 710,
          radius: 3,
          damage: 1,
          life: 1.6,
          pierce: 1,
          hitIds: new Set(),
        });
      }
      playTone("laser");
    } else if (weapon === "missile") {
      const level = Math.max(1, upgrades.missile);
      const count = 1 + Math.floor(wide / 2) + (level >= 3 ? 1 : 0);
      for (let i = 0; i < count; i += 1) {
        const ratio = count === 1 ? 0 : i / (count - 1) - 0.5;
        projectiles.push({
          type: "missile",
          x: ship.x + ratio * 32,
          y: ship.y - 23,
          vx: ratio * 100,
          vy: -355,
          radius: 6,
          damage: 2 + level,
          life: 3.6,
          trailClock: 0,
          pierce: 1,
          hitIds: new Set(),
        });
      }
      playTone("missile");
    } else if (weapon === "plasma") {
      const level = Math.max(1, upgrades.plasma);
      const count = 1 + Math.floor(wide / 2);
      for (let i = 0; i < count; i += 1) {
        const ratio = count === 1 ? 0 : i / (count - 1) - 0.5;
        const angle = ratio * wide * 0.11;
        projectiles.push({
          type: "plasma",
          x: ship.x + ratio * 26,
          y: ship.y - 29,
          vx: Math.sin(angle) * 510,
          vy: -Math.cos(angle) * 510,
          radius: 7 + level,
          damage: 1 + level,
          life: 2.2,
          pierce: 1 + level,
          hitIds: new Set(),
          phase: random(0, TAU),
        });
      }
      playTone("plasma");
    } else if (weapon === "railgun") {
      const level = Math.max(1, upgrades.railgun);
      const count = wide >= 3 ? 3 : 1;
      for (let i = 0; i < count; i += 1) {
        const ratio = count === 1 ? 0 : i / (count - 1) - 0.5;
        const angle = ratio * 0.2;
        projectiles.push({
          type: "railgun",
          x: ship.x + ratio * 34,
          y: ship.y - 34,
          vx: Math.sin(angle) * 1050,
          vy: -Math.cos(angle) * 1050,
          radius: 4,
          damage: 6 + level * 2,
          life: 1.25,
          pierce: 3 + level,
          hitIds: new Set(),
        });
      }
      screenShake = Math.max(screenShake, 2.8);
      playTone("railgun");
    }
    createSparks(ship.x, ship.y - 28, weapon === "railgun" ? 8 : 3, {
      laser: "#71f7ff",
      missile: "#ff8a45",
      plasma: "#c776ff",
      railgun: "#ffe36e",
    }[weapon]);
  }

  function damageAsteroid(asteroid, damage, projectileType) {
    asteroid.hp -= damage;
    asteroid.flash = 0.09;
    const impactColor = {
      missile: "#ff8a45",
      "missile-blast": "#ff8a45",
      plasma: "#c776ff",
      railgun: "#ffe36e",
      laser: "#71f7ff",
    }[projectileType] || "#71f7ff";
    createSparks(asteroid.x, asteroid.y, projectileType === "missile" ? 10 : 4, impactColor);
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
      destroyedCount += 1;
      const dropChance = asteroid.type === "large" ? 0.34 : asteroid.type === "medium" ? 0.17 : 0.08;
      if (destroyedCount === 5 && unlockedWeapons.size === 1) {
        spawnUpgrade(asteroid.x, asteroid.y, "missile");
      } else if (Math.random() < dropChance || destroyedCount % 12 === 0) {
        spawnUpgrade(asteroid.x, asteroid.y);
      }
      if (cause === "missile") {
        for (const nearby of [...asteroids]) {
          const blast = asteroid.radius + 66;
          if (distanceSq(asteroid, nearby) < blast * blast) damageAsteroid(nearby, 1, "missile-blast");
        }
      }
    }
    playTone("impact", strength);
  }

  function spawnUpgrade(x, y, preferredType = null) {
    const candidates = [];
    if (upgrades.fireRate < 5) candidates.push("fireRate", "fireRate");
    if (upgrades.wideShot < 4) candidates.push("wideShot", "wideShot");
    if (upgrades.shield < 4 || shield < shieldMax) candidates.push("shield", "shield");
    if (upgrades.missile < 3) candidates.push("missile", "missile");
    if (upgrades.plasma < 3) candidates.push("plasma");
    if (upgrades.railgun < 3) candidates.push("railgun");
    if (!candidates.length) candidates.push("shield");
    const type = preferredType || candidates[Math.floor(Math.random() * candidates.length)];
    powerUps.push({
      type,
      x,
      y,
      vx: random(-18, 18),
      vy: random(56, 78),
      radius: 17,
      phase: random(0, TAU),
      life: 11,
    });
  }

  function applyUpgrade(type) {
    let label = "SYSTEM ENHANCED";
    if (type === "fireRate") {
      upgrades.fireRate = Math.min(5, upgrades.fireRate + 1);
      label = `OVERDRIVE MK ${upgrades.fireRate}`;
    } else if (type === "wideShot") {
      upgrades.wideShot = Math.min(4, upgrades.wideShot + 1);
      label = `WIDE SHOT MK ${upgrades.wideShot}`;
    } else if (type === "shield") {
      upgrades.shield = Math.min(4, upgrades.shield + 1);
      shieldMax = Math.min(110, 35 + (upgrades.shield - 1) * 25);
      shield = shieldMax;
      label = upgrades.shield === 1 ? "DEFLECTOR SHIELD ONLINE" : `SHIELD ARRAY MK ${upgrades.shield}`;
    } else if (type === "missile") {
      upgrades.missile = Math.min(3, upgrades.missile + 1);
      unlockedWeapons.add("missile");
      label = upgrades.missile === 1 ? "SEEKER MISSILES UNLOCKED" : `SEEKER MISSILES MK ${upgrades.missile}`;
    } else if (type === "plasma") {
      upgrades.plasma = Math.min(3, upgrades.plasma + 1);
      unlockedWeapons.add("plasma");
      label = upgrades.plasma === 1 ? "PLASMA CANNON UNLOCKED" : `PLASMA CANNON MK ${upgrades.plasma}`;
    } else if (type === "railgun") {
      upgrades.railgun = Math.min(3, upgrades.railgun + 1);
      unlockedWeapons.add("railgun");
      label = upgrades.railgun === 1 ? "RAIL DRIVER UNLOCKED" : `RAIL DRIVER MK ${upgrades.railgun}`;
    }
    updateUpgradeUi();
    selectWeapon(weapon, false);
    showUpgradeToast(label);
    createExplosion(ship.x, ship.y, 34, 0.7);
    shockwaves.push({ x: ship.x, y: ship.y, radius: 5, maxRadius: 74, life: 0.48, maxLife: 0.48, color: "#b56cff" });
    playTone("upgrade");
  }

  function showUpgradeToast(label) {
    ui.upgradeToastTitle.textContent = label;
    ui.upgradeToast.classList.add("visible");
    ui.announcer.textContent = `Upgrade acquired: ${label}`;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => ui.upgradeToast.classList.remove("visible"), 2200);
  }

  function updateUpgradeUi() {
    const chips = [];
    if (upgrades.fireRate) chips.push(`<span class="upgrade-chip">OVERDRIVE ${upgrades.fireRate}</span>`);
    if (upgrades.wideShot) chips.push(`<span class="upgrade-chip">WIDE ${upgrades.wideShot}</span>`);
    if (upgrades.shield) chips.push(`<span class="upgrade-chip shield">SHIELD ${Math.round(shield)}/${shieldMax}</span>`);
    if (upgrades.missile) chips.push(`<span class="upgrade-chip weapon">MISSILE ${upgrades.missile}</span>`);
    if (upgrades.plasma) chips.push(`<span class="upgrade-chip weapon">PLASMA ${upgrades.plasma}</span>`);
    if (upgrades.railgun) chips.push(`<span class="upgrade-chip weapon">RAIL ${upgrades.railgun}</span>`);
    ui.upgradeList.innerHTML = chips.length ? chips.join("") : '<span class="empty-upgrades">NO UPGRADES INSTALLED</span>';
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
    let remainingDamage = amount;
    if (shield > 0) {
      const absorbed = Math.min(shield, remainingDamage);
      shield -= absorbed;
      remainingDamage -= absorbed;
      ship.invulnerable = remainingDamage > 0 ? 1.05 : 0.45;
      shockwaves.push({ x: ship.x, y: ship.y, radius: 24, maxRadius: 48, life: 0.3, maxLife: 0.3, color: "#63b8ff" });
      createSparks(x, y, 12, "#63b8ff");
      updateUpgradeUi();
      playTone("shield");
      if (remainingDamage <= 0) {
        screenShake = Math.max(screenShake, 5);
        return;
      }
    }
    health = Math.max(0, health - remainingDamage);
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
    const spawnDelay = Math.max(0.48, 1.25 - (wave - 1) * 0.05);
    spawnClock += dt;
    if (spawnClock >= spawnDelay) {
      spawnClock -= spawnDelay;
      spawnAsteroid();
      if (wave >= 4 && Math.random() < 0.08) spawnAsteroid();
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
    const shipHalfWidth = 31 + upgrades.wideShot * 3;
    ship.x = clamp(ship.x + ship.vx * dt, shipHalfWidth + 8, width - shipHalfWidth - 8);
    ship.y = clamp(ship.y + ship.vy * dt, 104 + 34, height - 35);
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
      } else if (projectile.type === "plasma") {
        projectile.phase += dt * 11;
        if (Math.random() < dt * 24) {
          particles.push({
            x: projectile.x + random(-4, 4),
            y: projectile.y + random(-2, 7),
            vx: random(-20, 20),
            vy: random(30, 75),
            life: 0.24,
            maxLife: 0.24,
            size: random(1, 2.8),
            color: "#c776ff",
            drag: 0.95,
          });
        }
      } else if (projectile.type === "railgun" && Math.random() < dt * 30) {
        particles.push({
          x: projectile.x + random(-3, 3),
          y: projectile.y + 10,
          vx: random(-9, 9),
          vy: random(30, 90),
          life: 0.16,
          maxLife: 0.16,
          size: 1.3,
          color: "#ffe36e",
          drag: 0.93,
        });
      }
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      if (projectile.life <= 0 || projectile.y < -30 || projectile.x < -30 || projectile.x > width + 30) {
        projectiles.splice(i, 1);
        continue;
      }
      for (const asteroid of [...asteroids]) {
        if (projectile.hitIds.has(asteroid.id)) continue;
        const hitRadius = projectile.radius + asteroid.radius;
        if (distanceSq(projectile, asteroid) <= hitRadius * hitRadius) {
          projectile.hitIds.add(asteroid.id);
          projectile.pierce -= 1;
          damageAsteroid(asteroid, projectile.damage, projectile.type);
          if (projectile.type === "missile") {
            shockwaves.push({ x: projectile.x, y: projectile.y, radius: 3, maxRadius: 74, life: 0.32, maxLife: 0.32, color: "#ff8545" });
          }
          if (projectile.pierce <= 0) {
            projectiles.splice(i, 1);
            break;
          }
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
        damageShip(asteroid.type === "large" ? 35 : asteroid.type === "medium" ? 22 : 14, asteroid.x, asteroid.y);
        continue;
      }
      if (asteroid.y - asteroid.radius > height) {
        asteroids.splice(asteroids.indexOf(asteroid), 1);
      }
    }

    for (let i = powerUps.length - 1; i >= 0; i -= 1) {
      const pickup = powerUps[i];
      pickup.life -= dt;
      pickup.phase += dt * 3.2;
      const dist = Math.sqrt(distanceSq(pickup, ship));
      if (dist < 140) {
        const attraction = 260 * (1 - dist / 140) + 85;
        pickup.vx += ((ship.x - pickup.x) / Math.max(1, dist)) * attraction * dt;
        pickup.vy += ((ship.y - pickup.y) / Math.max(1, dist)) * attraction * dt;
      }
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;
      pickup.vx *= Math.pow(0.97, dt * 60);
      if (dist <= pickup.radius + ship.radius + 4) {
        powerUps.splice(i, 1);
        applyUpgrade(pickup.type);
        continue;
      }
      if (pickup.life <= 0 || pickup.y - pickup.radius > height) powerUps.splice(i, 1);
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
    ui.shield.textContent = shieldMax > 0 ? `${Math.round(shield)} / ${shieldMax}` : "OFFLINE";
    ui.shieldBar.style.width = `${shieldMax > 0 ? (shield / shieldMax) * 100 : 0}%`;
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
    for (const pickup of powerUps) drawPowerUp(pickup);
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
    } else if (projectile.type === "missile") {
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
    } else if (projectile.type === "plasma") {
      const pulse = 1 + Math.sin(projectile.phase) * 0.12;
      ctx.scale(pulse, pulse);
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowBlur = 24;
      ctx.shadowColor = "#b56cff";
      const orb = ctx.createRadialGradient(-2, -3, 1, 0, 0, projectile.radius * 1.35);
      orb.addColorStop(0, "#ffffff");
      orb.addColorStop(0.24, "#e4b6ff");
      orb.addColorStop(0.6, "#9b43df");
      orb.addColorStop(1, "rgba(110, 28, 196, 0)");
      ctx.fillStyle = orb;
      ctx.beginPath();
      ctx.arc(0, 0, projectile.radius * 1.35, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(224, 180, 255, 0.75)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, projectile.radius * 1.6, projectile.radius * 0.62, projectile.phase, 0, TAU);
      ctx.stroke();
    } else if (projectile.type === "railgun") {
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowBlur = 19;
      ctx.shadowColor = "#ffe36e";
      const bolt = ctx.createLinearGradient(0, -38, 0, 15);
      bolt.addColorStop(0, "rgba(255, 227, 110, 0)");
      bolt.addColorStop(0.28, "#ffe36e");
      bolt.addColorStop(0.64, "#ffffff");
      bolt.addColorStop(1, "rgba(255, 184, 54, 0.2)");
      ctx.strokeStyle = bolt;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(0, -38);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 227, 110, 0.48)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4, 9);
      ctx.lineTo(-4, -28);
      ctx.moveTo(4, 9);
      ctx.lineTo(4, -28);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPowerUp(pickup) {
    const colors = {
      fireRate: "#ff9f45",
      wideShot: "#56f4ff",
      shield: "#63b8ff",
      missile: "#ff8345",
      plasma: "#b56cff",
      railgun: "#ffe36e",
    };
    const glyphs = { fireRate: "F", wideShot: "W", shield: "S", missile: "M", plasma: "P", railgun: "R" };
    const color = colors[pickup.type];
    const pulse = 1 + Math.sin(pickup.phase * 2) * 0.1;
    ctx.save();
    ctx.translate(pickup.x, pickup.y);
    ctx.rotate(pickup.phase * 0.45);
    ctx.scale(pulse, pulse);
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = "rgba(7, 14, 30, 0.82)";
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = -Math.PI / 2 + (i / 6) * TAU;
      const x = Math.cos(angle) * pickup.radius;
      const y = Math.sin(angle) * pickup.radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.rotate(-pickup.phase * 0.45);
    ctx.fillStyle = color;
    ctx.font = "900 12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyphs[pickup.type], 0, 0);
    ctx.strokeStyle = `${color}66`;
    ctx.beginPath();
    ctx.arc(0, 0, pickup.radius + 7 + Math.sin(pickup.phase * 2) * 2, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawEffects() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const wave of shockwaves) {
      const alpha = clamp(wave.life / wave.maxLife, 0, 1);
      ctx.globalAlpha = alpha * 0.75;
      ctx.strokeStyle = wave.color || "#ff8545";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
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
    ctx.save();
    ctx.translate(ship.x, ship.y);
    if (ship.invulnerable > 0 && Math.floor(ship.invulnerable * 16) % 2 === 0) ctx.globalAlpha = 0.38;

    const totalTier = upgrades.fireRate + upgrades.wideShot + upgrades.shield + upgrades.missile + upgrades.plasma + upgrades.railgun;
    const wingSpan = 31 + upgrades.wideShot * 3 + Math.min(4, totalTier * 0.25);
    const shieldRadius = 39 + upgrades.shield * 3;
    const weaponColor = { laser: "#56f4ff", missile: "#ff8345", plasma: "#b56cff", railgun: "#ffe36e" }[weapon];

    if (shield > 0) {
      const shieldRatio = shield / shieldMax;
      const pulse = 1 + Math.sin(elapsed * 5) * 0.025;
      ctx.save();
      ctx.scale(pulse, pulse);
      ctx.globalCompositeOperation = "lighter";
      const shieldGlow = ctx.createRadialGradient(0, 0, 20, 0, 0, shieldRadius);
      shieldGlow.addColorStop(0.58, "rgba(74, 163, 255, 0)");
      shieldGlow.addColorStop(0.88, `rgba(74, 176, 255, ${0.05 + shieldRatio * 0.06})`);
      shieldGlow.addColorStop(1, `rgba(112, 207, 255, ${0.18 + shieldRatio * 0.17})`);
      ctx.fillStyle = shieldGlow;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = `rgba(115, 210, 255, ${0.28 + shieldRatio * 0.38})`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([8, 7]);
      ctx.lineDashOffset = -elapsed * 18;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    ctx.rotate(ship.tilt);

    // Multi-nozzle ion drive. Overdrive upgrades add a brighter central engine.
    const enginePositions = upgrades.fireRate >= 2 ? [-13, 0, 13] : [-11, 11];
    for (const engineX of enginePositions) {
      const thrust = state === "running" ? random(18, 28 + upgrades.fireRate * 3) : 12;
      const flame = ctx.createLinearGradient(engineX, 13, engineX, 15 + thrust);
      flame.addColorStop(0, "#ffffff");
      flame.addColorStop(0.2, upgrades.fireRate >= 3 ? "#b56cff" : "#56f4ff");
      flame.addColorStop(0.55, "#287eff");
      flame.addColorStop(1, "rgba(31, 64, 255, 0)");
      ctx.fillStyle = flame;
      ctx.shadowBlur = 17;
      ctx.shadowColor = upgrades.fireRate >= 3 ? "#b56cff" : "#48caff";
      ctx.beginPath();
      ctx.moveTo(engineX - 3.5, 12);
      ctx.quadraticCurveTo(engineX, 18 + thrust, engineX + 3.5, 12);
      ctx.closePath();
      ctx.fill();
    }

    // Under-wing mechanical frame.
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#101a25";
    ctx.strokeStyle = "rgba(96, 174, 201, 0.46)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(-wingSpan, 12);
    ctx.lineTo(-wingSpan + 5, 21);
    ctx.lineTo(-10, 13);
    ctx.lineTo(0, 23);
    ctx.lineTo(10, 13);
    ctx.lineTo(wingSpan - 5, 21);
    ctx.lineTo(wingSpan, 12);
    ctx.lineTo(6, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing armour panels grow wider and more segmented with wide-shot upgrades.
    const wingGradient = ctx.createLinearGradient(-wingSpan, -8, wingSpan, 20);
    wingGradient.addColorStop(0, "#334a59");
    wingGradient.addColorStop(0.42, "#9cb4c0");
    wingGradient.addColorStop(0.58, "#667d89");
    wingGradient.addColorStop(1, "#243744");
    ctx.fillStyle = wingGradient;
    ctx.strokeStyle = "rgba(153, 241, 255, 0.66)";
    ctx.shadowBlur = 13;
    ctx.shadowColor = "rgba(61, 220, 255, 0.16)";
    ctx.beginPath();
    ctx.moveTo(-7, -8);
    ctx.lineTo(-wingSpan, 11);
    ctx.lineTo(-wingSpan + 3, 17);
    ctx.lineTo(-12, 9);
    ctx.lineTo(-8, 17);
    ctx.lineTo(0, 21);
    ctx.lineTo(8, 17);
    ctx.lineTo(12, 9);
    ctx.lineTo(wingSpan - 3, 17);
    ctx.lineTo(wingSpan, 11);
    ctx.lineTo(7, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central fuselage with faceted nose and layered armour.
    const hull = ctx.createLinearGradient(-12, -34, 15, 23);
    hull.addColorStop(0, "#f4fdff");
    hull.addColorStop(0.24, "#a9c0cb");
    hull.addColorStop(0.56, "#5b7380");
    hull.addColorStop(1, "#1c2b36");
    ctx.fillStyle = hull;
    ctx.strokeStyle = "rgba(187, 247, 255, 0.9)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.lineTo(8, -18);
    ctx.lineTo(12, 7);
    ctx.lineTo(7, 19);
    ctx.lineTo(0, 24);
    ctx.lineTo(-7, 19);
    ctx.lineTo(-12, 7);
    ctx.lineTo(-8, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Recessed hull channels and panel seams.
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(11, 30, 42, 0.78)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -33);
    ctx.lineTo(0, 20);
    ctx.moveTo(-8, -15);
    ctx.lineTo(-3, -7);
    ctx.lineTo(-5, 15);
    ctx.moveTo(8, -15);
    ctx.lineTo(3, -7);
    ctx.lineTo(5, 15);
    ctx.moveTo(-wingSpan + 5, 12);
    ctx.lineTo(-13, 3);
    ctx.moveTo(wingSpan - 5, 12);
    ctx.lineTo(13, 3);
    ctx.stroke();

    // Armoured engine nacelles.
    for (const side of [-1, 1]) {
      const x = side * 12;
      ctx.fillStyle = "#253b49";
      ctx.strokeStyle = "rgba(128, 224, 245, 0.62)";
      ctx.beginPath();
      ctx.moveTo(x - 4, 4);
      ctx.lineTo(x - 5, 16);
      ctx.lineTo(x + 5, 16);
      ctx.lineTo(x + 4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#80ecff";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#56f4ff";
      ctx.fillRect(x - 2.5, 13, 5, 2);
    }

    // Glass canopy with a bright reflected rim.
    ctx.shadowBlur = 14;
    ctx.shadowColor = weaponColor;
    const canopy = ctx.createLinearGradient(-5, -24, 6, 7);
    canopy.addColorStop(0, "#dffcff");
    canopy.addColorStop(0.18, "#43bfd2");
    canopy.addColorStop(0.55, "#0b4d63");
    canopy.addColorStop(1, "#041923");
    ctx.fillStyle = canopy;
    ctx.strokeStyle = weaponColor;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.quadraticCurveTo(7, -12, 5, 3);
    ctx.lineTo(0, 10);
    ctx.lineTo(-5, 3);
    ctx.quadraticCurveTo(-7, -12, 0, -25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.72)";
    ctx.beginPath();
    ctx.moveTo(-2, -21);
    ctx.quadraticCurveTo(1, -17, 2, -10);
    ctx.stroke();

    // Missile pickups install visible pods and additional launch tubes.
    if (upgrades.missile > 0) {
      for (const side of [-1, 1]) {
        const podX = side * (wingSpan - 7);
        ctx.shadowBlur = 4;
        ctx.fillStyle = "#121d27";
        ctx.strokeStyle = "#718c99";
        ctx.fillRect(podX - 4, 7, 8, 12);
        ctx.strokeRect(podX - 4, 7, 8, 12);
        ctx.fillStyle = "#ff7541";
        ctx.shadowColor = "#ff7541";
        ctx.beginPath();
        for (let tube = 0; tube < upgrades.missile; tube += 1) {
          ctx.arc(podX + (tube - (upgrades.missile - 1) / 2) * 2.4, 11, 1, 0, TAU);
        }
        ctx.fill();
      }
    }

    // Wide-shot levels install visible outboard cannon hardpoints.
    for (let i = 0; i < upgrades.wideShot; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      const cannonX = side * (20 + row * 7);
      ctx.fillStyle = "#243b48";
      ctx.strokeStyle = "#75f5ff";
      ctx.fillRect(cannonX - 2.5, -1 + row * 4, 5, 14);
      ctx.strokeRect(cannonX - 2.5, -1 + row * 4, 5, 14);
      ctx.fillStyle = "#b9fcff";
      ctx.shadowBlur = 7;
      ctx.shadowColor = "#56f4ff";
      ctx.fillRect(cannonX - 1, -3 + row * 4, 2, 4);
    }

    // Overdrive levels add luminous heat vents along the fuselage.
    for (let i = 0; i < upgrades.fireRate; i += 1) {
      const y = 5 + i * 3;
      const half = 4 + i * 0.65;
      ctx.strokeStyle = upgrades.fireRate >= 4 ? "#c58aff" : "#65eaff";
      ctx.shadowBlur = 6;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(-half - 8, y);
      ctx.lineTo(-half - 3, y);
      ctx.moveTo(half + 3, y);
      ctx.lineTo(half + 8, y);
      ctx.stroke();
    }

    // Shield generators become external blue nodes on the wing roots.
    for (let i = 0; i < upgrades.shield; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      const nodeX = side * (15 + row * 8);
      ctx.fillStyle = "#7bd1ff";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#63b8ff";
      ctx.beginPath();
      ctx.arc(nodeX, 12 + row * 3, 2.5, 0, TAU);
      ctx.fill();
    }

    // Weapon-core upgrades permanently alter the ship's centreline.
    if (upgrades.plasma > 0) {
      ctx.fillStyle = "#c47aff";
      ctx.shadowBlur = 16 + upgrades.plasma * 3;
      ctx.shadowColor = "#b56cff";
      ctx.beginPath();
      ctx.arc(0, 5, 2.5 + upgrades.plasma * 0.6, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(220, 171, 255, 0.65)";
      ctx.beginPath();
      ctx.arc(0, 5, 6 + upgrades.plasma, 0, TAU);
      ctx.stroke();
    }
    if (upgrades.railgun > 0) {
      ctx.strokeStyle = "#ffe36e";
      ctx.lineWidth = 1 + upgrades.railgun * 0.35;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ffe36e";
      ctx.beginPath();
      ctx.moveTo(0, -37 - upgrades.railgun * 2);
      ctx.lineTo(0, -25);
      ctx.stroke();
      ctx.fillStyle = "#f1d766";
      ctx.fillRect(-2.5, -34, 5, 7);
    }

    // IFF lights and selected-weapon status strip.
    ctx.fillStyle = "#ff6b2c";
    ctx.shadowBlur = 7;
    ctx.shadowColor = "#ff6b2c";
    ctx.fillRect(-wingSpan + 4, 15, 4, 1.5);
    ctx.fillRect(wingSpan - 8, 15, 4, 1.5);
    ctx.fillStyle = weaponColor;
    ctx.shadowColor = weaponColor;
    ctx.fillRect(-3, 17, 6, 1.5);
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
      plasma: [420, 105, 0.22, "sine", 0.045],
      railgun: [1050, 72, 0.16, "sawtooth", 0.05],
      impact: [90, 34, 0.16 * strength, "sawtooth", 0.04],
      explosion: [74, 24, 0.6, "sawtooth", 0.06],
      damage: [120, 45, 0.28, "square", 0.05],
      shield: [260, 620, 0.15, "sine", 0.025],
      upgrade: [290, 880, 0.32, "triangle", 0.035],
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
    if (event.code === "Escape") {
      if (!ui.configPopover.hidden) setConfigOpen(false);
      else if (state === "paused") togglePause(true);
      return;
    }
    keys.add(event.code);
  });

  window.addEventListener("keyup", (event) => keys.delete(event.code));

  document.getElementById("startButton").addEventListener("click", startGame);
  document.getElementById("restartButton").addEventListener("click", startGame);
  document.getElementById("resumeButton").addEventListener("click", () => togglePause(true));
  document.getElementById("pauseButton").addEventListener("click", () => togglePause());
  document.querySelectorAll(".weapon-slot").forEach((card) => {
    card.addEventListener("click", () => selectWeapon(card.dataset.weapon));
  });
  ui.configButton.addEventListener("click", () => setConfigOpen(ui.configPopover.hidden));
  document.getElementById("closeConfigButton").addEventListener("click", () => setConfigOpen(false));
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
