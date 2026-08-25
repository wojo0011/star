import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const gradient = { addColorStop() {} };
const canvasContext = new Proxy({
  createLinearGradient: () => gradient,
  createRadialGradient: () => gradient,
  measureText: (value) => ({ width: String(value).length * 7 }),
}, {
  get(target, property) {
    if (property in target) return target[property];
    return () => {};
  },
  set(target, property, value) {
    target[property] = value;
    return true;
  },
});

class MockElement {
  constructor(id = "") {
    this.id = id;
    this.hidden = true;
    this.style = {};
    this.dataset = {};
    this.value = "80";
    this.textContent = "";
    this.innerHTML = "";
    this.classList = { add() {}, remove() {}, toggle() {} };
  }

  addEventListener() {}
  appendChild() {}
  querySelectorAll() { return []; }
  setAttribute() {}
  setPointerCapture() {}
  hasPointerCapture() { return false; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 120, height: 120 }; }
}

const elements = new Map();
const canvas = new MockElement("gameCanvas");
canvas.getContext = () => canvasContext;
elements.set("gameCanvas", canvas);

const document = {
  body: new MockElement("body"),
  hidden: false,
  addEventListener() {},
  querySelectorAll() { return []; },
  createElement() { return new MockElement(); },
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, new MockElement(id));
    return elements.get(id);
  },
};

const storage = new Map();
const localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};

const windowObject = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  addEventListener() {},
  setTimeout: () => 1,
  clearTimeout() {},
};

let source = await readFile(new URL("../game.js", import.meta.url), "utf8");
const bootMarker = "  requestAnimationFrame(frame);\n})();";
assert.ok(source.includes(bootMarker), "game boot marker should remain instrumentable");
source = source.replace(bootMarker, `  globalThis.__starPerformanceTest = {
    startMissionOne,
    fire,
    update,
    draw,
    createExplosion,
    projectiles,
    enemyProjectiles,
    particles,
    shockwaves,
    asteroids,
    limits: PERFORMANCE_LIMITS,
    getState() { return state; },
    getLaunchIntroElapsed() { return launchIntroElapsed; },
    startTestAssist(path = [0.25, 0.5, 0.75]) {
      state = "running";
      mission = 1;
      spawnGravityAssist({ id: "test", assist: { label: "TEST FLYBY", path, color: "#56f4ff", gateSpeed: 160 } });
    },
    passNextAssistGate() {
      const gate = activeGravityAssist?.gates.find((candidate) => !candidate.resolved);
      if (!gate) return;
      ship.x = gravityGateX(gate);
      gate.y = ship.y - 1;
      gate.lastRelative = -1;
      updateGravityAssist(1 / 60);
    },
    missNextAssistGate() {
      const gate = activeGravityAssist?.gates.find((candidate) => !candidate.resolved);
      if (!gate) return;
      ship.x = gravityGateX(gate) > width * 0.5 ? 0 : width;
      gate.y = ship.y - 1;
      gate.lastRelative = -1;
      updateGravityAssist(1 / 60);
    },
    updateAssistFailure,
    getAssistSnapshot() {
      return activeGravityAssist ? { state: activeGravityAssist.state, passed: activeGravityAssist.passed } : null;
    },
    getAssistFailureTimer() { return assistFailureTimer; },
    getShipPosition() { return { x: ship.x, y: ship.y }; },
    getGameOverReason() { return ui.gameOverReason.textContent; },
    setStressMode() {
      state = "running";
      mission = 2;
      lastShot = -Infinity;
      rapidFireTimer = 30;
      upgrades.fireRate = 5;
      upgrades.wideShot = 4;
      settings.asteroids = false;
      settings.shootingStars = false;
      settings.planets = false;
      settings.alienShips = false;
      settings.spaceStations = false;
      settings.weaponArrays = false;
      settings.screenShake = false;
      settings.particles = true;
    },
    setShipX(value) { ship.x = value; },
    addCollisionTargets(count) {
      for (let index = 0; index < count; index += 1) {
        asteroids.push({
          id: ++asteroidSequence,
          alive: true,
          x: 40 + (index % 30) * 40,
          y: 90 + (index % 7) * 42,
          vx: 0,
          vy: 0,
          radius: 9,
          hp: 100000,
          maxHp: 100000,
          score: 0,
          type: "small",
          rotation: 0,
          rotationSpeed: 0,
          flash: 0,
          composition: { metals: [], rockRatio: 1 },
          vertices: [],
          craters: [],
          mineralPatches: [],
        });
      }
    },
    clearCollisionTargets() { asteroids.length = 0; },
  };
  requestAnimationFrame(frame);
})();`);

