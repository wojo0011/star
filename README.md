# Starfall Command

A fast, responsive browser-based space shooter built with the Canvas API.

## Play

- Move with **WASD** or the **arrow keys**.
- Fire with **Space**.
- Switch between unlocked weapons with **Alt** or **Command** on macOS.
- Pause with **P**.
- Open ship upgrades with **Tab**. Opening the CFG panel pauses the mission until it is closed.
- Open mission options with **Escape** or **O**. The options panel also pauses the mission.
- Touch controls appear automatically on small screens.

## Campaign

The game opens with a short Mission 1 story and briefing. The player launches from Earth, dives toward the Sun for a gravity assist, flies past Mercury and Venus, passes Mars, crosses a dense asteroid belt, and navigates past Jupiter, Saturn, Uranus, and Neptune before reaching the heliopause. The Solar System bodies use dedicated visual models, colors, atmosphere, surface features, solar plasma, storms, ice caps, cloud bands, and rings. Planetary and solar collisions remain fatal.

Mission 1 is also populated with detailed human-built infrastructure: relay satellites, orbital and heliopause telescopes, solar and planetary probes, science platforms, asteroid-mining rigs, refinery drones, and deep-space science arrays. These labelled contacts are scenery and do not damage the player.

Crossing the heliopause completes Mission 1 and unlocks the transition into Mission 2. Upgrades, collected resources, ship condition, unlocked weapons, and score carry forward. Mission 2 is the existing uncharted deep-space game and currently continues forever. Its fictional planets, alien ships, stations, resources, and other systems remain intact for reuse in later missions.

Asteroids vary in size, speed, and durability. Missed asteroids leave the battlefield safely—only direct collisions damage the ship. Every new campaign begins with the photon laser; all other weapons must be recovered as glowing pickups in the asteroid field.

Most asteroids are ordinary rock and drop nothing. Rarer asteroids visibly contain common metals, silver, gold, titanium, beryllium, platinum-group metals, rare-earth metals, or radioactive metals. Destroying a mineral-bearing asteroid releases labelled elemental shards that can be collected and refined into matter units.

Open **CFG** to view the illustrated ship-systems gallery, discovered elements, and the field fabricator. Every permanent and temporary upgrade appears in an ordered Defence, Weapons, Flight, or Tactical section with its own vector schematic, description, installation state, level pips, and active timer. Damage is applied in three explicit stages: energy shield first, armour plating second, and hull integrity last. Each layer has its own HUD bar. Shields recharge slowly after a damage-free delay, while the fabricator provides separate immediate shield recharge, armour patch, and hull repair controls. Passive regeneration repairs hull damage.

Fast diagonal shooting stars occasionally cross the battlefield. Contact damages the ship, but shooting stars that leave the screen cause no damage.

During Mission 2, rare fictional planets drift through the sector in varied sizes. Gas giants, rocky worlds, habitable planets, icy worlds, forest planets, ocean planets, deserts, volcanic worlds, and toxic planets each have a distinct appearance. They can be safely avoided, but a direct planetary collision is an immediate game over.

Hostile alien scouts, raiders, and gunships enter the field, manoeuvre continuously across the upper sector, and fire aimed energy bolts at the player. Their patrol phase begins from their actual arrival point so they never teleport between entry and patrol movement. Rarer orbital stations act as large rotating gun platforms. Hostiles may be unprotected, armored, shielded, or fortified with both defenses; armor reduces incoming damage while shields must be depleted before the hull can be hit. Their defense state is visible on the craft and in the status bars above it.

Mission 2 also contains crimson and azure missile weapon arrays. Each destructible platform projects a visible red or blue laser sight and moving targeting reticle. The reticle gradually follows the ship while a percentage lock builds; only a complete lock launches a homing missile. Cloaking actively breaks the lock and prevents missile guidance from reacquiring the hidden ship. Weapon arrays, their missiles, and their feature toggle are tracked separately from alien ships and orbital stations.

The **OPT** panel can independently enable or disable asteroids, mineral drops, shooting stars, planets, alien ships, space stations, missile weapon arrays, original mission music, sound effects, particle effects, and screen shake. Choices and separate music/SFX volume levels are saved locally. An audio-status monitor reports whether audio is locked, ready, muted, or actively playing. **Enable / Test Audio** explicitly resumes browser audio and plays a confirmation sound.

## Original score and sound design

The game renders two original stereo scores into looping audio buffers: a rhythmic orchestral/electronic **Solar Escape** theme for Mission 1 and a slower, darker **Deep Space** exploration theme for Mission 2. Each composition includes harmonic pads, sub-bass, arpeggios, lead phrases, percussion, stereo movement, dynamics processing, and a dedicated tempo and chord progression. Music pauses without losing its playback position and changes automatically between missions.

Weapon and interaction sounds use layered synthesis rather than single beeps. Lasers combine pitch sweeps and high-frequency transients; missiles combine ignition noise, rocket-like filtered exhaust, and sub-bass; plasma uses layered energy tones; railguns combine a sharp crack, electromagnetic sweep, low-frequency impact, and echo. Explosions, impacts, shields, damage alerts, pickups, launch, hostile fire, and mission completion also have distinct multi-layer designs. All music and sound effects are generated by the game, so no third-party audio license or remote asset is required.

Destroyed asteroids can release permanent upgrades for the current mission:

- **Overdrive** increases fire rate up to five levels.
- **Wide Shot** adds additional firing lanes and visible wing cannons.
- **Deflector Shield** absorbs collision damage and installs shield nodes on the hull.
- **Shield Overcharge** expands shield capacity, increases recharge rate, and adds external capacitors.
- **Magnetic Capture** expands the attraction field for upgrade and mineral pickups at every level.
- **Laser Ricochet** redirects laser bolts into a nearby unhit asteroid, ship, or station one, two, or three times.
- **Cloaking** suppresses hostile targeting for 10, 20, 30, or 40 seconds as the module level increases.
- **Rapid Fire** is a temporary pickup that cuts weapon delay for up to 30 stacked seconds.
- **Seeker Missiles** unlock homing explosives and install visible wing pods.
- **Plasma Cannon** unlocks piercing energy orbs and can be upgraded three times.
- **Rail Driver** unlocks heavy piercing rounds and can be upgraded three times.
- **Engine Thrust** increases the ship's top speed and expands its drive system.
- **Manoeuvring Thrusters** sharpen directional response and add attitude-control jets.
- **Armour Plating** adds a separate sacrificial protection layer between shield and hull.
- **Hull Regeneration** gradually repairs damage after a short damage-free delay.

Each installed upgrade visibly changes the detailed ship model. Your high score is saved locally in the browser.

Missile guidance caches its target and reacquires at a controlled interval instead of scanning every entity on every animation frame. Missile exhaust also uses a capped, lower-frequency particle trail to keep large volleys smooth.

## Run locally

Open `index.html` directly, or serve the folder with any static web server.

## Deployment

Every push to `main` deploys the static game to GitHub Pages through the included workflow.
