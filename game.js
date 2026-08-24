(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const ui = {
    score: document.getElementById("scoreValue"),
    highScore: document.getElementById("highScoreValue"),
    wave: document.getElementById("waveValue"),
    waveLabel: document.getElementById("waveLabel"),
    health: document.getElementById("healthValue"),
    healthBar: document.getElementById("healthBar"),
    shield: document.getElementById("shieldValue"),
    shieldBar: document.getElementById("shieldBar"),
    threats: document.getElementById("threatCount"),
    radar: document.getElementById("radar"),
    start: document.getElementById("startOverlay"),
    pause: document.getElementById("pauseOverlay"),
    gameOver: document.getElementById("gameOverOverlay"),
    missionComplete: document.getElementById("missionCompleteOverlay"),
    gameOverReason: document.getElementById("gameOverReason"),
    finalScore: document.getElementById("finalScore"),
    announcer: document.getElementById("announcer"),
    sound: document.getElementById("soundButton"),
    upgradeList: document.getElementById("upgradeList"),
    upgradeToast: document.getElementById("upgradeToast"),
    upgradeToastKicker: document.getElementById("upgradeToastKicker"),
    upgradeToastTitle: document.getElementById("upgradeToastTitle"),
    activeWeaponIcon: document.getElementById("activeWeaponIcon"),
    activeWeaponName: document.getElementById("activeWeaponName"),
    activeWeaponStats: document.getElementById("activeWeaponStats"),
    configButton: document.getElementById("configButton"),
    configPopover: document.getElementById("configPopover"),
    settingsButton: document.getElementById("settingsButton"),
    settingsPopover: document.getElementById("settingsPopover"),
    matterValue: document.getElementById("matterValue"),
    resourceList: document.getElementById("resourceList"),
    missionNumber: document.getElementById("missionNumber"),
    missionObjective: document.getElementById("missionObjective"),
    missionProgress: document.getElementById("missionProgress"),
    musicVolume: document.getElementById("musicVolume"),
    musicVolumeValue: document.getElementById("musicVolumeValue"),
    sfxVolume: document.getElementById("sfxVolume"),
    sfxVolumeValue: document.getElementById("sfxVolumeValue"),
    audioStatus: document.getElementById("audioStatus"),
    audioStatusText: document.getElementById("audioStatusText"),
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
  const resourceCatalog = {
    iron: { name: "Iron", symbol: "Fe", color: "#aeb5bc", value: 1 },
    nickel: { name: "Nickel", symbol: "Ni", color: "#ccd3c7", value: 1 },
    copper: { name: "Copper", symbol: "Cu", color: "#d77945", value: 1 },
    aluminum: { name: "Aluminum", symbol: "Al", color: "#d8e1e8", value: 1 },
    magnesium: { name: "Magnesium", symbol: "Mg", color: "#edf3f7", value: 1 },
    zinc: { name: "Zinc", symbol: "Zn", color: "#a8b5c2", value: 1 },
    chromium: { name: "Chromium", symbol: "Cr", color: "#d4e2ef", value: 1 },
    manganese: { name: "Manganese", symbol: "Mn", color: "#a09ba4", value: 1 },
    cobalt: { name: "Cobalt", symbol: "Co", color: "#5686cb", value: 1 },
    tin: { name: "Tin", symbol: "Sn", color: "#bdc5c9", value: 1 },
    lead: { name: "Lead", symbol: "Pb", color: "#747681", value: 1 },
    titanium: { name: "Titanium", symbol: "Ti", color: "#9aa8bd", value: 2 },
    beryllium: { name: "Beryllium", symbol: "Be", color: "#b7e7cf", value: 3 },
    lithium: { name: "Lithium", symbol: "Li", color: "#e8d7e9", value: 2 },
    vanadium: { name: "Vanadium", symbol: "V", color: "#93a1ad", value: 2 },
    zirconium: { name: "Zirconium", symbol: "Zr", color: "#c6dbdd", value: 2 },
    niobium: { name: "Niobium", symbol: "Nb", color: "#8cb3ba", value: 2 },
    molybdenum: { name: "Molybdenum", symbol: "Mo", color: "#89959f", value: 2 },
    silver: { name: "Silver", symbol: "Ag", color: "#f1f5ff", value: 2 },
    cadmium: { name: "Cadmium", symbol: "Cd", color: "#b8c0c7", value: 2 },
    gallium: { name: "Gallium", symbol: "Ga", color: "#c4d8e1", value: 2 },
    indium: { name: "Indium", symbol: "In", color: "#aebbd8", value: 2 },
    gold: { name: "Gold", symbol: "Au", color: "#ffd34e", value: 4 },
    platinum: { name: "Platinum", symbol: "Pt", color: "#e6edf2", value: 4 },
    palladium: { name: "Palladium", symbol: "Pd", color: "#d6dedf", value: 3 },
    tungsten: { name: "Tungsten", symbol: "W", color: "#727d87", value: 3 },
    tantalum: { name: "Tantalum", symbol: "Ta", color: "#66788d", value: 3 },
    rhodium: { name: "Rhodium", symbol: "Rh", color: "#eff8ff", value: 4 },
    iridium: { name: "Iridium", symbol: "Ir", color: "#c7d6e5", value: 4 },
    osmium: { name: "Osmium", symbol: "Os", color: "#748b9e", value: 4 },
    ruthenium: { name: "Ruthenium", symbol: "Ru", color: "#bdcbd2", value: 3 },
    hafnium: { name: "Hafnium", symbol: "Hf", color: "#a4b6bf", value: 3 },
    rhenium: { name: "Rhenium", symbol: "Re", color: "#8c9ba5", value: 4 },
    neodymium: { name: "Neodymium", symbol: "Nd", color: "#be8ee5", value: 3 },
    cerium: { name: "Cerium", symbol: "Ce", color: "#d1a884", value: 3 },
    thorium: { name: "Thorium", symbol: "Th", color: "#6fd793", value: 4 },
    uranium: { name: "Uranium", symbol: "U", color: "#83f052", value: 5 },
    sodium: { name: "Sodium", symbol: "Na", color: "#e4d8b1", value: 1 },
    potassium: { name: "Potassium", symbol: "K", color: "#c9b6d8", value: 1 },
    calcium: { name: "Calcium", symbol: "Ca", color: "#e5e1d4", value: 1 },
    scandium: { name: "Scandium", symbol: "Sc", color: "#c7d2d8", value: 2 },
    rubidium: { name: "Rubidium", symbol: "Rb", color: "#c59ac9", value: 2 },
    strontium: { name: "Strontium", symbol: "Sr", color: "#e7c5b8", value: 2 },
    yttrium: { name: "Yttrium", symbol: "Y", color: "#b9c9ce", value: 2 },
    technetium: { name: "Technetium", symbol: "Tc", color: "#87999f", value: 4 },
    mercury: { name: "Mercury", symbol: "Hg", color: "#d6d9e1", value: 3 },
    cesium: { name: "Cesium", symbol: "Cs", color: "#dbc58e", value: 3 },
    barium: { name: "Barium", symbol: "Ba", color: "#c7d5bf", value: 2 },
    lanthanum: { name: "Lanthanum", symbol: "La", color: "#b9c7c0", value: 3 },
    praseodymium: { name: "Praseodymium", symbol: "Pr", color: "#a7c79d", value: 3 },
    samarium: { name: "Samarium", symbol: "Sm", color: "#c1a8a4", value: 3 },
    europium: { name: "Europium", symbol: "Eu", color: "#cfa2bf", value: 4 },
    gadolinium: { name: "Gadolinium", symbol: "Gd", color: "#aebfc0", value: 3 },
    terbium: { name: "Terbium", symbol: "Tb", color: "#93c6a3", value: 4 },
    dysprosium: { name: "Dysprosium", symbol: "Dy", color: "#a9b6cc", value: 4 },
    holmium: { name: "Holmium", symbol: "Ho", color: "#b0c5b2", value: 4 },
    erbium: { name: "Erbium", symbol: "Er", color: "#d2a6c5", value: 4 },
    thulium: { name: "Thulium", symbol: "Tm", color: "#a6c9cf", value: 4 },
    ytterbium: { name: "Ytterbium", symbol: "Yb", color: "#b3c2b7", value: 4 },
    lutetium: { name: "Lutetium", symbol: "Lu", color: "#9fb3bb", value: 4 },
    thallium: { name: "Thallium", symbol: "Tl", color: "#8f9ca7", value: 3 },
    bismuth: { name: "Bismuth", symbol: "Bi", color: "#d091bd", value: 4 },
    polonium: { name: "Polonium", symbol: "Po", color: "#86d784", value: 5 },
    radium: { name: "Radium", symbol: "Ra", color: "#9bff75", value: 5 },
    actinium: { name: "Actinium", symbol: "Ac", color: "#78e2a2", value: 5 },
    protactinium: { name: "Protactinium", symbol: "Pa", color: "#6acb82", value: 5 },
  };
  const commonMetals = ["iron", "nickel", "copper", "aluminum", "magnesium", "cobalt", "chromium", "zinc"];
  const exoticMetals = Object.keys(resourceCatalog).filter((id) => !commonMetals.includes(id) && !["silver", "gold", "titanium", "beryllium"].includes(id));
  const planetTypes = [
    { id: "gas", name: "Gas giant", style: "gas", colors: ["#d39a61", "#efe0bc", "#985d72"], atmosphere: "#ffc980" },
    { id: "rocky", name: "Rocky world", style: "rocky", colors: ["#8e7766", "#493b36", "#b99c7e"], atmosphere: "#c4aa8d" },
    { id: "habitable", name: "Habitable world", style: "habitable", colors: ["#287cb7", "#2f9d65", "#d5f2ed"], atmosphere: "#69cfff" },
    { id: "icy", name: "Icy world", style: "icy", colors: ["#bce7f4", "#eafcff", "#6eafcd"], atmosphere: "#a8efff" },
    { id: "forest", name: "Forest world", style: "forest", colors: ["#235f42", "#4e9a52", "#a9c473"], atmosphere: "#78d5ac" },
    { id: "ocean", name: "Ocean world", style: "ocean", colors: ["#0c4f94", "#2e9ec1", "#8de5ee"], atmosphere: "#59d8ff" },
    { id: "desert", name: "Desert world", style: "desert", colors: ["#c77c3f", "#e2b66f", "#8b4d35"], atmosphere: "#e9b46d" },
    { id: "volcanic", name: "Volcanic world", style: "volcanic", colors: ["#21191c", "#4b2929", "#ff5a24"], atmosphere: "#ff6338" },
    { id: "toxic", name: "Toxic world", style: "toxic", colors: ["#76933e", "#b2c75b", "#354729"], atmosphere: "#b8e75e" },
  ];
  const solarBodyTypes = {
    earth: { id: "earth", name: "Earth", colors: ["#176bb1", "#43a66c", "#eefcff"], atmosphere: "#64cfff" },
    mars: { id: "mars", name: "Mars", colors: ["#a8492c", "#d47c51", "#6d2e23"], atmosphere: "#e68b64" },
    jupiter: { id: "jupiter", name: "Jupiter", colors: ["#c89468", "#ead6b7", "#9b5b4d"], atmosphere: "#f3c78e" },
    saturn: { id: "saturn", name: "Saturn", colors: ["#d7bd79", "#f1dfa8", "#a98955"], atmosphere: "#ffe2a0" },
    uranus: { id: "uranus", name: "Uranus", colors: ["#81d6df", "#b8f0ee", "#4d9fb4"], atmosphere: "#a7f5ff" },
    neptune: { id: "neptune", name: "Neptune", colors: ["#2455b9", "#4a8be1", "#182d75"], atmosphere: "#5597ff" },
  };
  const solarMissionEvents = [
    { at: 7, id: "mars", side: 0.23, radius: 64, speed: 54 },
    { at: 36, id: "jupiter", side: 0.78, radius: 142, speed: 51 },
    { at: 49, id: "saturn", side: 0.24, radius: 112, speed: 55, rings: true },
    { at: 61, id: "uranus", side: 0.77, radius: 76, speed: 58, rings: true },
    { at: 71, id: "neptune", side: 0.27, radius: 82, speed: 61 },
  ];
  const SOLAR_MISSION_DURATION = 88;
  const alienShipTypes = [
    { id: "scout", name: "Alien scout", radius: 23, hp: 4, speed: 82, score: 420, color: "#ff5d9e" },
    { id: "raider", name: "Alien raider", radius: 29, hp: 7, speed: 66, score: 760, color: "#c86cff" },
    { id: "gunship", name: "Alien gunship", radius: 36, hp: 11, speed: 48, score: 1250, color: "#ff7654" },
  ];
  const defaultSettings = {
    asteroids: true,
    mineralDrops: true,
    shootingStars: true,
    planets: true,
    alienShips: true,
    spaceStations: true,
    music: true,
    soundFx: true,
    particles: true,
    screenShake: true,
    musicVolume: 0.65,
    sfxVolume: 0.8,
  };
  const settings = { ...defaultSettings };
  try {
    const savedSettings = JSON.parse(localStorage.getItem("starfall-settings-v1") || "{}");
    for (const key of Object.keys(defaultSettings)) {
      if (typeof defaultSettings[key] === "boolean" && typeof savedSettings[key] === "boolean") settings[key] = savedSettings[key];
      if (typeof defaultSettings[key] === "number" && Number.isFinite(savedSettings[key])) settings[key] = clamp(savedSettings[key], 0, 1);
    }
  } catch {
    localStorage.removeItem("starfall-settings-v1");
  }
  if (localStorage.getItem("starfall-audio-engine-v2") !== "enabled") {
    settings.music = true;
    settings.soundFx = true;
    settings.musicVolume = 0.72;
    settings.sfxVolume = 0.9;
    localStorage.setItem("starfall-audio-engine-v2", "enabled");
    localStorage.setItem("starfall-settings-v1", JSON.stringify(settings));
  }

  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let lastTime = performance.now();
  let state = "idle";
  let mission = 1;
  let missionElapsed = 0;
  let solarEventIndex = 0;
  let beltAnnounced = false;
  let configReturnState = null;
  let settingsReturnState = null;
  let score = 0;
  let highScore = Number(localStorage.getItem("starfall-high-score") || 0);
  let health = 100;
  let maxHealth = 100;
  let shield = 0;
  let shieldMax = 0;
  let weapon = "laser";
  let lastShot = 0;
  let elapsed = 0;
  let spawnClock = 0;
  let screenShake = 0;
  let soundEnabled = settings.soundFx;
  let audioContext = null;
  let musicBus = null;
  let sfxBus = null;
  let audioMaster = null;
  let musicSource = null;
  let musicStartedAt = 0;
  let musicOffset = 0;
  let currentMusicTrack = null;
  let noiseBuffer = null;
  const musicBuffers = new Map();
  let radarClock = 0;
  let mobileFiring = false;
  let asteroidSequence = 0;
  let destroyedCount = 0;
  let toastTimer = 0;
  let shootingStarClock = 0;
  let nextShootingStar = random(7, 12);
  let matterBalance = 0;
  let timeSinceDamage = 0;
  let planetClock = 0;
  let nextPlanet = random(24, 40);
  let alienClock = 0;
  let nextAlien = random(10, 17);
  let stationClock = 0;
  let nextStation = random(34, 55);
  let hostileSequence = 0;

  const keys = new Set();
  const stars = [];
  const asteroids = [];
  const projectiles = [];
  const particles = [];
  const shockwaves = [];
  const powerUps = [];
  const resourceDrops = [];
  const shootingStars = [];
  const planets = [];
  const solarPlanets = [];
  const alienShips = [];
  const spaceStations = [];
  const enemyProjectiles = [];
  const mobileVector = { x: 0, y: 0 };
  const resourceInventory = {};
  const upgrades = {
    fireRate: 0,
    wideShot: 0,
    shield: 0,
    engine: 0,
    maneuver: 0,
    armor: 0,
    regeneration: 0,
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
    maxHealth = 100;
    shield = 0;
    shieldMax = 0;
    elapsed = 0;
    spawnClock = 0;
    lastShot = 0;
    screenShake = 0;
    destroyedCount = 0;
    toastTimer = 0;
    shootingStarClock = 0;
    nextShootingStar = random(7, 12);
    planetClock = 0;
    nextPlanet = random(24, 40);
    alienClock = 0;
    nextAlien = random(10, 17);
    stationClock = 0;
    nextStation = random(34, 55);
    hostileSequence = 0;
    matterBalance = 0;
    timeSinceDamage = 0;
    configReturnState = null;
    settingsReturnState = null;
    missionElapsed = 0;
    solarEventIndex = 0;
    beltAnnounced = false;
    asteroids.length = 0;
    projectiles.length = 0;
    particles.length = 0;
    shockwaves.length = 0;
    powerUps.length = 0;
    resourceDrops.length = 0;
    shootingStars.length = 0;
    planets.length = 0;
    solarPlanets.length = 0;
    alienShips.length = 0;
    spaceStations.length = 0;
    enemyProjectiles.length = 0;
    Object.keys(resourceInventory).forEach((key) => delete resourceInventory[key]);
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
    updateResourceUi();
    updateHud(true);
  }

  function prepareRunningState() {
    state = "running";
    ui.start.classList.remove("visible");
    ui.pause.classList.remove("visible");
    ui.gameOver.classList.remove("visible");
    ui.missionComplete.classList.remove("visible");
    setConfigOpen(false);
    setSettingsOpen(false);
    lastTime = performance.now();
    updateMissionHud();
    updateMusicState();
  }

  function spawnEarthDeparture() {
    const radius = clamp(Math.min(width, height) * 0.34, 180, 310);
    solarPlanets.push({
      type: solarBodyTypes.earth,
      x: width / 2,
      y: height + radius * 0.46,
      radius,
      vy: 19,
      rotation: -0.18,
      rotationSpeed: 0.018,
      phase: 0,
      rings: false,
      collision: false,
      label: "EARTH · DEPARTURE",
    });
  }

  function startMissionOne() {
    if (state === "running") return;
    unlockAudio();
    resetMissionMusic();
    mission = 1;
    resetGame();
    spawnEarthDeparture();
    prepareRunningState();
    ui.announcer.textContent = "Mission one launched from Earth. Leave the Solar System.";
    screenShake = 7;
    playTone("launch");
  }

  function clearSectorForMissionTwo() {
    for (const asteroid of asteroids) asteroid.alive = false;
    for (const enemy of alienShips) enemy.alive = false;
    for (const station of spaceStations) station.alive = false;
    asteroids.length = 0;
    projectiles.length = 0;
    particles.length = 0;
    shockwaves.length = 0;
    powerUps.length = 0;
    resourceDrops.length = 0;
    shootingStars.length = 0;
    planets.length = 0;
    solarPlanets.length = 0;
    alienShips.length = 0;
    spaceStations.length = 0;
    enemyProjectiles.length = 0;
    elapsed = 0;
    missionElapsed = 0;
    spawnClock = 0;
    shootingStarClock = 0;
    planetClock = 0;
    alienClock = 0;
    stationClock = 0;
    nextShootingStar = random(7, 12);
    nextPlanet = random(24, 40);
    nextAlien = random(10, 17);
    nextStation = random(34, 55);
    ship.x = width / 2;
    ship.y = height * 0.82;
    ship.vx = 0;
    ship.vy = 0;
    ship.invulnerable = 1.5;
  }

  function startMissionTwo(preserveProgress = true) {
    if (state === "running" && mission === 2) return;
    unlockAudio();
    resetMissionMusic();
    if (preserveProgress) clearSectorForMissionTwo();
    else resetGame();
    mission = 2;
    prepareRunningState();
    updateUpgradeUi();
    updateResourceUi();
    updateHud(true);
    ui.announcer.textContent = "Mission two launched. Uncharted deep space. Endless operation.";
    showUpgradeToast("UNCHARTED SPACE", "MISSION 02 · ENDLESS");
    playTone("launch");
  }

  function restartMission() {
    if (mission === 2) startMissionTwo(false);
    else startMissionOne();
  }

  function completeMissionOne() {
    if (mission !== 1 || state !== "running") return;
    state = "missioncomplete";
    ui.missionComplete.classList.add("visible");
    ui.missionObjective.textContent = "SOLAR SYSTEM ESCAPED";
    ui.missionProgress.style.width = "100%";
    ui.announcer.textContent = "Mission one complete. Heliopause crossed.";
    updateMusicState();
    playTone("complete");
  }

  function togglePause(forceResume = false) {
    if (state === "idle" || state === "gameover" || state === "missioncomplete" || state === "config" || state === "options") return;
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
    updateMusicState();
  }

  function setConfigOpen(open) {
    if (open && ui.configPopover.hidden) {
      if (!ui.settingsPopover.hidden) setSettingsOpen(false);
      configReturnState = state;
      if (state === "running") state = "config";
      ui.announcer.textContent = "Ship configuration open. Mission paused.";
    } else if (!open && !ui.configPopover.hidden) {
      if (state === "config") state = configReturnState === "running" ? "running" : configReturnState;
      configReturnState = null;
      lastTime = performance.now();
      ui.announcer.textContent = state === "running" ? "Ship configuration closed. Mission resumed." : "Ship configuration closed.";
    }
    ui.configPopover.hidden = !open;
    ui.configButton.classList.toggle("active", open);
    ui.configButton.setAttribute("aria-expanded", String(open));
    ui.configButton.setAttribute("aria-label", open ? "Hide ship configuration" : "Show ship configuration");
    updateMusicState();
  }

  function setSettingsOpen(open) {
    if (open && ui.settingsPopover.hidden) {
      if (!ui.configPopover.hidden) setConfigOpen(false);
      settingsReturnState = state;
      if (state === "running") state = "options";
      ui.announcer.textContent = "Mission options open. Mission paused.";
    } else if (!open && !ui.settingsPopover.hidden) {
      if (state === "options") state = settingsReturnState === "running" ? "running" : settingsReturnState;
      settingsReturnState = null;
      lastTime = performance.now();
      ui.announcer.textContent = state === "running" ? "Mission options closed. Mission resumed." : "Mission options closed.";
    }
    ui.settingsPopover.hidden = !open;
    ui.settingsButton.classList.toggle("active", open);
    ui.settingsButton.setAttribute("aria-expanded", String(open));
    ui.settingsButton.setAttribute("aria-label", open ? "Hide game options" : "Show game options");
    updateMusicState();
  }

  function updateSettingsUi() {
    document.querySelectorAll("[data-setting]").forEach((button) => {
      const enabled = Boolean(settings[button.dataset.setting]);
      button.classList.toggle("enabled", enabled);
      button.setAttribute("aria-checked", String(enabled));
      button.setAttribute("data-state", enabled ? "ON" : "OFF");
    });
    soundEnabled = settings.soundFx;
    ui.sound.classList.toggle("muted", !soundEnabled);
    ui.sound.textContent = soundEnabled ? "SFX" : "OFF";
    ui.sound.setAttribute("aria-label", soundEnabled ? "Mute sound effects" : "Enable sound effects");
    const musicPercent = Math.round(settings.musicVolume * 100);
    const sfxPercent = Math.round(settings.sfxVolume * 100);
    ui.musicVolume.value = String(musicPercent);
    ui.musicVolumeValue.textContent = `${musicPercent}%`;
    ui.sfxVolume.value = String(sfxPercent);
    ui.sfxVolumeValue.textContent = `${sfxPercent}%`;
  }

  function setVolumeSetting(key, value) {
    if (!(key in settings)) return;
    settings[key] = clamp(Number(value), 0, 1);
    localStorage.setItem("starfall-settings-v1", JSON.stringify(settings));
    updateSettingsUi();
    if (key === "musicVolume" && audioContext && musicBus) {
      const now = audioContext.currentTime;
      musicBus.gain.cancelScheduledValues(now);
      musicBus.gain.linearRampToValueAtTime(state === "running" && settings.music ? Math.max(0.0001, settings.musicVolume) : 0.0001, now + 0.08);
    }
    if (key === "sfxVolume" && audioContext && sfxBus) {
      const now = audioContext.currentTime;
      sfxBus.gain.cancelScheduledValues(now);
      sfxBus.gain.linearRampToValueAtTime(Math.max(0.0001, settings.sfxVolume), now + 0.08);
    }
    refreshAudioStatus();
  }

  function setFeatureSetting(key, enabled) {
    if (!(key in settings)) return;
    settings[key] = Boolean(enabled);
    if (!settings.asteroids) {
      for (const asteroid of asteroids) asteroid.alive = false;
      asteroids.length = 0;
    }
    if (!settings.mineralDrops) resourceDrops.length = 0;
    if (!settings.shootingStars) shootingStars.length = 0;
    if (!settings.planets) planets.length = 0;
    if (!settings.alienShips) {
      for (const enemy of alienShips) enemy.alive = false;
      alienShips.length = 0;
      for (let i = enemyProjectiles.length - 1; i >= 0; i -= 1) {
        if (!enemyProjectiles[i].stationBolt) enemyProjectiles.splice(i, 1);
      }
    }
    if (!settings.spaceStations) {
      for (const station of spaceStations) station.alive = false;
      spaceStations.length = 0;
      for (let i = enemyProjectiles.length - 1; i >= 0; i -= 1) {
        if (enemyProjectiles[i].stationBolt) enemyProjectiles.splice(i, 1);
      }
    }
    if (!settings.particles) {
      particles.length = 0;
      shockwaves.length = 0;
    }
    localStorage.setItem("starfall-settings-v1", JSON.stringify(settings));
    updateSettingsUi();
    if (key === "music") unlockAudio();
    updateMusicState();
    refreshAudioStatus();
    ui.announcer.textContent = `${key.replace(/([A-Z])/g, " $1")} ${enabled ? "enabled" : "disabled"}`;
  }

  function endGame(reason = "HULL INTEGRITY FAILED") {
    state = "gameover";
    configReturnState = null;
    settingsReturnState = null;
    ui.configPopover.hidden = true;
    ui.configButton.classList.remove("active");
    ui.configButton.setAttribute("aria-expanded", "false");
    ui.settingsPopover.hidden = true;
    ui.settingsButton.classList.remove("active");
    ui.settingsButton.setAttribute("aria-expanded", "false");
    ui.missionComplete.classList.remove("visible");
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("starfall-high-score", String(highScore));
    }
    ui.finalScore.textContent = padScore(score);
    ui.gameOverReason.textContent = reason;
    ui.highScore.textContent = padScore(highScore);
    ui.gameOver.classList.add("visible");
    ui.announcer.textContent = `${reason}. Final score ${score}`;
    updateMusicState();
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

  function chooseAsteroidComposition() {
    const roll = Math.random();
    if (roll < 0.7) return { label: "Rock", rockRatio: 1, metals: [] };
    if (roll < 0.81) {
      const first = commonMetals[Math.floor(Math.random() * commonMetals.length)];
      let second = commonMetals[Math.floor(Math.random() * commonMetals.length)];
      if (second === first) second = "iron";
      return { label: "Common-metal rock", rockRatio: 0.68, metals: [{ id: first, amount: 1 }, { id: second, amount: 1 }] };
    }
    if (roll < 0.855) return { label: "Silver-bearing rock", rockRatio: 0.66, metals: [{ id: "silver", amount: 1 }] };
    if (roll < 0.87) return { label: "Silver-rich asteroid", rockRatio: 0.12, metals: [{ id: "silver", amount: 2 }] };
    if (roll < 0.9) return { label: "Gold-bearing rock", rockRatio: 0.68, metals: [{ id: "gold", amount: 1 }] };
    if (roll < 0.92) return { label: "Gold-silver rock", rockRatio: 0.56, metals: [{ id: "gold", amount: 1 }, { id: "silver", amount: 1 }] };
    if (roll < 0.95) return { label: "Titanium-rich", rockRatio: 0.38, metals: [{ id: "titanium", amount: 2 }] };
    if (roll < 0.965) return { label: "Beryllium-rich", rockRatio: 0.44, metals: [{ id: "beryllium", amount: 1 }] };
    if (roll < 0.985) {
      const id = exoticMetals[Math.floor(Math.random() * exoticMetals.length)];
      return { label: `${resourceCatalog[id].name}-bearing`, rockRatio: 0.5, metals: [{ id, amount: 1 }] };
    }
    const metalPool = Object.keys(resourceCatalog);
    const first = metalPool[Math.floor(Math.random() * metalPool.length)];
    let second = metalPool[Math.floor(Math.random() * metalPool.length)];
    if (second === first) second = "nickel";
    return { label: "Metallic asteroid", rockRatio: 0.12, metals: [{ id: first, amount: 2 }, { id: second, amount: 1 }] };
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
    const composition = chooseAsteroidComposition();
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
    const mineralPatches = composition.metals.flatMap((metal) => {
      const count = Math.max(2, Math.round((1.15 - composition.rockRatio) * random(4, 8)));
      return Array.from({ length: count }, () => {
        const angle = random(0, TAU);
        const distance = random(0.12, 0.72) * radius;
        return {
          id: metal.id,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          r: random(0.08, 0.2) * radius,
          stretch: random(0.35, 0.8),
          rotation: random(0, TAU),
        };
      });
    });
    asteroids.push({
      id: ++asteroidSequence,
      alive: true,
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
      composition,
      mineralPatches,
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
          targetClock: 0,
          target: null,
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
    asteroid.alive = false;
    asteroids.splice(index, 1);
    const strength = asteroid.type === "large" ? 1.7 : asteroid.type === "medium" ? 1.2 : 0.8;
    createExplosion(asteroid.x, asteroid.y, asteroid.radius, strength);
    screenShake = Math.max(screenShake, 3.5 * strength);
    if (cause !== "ship") {
      score += asteroid.score;
      destroyedCount += 1;
      dropAsteroidResources(asteroid);
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

  function dropAsteroidResources(asteroid) {
    if (!settings.mineralDrops || !asteroid.composition.metals.length) return;
    const sizeYield = asteroid.type === "large" ? 3 : asteroid.type === "medium" ? 2 : 1;
    for (const metal of asteroid.composition.metals) {
      resourceDrops.push({
        id: metal.id,
        amount: metal.amount * sizeYield,
        x: asteroid.x + random(-8, 8),
        y: asteroid.y + random(-8, 8),
        vx: random(-52, 52),
        vy: random(28, 72),
        radius: 11,
        phase: random(0, TAU),
        life: 14,
      });
    }
  }

  function collectResource(drop) {
    const resource = resourceCatalog[drop.id];
    resourceInventory[drop.id] = (resourceInventory[drop.id] || 0) + drop.amount;
    const gainedMatter = drop.amount * resource.value;
    matterBalance += gainedMatter;
    updateResourceUi();
    showUpgradeToast(`${resource.symbol} ${resource.name.toUpperCase()} ×${drop.amount} · +${gainedMatter} MU`, "RESOURCE RECOVERED");
    playTone("resource");
  }

  function spawnUpgrade(x, y, preferredType = null) {
    const candidates = [];
    if (upgrades.fireRate < 5) candidates.push("fireRate", "fireRate");
    if (upgrades.wideShot < 4) candidates.push("wideShot", "wideShot");
    if (upgrades.shield < 4 || shield < shieldMax) candidates.push("shield", "shield");
    if (upgrades.engine < 4) candidates.push("engine");
    if (upgrades.maneuver < 4) candidates.push("maneuver");
    if (upgrades.armor < 4) candidates.push("armor");
    if (upgrades.regeneration < 4) candidates.push("regeneration");
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
    } else if (type === "engine") {
      upgrades.engine = Math.min(4, upgrades.engine + 1);
      label = `ENGINE THRUST MK ${upgrades.engine}`;
    } else if (type === "maneuver") {
      upgrades.maneuver = Math.min(4, upgrades.maneuver + 1);
      label = `MANOEUVRING MK ${upgrades.maneuver}`;
    } else if (type === "armor") {
      upgrades.armor = Math.min(4, upgrades.armor + 1);
      maxHealth = 100 + upgrades.armor * 25;
      health = Math.min(maxHealth, health + 25);
      label = `ARMOUR PLATING MK ${upgrades.armor}`;
    } else if (type === "regeneration") {
      upgrades.regeneration = Math.min(4, upgrades.regeneration + 1);
      label = `HULL REGENERATION MK ${upgrades.regeneration}`;
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

  function showUpgradeToast(label, kicker = "UPGRADE ACQUIRED") {
    ui.upgradeToastKicker.textContent = kicker;
    ui.upgradeToastTitle.textContent = label;
    ui.upgradeToast.classList.add("visible");
    ui.announcer.textContent = `${kicker}: ${label}`;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => ui.upgradeToast.classList.remove("visible"), 2200);
  }

  function updateUpgradeUi() {
    const chips = [];
    if (upgrades.fireRate) chips.push(`<span class="upgrade-chip">OVERDRIVE ${upgrades.fireRate}</span>`);
    if (upgrades.wideShot) chips.push(`<span class="upgrade-chip">WIDE ${upgrades.wideShot}</span>`);
    if (upgrades.shield) chips.push(`<span class="upgrade-chip shield">SHIELD ${Math.round(shield)}/${shieldMax}</span>`);
    if (upgrades.engine) chips.push(`<span class="upgrade-chip">ENGINE ${upgrades.engine}</span>`);
    if (upgrades.maneuver) chips.push(`<span class="upgrade-chip">MANOEUVRE ${upgrades.maneuver}</span>`);
    if (upgrades.armor) chips.push(`<span class="upgrade-chip">ARMOUR ${upgrades.armor}</span>`);
    if (upgrades.regeneration) chips.push(`<span class="upgrade-chip shield">REGEN ${upgrades.regeneration}</span>`);
    if (upgrades.missile) chips.push(`<span class="upgrade-chip weapon">MISSILE ${upgrades.missile}</span>`);
    if (upgrades.plasma) chips.push(`<span class="upgrade-chip weapon">PLASMA ${upgrades.plasma}</span>`);
    if (upgrades.railgun) chips.push(`<span class="upgrade-chip weapon">RAIL ${upgrades.railgun}</span>`);
    ui.upgradeList.innerHTML = chips.length ? chips.join("") : '<span class="empty-upgrades">NO UPGRADES INSTALLED</span>';
    updateFabricatorButtons();
  }

  const fabricationCosts = { fireRate: 8, wideShot: 10, shield: 12, repair: 7, engine: 10, maneuver: 9, armor: 14, regeneration: 16 };

  function updateResourceUi() {
    ui.matterValue.textContent = String(Math.floor(matterBalance));
    const collected = Object.entries(resourceInventory)
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => resourceCatalog[b[0]].value - resourceCatalog[a[0]].value || b[1] - a[1]);
    ui.resourceList.innerHTML = collected.length
      ? collected.map(([id, amount]) => {
        const resource = resourceCatalog[id];
        return `<span class="resource-chip" title="${resource.name}"><i style="--resource-color:${resource.color}"></i>${resource.symbol} ×${amount}</span>`;
      }).join("")
      : '<span class="empty-resources">NO ELEMENTS RECOVERED</span>';
    updateFabricatorButtons();
  }

  function fabricationAtMax(type) {
    if (type === "repair") return health >= maxHealth;
    const limits = { fireRate: 5, wideShot: 4, shield: 4, engine: 4, maneuver: 4, armor: 4, regeneration: 4 };
    return upgrades[type] >= limits[type];
  }

  function updateFabricatorButtons() {
    document.querySelectorAll("[data-fabricate]").forEach((button) => {
      const type = button.dataset.fabricate;
      button.disabled = matterBalance < fabricationCosts[type] || fabricationAtMax(type);
      button.title = fabricationAtMax(type) ? "Maximum level reached" : `${fabricationCosts[type]} refined matter units`;
    });
  }

  function fabricate(type) {
    const cost = fabricationCosts[type];
    if (!cost || matterBalance < cost || fabricationAtMax(type)) {
      showUpgradeToast("INSUFFICIENT REFINED MATTER", "FABRICATION FAILED");
      return;
    }
    matterBalance -= cost;
    if (type === "repair") {
      health = Math.min(maxHealth, health + 45);
      showUpgradeToast("HULL INTEGRITY RESTORED", "FABRICATION COMPLETE");
      playTone("upgrade");
    } else {
      applyUpgrade(type);
      ui.upgradeToastKicker.textContent = "FABRICATION COMPLETE";
    }
    updateResourceUi();
  }

  function createSparks(x, y, count, color) {
    if (!settings.particles) return;
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
    if (!settings.particles) return;
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
    timeSinceDamage = 0;
    const armorReduction = upgrades.armor * 0.09;
    let remainingDamage = amount * (1 - armorReduction);
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

  function spawnShootingStar() {
    const fromLeft = Math.random() < 0.5;
    const speed = random(480, 690);
    const angle = random(0.28, 0.48);
    shootingStars.push({
      x: fromLeft ? -80 : width + 80,
      y: random(110, Math.max(150, height * 0.42)),
      vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
      vy: Math.sin(angle) * speed,
      radius: random(8, 13),
      life: 4,
      phase: random(0, TAU),
    });
  }

  function spawnPlanet() {
    const type = planetTypes[Math.floor(Math.random() * planetTypes.length)];
    const maxRadius = Math.max(58, Math.min(190, width * 0.23, height * 0.25));
    let radius = random(maxRadius * 0.42, maxRadius);
    if (type.style === "gas") radius = Math.min(maxRadius, radius * 1.15);
    if (type.style === "rocky" && Math.random() < 0.5) radius *= 0.72;
    const featureCount = Math.floor(random(8, 17));
    const features = Array.from({ length: featureCount }, () => {
      const angle = random(0, TAU);
      const distance = Math.sqrt(Math.random()) * radius * 0.68;
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        r: random(0.045, 0.16) * radius,
        rotation: random(0, TAU),
        tone: Math.floor(random(0, type.colors.length)),
      };
    });
    planets.push({
      type,
      x: random(-radius * 0.1, width + radius * 0.1),
      y: -radius - random(30, 110),
      radius,
      vy: random(19, 34),
      rotation: random(0, TAU),
      rotationSpeed: random(-0.035, 0.035),
      features,
      hasRings: type.style === "gas" && Math.random() < 0.42,
      phase: random(0, TAU),
    });
    showUpgradeToast(type.name.toUpperCase(), "PLANETARY BODY DETECTED");
  }

  function spawnSolarPlanet(event) {
    const scale = clamp(width / 1100, 0.68, 1);
    const radius = event.radius * scale;
    const type = solarBodyTypes[event.id];
    solarPlanets.push({
      type,
      x: clamp(width * event.side, radius + 12, width - radius - 12),
      y: -radius - 45,
      radius,
      vy: event.speed,
      rotation: random(-0.35, 0.35),
      rotationSpeed: event.id === "jupiter" || event.id === "saturn" ? 0.032 : 0.018,
      phase: random(0, TAU),
      rings: Boolean(event.rings),
      collision: true,
      label: `${type.name.toUpperCase()} · SOLAR SYSTEM`,
    });
    showUpgradeToast(`${type.name.toUpperCase()} APPROACH`, "MISSION 01 · NAVIGATION");
  }

  function updateSolarMission(dt) {
    missionElapsed += dt;
    while (solarEventIndex < solarMissionEvents.length && missionElapsed >= solarMissionEvents[solarEventIndex].at) {
      spawnSolarPlanet(solarMissionEvents[solarEventIndex]);
      solarEventIndex += 1;
    }
    if (!beltAnnounced && missionElapsed >= 18) {
      beltAnnounced = true;
      showUpgradeToast("DENSE ASTEROID BELT", "MISSION 01 · SURVIVE");
      ui.announcer.textContent = "Asteroid belt entered. Dodge or destroy incoming rocks.";
    }
    if (settings.asteroids && missionElapsed >= 18 && missionElapsed < 43) {
      const beltDelay = missionElapsed < 23 ? 0.86 : missionElapsed > 38 ? 0.92 : 0.68;
      spawnClock += dt;
      if (spawnClock >= beltDelay) {
        spawnClock -= beltDelay;
        spawnAsteroid();
        if (missionElapsed > 27 && missionElapsed < 36 && Math.random() < 0.14) spawnAsteroid();
      }
    }
    if (missionElapsed >= SOLAR_MISSION_DURATION) completeMissionOne();
  }

  function rollHostileDefense(baseHp) {
    const roll = Math.random();
    if (roll < 0.34) return { defense: "none", armor: 0, hpBonus: 0, shield: 0 };
    if (roll < 0.58) return { defense: "armored", armor: 0.28, hpBonus: Math.ceil(baseHp * 0.35), shield: 0 };
    if (roll < 0.82) return { defense: "shielded", armor: 0, hpBonus: 0, shield: Math.ceil(baseHp * 0.75) };
    return { defense: "fortified", armor: 0.2, hpBonus: Math.ceil(baseHp * 0.2), shield: Math.ceil(baseHp * 0.58) };
  }

  function spawnAlienShip() {
    const wave = getWave();
    const availableTypes = alienShipTypes.slice(0, wave >= 4 ? 3 : wave >= 2 ? 2 : 1);
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const defense = rollHostileDefense(type.hp);
    const maxHp = type.hp + defense.hpBonus + Math.floor((wave - 1) * 0.45);
    const radius = type.radius;
    alienShips.push({
      id: `alien-${++hostileSequence}`,
      alive: true,
      kind: "ship",
      type,
      x: random(radius + 20, width - radius - 20),
      y: -radius - 35,
      baseX: 0,
      targetY: random(135, Math.min(height * 0.46, 360)),
      radius,
      hp: maxHp,
      maxHp,
      shield: defense.shield,
      shieldMax: defense.shield,
      armor: defense.armor,
      defense: defense.defense,
      fireClock: random(0.15, 0.9),
      fireDelay: random(2.05, 3.15),
      phase: random(0, TAU),
      life: random(17, 24),
      flash: 0,
      shieldFlash: 0,
      score: type.score,
    });
    const enemy = alienShips[alienShips.length - 1];
    enemy.baseX = enemy.x;
    showUpgradeToast(`${type.name.toUpperCase()} · ${defense.defense.toUpperCase()}`, "HOSTILE CONTACT");
  }

  function spawnSpaceStation() {
    const wave = getWave();
    const baseHp = 18 + Math.floor(wave * 1.5);
    const defense = rollHostileDefense(baseHp);
    const maxHp = baseHp + defense.hpBonus;
    const radius = random(52, 76);
    const x = random(radius + 28, width - radius - 28);
    spaceStations.push({
      id: `station-${++hostileSequence}`,
      alive: true,
      kind: "station",
      x,
      y: -radius - 70,
      baseX: x,
      targetY: random(145, Math.min(height * 0.38, 290)),
      radius,
      hp: maxHp,
      maxHp,
      shield: defense.shield,
      shieldMax: defense.shield,
      armor: defense.armor,
      defense: defense.defense,
      fireClock: random(0.4, 1.2),
      fireDelay: random(2.7, 3.7),
      phase: random(0, TAU),
      rotation: random(0, TAU),
      life: random(25, 34),
      flash: 0,
      shieldFlash: 0,
      score: 3200,
    });
    showUpgradeToast(`ORBITAL STATION · ${defense.defense.toUpperCase()}`, "HEAVY HOSTILE CONTACT");
  }

  function fireEnemyWeapon(hostile) {
    const isStation = hostile.kind === "station";
    const count = isStation ? (getWave() >= 4 ? 3 : 2) : 1;
    const speed = isStation ? 205 : hostile.type.id === "scout" ? 255 : 225;
    const baseAngle = Math.atan2(ship.y - hostile.y, ship.x - hostile.x);
    for (let i = 0; i < count; i += 1) {
      const ratio = count === 1 ? 0 : i / (count - 1) - 0.5;
      const angle = baseAngle + ratio * (isStation ? 0.2 : 0.08);
      enemyProjectiles.push({
        x: hostile.x + Math.cos(angle) * hostile.radius * 0.45,
        y: hostile.y + Math.sin(angle) * hostile.radius * 0.45,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: isStation ? 7 : 5,
        damage: isStation ? 8 : hostile.type.id === "gunship" ? 11 : hostile.type.id === "raider" ? 9 : 7,
        life: 5.5,
        phase: random(0, TAU),
        stationBolt: isStation,
      });
    }
    createSparks(hostile.x, hostile.y + hostile.radius * 0.35, isStation ? 7 : 4, isStation ? "#ffb548" : hostile.type.color);
    playTone("enemy");
  }

  function damageHostile(hostile, amount, projectileType) {
    let remaining = amount;
    if (hostile.shield > 0) {
      const absorbed = Math.min(hostile.shield, remaining);
      hostile.shield -= absorbed;
      remaining -= absorbed;
      hostile.shieldFlash = 0.18;
      createSparks(hostile.x, hostile.y, 5, "#5ee8ff");
      playTone("shield");
    }
    if (remaining > 0) {
      hostile.hp -= remaining * (1 - hostile.armor);
      hostile.flash = 0.1;
      createSparks(hostile.x, hostile.y, projectileType === "missile" ? 11 : 5, hostile.kind === "station" ? "#ffb548" : hostile.type.color);
    }
    if (hostile.hp <= 0) destroyHostile(hostile);
  }

  function destroyHostile(hostile) {
    const collection = hostile.kind === "station" ? spaceStations : alienShips;
    const index = collection.indexOf(hostile);
    if (index === -1) return;
    hostile.alive = false;
    collection.splice(index, 1);
    score += hostile.score;
    createExplosion(hostile.x, hostile.y, hostile.radius * 1.2, hostile.kind === "station" ? 2.5 : 1.5);
    shockwaves.push({ x: hostile.x, y: hostile.y, radius: 4, maxRadius: hostile.radius * 2, life: 0.42, maxLife: 0.42, color: hostile.kind === "station" ? "#ffb548" : hostile.type.color });
    screenShake = Math.max(screenShake, hostile.kind === "station" ? 10 : 5);
    if (Math.random() < (hostile.kind === "station" ? 0.55 : 0.16)) spawnUpgrade(hostile.x, hostile.y);
    playTone("explosion");
  }

  function updateHostile(hostile, dt) {
    hostile.phase += dt;
    hostile.flash = Math.max(0, hostile.flash - dt);
    hostile.shieldFlash = Math.max(0, hostile.shieldFlash - dt);
    if (hostile.kind === "station") hostile.rotation += dt * 0.24;
    const entrySpeed = hostile.kind === "station" ? 28 : hostile.type.speed;
    if (hostile.y < hostile.targetY) {
      hostile.y = Math.min(hostile.targetY, hostile.y + entrySpeed * dt);
    } else {
      hostile.life -= dt;
      const range = hostile.kind === "station" ? Math.min(70, width * 0.06) : Math.min(165, width * 0.15);
      const frequency = hostile.kind === "station" ? 0.32 : 0.75 + hostile.type.speed * 0.002;
      hostile.x = clamp(hostile.baseX + Math.sin(hostile.phase * frequency) * range, hostile.radius + 12, width - hostile.radius - 12);
      if (hostile.life <= 0) hostile.y += (hostile.kind === "station" ? 38 : 105) * dt;
    }
    hostile.fireClock += dt;
    if (hostile.life > 0 && hostile.y > 70 && hostile.fireClock >= hostile.fireDelay) {
      hostile.fireClock = 0;
      hostile.fireDelay *= random(0.92, 1.08);
      fireEnemyWeapon(hostile);
    }
  }

  function acquireMissileTarget(projectile) {
    let target = null;
    let nearest = Infinity;
    const consider = (candidate) => {
      if (!candidate.alive || candidate.y >= projectile.y + 20) return;
      const candidateDistance = distanceSq(projectile, candidate);
      if (candidateDistance < nearest) {
        nearest = candidateDistance;
        target = candidate;
      }
    };
    for (const asteroid of asteroids) consider(asteroid);
    for (const enemy of alienShips) consider(enemy);
    for (const station of spaceStations) consider(station);
    return target;
  }

  function update(dt, now) {
    if (state === "paused" || state === "config" || state === "options") return;
    updateStars(dt);
    if (state !== "running") return;

    elapsed += dt;
    if (mission === 1) {
      updateSolarMission(dt);
      if (state !== "running") return;
    }
    timeSinceDamage += dt;
    ship.invulnerable = Math.max(0, ship.invulnerable - dt);
    if (upgrades.regeneration > 0 && timeSinceDamage > 3.5 && health < maxHealth) {
      health = Math.min(maxHealth, health + (0.5 + upgrades.regeneration * 0.65) * dt);
    }
    if (mission === 2 && settings.shootingStars) shootingStarClock += dt;
    if (mission === 2 && settings.shootingStars && shootingStarClock >= nextShootingStar) {
      shootingStarClock = 0;
      nextShootingStar = random(7, 13);
      spawnShootingStar();
    }
    if (mission === 2 && settings.planets) planetClock += dt;
    if (mission === 2 && settings.planets && planetClock >= nextPlanet) {
      planetClock = 0;
      nextPlanet = random(27, 44);
      spawnPlanet();
    }
    if (mission === 2 && settings.alienShips) alienClock += dt;
    if (mission === 2 && settings.alienShips && alienClock >= nextAlien) {
      alienClock = 0;
      nextAlien = random(Math.max(7.5, 12.5 - getWave() * 0.35), Math.max(12, 19 - getWave() * 0.3));
      spawnAlienShip();
    }
    if (mission === 2 && settings.spaceStations) stationClock += dt;
    if (mission === 2 && settings.spaceStations && stationClock >= nextStation) {
      stationClock = 0;
      nextStation = random(38, 62);
      spawnSpaceStation();
    }
    const wave = getWave();
    const spawnDelay = Math.max(0.48, 1.25 - (wave - 1) * 0.05);
    if (mission === 2 && settings.asteroids) spawnClock += dt;
    if (mission === 2 && settings.asteroids && spawnClock >= spawnDelay) {
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
    const effectiveSpeed = ship.speed + upgrades.engine * 48;
    const response = 1 - Math.exp(-dt * (13 + upgrades.maneuver * 3.2));
    ship.vx += (dx * effectiveSpeed - ship.vx) * response;
    ship.vy += (dy * effectiveSpeed - ship.vy) * response;
    if (Math.abs(dx) < 0.02) ship.vx *= Math.pow(0.02, dt);
    if (Math.abs(dy) < 0.02) ship.vy *= Math.pow(0.02, dt);
    const shipHalfWidth = 31 + upgrades.wideShot * 3 + upgrades.armor * 1.5 + upgrades.engine;
    ship.x = clamp(ship.x + ship.vx * dt, shipHalfWidth + 8, width - shipHalfWidth - 8);
    ship.y = clamp(ship.y + ship.vy * dt, 104 + 34, height - 35);
    ship.tilt += (clamp(ship.vx / effectiveSpeed, -1, 1) * (0.32 + upgrades.maneuver * 0.025) - ship.tilt) * response;

    if (keys.has("Space") || mobileFiring) fire(now);

    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = projectiles[i];
      projectile.life -= dt;
      if (projectile.type === "missile") {
        projectile.targetClock -= dt;
        let target = projectile.target;
        if (target && (!target.alive || target.y >= projectile.y + 20)) target = null;
        if (!target && projectile.targetClock <= 0) {
          target = acquireMissileTarget(projectile);
          projectile.targetClock = 0.12;
        }
        projectile.target = target;
        if (target) {
          const angle = Math.atan2(target.y - projectile.y, target.x - projectile.x);
          projectile.vx += (Math.cos(angle) * 390 - projectile.vx) * Math.min(1, dt * 3.4);
          projectile.vy += (Math.sin(angle) * 390 - projectile.vy) * Math.min(1, dt * 3.4);
        }
        projectile.trailClock += dt;
        if (projectile.trailClock > 0.06 && particles.length < 650) {
          projectile.trailClock = 0;
          particles.push({
            x: projectile.x,
            y: projectile.y + 7,
            vx: random(-12, 12),
            vy: random(40, 85),
            life: 0.22,
            maxLife: 0.22,
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
      let projectileRemoved = false;
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
            projectileRemoved = true;
            break;
          }
        }
      }
      if (projectileRemoved) continue;
      for (const hostile of [...alienShips, ...spaceStations]) {
        if (projectile.hitIds.has(hostile.id)) continue;
        const hitRadius = projectile.radius + hostile.radius * 0.76;
        if (distanceSq(projectile, hostile) <= hitRadius * hitRadius) {
          projectile.hitIds.add(hostile.id);
          projectile.pierce -= 1;
          damageHostile(hostile, projectile.damage, projectile.type);
          if (projectile.type === "missile") {
            shockwaves.push({ x: projectile.x, y: projectile.y, radius: 3, maxRadius: 74, life: 0.32, maxLife: 0.32, color: "#ff8545" });
          }
          if (projectile.pierce <= 0) {
            projectiles.splice(i, 1);
            projectileRemoved = true;
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

    for (const planet of [...planets]) {
      planet.y += planet.vy * dt;
      planet.rotation += planet.rotationSpeed * dt;
      planet.phase += dt;
      const collisionRadius = planet.radius * 0.82 + ship.radius;
      if (distanceSq(planet, ship) <= collisionRadius * collisionRadius) {
        createExplosion(ship.x, ship.y, 62, 2.6);
        screenShake = 18;
        endGame("PLANETARY IMPACT");
        return;
      }
      if (planet.y - planet.radius > height + 40) planets.splice(planets.indexOf(planet), 1);
    }

    for (const planet of [...solarPlanets]) {
      planet.y += planet.vy * dt;
      planet.rotation += planet.rotationSpeed * dt;
      planet.phase += dt;
      if (planet.collision) {
        const collisionRadius = planet.radius * 0.82 + ship.radius;
        if (distanceSq(planet, ship) <= collisionRadius * collisionRadius) {
          createExplosion(ship.x, ship.y, 62, 2.6);
          screenShake = 18;
          endGame(`PLANETARY IMPACT · ${planet.type.name.toUpperCase()}`);
          return;
        }
      }
      if (planet.y - planet.radius > height + 120) solarPlanets.splice(solarPlanets.indexOf(planet), 1);
    }

    for (const enemy of [...alienShips]) {
      updateHostile(enemy, dt);
      if (enemy.y - enemy.radius > height + 70) alienShips.splice(alienShips.indexOf(enemy), 1);
    }
    for (const station of [...spaceStations]) {
      updateHostile(station, dt);
      if (station.y - station.radius > height + 100) spaceStations.splice(spaceStations.indexOf(station), 1);
    }

    for (let i = enemyProjectiles.length - 1; i >= 0; i -= 1) {
      const bolt = enemyProjectiles[i];
      bolt.life -= dt;
      bolt.phase += dt * 12;
      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;
      if (Math.random() < dt * 18) {
        particles.push({
          x: bolt.x + random(-2, 2),
          y: bolt.y + random(-2, 2),
          vx: -bolt.vx * 0.08 + random(-12, 12),
          vy: -bolt.vy * 0.08 + random(-12, 12),
          life: 0.18,
          maxLife: 0.18,
          size: random(1, 2.4),
          color: bolt.stationBolt ? "#ffb548" : "#ff4f9c",
          drag: 0.94,
        });
      }
      const collisionRadius = bolt.radius + ship.radius * 0.72;
      if (distanceSq(bolt, ship) <= collisionRadius * collisionRadius) {
        enemyProjectiles.splice(i, 1);
        createSparks(bolt.x, bolt.y, 9, bolt.stationBolt ? "#ffb548" : "#ff4f9c");
        damageShip(bolt.damage, bolt.x, bolt.y);
        continue;
      }
      if (bolt.life <= 0 || bolt.y < -60 || bolt.y > height + 60 || bolt.x < -60 || bolt.x > width + 60) enemyProjectiles.splice(i, 1);
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

    for (let i = resourceDrops.length - 1; i >= 0; i -= 1) {
      const drop = resourceDrops[i];
      drop.life -= dt;
      drop.phase += dt * 2.6;
      const dist = Math.sqrt(distanceSq(drop, ship));
      if (dist < 165) {
        const attraction = 290 * (1 - dist / 165) + 95;
        drop.vx += ((ship.x - drop.x) / Math.max(1, dist)) * attraction * dt;
        drop.vy += ((ship.y - drop.y) / Math.max(1, dist)) * attraction * dt;
      }
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      drop.vx *= Math.pow(0.97, dt * 60);
      if (dist <= drop.radius + ship.radius + 5) {
        resourceDrops.splice(i, 1);
        collectResource(drop);
        continue;
      }
      if (drop.life <= 0 || drop.y - drop.radius > height) resourceDrops.splice(i, 1);
    }

    for (let i = shootingStars.length - 1; i >= 0; i -= 1) {
      const star = shootingStars[i];
      star.life -= dt;
      star.phase += dt * 9;
      star.x += star.vx * dt;
      star.y += star.vy * dt;
      const collisionRadius = star.radius + ship.radius;
      if (distanceSq(star, ship) <= collisionRadius * collisionRadius) {
        shootingStars.splice(i, 1);
        createExplosion(star.x, star.y, 24, 1.1);
        damageShip(24, star.x, star.y);
        continue;
      }
      if (star.life <= 0 || star.y > height + 100 || star.x < -140 || star.x > width + 140) shootingStars.splice(i, 1);
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

  function updateMissionHud() {
    if (mission === 1) {
      ui.missionNumber.textContent = "MISSION 01 · SOLAR ESCAPE";
      const objective = missionElapsed < 7
        ? "CLEAR EARTH ORBIT"
        : missionElapsed < 18
          ? "PASS THE ORBIT OF MARS"
          : missionElapsed < 43
            ? "SURVIVE THE ASTEROID BELT"
            : missionElapsed < 61
              ? "NAVIGATE JUPITER AND SATURN"
              : missionElapsed < 78
                ? "CROSS THE OUTER PLANETS"
                : "REACH THE HELIOPAUSE";
      ui.missionObjective.textContent = objective;
      ui.missionProgress.style.width = `${clamp(missionElapsed / SOLAR_MISSION_DURATION, 0, 1) * 100}%`;
    } else {
      ui.missionNumber.textContent = "MISSION 02 · ENDLESS";
      ui.missionObjective.textContent = `UNCHARTED DEEP SPACE · WAVE ${String(getWave()).padStart(2, "0")}`;
      ui.missionProgress.style.width = "100%";
    }
  }

  function updateHud(forceRadar = false) {
    ui.score.textContent = padScore(score);
    ui.highScore.textContent = padScore(Math.max(highScore, score));
    if (mission === 1) {
      const leg = missionElapsed < 18 ? 1 : missionElapsed < 43 ? 2 : missionElapsed < 61 ? 3 : missionElapsed < 78 ? 4 : 5;
      ui.waveLabel.textContent = "LEG";
      ui.wave.textContent = String(leg).padStart(2, "0");
    } else {
      ui.waveLabel.textContent = "WAVE";
      ui.wave.textContent = String(getWave()).padStart(2, "0");
    }
    const healthRatio = health / maxHealth;
    ui.health.textContent = maxHealth > 100 ? `${Math.round(health)} / ${maxHealth}` : `${Math.round(healthRatio * 100)}%`;
    ui.healthBar.style.width = `${healthRatio * 100}%`;
    const healthColor = healthRatio > 0.55 ? "#43ffc0" : healthRatio > 0.25 ? "#ffb347" : "#ff3f57";
    ui.health.style.color = healthColor;
    ui.healthBar.style.background = healthColor;
    ui.shield.textContent = shieldMax > 0 ? `${Math.round(shield)} / ${shieldMax}` : "OFFLINE";
    ui.shieldBar.style.width = `${shieldMax > 0 ? (shield / shieldMax) * 100 : 0}%`;
    const contacts = asteroids.length + shootingStars.length + planets.length + solarPlanets.length + alienShips.length + spaceStations.length;
    ui.threats.textContent = `${contacts} ${contacts === 1 ? "CONTACT" : "CONTACTS"}`;
    updateMissionHud();
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
    for (const star of shootingStars) {
      const dot = document.createElement("i");
      dot.className = "radar-dot shooting-star-dot";
      dot.style.left = `${clamp((star.x / width) * 60 + 4, 3, 64)}px`;
      dot.style.top = `${clamp((star.y / height) * 54 + 4, 3, 57)}px`;
      ui.radar.appendChild(dot);
    }
    for (const planet of planets) {
      const dot = document.createElement("i");
      dot.className = "radar-dot planet-dot";
      dot.style.left = `${clamp((planet.x / width) * 60 + 4, 3, 64)}px`;
      dot.style.top = `${clamp((planet.y / height) * 54 + 4, 3, 57)}px`;
      ui.radar.appendChild(dot);
    }
    for (const planet of solarPlanets) {
      const dot = document.createElement("i");
      dot.className = "radar-dot planet-dot solar-dot";
      dot.style.left = `${clamp((planet.x / width) * 60 + 4, 3, 64)}px`;
      dot.style.top = `${clamp((planet.y / height) * 54 + 4, 3, 57)}px`;
      ui.radar.appendChild(dot);
    }
    for (const hostile of [...alienShips, ...spaceStations]) {
      const dot = document.createElement("i");
      dot.className = `radar-dot hostile-dot${hostile.kind === "station" ? " station-dot" : ""}`;
      dot.style.left = `${clamp((hostile.x / width) * 60 + 4, 3, 64)}px`;
      dot.style.top = `${clamp((hostile.y / height) * 54 + 4, 3, 57)}px`;
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
    if (mission === 1) drawSolarBackdrop();

    const shakeX = settings.screenShake && screenShake ? random(-screenShake, screenShake) : 0;
    const shakeY = settings.screenShake && screenShake ? random(-screenShake, screenShake) : 0;
    ctx.translate(shakeX, shakeY);
    drawGuideLines();
    for (const planet of solarPlanets) drawSolarPlanet(planet);
    for (const planet of planets) drawPlanet(planet);
    for (const star of shootingStars) drawShootingStar(star);
    for (const asteroid of asteroids) drawAsteroid(asteroid);
    for (const station of spaceStations) drawSpaceStation(station);
    for (const enemy of alienShips) drawAlienShip(enemy);
    for (const drop of resourceDrops) drawResourceDrop(drop);
    for (const pickup of powerUps) drawPowerUp(pickup);
    for (const projectile of enemyProjectiles) drawEnemyProjectile(projectile);
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

  function drawSolarBackdrop() {
    const departure = clamp(1 - missionElapsed / 22, 0, 1);
    if (departure <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(width * 0.5, height * 1.08, 0, width * 0.5, height * 1.08, height * 0.72);
    glow.addColorStop(0, `rgba(255, 224, 160, ${0.2 * departure})`);
    glow.addColorStop(0.34, `rgba(82, 169, 255, ${0.11 * departure})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
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

  function drawSolarPlanet(planet) {
    const { type, radius: r } = planet;
    ctx.save();
    ctx.translate(planet.x, planet.y);

    if (type.id === "earth") {
      const moonAngle = planet.phase * 0.16 - 0.8;
      const moonX = Math.cos(moonAngle) * r * 1.28;
      const moonY = Math.sin(moonAngle) * r * 0.34 - r * 0.14;
      const moon = ctx.createRadialGradient(moonX - r * 0.045, moonY - r * 0.045, 0, moonX, moonY, r * 0.085);
      moon.addColorStop(0, "#f0f1e9");
      moon.addColorStop(0.58, "#8f969e");
      moon.addColorStop(1, "#242b35");
      ctx.fillStyle = moon;
      ctx.beginPath();
      ctx.arc(moonX, moonY, r * 0.085, 0, TAU);
      ctx.fill();
    }

    const ringTilt = type.id === "uranus" ? 1.18 : -0.2;
    if (planet.rings) {
      ctx.save();
      ctx.rotate(ringTilt);
      ctx.strokeStyle = type.id === "saturn" ? "rgba(231, 204, 145, 0.46)" : "rgba(173, 235, 241, 0.32)";
      ctx.lineWidth = Math.max(5, r * 0.1);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.72, r * 0.38, 0, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = "rgba(84, 71, 63, 0.28)";
      ctx.lineWidth = Math.max(2, r * 0.025);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.46, r * 0.3, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    ctx.rotate(planet.rotation);
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.clip();
    const surface = ctx.createRadialGradient(-r * 0.34, -r * 0.38, r * 0.04, r * 0.08, r * 0.06, r * 1.18);
    surface.addColorStop(0, type.colors[1]);
    surface.addColorStop(0.58, type.colors[0]);
    surface.addColorStop(1, "#030713");
    ctx.fillStyle = surface;
    ctx.fillRect(-r, -r, r * 2, r * 2);

    if (type.id === "earth") {
      ctx.fillStyle = "#3aa362";
      const continents = [
        [-0.35, -0.34, 0.34, 0.24, -0.25],
        [0.3, -0.08, 0.26, 0.38, 0.38],
        [-0.08, 0.42, 0.2, 0.18, 0.12],
        [0.58, 0.35, 0.14, 0.1, -0.2],
      ];
      for (const [x, y, rx, ry, rotation] of continents) {
        ctx.beginPath();
        ctx.ellipse(x * r, y * r, rx * r, ry * r, rotation, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(238, 252, 255, 0.92)";
      ctx.fillRect(-r, -r, r * 2, r * 0.08);
      ctx.fillRect(-r, r * 0.91, r * 2, r * 0.09);
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(2, r * 0.025);
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.arc(-r * 0.05, i * r * 0.28, r * 0.62, 0.2, 2.72);
        ctx.stroke();
      }
    } else if (type.id === "mars") {
      const craters = [[-0.42, -0.28, 0.13], [0.3, -0.44, 0.09], [0.46, 0.18, 0.15], [-0.12, 0.38, 0.11], [-0.55, 0.4, 0.07]];
      for (const [x, y, size] of craters) {
        ctx.fillStyle = "rgba(75, 27, 23, 0.45)";
        ctx.strokeStyle = "rgba(241, 150, 103, 0.28)";
        ctx.lineWidth = Math.max(1, r * 0.012);
        ctx.beginPath();
        ctx.ellipse(x * r, y * r, size * r, size * r * 0.66, 0.3, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(245, 231, 211, 0.72)";
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.91, r * 0.34, r * 0.1, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(88, 31, 26, 0.55)";
      ctx.lineWidth = Math.max(2, r * 0.035);
      ctx.beginPath();
      ctx.moveTo(-r * 0.75, r * 0.08);
      ctx.bezierCurveTo(-r * 0.2, r * 0.26, r * 0.24, -r * 0.06, r * 0.78, r * 0.16);
      ctx.stroke();
    } else if (type.id === "jupiter" || type.id === "saturn") {
      for (let i = -7; i <= 7; i += 1) {
        const y = i * r * 0.13;
        ctx.globalAlpha = 0.28 + (i % 2 === 0 ? 0.18 : 0);
        ctx.strokeStyle = i % 3 === 0 ? type.colors[2] : i % 2 === 0 ? type.colors[1] : "#fff1d2";
        ctx.lineWidth = r * (type.id === "jupiter" && i % 3 === 0 ? 0.09 : 0.052);
        ctx.beginPath();
        ctx.moveTo(-r * 1.05, y);
        ctx.bezierCurveTo(-r * 0.35, y + r * 0.06, r * 0.38, y - r * 0.05, r * 1.05, y);
        ctx.stroke();
      }
      if (type.id === "jupiter") {
        ctx.globalAlpha = 0.66;
        ctx.fillStyle = "#a74637";
        ctx.beginPath();
        ctx.ellipse(r * 0.34, r * 0.23, r * 0.2, r * 0.09, -0.08, 0, TAU);
        ctx.fill();
      }
    } else if (type.id === "uranus") {
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "#e5ffff";
      ctx.lineWidth = r * 0.045;
      for (let i = -4; i <= 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-r, i * r * 0.2);
        ctx.lineTo(r, i * r * 0.2 + r * 0.05);
        ctx.stroke();
      }
    } else if (type.id === "neptune") {
      ctx.globalAlpha = 0.34;
      ctx.strokeStyle = "#7db9ff";
      ctx.lineWidth = r * 0.055;
      for (let i = -4; i <= 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-r, i * r * 0.19);
        ctx.bezierCurveTo(-r * 0.3, i * r * 0.19 + r * 0.05, r * 0.4, i * r * 0.19 - r * 0.04, r, i * r * 0.19);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(20, 34, 104, 0.78)";
      ctx.beginPath();
      ctx.ellipse(r * 0.3, r * 0.2, r * 0.17, r * 0.08, -0.12, 0, TAU);
      ctx.fill();
    }

    const limb = ctx.createRadialGradient(-r * 0.35, -r * 0.38, r * 0.1, r * 0.34, r * 0.32, r * 1.2);
    limb.addColorStop(0, "rgba(255,255,255,0.15)");
    limb.addColorStop(0.58, "rgba(0,0,0,0.02)");
    limb.addColorStop(1, "rgba(0,0,0,0.86)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = limb;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();

    ctx.strokeStyle = type.atmosphere;
    ctx.lineWidth = Math.max(2, r * 0.022);
    ctx.globalAlpha = 0.72;
    ctx.shadowBlur = Math.min(24, r * 0.16);
    ctx.shadowColor = type.atmosphere;
    ctx.beginPath();
    ctx.arc(0, 0, r + 1, 0, TAU);
    ctx.stroke();

    if (planet.rings) {
      ctx.save();
      ctx.rotate(ringTilt - planet.rotation);
      ctx.globalAlpha = 0.72;
      ctx.strokeStyle = type.id === "saturn" ? "#e6ca8f" : "#b6edf2";
      ctx.lineWidth = Math.max(4, r * 0.06);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.72, r * 0.38, 0, 0.03, Math.PI - 0.03);
      ctx.stroke();
      ctx.restore();
    }

    ctx.rotate(-planet.rotation);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#dffaff";
    ctx.font = "800 8px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(planet.label, 0, -r - 14);
    ctx.restore();
  }

  function drawPlanet(planet) {
    const { type, radius } = planet;
    ctx.save();
    ctx.translate(planet.x, planet.y);
    ctx.rotate(planet.rotation);

    if (planet.hasRings) {
      ctx.save();
      ctx.rotate(-0.22);
      ctx.strokeStyle = "rgba(234, 205, 161, 0.34)";
      ctx.lineWidth = Math.max(4, radius * 0.09);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.48, radius * 0.36, 0, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = "rgba(121, 88, 79, 0.28)";
      ctx.lineWidth = Math.max(2, radius * 0.035);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.68, radius * 0.42, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.clip();

    const surface = ctx.createRadialGradient(-radius * 0.34, -radius * 0.38, radius * 0.06, 0, 0, radius * 1.15);
    surface.addColorStop(0, type.colors[1] || type.colors[0]);
    surface.addColorStop(0.58, type.colors[0]);
    surface.addColorStop(1, "#070b13");
    ctx.fillStyle = surface;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);

    if (type.style === "gas") {
      for (let i = -6; i <= 6; i += 1) {
        const y = i * radius * 0.145 + Math.sin(planet.phase * 0.16 + i) * radius * 0.025;
        ctx.strokeStyle = i % 3 === 0 ? type.colors[2] : i % 2 === 0 ? type.colors[1] : "rgba(255,255,255,0.13)";
        ctx.globalAlpha = 0.38 + (i % 2 === 0 ? 0.15 : 0);
        ctx.lineWidth = radius * (i % 3 === 0 ? 0.09 : 0.055);
        ctx.beginPath();
        ctx.moveTo(-radius * 1.05, y);
        ctx.bezierCurveTo(-radius * 0.4, y + radius * 0.08, radius * 0.42, y - radius * 0.07, radius * 1.05, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.56;
      ctx.fillStyle = type.colors[2];
      ctx.beginPath();
      ctx.ellipse(radius * 0.24, radius * 0.2, radius * 0.22, radius * 0.1, -0.12, 0, TAU);
      ctx.fill();
    } else {
      for (const feature of planet.features) {
        ctx.save();
        ctx.translate(feature.x, feature.y);
        ctx.rotate(feature.rotation);
        ctx.globalAlpha = type.style === "icy" ? 0.42 : 0.58;
        ctx.fillStyle = type.colors[feature.tone] || type.colors[1];
        ctx.beginPath();
        ctx.ellipse(0, 0, feature.r * 1.25, feature.r * 0.7, 0, 0, TAU);
        ctx.fill();
        if (type.style === "rocky") {
          ctx.strokeStyle = "rgba(20, 15, 16, 0.48)";
          ctx.lineWidth = Math.max(1, feature.r * 0.14);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    if (["habitable", "forest", "ocean"].includes(type.style)) {
      ctx.globalAlpha = 0.38;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(2, radius * 0.035);
      for (let i = -2; i <= 2; i += 1) {
        const y = i * radius * 0.29 + Math.sin(planet.phase * 0.1 + i) * radius * 0.03;
        ctx.beginPath();
        ctx.arc(-radius * 0.12, y, radius * 0.58, 0.18, 2.72);
        ctx.stroke();
      }
    }

    if (type.style === "icy") {
      ctx.strokeStyle = "rgba(50, 139, 180, 0.55)";
      ctx.lineWidth = Math.max(1, radius * 0.018);
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-radius * 0.8, -radius * 0.55 + i * radius * 0.28);
        ctx.lineTo(-radius * 0.18, -radius * 0.28 + i * radius * 0.2);
        ctx.lineTo(radius * 0.66, -radius * 0.5 + i * radius * 0.3);
        ctx.stroke();
      }
    }

    if (type.style === "volcanic") {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(255, 82, 31, 0.82)";
      ctx.shadowColor = "#ff351d";
      ctx.shadowBlur = radius * 0.1;
      ctx.lineWidth = Math.max(2, radius * 0.025);
      for (const feature of planet.features.slice(0, 7)) {
        ctx.beginPath();
        ctx.moveTo(feature.x * 0.3, feature.y * 0.3);
        ctx.lineTo(feature.x, feature.y);
        ctx.lineTo(feature.x + Math.cos(feature.rotation) * feature.r, feature.y + Math.sin(feature.rotation) * feature.r);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    const limb = ctx.createRadialGradient(-radius * 0.32, -radius * 0.36, radius * 0.18, radius * 0.36, radius * 0.35, radius * 1.2);
    limb.addColorStop(0, "rgba(255,255,255,0.12)");
    limb.addColorStop(0.56, "rgba(0,0,0,0.02)");
    limb.addColorStop(1, "rgba(0,0,0,0.82)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = limb;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.restore();

    ctx.strokeStyle = type.atmosphere;
    ctx.globalAlpha = 0.66;
    ctx.lineWidth = Math.max(2, radius * 0.025);
    ctx.shadowBlur = Math.min(24, radius * 0.18);
    ctx.shadowColor = type.atmosphere;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 1, 0, TAU);
    ctx.stroke();

    if (planet.hasRings) {
      ctx.save();
      ctx.rotate(-0.22);
      ctx.globalAlpha = 0.72;
      ctx.strokeStyle = "#d7b98d";
      ctx.lineWidth = Math.max(3, radius * 0.055);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.48, radius * 0.36, 0, 0.03, Math.PI - 0.03);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawHostileStatus(hostile) {
    const width = hostile.radius * 1.55;
    const y = -hostile.radius - 12;
    ctx.save();
    ctx.rotate(hostile.kind === "station" ? -hostile.rotation : 0);
    ctx.fillStyle = "rgba(1, 5, 12, 0.82)";
    ctx.fillRect(-width / 2, y, width, 4);
    ctx.fillStyle = hostile.kind === "station" ? "#ffb548" : hostile.type.color;
    ctx.fillRect(-width / 2, y, width * clamp(hostile.hp / hostile.maxHp, 0, 1), 4);
    if (hostile.shieldMax > 0) {
      ctx.fillStyle = "rgba(1, 5, 12, 0.82)";
      ctx.fillRect(-width / 2, y - 6, width, 3);
      ctx.fillStyle = "#59e6ff";
      ctx.fillRect(-width / 2, y - 6, width * clamp(hostile.shield / hostile.shieldMax, 0, 1), 3);
    }
    ctx.font = "700 7px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = hostile.armor > 0 ? "#dbe5ed" : "rgba(255,255,255,.62)";
    ctx.fillText(hostile.defense === "none" ? "UNPROTECTED" : hostile.defense.toUpperCase(), 0, y - (hostile.shieldMax > 0 ? 10 : 4));
    ctx.restore();
  }

  function drawAlienShip(enemy) {
    const r = enemy.radius;
    const color = enemy.type.color;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(Math.sin(enemy.phase * 1.4) * 0.06);

    if (enemy.shieldMax > 0 && enemy.shield > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = enemy.shieldFlash > 0 ? 0.92 : 0.2 + Math.sin(enemy.phase * 4) * 0.05;
      ctx.strokeStyle = "#5de9ff";
      ctx.fillStyle = "rgba(66, 205, 255, 0.05)";
      ctx.lineWidth = enemy.shieldFlash > 0 ? 3 : 1.2;
      ctx.shadowBlur = enemy.shieldFlash > 0 ? 26 : 12;
      ctx.shadowColor = "#5de9ff";
      ctx.beginPath();
      ctx.ellipse(0, 1, r * 1.15, r * 1.02, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.shadowBlur = 18;
    ctx.shadowColor = color;
    ctx.strokeStyle = enemy.flash > 0 ? "#ffffff" : color;
    ctx.lineWidth = 1.5;
    const hull = ctx.createLinearGradient(0, -r, 0, r);
    hull.addColorStop(0, "#2a193d");
    hull.addColorStop(0.52, enemy.flash > 0 ? "#ffffff" : "#67427f");
    hull.addColorStop(1, "#110b1b");
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.lineTo(r * 0.34, r * 0.36);
    ctx.lineTo(r * 1.06, r * 0.12);
    ctx.lineTo(r * 0.72, -r * 0.2);
    ctx.lineTo(r * 0.9, -r * 0.72);
    ctx.lineTo(r * 0.22, -r * 0.46);
    ctx.lineTo(0, -r * 0.82);
    ctx.lineTo(-r * 0.22, -r * 0.46);
    ctx.lineTo(-r * 0.9, -r * 0.72);
    ctx.lineTo(-r * 0.72, -r * 0.2);
    ctx.lineTo(-r * 1.06, r * 0.12);
    ctx.lineTo(-r * 0.34, r * 0.36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#160a24";
    ctx.strokeStyle = "rgba(255,255,255,.2)";
    ctx.beginPath();
    ctx.moveTo(0, r * 0.72);
    ctx.lineTo(r * 0.2, -r * 0.22);
    ctx.lineTo(0, -r * 0.6);
    ctx.lineTo(-r * 0.2, -r * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const core = ctx.createRadialGradient(-r * 0.08, 0, 0, 0, r * 0.06, r * 0.32);
    core.addColorStop(0, "#ffffff");
    core.addColorStop(0.3, color);
    core.addColorStop(1, "rgba(255, 44, 153, 0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, r * 0.08, r * 0.32, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    if (enemy.armor > 0) {
      ctx.fillStyle = "#aab5c4";
      ctx.strokeStyle = "#eff8ff";
      ctx.lineWidth = 1;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * r * 0.38, r * 0.26);
        ctx.lineTo(side * r * 0.82, 0);
        ctx.lineTo(side * r * 0.7, -r * 0.23);
        ctx.lineTo(side * r * 0.31, -r * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;
    for (const x of [-r * 0.33, r * 0.33]) {
      ctx.beginPath();
      ctx.ellipse(x, -r * 0.48, r * 0.09, r * (0.22 + Math.sin(enemy.phase * 9) * 0.035), 0, 0, TAU);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    drawHostileStatus(enemy);
    ctx.restore();
  }

  function drawSpaceStation(station) {
    const r = station.radius;
    ctx.save();
    ctx.translate(station.x, station.y);

    if (station.shieldMax > 0 && station.shield > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = station.shieldFlash > 0 ? 0.95 : 0.2 + Math.sin(station.phase * 3) * 0.04;
      ctx.strokeStyle = "#5de9ff";
      ctx.fillStyle = "rgba(66, 205, 255, 0.045)";
      ctx.lineWidth = station.shieldFlash > 0 ? 4 : 1.5;
      ctx.shadowBlur = station.shieldFlash > 0 ? 30 : 15;
      ctx.shadowColor = "#5de9ff";
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.18, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.rotate(station.rotation);
    ctx.strokeStyle = station.flash > 0 ? "#ffffff" : "#ffb548";
    ctx.fillStyle = "rgba(50, 31, 42, 0.94)";
    ctx.lineWidth = Math.max(2, r * 0.035);
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#ff7a45";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.76, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.48, 0, TAU);
    ctx.stroke();

    for (let i = 0; i < 6; i += 1) {
      ctx.save();
      ctx.rotate((i / 6) * TAU);
      ctx.fillStyle = station.armor > 0 ? "#aeb9c7" : "#3d2d49";
      ctx.strokeStyle = station.armor > 0 ? "#eef7ff" : "#ff9b59";
      ctx.fillRect(r * 0.34, -r * 0.1, r * 0.62, r * 0.2);
      ctx.strokeRect(r * 0.34, -r * 0.1, r * 0.62, r * 0.2);
      ctx.fillStyle = "#ff6a4a";
      ctx.shadowBlur = 9;
      ctx.shadowColor = "#ff3f57";
      ctx.beginPath();
      ctx.arc(r * 0.94, 0, r * 0.085, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    const core = ctx.createRadialGradient(-r * 0.12, -r * 0.14, 0, 0, 0, r * 0.48);
    core.addColorStop(0, "#ffffff");
    core.addColorStop(0.22, "#ffca6d");
    core.addColorStop(0.58, "#e64b5f");
    core.addColorStop(1, "rgba(70, 8, 35, 0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.48, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(255, 225, 190, 0.65)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.28, 0, TAU);
    ctx.stroke();
    drawHostileStatus(station);
    ctx.restore();
  }

  function drawEnemyProjectile(bolt) {
    ctx.save();
    ctx.translate(bolt.x, bolt.y);
    ctx.rotate(Math.atan2(bolt.vy, bolt.vx));
    ctx.globalCompositeOperation = "lighter";
    const color = bolt.stationBolt ? "#ffb548" : "#ff4f9c";
    ctx.shadowBlur = bolt.stationBolt ? 22 : 16;
    ctx.shadowColor = color;
    const trail = ctx.createLinearGradient(-28, 0, bolt.radius, 0);
    trail.addColorStop(0, "rgba(255, 44, 130, 0)");
    trail.addColorStop(0.65, color);
    trail.addColorStop(1, "#ffffff");
    ctx.strokeStyle = trail;
    ctx.lineWidth = bolt.stationBolt ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(bolt.radius, 0);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, 0, bolt.radius * (0.65 + Math.sin(bolt.phase) * 0.08), 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawShootingStar(star) {
    ctx.save();
    ctx.translate(star.x, star.y);
    ctx.rotate(Math.atan2(star.vy, star.vx));
    ctx.globalCompositeOperation = "lighter";
    const tailLength = 105 + star.radius * 4;
    const tail = ctx.createLinearGradient(-tailLength, 0, star.radius, 0);
    tail.addColorStop(0, "rgba(255, 61, 93, 0)");
    tail.addColorStop(0.55, "rgba(255, 96, 82, 0.22)");
    tail.addColorStop(0.88, "rgba(255, 219, 153, 0.82)");
    tail.addColorStop(1, "#ffffff");
    ctx.strokeStyle = tail;
    ctx.lineWidth = star.radius * 0.75;
    ctx.shadowBlur = 22;
    ctx.shadowColor = "#ff4d59";
    ctx.beginPath();
    ctx.moveTo(-tailLength, 0);
    ctx.lineTo(star.radius, 0);
    ctx.stroke();
    const core = ctx.createRadialGradient(0, 0, 1, 0, 0, star.radius);
    core.addColorStop(0, "#ffffff");
    core.addColorStop(0.35, "#fff0c4");
    core.addColorStop(0.72, "#ff704f");
    core.addColorStop(1, "rgba(255, 54, 92, 0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, star.radius, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawResourceDrop(drop) {
    const resource = resourceCatalog[drop.id];
    const pulse = 1 + Math.sin(drop.phase * 2) * 0.09;
    ctx.save();
    ctx.translate(drop.x, drop.y);
    ctx.rotate(drop.phase);
    ctx.scale(pulse, pulse);
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowBlur = 15;
    ctx.shadowColor = resource.color;
    const crystal = ctx.createLinearGradient(-drop.radius, -drop.radius, drop.radius, drop.radius);
    crystal.addColorStop(0, "#ffffff");
    crystal.addColorStop(0.24, resource.color);
    crystal.addColorStop(1, "rgba(22, 30, 39, 0.82)");
    ctx.fillStyle = crystal;
    ctx.strokeStyle = resource.color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -drop.radius);
    ctx.lineTo(drop.radius * 0.72, -drop.radius * 0.15);
    ctx.lineTo(drop.radius * 0.42, drop.radius);
    ctx.lineTo(-drop.radius * 0.55, drop.radius * 0.72);
    ctx.lineTo(-drop.radius * 0.78, -drop.radius * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.rotate(-drop.phase);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 7px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(resource.symbol, 0, 0);
    ctx.restore();
  }

  function drawAsteroid(asteroid) {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.rotation);
    ctx.shadowBlur = 24;
    ctx.shadowColor = asteroid.flash > 0 ? "rgba(120, 247, 255, .75)" : "rgba(255, 104, 45, .08)";
    const metalRichness = 1 - asteroid.composition.rockRatio;
    const gradient = ctx.createRadialGradient(-asteroid.radius * 0.35, -asteroid.radius * 0.4, 1, 0, 0, asteroid.radius * 1.1);
    gradient.addColorStop(0, asteroid.flash > 0 ? "#c8fdff" : metalRichness > 0.7 ? "#d3dae0" : "#89919a");
    gradient.addColorStop(0.35, asteroid.flash > 0 ? "#6feeff" : metalRichness > 0.7 ? "#78858e" : "#4c535c");
    gradient.addColorStop(1, metalRichness > 0.7 ? "#2d353b" : "#171c23");
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
    for (const patch of asteroid.mineralPatches) {
      const metal = resourceCatalog[patch.id];
      ctx.save();
      ctx.translate(patch.x, patch.y);
      ctx.rotate(patch.rotation);
      ctx.shadowBlur = metal.value >= 4 ? 9 : 4;
      ctx.shadowColor = metal.color;
      const ore = ctx.createRadialGradient(-patch.r * 0.3, -patch.r * 0.3, 0, 0, 0, patch.r);
      ore.addColorStop(0, "#ffffff");
      ore.addColorStop(0.2, metal.color);
      ore.addColorStop(0.72, metal.color);
      ore.addColorStop(1, "rgba(20, 25, 29, 0.55)");
      ctx.fillStyle = ore;
      ctx.strokeStyle = `${metal.color}99`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, patch.r, patch.r * patch.stretch, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.45)";
      ctx.beginPath();
      ctx.moveTo(-patch.r * 0.45, -patch.r * 0.15);
      ctx.lineTo(patch.r * 0.35, patch.r * 0.1);
      ctx.stroke();
      ctx.restore();
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
      engine: "#ff9d4a",
      maneuver: "#46e6ff",
      armor: "#c6d2dc",
      regeneration: "#52ff9b",
      missile: "#ff8345",
      plasma: "#b56cff",
      railgun: "#ffe36e",
    };
    const glyphs = { fireRate: "F", wideShot: "W", shield: "S", engine: "E", maneuver: "T", armor: "A", regeneration: "+", missile: "M", plasma: "P", railgun: "R" };
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

    const totalTier = upgrades.fireRate + upgrades.wideShot + upgrades.shield + upgrades.engine + upgrades.maneuver + upgrades.armor + upgrades.regeneration + upgrades.missile + upgrades.plasma + upgrades.railgun;
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
    const enginePositions = upgrades.fireRate + upgrades.engine >= 2 ? [-13, 0, 13] : [-11, 11];
    for (const engineX of enginePositions) {
      const thrust = state === "running" ? random(18, 28 + upgrades.fireRate * 3 + upgrades.engine * 5) : 12;
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

    // Engine upgrades install larger orange drive vanes around the nacelles.
    for (let i = 0; i < upgrades.engine; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      const vaneX = side * (13 + row * 6);
      ctx.fillStyle = "#3d4650";
      ctx.strokeStyle = "#ffad5d";
      ctx.shadowBlur = 7;
      ctx.shadowColor = "#ff8a45";
      ctx.beginPath();
      ctx.moveTo(vaneX - side * 3, 13);
      ctx.lineTo(vaneX + side * 6, 20 + row * 2);
      ctx.lineTo(vaneX + side * 2, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Manoeuvring upgrades add lateral attitude-control thrusters.
    for (let i = 0; i < upgrades.maneuver; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      const thrusterX = side * (wingSpan - 5 - row * 7);
      const thrusterY = 12 - row * 5;
      ctx.fillStyle = "#c7fbff";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#46e6ff";
      ctx.fillRect(thrusterX - 1.5, thrusterY - 2, 3, 5);
      ctx.strokeStyle = "rgba(70,230,255,.7)";
      ctx.beginPath();
      ctx.moveTo(thrusterX, thrusterY);
      ctx.lineTo(thrusterX + side * 7, thrusterY - 1);
      ctx.stroke();
    }

    // Armour upgrades layer heavy plates over the wing roots and spine.
    for (let i = 0; i < upgrades.armor; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      ctx.fillStyle = "rgba(186, 205, 216, 0.88)";
      ctx.strokeStyle = "rgba(239, 251, 255, 0.86)";
      ctx.shadowBlur = 4;
      ctx.shadowColor = "#b8d5e3";
      ctx.beginPath();
      ctx.moveTo(side * (7 + row * 3), -13 + row * 8);
      ctx.lineTo(side * (17 + row * 4), -2 + row * 7);
      ctx.lineTo(side * (14 + row * 4), 5 + row * 6);
      ctx.lineTo(side * (8 + row * 2), 1 + row * 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Regeneration upgrades route green nanite conduits through the hull.
    for (let i = 0; i < upgrades.regeneration; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      ctx.strokeStyle = "#52ff9b";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#52ff9b";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(side * (3 + row * 3), -4 + row * 5);
      ctx.lineTo(side * (10 + row * 4), 7 + row * 4);
      ctx.lineTo(side * (16 + row * 5), 9 + row * 3);
      ctx.stroke();
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

  function setAudioStatus(message, status = "ready") {
    ui.audioStatus.dataset.state = status;
    ui.audioStatusText.textContent = message;
  }

  function refreshAudioStatus() {
    if (!audioContext) {
      setAudioStatus("AUDIO LOCKED · PRESS ENABLE", "locked");
    } else if (audioContext.state === "suspended") {
      setAudioStatus("BROWSER AUDIO SUSPENDED · PRESS ENABLE", "locked");
    } else if (!settings.music && !settings.soundFx) {
      setAudioStatus("MUSIC AND SOUND FX MUTED", "muted");
    } else if (musicSource && settings.music && state === "running") {
      setAudioStatus(`${mission === 1 ? "SOLAR ESCAPE" : "DEEP SPACE"} SCORE PLAYING`, "playing");
    } else {
      setAudioStatus("AUDIO ENGINE READY", "ready");
    }
  }

  function unlockAudio() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        setAudioStatus("WEB AUDIO NOT SUPPORTED", "muted");
        return null;
      }
      audioContext = new AudioCtx();
      audioMaster = audioContext.createDynamicsCompressor();
      audioMaster.threshold.setValueAtTime(-12, audioContext.currentTime);
      audioMaster.knee.setValueAtTime(18, audioContext.currentTime);
      audioMaster.ratio.setValueAtTime(4, audioContext.currentTime);
      audioMaster.attack.setValueAtTime(0.004, audioContext.currentTime);
      audioMaster.release.setValueAtTime(0.24, audioContext.currentTime);
      musicBus = audioContext.createGain();
      sfxBus = audioContext.createGain();
      musicBus.gain.setValueAtTime(Math.max(0.0001, settings.musicVolume), audioContext.currentTime);
      sfxBus.gain.setValueAtTime(Math.max(0.0001, settings.sfxVolume), audioContext.currentTime);
      musicBus.connect(audioMaster);
      sfxBus.connect(audioMaster);
      audioMaster.connect(audioContext.destination);
    }
    if (audioContext.state === "suspended") {
      const resumed = audioContext.resume();
      if (resumed?.then) {
        resumed.then(() => {
          refreshAudioStatus();
          updateMusicState();
        }).catch(() => setAudioStatus("AUDIO BLOCKED · PRESS ENABLE AGAIN", "locked"));
      }
    }
    refreshAudioStatus();
    return audioContext;
  }

  function renderMusicTrack(trackId) {
    if (!audioContext) return null;
    if (musicBuffers.has(trackId)) return musicBuffers.get(trackId);
    const solar = trackId === "solar";
    const sampleRate = 12000;
    const bpm = solar ? 96 : 74;
    const beat = 60 / bpm;
    const bars = 8;
    const duration = bars * 4 * beat;
    const length = Math.ceil(duration * sampleRate);
    const left = new Float32Array(length);
    const right = new Float32Array(length);
    const sineTable = new Float32Array(4096);
    for (let i = 0; i < sineTable.length; i += 1) sineTable[i] = Math.sin((i / sineTable.length) * TAU);
    const waveAt = (cycles) => sineTable[Math.floor(cycles * sineTable.length) & 4095];
    let seed = solar ? 0x5f3759df : 0x1f123bb5;
    const noise = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed / 0xffffffff) * 2 - 1;
    };
    const panGains = (pan) => [Math.sqrt((1 - pan) * 0.5), Math.sqrt((1 + pan) * 0.5)];
    const addVoice = (start, voiceDuration, frequency, amplitude, voice = "pad", pan = 0, attack = 0.03, release = 0.2) => {
      const first = Math.max(0, Math.floor(start * sampleRate));
      const count = Math.min(length - first, Math.floor(voiceDuration * sampleRate));
      const [leftGain, rightGain] = panGains(pan);
      for (let i = 0; i < count; i += 1) {
        const t = i / sampleRate;
        const fadeIn = Math.min(1, t / Math.max(0.001, attack));
        const fadeOut = Math.min(1, (voiceDuration - t) / Math.max(0.001, release));
        const rawEnvelope = Math.max(0, Math.min(fadeIn, fadeOut));
        const envelope = rawEnvelope * rawEnvelope * (3 - 2 * rawEnvelope);
        const cycles = frequency * t;
        let sample;
        if (voice === "pad") sample = waveAt(cycles + waveAt(t * 0.11) * 0.025) + waveAt(cycles * 2.003) * 0.28 + waveAt(cycles * 3.997) * 0.09;
        else if (voice === "bass") sample = waveAt(cycles) + waveAt(cycles * 0.5) * 0.34 + waveAt(cycles * 2) * 0.18;
        else if (voice === "glass") sample = waveAt(cycles) + waveAt(cycles * 2.01) * 0.46 + waveAt(cycles * 4.02) * 0.15;
        else if (voice === "lead") sample = waveAt(cycles + waveAt(t * 0.83) * 0.035) + waveAt(cycles * 2) * 0.2;
        else sample = waveAt(cycles);
        const value = sample * amplitude * envelope;
        left[first + i] += value * leftGain;
        right[first + i] += value * rightGain;
      }
    };
    const addNoise = (start, noiseDuration, amplitude, pan = 0, decay = 8) => {
      const first = Math.max(0, Math.floor(start * sampleRate));
      const count = Math.min(length - first, Math.floor(noiseDuration * sampleRate));
      const [leftGain, rightGain] = panGains(pan);
      let previous = 0;
      for (let i = 0; i < count; i += 1) {
        const t = i / sampleRate;
        previous = previous * 0.62 + noise() * 0.38;
        const value = previous * amplitude * Math.exp(-t * decay);
        left[first + i] += value * leftGain;
        right[first + i] += value * rightGain;
      }
    };
    const addKick = (start, amplitude) => {
      const first = Math.floor(start * sampleRate);
      const count = Math.min(length - first, Math.floor(0.42 * sampleRate));
      let phase = 0;
      for (let i = 0; i < count; i += 1) {
        const t = i / sampleRate;
        const frequency = 42 + 96 * Math.exp(-t * 18);
        phase += TAU * frequency / sampleRate;
        const value = Math.sin(phase) * amplitude * Math.exp(-t * 10);
        left[first + i] += value * 0.72;
        right[first + i] += value * 0.72;
      }
    };
    const solarRoots = [73.42, 58.27, 87.31, 65.41, 73.42, 58.27, 65.41, 55, 73.42, 87.31, 58.27, 55];
    const deepRoots = [46.25, 38.89, 43.65, 34.65, 46.25, 51.91, 38.89, 41.2, 46.25, 34.65, 38.89, 41.2];
    const roots = solar ? solarRoots : deepRoots;
    const melody = solar ? [0, 3, 7, 10, 7, 12, 10, 7, 3, 7, 5, 3, 0, -2, 0, 3] : [0, 1, 7, 5, 1, 8, 7, 0, -5, 1, 3, 1, 0, -4, -5, -7];
    for (let bar = 0; bar < bars; bar += 1) {
      const barStart = bar * beat * 4;
      const root = roots[bar];
      const major = solar && [2, 3, 6, 9].includes(bar);
      const chord = major ? [1, 1.2599, 1.4983, 2.2449] : [1, 1.1892, 1.4983, 2.2449];
      const padDuration = beat * (bar === bars - 1 ? 4 : 4.35);
      chord.forEach((ratio, index) => addVoice(barStart, padDuration, root * ratio * 2, solar ? 0.052 : 0.062, "pad", (index - 1.5) * 0.34, beat * 0.9, bar === bars - 1 ? beat * 0.72 : beat * 1.25));
      for (let pulse = 0; pulse < 4; pulse += 1) {
        addVoice(barStart + pulse * beat, beat * 0.82, root * (pulse % 2 === 0 ? 1 : 1.4983), solar ? 0.13 : 0.1, "bass", pulse % 2 ? 0.12 : -0.12, 0.012, beat * 0.34);
      }
      for (let step = 0; step < 8; step += 1) {
        const ratio = chord[step % chord.length];
        addVoice(barStart + step * beat * 0.5, beat * (solar ? 0.31 : 0.44), root * ratio * 4, solar ? 0.052 : 0.034, "glass", step % 2 ? 0.48 : -0.48, 0.008, beat * 0.18);
      }
      if (solar || bar % 2 === 0) {
        for (let phrase = 0; phrase < 4; phrase += 1) {
          const offset = melody[(bar * 4 + phrase) % melody.length];
          addVoice(barStart + phrase * beat, beat * 0.72, root * 4 * 2 ** (offset / 12), solar ? 0.065 : 0.045, "lead", Math.sin((bar + phrase) * 1.7) * 0.36, 0.04, beat * 0.3);
        }
      }
      for (let pulse = 0; pulse < 4; pulse += 1) {
        if (solar ? pulse % 2 === 0 : pulse === 0) addKick(barStart + pulse * beat, solar ? 0.34 : 0.24);
        if (solar && pulse % 2 === 1) addNoise(barStart + pulse * beat, 0.18, 0.14, pulse === 1 ? -0.16 : 0.16, 18);
        addNoise(barStart + pulse * beat + beat * 0.5, solar ? 0.065 : 0.11, solar ? 0.045 : 0.025, pulse % 2 ? 0.66 : -0.66, solar ? 34 : 16);
      }
    }
    for (let i = 0; i < length; i += 1) {
      const leftValue = left[i] * 1.15;
      const rightValue = right[i] * 1.15;
      left[i] = (leftValue / (1 + Math.abs(leftValue))) * 0.9;
      right[i] = (rightValue / (1 + Math.abs(rightValue))) * 0.9;
    }
    const buffer = audioContext.createBuffer(2, length, sampleRate);
    buffer.copyToChannel(left, 0);
    buffer.copyToChannel(right, 1);
    musicBuffers.set(trackId, buffer);
    return buffer;
  }

  function stopMissionMusic(preservePosition = true) {
    if (musicSource && audioContext) {
      if (preservePosition && musicSource.buffer?.duration) {
        musicOffset = (musicOffset + audioContext.currentTime - musicStartedAt) % musicSource.buffer.duration;
      }
      try { musicSource.stop(); } catch {}
      musicSource.disconnect?.();
      musicSource = null;
    }
    if (audioContext && musicBus) {
      const now = audioContext.currentTime;
      musicBus.gain.cancelScheduledValues(now);
      musicBus.gain.setValueAtTime(Math.max(0.0001, musicBus.gain.value), now);
      musicBus.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    }
    refreshAudioStatus();
  }

  function resetMissionMusic() {
    stopMissionMusic(false);
    musicOffset = 0;
    currentMusicTrack = null;
  }

  function startMissionMusic() {
    if (!audioContext || !musicBus || !settings.music || state !== "running") return;
    const trackId = mission === 1 ? "solar" : "deep";
    if (musicSource && currentMusicTrack === trackId) return;
    if (musicSource) stopMissionMusic(currentMusicTrack === trackId);
    if (currentMusicTrack !== trackId) musicOffset = 0;
    const buffer = renderMusicTrack(trackId);
    if (!buffer) return;
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(musicBus);
    const now = audioContext.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(0.0001, now);
    musicBus.gain.linearRampToValueAtTime(Math.max(0.0001, settings.musicVolume), now + 0.42);
    source.start(0, musicOffset % buffer.duration);
    musicStartedAt = now;
    musicSource = source;
    currentMusicTrack = trackId;
    refreshAudioStatus();
  }

  function updateMusicState() {
    if (!audioContext || !musicBus || audioContext.state === "suspended" || !settings.music || state !== "running") {
      stopMissionMusic(true);
      return;
    }
    startMissionMusic();
  }

  function getNoiseBuffer() {
    if (noiseBuffer || !audioContext) return noiseBuffer;
    const length = Math.floor(audioContext.sampleRate * 2);
    noiseBuffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      last = last * 0.12 + (Math.random() * 2 - 1) * 0.88;
      data[i] = last;
    }
    return noiseBuffer;
  }

  function sfxVoice({ start = 440, end = start, duration = 0.2, volume = 0.1, shape = "sine", delay = 0, pan = 0, attack = 0.006 }) {
    if (!audioContext || !sfxBus) return;
    const now = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(Math.max(1, start), now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, end), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(Math.max(0.0001, volume), now + Math.min(attack, duration * 0.35));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    if (audioContext.createStereoPanner) {
      const panner = audioContext.createStereoPanner();
      panner.pan.setValueAtTime(clamp(pan, -1, 1), now);
      gain.connect(panner).connect(sfxBus);
    } else gain.connect(sfxBus);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  function sfxNoise({ duration = 0.25, volume = 0.1, frequency = 1200, endFrequency = frequency, filterType = "lowpass", delay = 0, pan = 0 }) {
    if (!audioContext || !sfxBus) return;
    const now = audioContext.currentTime + delay;
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    source.buffer = getNoiseBuffer();
    filter.type = filterType;
    filter.frequency.setValueAtTime(Math.max(20, frequency), now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    filter.Q.setValueAtTime(filterType === "bandpass" ? 2.8 : 0.7, now);
    gain.gain.setValueAtTime(Math.max(0.0001, volume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain);
    if (audioContext.createStereoPanner) {
      const panner = audioContext.createStereoPanner();
      panner.pan.setValueAtTime(clamp(pan, -1, 1), now);
      gain.connect(panner).connect(sfxBus);
    } else gain.connect(sfxBus);
    const maxOffset = Math.max(0, noiseBuffer.duration - duration - 0.02);
    source.start(now, Math.random() * maxOffset, duration);
    source.stop(now + duration + 0.03);
  }

  function playTone(type, strength = 1) {
    if (!soundEnabled || !audioContext || !sfxBus) return;
    const power = clamp(strength, 0.45, 2.5);
    if (type === "laser") {
      sfxVoice({ start: 1450, end: 190, duration: 0.15, volume: 0.12, shape: "sawtooth", pan: random(-0.18, 0.18) });
      sfxVoice({ start: 2100, end: 620, duration: 0.09, volume: 0.055, shape: "sine", delay: 0.012 });
      sfxNoise({ duration: 0.055, volume: 0.035, frequency: 4200, endFrequency: 1200, filterType: "highpass" });
    } else if (type === "missile") {
      sfxVoice({ start: 128, end: 42, duration: 0.48, volume: 0.19, shape: "sine" });
      sfxVoice({ start: 360, end: 72, duration: 0.28, volume: 0.075, shape: "square" });
      sfxNoise({ duration: 0.42, volume: 0.15, frequency: 1500, endFrequency: 110, filterType: "bandpass" });
    } else if (type === "plasma") {
      sfxVoice({ start: 520, end: 88, duration: 0.34, volume: 0.17, shape: "sine" });
      sfxVoice({ start: 1040, end: 210, duration: 0.27, volume: 0.09, shape: "triangle", delay: 0.018, pan: 0.24 });
      sfxNoise({ duration: 0.22, volume: 0.07, frequency: 2200, endFrequency: 340, filterType: "bandpass", pan: -0.24 });
    } else if (type === "railgun") {
      sfxNoise({ duration: 0.15, volume: 0.24, frequency: 6000, endFrequency: 180, filterType: "bandpass" });
      sfxVoice({ start: 1900, end: 58, duration: 0.24, volume: 0.18, shape: "square" });
      sfxVoice({ start: 105, end: 31, duration: 0.55, volume: 0.2, shape: "sine" });
      sfxVoice({ start: 760, end: 120, duration: 0.21, volume: 0.075, shape: "sawtooth", delay: 0.11, pan: 0.4 });
    } else if (type === "impact") {
      sfxNoise({ duration: 0.22 * power, volume: 0.13 * power, frequency: 1800, endFrequency: 90, filterType: "lowpass" });
      sfxVoice({ start: 105, end: 33, duration: 0.25 * power, volume: 0.13 * power, shape: "sine" });
    } else if (type === "explosion") {
      sfxNoise({ duration: 0.82, volume: 0.25 * power, frequency: 1300, endFrequency: 48, filterType: "lowpass" });
      sfxNoise({ duration: 0.18, volume: 0.16 * power, frequency: 5200, endFrequency: 520, filterType: "highpass" });
      sfxVoice({ start: 82, end: 24, duration: 0.72, volume: 0.23 * power, shape: "sine" });
    } else if (type === "damage") {
      sfxVoice({ start: 190, end: 62, duration: 0.3, volume: 0.16, shape: "square" });
      sfxVoice({ start: 260, end: 92, duration: 0.22, volume: 0.11, shape: "sawtooth", delay: 0.12 });
      sfxNoise({ duration: 0.26, volume: 0.12, frequency: 1800, endFrequency: 140, filterType: "bandpass" });
    } else if (type === "shield") {
      sfxVoice({ start: 310, end: 1320, duration: 0.34, volume: 0.13, shape: "sine" });
      sfxVoice({ start: 620, end: 1680, duration: 0.27, volume: 0.07, shape: "triangle", pan: 0.35 });
      sfxVoice({ start: 480, end: 1180, duration: 0.3, volume: 0.06, shape: "triangle", pan: -0.35 });
    } else if (type === "upgrade" || type === "complete") {
      const notes = type === "complete" ? [392, 523.25, 659.25, 783.99] : [293.66, 440, 587.33];
      notes.forEach((note, index) => {
        sfxVoice({ start: note, end: note * 1.01, duration: type === "complete" ? 0.75 : 0.42, volume: 0.09, shape: "triangle", delay: index * (type === "complete" ? 0.17 : 0.09), pan: (index - 1.5) * 0.2 });
        sfxVoice({ start: note * 2, end: note * 1.5, duration: 0.3, volume: 0.035, shape: "sine", delay: index * 0.09 });
      });
    } else if (type === "resource") {
      [659.25, 880, 1174.66].forEach((note, index) => sfxVoice({ start: note, end: note * 1.02, duration: 0.19, volume: 0.065, shape: "sine", delay: index * 0.055, pan: index * 0.25 - 0.25 }));
    } else if (type === "switch") {
      sfxVoice({ start: 320, end: 720, duration: 0.075, volume: 0.075, shape: "sine" });
      sfxVoice({ start: 680, end: 980, duration: 0.055, volume: 0.04, shape: "square", delay: 0.045 });
    } else if (type === "enemy") {
      sfxVoice({ start: 270, end: 82, duration: 0.2, volume: 0.1, shape: "sawtooth", pan: random(-0.55, 0.55) });
      sfxNoise({ duration: 0.11, volume: 0.06, frequency: 2400, endFrequency: 380, filterType: "bandpass" });
    } else if (type === "launch") {
      sfxVoice({ start: 48, end: 122, duration: 1.15, volume: 0.2, shape: "sine" });
      sfxVoice({ start: 96, end: 610, duration: 0.88, volume: 0.11, shape: "sawtooth", delay: 0.08 });
      sfxNoise({ duration: 1.1, volume: 0.2, frequency: 180, endFrequency: 2400, filterType: "bandpass" });
    }
    refreshAudioStatus();
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
    if (event.code === "Tab" && !event.repeat) {
      event.preventDefault();
      if (state !== "gameover") setConfigOpen(ui.configPopover.hidden);
      return;
    }
    if (event.code === "KeyO" && !event.repeat) {
      event.preventDefault();
      if (state !== "gameover") setSettingsOpen(ui.settingsPopover.hidden);
      return;
    }
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
      startMissionOne();
      return;
    }
    if (event.code === "Space" && state === "missioncomplete") {
      startMissionTwo(true);
      return;
    }
    if (event.code === "Space" && state === "gameover") {
      restartMission();
      return;
    }
    if (event.code === "Escape") {
      if (!ui.configPopover.hidden) setConfigOpen(false);
      else if (!ui.settingsPopover.hidden) setSettingsOpen(false);
      else if (state !== "gameover") setSettingsOpen(true);
      return;
    }
    keys.add(event.code);
  });

  window.addEventListener("keyup", (event) => keys.delete(event.code));

  document.getElementById("startButton").addEventListener("click", startMissionOne);
  document.getElementById("restartButton").addEventListener("click", restartMission);
  document.getElementById("missionTwoButton").addEventListener("click", () => startMissionTwo(true));
  document.getElementById("resumeButton").addEventListener("click", () => togglePause(true));
  document.getElementById("pauseButton").addEventListener("click", () => togglePause());
  document.querySelectorAll(".weapon-slot").forEach((card) => {
    card.addEventListener("click", () => selectWeapon(card.dataset.weapon));
  });
  document.querySelectorAll("[data-fabricate]").forEach((button) => {
    button.addEventListener("click", () => fabricate(button.dataset.fabricate));
  });
  document.querySelectorAll("[data-setting]").forEach((button) => {
    button.addEventListener("click", () => setFeatureSetting(button.dataset.setting, !settings[button.dataset.setting]));
  });
  document.querySelectorAll("[data-volume]").forEach((input) => {
    input.addEventListener("input", () => setVolumeSetting(input.dataset.volume, Number(input.value) / 100));
  });
  ui.configButton.addEventListener("click", () => setConfigOpen(ui.configPopover.hidden));
  document.getElementById("closeConfigButton").addEventListener("click", () => setConfigOpen(false));
  ui.settingsButton.addEventListener("click", () => setSettingsOpen(ui.settingsPopover.hidden));
  document.getElementById("closeSettingsButton").addEventListener("click", () => setSettingsOpen(false));
  ui.sound.addEventListener("click", () => {
    unlockAudio();
    setFeatureSetting("soundFx", !settings.soundFx);
    if (settings.soundFx) playTone("switch");
  });
  document.getElementById("testAudioButton").addEventListener("click", () => {
    unlockAudio();
    if (!settings.music) setFeatureSetting("music", true);
    if (!settings.soundFx) setFeatureSetting("soundFx", true);
    if (settings.musicVolume < 0.05) setVolumeSetting("musicVolume", 0.72);
    if (settings.sfxVolume < 0.05) setVolumeSetting("sfxVolume", 0.8);
    playTone("upgrade");
    updateMusicState();
    refreshAudioStatus();
    ui.announcer.textContent = "Audio test played.";
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
  updateSettingsUi();
  refreshAudioStatus();
  updateResourceUi();
  updateHud(true);
  requestAnimationFrame(frame);
})();
