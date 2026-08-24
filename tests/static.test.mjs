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
assert.match(html, /id="mobileFire"/);
assert.match(css, /@media \(max-width: 680px\)/);
assert.match(game, /event\.code === "Space"/);
assert.match(game, /event\.key === "Meta"/);
assert.match(game, /ship\.x = clamp/);
assert.match(game, /ship\.y = clamp/);
assert.match(game, /function spawnAsteroid/);
assert.match(game, /function createExplosion/);
assert.match(game, /localStorage\.setItem\("starfall-high-score"/);

console.log("Static game checks passed.");
