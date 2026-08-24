import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, css, game] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../game.js", import.meta.url), "utf8"),
]);

assert.match(html, /id="gameCanvas"/);
assert.match(html, /data-weapon="laser"/);
assert.match(html, /data-weapon="missile"/);
assert.match(html, /data-weapon="plasma"/);
assert.match(html, /data-weapon="railgun"/);
assert.match(html, /class="weapon-slot" data-weapon="missile"[^>]*hidden disabled/);
assert.match(html, /id="configPopover"[^>]*hidden/);
assert.match(html, /id="activeWeaponName"/);
assert.match(html, /id="shieldBar"/);
assert.match(html, /id="upgradeList"/);
assert.match(html, /id="mobileFire"/);
assert.match(css, /@media \(max-width: 680px\)/);
assert.match(game, /event\.code === "Space"/);
assert.match(game, /event\.key === "Meta"/);
assert.match(game, /ship\.x = clamp/);
assert.match(game, /ship\.y = clamp/);
assert.match(game, /function spawnAsteroid/);
assert.match(game, /function createExplosion/);
assert.match(game, /function spawnUpgrade/);
assert.match(game, /spawnUpgrade\(asteroid\.x, asteroid\.y, "missile"\)/);
assert.match(game, /function applyUpgrade/);
assert.match(game, /function drawPowerUp/);
assert.match(game, /type: "plasma"/);
assert.match(game, /type: "railgun"/);
assert.match(game, /unlockedWeapons = new Set\(\["laser"\]\)/);
assert.doesNotMatch(game, /asteroid\.y - asteroid\.radius > height[\s\S]{0,160}damageShip/);
assert.match(game, /localStorage\.setItem\("starfall-high-score"/);

console.log("Static game checks passed.");
