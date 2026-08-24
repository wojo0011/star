# Starfall Command

A fast, responsive browser-based space shooter built with the Canvas API.

## Play

- Move with **WASD** or the **arrow keys**.
- Fire with **Space**.
- Switch between unlocked weapons with **Alt** or **Command** on macOS.
- Pause with **P**.
- Touch controls appear automatically on small screens.

Asteroids vary in size, speed, and durability. Missed asteroids leave the battlefield safely—only direct collisions damage the ship. Every mission begins with the photon laser; all other weapons must be recovered as glowing pickups in the asteroid field.

Most asteroids are ordinary rock and drop nothing. Rarer asteroids visibly contain common metals, silver, gold, titanium, beryllium, platinum-group metals, rare-earth metals, or radioactive metals. Destroying a mineral-bearing asteroid releases labelled elemental shards that can be collected and refined into matter units.

Open **CFG** to view discovered elements and spend refined matter in the field fabricator. Fabrication supports fire rate, wide shot, shielding, hull repair, engine thrust, manoeuvring response, armour plating, and passive hull regeneration.

Fast diagonal shooting stars occasionally cross the battlefield. Contact damages the ship, but shooting stars that leave the screen cause no damage.

Destroyed asteroids can release permanent upgrades for the current mission:

- **Overdrive** increases fire rate up to five levels.
- **Wide Shot** adds additional firing lanes and visible wing cannons.
- **Deflector Shield** absorbs collision damage and installs shield nodes on the hull.
- **Seeker Missiles** unlock homing explosives and install visible wing pods.
- **Plasma Cannon** unlocks piercing energy orbs and can be upgraded three times.
- **Rail Driver** unlocks heavy piercing rounds and can be upgraded three times.
- **Engine Thrust** increases the ship's top speed and expands its drive system.
- **Manoeuvring Thrusters** sharpen directional response and add attitude-control jets.
- **Armour Plating** increases maximum hull integrity and reduces collision damage.
- **Hull Regeneration** gradually repairs damage after a short damage-free delay.

Each installed upgrade visibly changes the detailed ship model. Your high score is saved locally in the browser.

## Run locally

Open `index.html` directly, or serve the folder with any static web server.

## Deployment

Every push to `main` deploys the static game to GitHub Pages through the included workflow.