const context = vm.createContext({
  console,
  document,
  localStorage,
  window: windowObject,
  performance,
  requestAnimationFrame() {},
  setTimeout: windowObject.setTimeout,
  clearTimeout: windowObject.clearTimeout,
  Math,
  Map,
  Set,
  Object,
  Array,
  Number,
  String,
  JSON,
  Infinity,
});
context.globalThis = context;
vm.runInContext(source, context, { filename: "game.js" });

const game = context.__starPerformanceTest;
game.startMissionOne();
assert.equal(game.getState(), "intro", "launch should begin with the cinematic state");
game.draw();
for (let frame = 0; frame < 242; frame += 1) game.update(1 / 30, frame * (1000 / 30));
assert.equal(game.getState(), "running", "the eight-second launch cinematic should hand off to Mission 1");
assert.equal(game.getLaunchIntroElapsed(), 8);

game.startTestAssist();
game.passNextAssistGate();
game.passNextAssistGate();
game.passNextAssistGate();
assert.equal(game.getAssistSnapshot().state, "complete", "three correctly flown gates should complete the gravity assist");
assert.equal(game.getAssistSnapshot().passed, 3, "all three gravity gates should be credited");

game.startTestAssist([0.8, 0.5, 0.2]);
game.missNextAssistGate();
assert.equal(game.getState(), "assistfailed", "missing a required lane gate should start the failure sequence");
assert.equal(game.getAssistFailureTimer(), 3, "gravity-assist failure should give a visible three-second trajectory loss");
const failureStart = game.getShipPosition();
game.updateAssistFailure(1);
assert.ok(game.getShipPosition().y < failureStart.y, "the failed ship should visibly fly out of the mission corridor");
assert.equal(game.getState(), "assistfailed", "the failed trajectory should remain visible during its countdown");
game.updateAssistFailure(2.05);
assert.equal(game.getState(), "gameover", "the mission should end when the three-second failure countdown expires");
assert.equal(game.getGameOverReason(), "GRAVITY ASSIST FAILED · TRAJECTORY LOST");

game.setStressMode();

for (let shot = 0; shot < 900; shot += 1) game.fire(1000 + shot * 24);
assert.equal(game.projectiles.length, game.limits.playerProjectiles, "rapid fire should recycle at the projectile budget");
assert.ok(game.particles.length <= game.limits.particles, "muzzle effects should stay within the particle budget");

game.setShipX(777);
game.fire(23000);
assert.equal(game.projectiles.length, game.limits.playerProjectiles, "a full projectile pool should still accept a new shot");
assert.ok(game.projectiles.some((projectile) => Math.abs(projectile.x - 777) < 50), "new volleys should replace old shots instead of being dropped");

for (let blast = 0; blast < 180; blast += 1) game.createExplosion(400, 220, 58, 2);
assert.ok(game.particles.length <= game.limits.particles, "explosions should stay within the particle budget");
assert.ok(game.shockwaves.length <= game.limits.shockwaves, "shockwaves should stay within their budget");

game.addCollisionTargets(90);
const stressStarted = performance.now();
for (let frame = 0; frame < 420; frame += 1) {
  const now = 24000 + frame * 24;
  game.fire(now);
  game.update(1 / 60, now);
  if (frame % 3 === 0) game.draw();
  assert.ok(game.projectiles.length <= game.limits.playerProjectiles);
  assert.ok(game.enemyProjectiles.length <= game.limits.enemyProjectiles);
  assert.ok(game.particles.length <= game.limits.particles);
  assert.ok(game.shockwaves.length <= game.limits.shockwaves);
}
const stressDuration = performance.now() - stressStarted;
assert.ok(stressDuration < 8000, `sustained-fire simulation took too long: ${Math.round(stressDuration)}ms`);

game.clearCollisionTargets();
console.log(`Performance stress checks passed in ${Math.round(stressDuration)}ms.`);
