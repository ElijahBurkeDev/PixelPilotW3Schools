console.log("Script loaded successfully.");

window.Userback = window.Userback || {};
  Userback.access_token = "A-6XNr2g2Qk0fa7PZInuGEqKuUb";
  (function(d) {
    var s = d.createElement('script');s.async = true;s.src = 'https://static.userback.io/widget/v1.js';(d.head || d.body).appendChild(s);
  })(document);


const SPACESHIPS = {
  classic: {
    name: 'CLASSIC',
    image: './images/spaceships/classic/classic.png',
    gunPosX: 50,
    gunPosY: 50,
    width: 110,
    height: 90,
    guns: 'astropopper',
    numberOfGuns: 1,
    price: 0,
    purchasedKey: null,
    stats: {
      speed: 7,
      maneuverability: 1,
      multiplier: 1,
      hullSize: 5,
      writeUp: "This spaceship is classic. Some veteran pilots will remember it from the early days of Pixel Pilot. Large and hard to control with no multiplier, it's not quite the best spaceship. But hey, it's free.",
    },
    controls: {
      sensitivity: 1,
    },
  },
  pixpro: {
    name: 'Pixel Piece Prospecter',
    image: './images/spaceships/pixpro/pixpro.png',
    gunPosX: 50,
    gunPosY: 50,
    width: 110,
    height: 90,
    guns: 'astropopper',
    numberOfGuns: 1,
    price: 20000,
    purchasedKey: 'pixpro',
    stats: {
      speed: 7,
      maneuverability: 1,
      multiplier: 1.25,
      hullSize: 5,
      writeUp: 'The Pixel Piece Prospector is just here for the money (and alliteration). It\'s just a reskin of the Classic, you say? Nah, that\'s <i>way</i> too lazy. It has nothing to boast of in performance, but its score multiplier will help you earn some extra Pixel Pieces!',
    },
    controls: {
      sensitivity: 1,
    },
  },
};

const GUNS = {
    astropopper: {
      name: 'AstroPopper',
      code: '1ast',
      cooldown: 1,
      fireModes: 'Single-shot',
      bulletcapacity: 8,
      writeUp: 'The AstroPopper is a basic gun that fires a single shot at a time.',
    }
}

const SHIP_UPGRADE_CONFIG = {
  classic: {
    doubleGunPrice: 10000,
    afterburnerPrice: 15000,
    upgradedImage: './images/spaceships/classic/classic_double_guns.png',
  },
  pixpro: {
    doubleGunPrice: 25000,
    afterburnerPrice: 15000,
    upgradedImage: './images/spaceships/pixpro/pixpro_double_guns.png',
  },
};

let viewedShipKey = 'classic';

function getShipUpgradeState(shipKey) {
  const stored = saveData?.upgrades?.[shipKey] || {};
  return {
    doubleGun: stored.doubleGun === true,
    afterburner: stored.afterburner === true,
    aimDistance: Math.min(2000, Math.max(200, Number(stored.aimDistance) || 600)),
  };
}

function saveShipUpgradeState(shipKey, changes) {
  saveData.upgrades = saveData.upgrades || {};
  saveData.upgrades[shipKey] = { ...getShipUpgradeState(shipKey), ...changes };
  saveGame();
}

function purchaseShipDoubleGun(shipKey) {
  const config = SHIP_UPGRADE_CONFIG[shipKey];
  const ship = SPACESHIPS[shipKey];
  const upgrade = getShipUpgradeState(shipKey);
  const owned = ship && (ship.purchasedKey === null || saveData.purchasedShips[ship.purchasedKey]);
  if (!config || !owned || upgrade.doubleGun) return;
  if (getScoreCookie() < config.doubleGunPrice) {
    purchaseAttemptFailed(config.doubleGunPrice);
    return;
  }
  setScoreCookie(getScoreCookie() - config.doubleGunPrice);
  saveShipUpgradeState(shipKey, { doubleGun: true });
  if (getSelectedShipCookie().at(11) === SPACESHIPS[shipKey].name) equipShip(shipKey);
  if (viewedShipKey === shipKey) showShip(shipKey);
  updateUpgradePanel();
  updateShipNavImages();
  setScorebar();
}

function purchaseShipAfterburner(shipKey) {
  const config = SHIP_UPGRADE_CONFIG[shipKey];
  const ship = SPACESHIPS[shipKey];
  const upgrade = getShipUpgradeState(shipKey);
  const owned = ship && (ship.purchasedKey === null || saveData.purchasedShips[ship.purchasedKey]);
  if (!config || !owned || upgrade.afterburner) return;
  if (getScoreCookie() < config.afterburnerPrice) {
    purchaseAttemptFailed(config.afterburnerPrice);
    return;
  }
  setScoreCookie(getScoreCookie() - config.afterburnerPrice);
  saveShipUpgradeState(shipKey, { afterburner: true });
  if (viewedShipKey === shipKey) showShip(shipKey);
  updateUpgradePanel();
  setScorebar();
}


function updateShipAimDistance(shipKey, value) {
  saveShipUpgradeState(shipKey, { aimDistance: Number(value) });
  updateUpgradePanel();
}

function updateUpgradePanel() {
  const panel = document.getElementById('upgradePanel');
  const ship = SPACESHIPS[viewedShipKey];
  const config = SHIP_UPGRADE_CONFIG[viewedShipKey];
  if (!panel || !ship || !config) return;

  const upgrade = getShipUpgradeState(viewedShipKey);
  const owned = ship.purchasedKey === null || saveData.purchasedShips[ship.purchasedKey];

  const doubleGunAffordable = getScoreCookie() >= config.doubleGunPrice;
  const afterburnerAffordable = getScoreCookie() >= config.afterburnerPrice;

  panel.innerHTML = `
    <h2>SHIP UPGRADES</h2>
    <h3>DUAL ASTROPOPPERS</h3>
    <p>${upgrade.doubleGun ? 'Installed: two side-mounted guns.' : `Cost: ${config.doubleGunPrice.toLocaleString()} PP`}</p>
    ${!owned
      ? '<p style="color:#e8c84a;">PURCHASE THE SHIP FIRST</p>'
      : upgrade.doubleGun
      ? '<p style="color:#4adc6e;">PURCHASED</p>'
      : doubleGunAffordable
        ? `<button class="button buttonPurchase" onclick="purchaseShipDoubleGun('${viewedShipKey}')">Purchase</button>`
        : `<div class="shipLockBadge">Need ${(config.doubleGunPrice - getScoreCookie()).toLocaleString()} more PP</div>`
    }

    <h3>AFTERBURNER</h3>
    <p>Hold <b>D</b> to fly 2× faster!</p>
    <p>${upgrade.afterburner ? 'Installed: Afterburners enabled.' : `Cost: ${config.afterburnerPrice.toLocaleString()} PP`}</p>
    ${!owned
      ? '<p style="color:#e8c84a;">PURCHASE THE SHIP FIRST</p>'
      : upgrade.afterburner
      ? '<p style="color:#4adc6e;">PURCHASED</p>'
      : afterburnerAffordable
        ? `<button class="button buttonPurchase" onclick="purchaseShipAfterburner('${viewedShipKey}')">Purchase</button>`
        : `<div class="shipLockBadge">Need ${(config.afterburnerPrice - getScoreCookie()).toLocaleString()} more PP</div>`
    }

    <h3>AIM CONVERGENCE</h3>
    <p>Shots converge after <span class="upgradeValue">${upgrade.aimDistance} px</span></p>
    <input type="range" min="200" max="2000" step="25" value="${upgrade.aimDistance}" ${upgrade.doubleGun && owned ? '' : 'disabled'} oninput="updateShipAimDistance('${viewedShipKey}', this.value)">`;
}

function getShipStatsMarkup(ship, shipKey) {
  const stats = ship.stats;
  const gun = GUNS[ship.guns];
  const price = ship.price === 0 ? 'Free' : `${ship.price}PP`;
  const gunCount = getShipUpgradeState(shipKey).doubleGun ? 2 : ship.numberOfGuns;
  const gunLabel = `${gunCount}x ${gun.name}`;
  const gunTooltip = `<span class="gun-tooltip" role="tooltip">
    <strong>${gun.name}</strong>
    <span><b>Cooldown:</b> ${gun.cooldown} second${gun.cooldown === 1 ? '' : 's'}</span>
    <span><b>Bullet capacity:</b> ${gun.bulletcapacity}</span>
    <span><b>Fire mode:</b> ${gun.fireModes}</span>
    <span>${gun.writeUp}</span>
  </span>`;
  return `<span style="font-size: 16px; font-family: '8bit-font-text'; color: #c8c8d0;">PRICE: ${price}</span>`
    + buildStatBars(stats.speed, stats.maneuverability, stats.multiplier, stats.hullSize)
    + `<span style="font-size: 14px; font-family: '8bit-font-text'; color: #c8c8d0;">\n<br> WEAPON${gunCount === 1 ? '' : 'S'} // <span class="gun-tooltip-trigger" tabindex="0">${gunLabel}${gunCount === 1 ? '' : 's'}${gunTooltip}</span>\n<br><br>${stats.writeUp}</span><br>`;
}

function getShipPreview(ship, shipKey) {
  const image = getShipUpgradeState(shipKey).doubleGun
    ? SHIP_UPGRADE_CONFIG[shipKey].upgradedImage
    : ship.image;
  return `<img class="shipPrev" src="${image}">`;
}

function getShipButtonImage(ship, shipKey) {
  const image = getShipUpgradeState(shipKey).doubleGun
    ? SHIP_UPGRADE_CONFIG[shipKey].upgradedImage
    : ship.image;
  return image;
}

function updateShipNavImages() {
  const navShips = ['classic', 'pixpro'];

  navShips.forEach(shipKey => {
    const imgElement = document.getElementById(`nav-img-${shipKey}`);
    
    if (imgElement && SPACESHIPS[shipKey]) {
      const correctUrl = getShipButtonImage(SPACESHIPS[shipKey], shipKey);
      
      imgElement.src = correctUrl;
    }
  });
}

function equipShip(shipKey, button) {
  const ship = SPACESHIPS[shipKey];
  const stats = ship.stats;
  const gun = GUNS[ship.guns];
  const controls = ship.controls;
  const image = getShipUpgradeState(shipKey).doubleGun
    ? SHIP_UPGRADE_CONFIG[shipKey].upgradedImage
    : ship.image;
  setSelectedShipCookie(stats.speed, controls.sensitivity, gun.code, gun.cooldown, gun.fireModes.toLowerCase(), ship.gunPosX, ship.gunPosY, stats.multiplier, ship.width, ship.height, image, ship.name);
  if (button) shipEquiped(button);
  updateUpgradePanel();
}

function getEquipButton(shipKey) { return `<br><br><button class="button buttonPurchase" onclick="equipShip('${shipKey}', this)">Equip Ship</button>`; }

function getPurchaseButton(ship) { return `<button id="${ship.purchasedKey}PurchaseButton" class="button buttonPurchase" onclick="purchaseAttempt(${ship.price}, '${ship.purchasedKey}')">Purchase Ship</button><br>`; }

function showShip(shipKey) {
  viewedShipKey = shipKey;
  const ship = SPACESHIPS[shipKey];
  setPicture(getShipPreview(ship, shipKey));
  setCard(shipKey);
  updateUpgradePanel();
}


//----------------------------------------------------------------------
// STAT BARS BUILDER 
function buildStatBars(speed, maneuver, multiplier, hullSize) {
  function bar(label, value, max, color) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    return `<div class="stat-bar-wrap">
      <span class="stat-bar-label">${label}</span>
      <div class="stat-bar-track" tabindex="0" aria-label="${label.replace(/<[^>]*>/g, '')}: ${value}">
        <div class="stat-bar-fill" style="width:${pct}%; background:${color};"></div>
      </div>
      <span class="stat-bar-value" role="tooltip">${value}</span>
    </div>`;
  }
  return `<div style="margin: 12px 0 4px 0;">
    ${bar('<b>Speed</b>', speed, 50, '#e03a3a')}
    ${bar('<b>Maneuverability</b>', maneuver, 10, '#4a9bdc')}
    ${bar('<b>Multiplier</b>', multiplier, 10, '#e8c84a')}
    ${bar('<b>Hull Size</b>', hullSize, 10, '#9b6ad6')}
  </div>`;
}

//----------------------------------------------------------------------
var splashStrings = [
  "Holy hamsters!",
  "Gluten-free water!",
  "Tip your waiter!",
  "Gondor calls for aid!",
  "Made in the USA!",
  "Give me a break!",
  "Shout!",
  "Vegan-free!",
  "Totally accurate!",
  "Heavier than a kilogram of feathers!",
  "PEMDAS!",
  "Made for VSA!",
  "All I'm asking for is total perfection!",
  "Déjà vu!",
  "May contain bugs!",
  "Smash that subscribe button!",
  "Don't forget to breathe!",
  "Don't ask your doctor!",
  "Read the instructions before opening!",
  "Привет!",
  "Eat more cheeseballs!",
  "Don't forget your homework!",
  "Panic is not advised, but it is recommended!",
  "Nobody asked for your opinion!",
  "Try the calamari!",
  "Oh, it's you again!",
  "I'm ready!",
  "Pay as little taxes as legally permissible!",
  "Don't be naïve!",
  "What the fridge!",
  "May cause intense anxiety!",
  "Pineapple on pizza is good!",
  "Wow, nice shoes!",
  "Watch out for the mafia!",
  "That's kinda dicey!",
  "Это всего лишь несколько слов!",
  "Indie!",
  "Don't forget to lock up the chinchillas!",
  "Another one bites the dust!",
  "Check under your bed for Chuck Norris!",
  "Carry on!",
  "Don't let a drunk chicken stomp on your crops!",
  "Houston, we have a major problem!",
  "It gets worse, trust me!",
  "So many pixels!",
  "Oh come on, Patrick!",
  "Don't be scared of swamp puppies!",
  "Let's shoot for 40!",
  "Todd is just a garbage last name!",
  "Licking ice cream is just wrong!",
  "Touch grass!",
  "Timmy can play golf with a bowling ball!",
  "Wheels are more abundant than doors!",
  "Three little birds!",
  "Ha roligt!",
  "Nyango Star destroys the drums!",
  "You underestimate my power!",
  "That's some good beans!",
  "Spoons are not inherently evil!",
  "Made with Javascript!",
  "Your shoe is untied!",
  "Good afternoon, good evening, and good night!",
  "It's elementary, my dear Watson!",
  "Probably doesn't contain peanuts, but who knows!",
  "Produced in a two-story house!",
  "I'm going on an adventure!",
  "Dream on!",
  "Chuck Norris can kill two stones with one bird!",
  "Grenade!",
  "Seal pups are pretty average!",
  "Take a break from your phone already!",
  "Flying straight isn't a good idea!",
  "Still a work in progress!",
  "Technoblade never dies!",
  "Do not go gentle into that good night!",
  "Everything is awesome!",
  "Look behind you!",
  "It's Schoology, not Schoalagy!",
  "It is Thursday, my dudes!",
  "That's a lotta damage!",
  "Ask the Panzer of the Lake!",
  "Feedback is greatly appreciated!",
  "Emotional damage!",
  "Brother, may I have some oats!",
  "Think for yourself!",
  "Tell your friends!",
  "The Dyatlov Pass wasn't just an avalanche!",
  "Agency FB is pretty cool!",
  "Support the troops!",
  "You may not sleep now, there are monsters nearby!",
  "Microsoft One Drive is malware!",
  "Attack the D point!",
  "Do a barrel roll!",
  "Try listening to real music!",
  "It is Wednesday, my dudes!",
  "Don't put rubber bands in your hair!",
  "Poyo!",
  "Free to play!",
  "Around 4.5k lines of code!",
  "I'm tired of this, Grandpa!"
];

document.getElementById("splashText").textContent =
  splashStrings[Math.floor(Math.random() * splashStrings.length)];

// VARIABLES

// Misc
let distanceTraveled = 0;
let worldSpeedMultiplier = 1

// Settings state
let settingsMusicVol   = 0.25;
let settingsSfxVol     = 0.25;
let settingsShowHitbox = false;

// For game canvas
var myGamePiece;
var myObstacles = [];
var myBullets = [];
var myBarriers = [];
var myScore;
var myObstacle;
var barrierOpening = 300;
var myBackground;
var myAmmo;
var myMags = [];
var speedLines = [];
const devDiagonalObstacles = new URLSearchParams(window.location.search).has('devDiagonal');
var crashFlash = { active: false, alpha: 0, elapsed: 0, duration: 18 };
var crashSlowmo = { active: false, elapsed: 0, duration: 20 };

// Explosions
var explosions = [];
var screenShake = { active: false, intensity: 0, duration: 0, elapsed: 0 };

function spawnExplosion(x, y) {
    explosions.push({ x: x, y: y, radius: 2, maxRadius: 500, alpha: 1.0 });
    explosionSound.play();
}

function updateExplosions() {
    for (var e = explosions.length - 1; e >= 0; e--) {
        explosions[e].radius += 2.5;
        explosions[e].alpha  -= 0.07;
        if (explosions[e].alpha <= 0 || explosions[e].radius >= explosions[e].maxRadius) {
            explosions.splice(e, 1);
        }
    }
}

function drawExplosions() {
    var ctx = myGameArea.context;
    const sx = myGameArea.shakeX || 0;
    const sy = myGameArea.shakeY || 0;
    for (var e = 0; e < explosions.length; e++) {
        var exp = explosions[e];
        var gradient = ctx.createRadialGradient(
          exp.x + sx, exp.y + sy, 0,
          exp.x + sx, exp.y + sy, exp.radius
        );
        gradient.addColorStop(0,   "rgba(255, 255, 180, " + exp.alpha + ")");
        gradient.addColorStop(0.3, "rgba(255, 160,   0, " + exp.alpha + ")");
        gradient.addColorStop(1,   "rgba(200,  40,   0, 0)");
        ctx.beginPath();
        ctx.arc(exp.x + sx, exp.y + sy, exp.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

  function updateAndDrawSpeedLines() {
    const ctx = myGameArea.context;
    const sx = myGameArea.shakeX || 0;
    const sy = myGameArea.shakeY || 0;
    const score = myGameArea.frameNo / 6 * getSelectedShipCookie().at(7);
    const scoreIntensity = Math.min(score / 8000, 1);
    const afterburnerIntensity = afterburnerSpeedMultiplier > 1.05 ? (afterburnerSpeedMultiplier - 1) : 0;
    const totalIntensity = Math.max(scoreIntensity, afterburnerIntensity);
    
    if (totalIntensity < 0.1) return;

    const spawnChance = afterburnerActive ? totalIntensity * 0.6 : totalIntensity * 0.4;
    if (Math.random() < spawnChance) {
      speedLines.push({
        x: GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        length: 60 + Math.random() * 180 * totalIntensity,
        speed: 18 + Math.random() * 14 * afterburnerSpeedMultiplier,
        alpha: 0.08 + Math.random() * 0.13 * totalIntensity,
        width: 0.5 + Math.random() * 1.0 * afterburnerSpeedMultiplier,
      });
    }

    for (let i = speedLines.length - 1; i >= 0; i--) {
      const l = speedLines[i];
      l.x -= l.speed * afterburnerSpeedMultiplier;
      if (l.x + l.length < 0) { speedLines.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(200, 210, 255, ${l.alpha})`;
      ctx.lineWidth = l.width;
      ctx.beginPath();
      ctx.moveTo(l.x + l.length + sx, l.y + sy);
      ctx.lineTo(l.x + sx, l.y + sy);
      ctx.stroke();
    }
  }

  function drawCrashFlash() {
  if (!crashFlash.active) return;
  const ctx = myGameArea.context;
  ctx.save();
  ctx.globalAlpha = crashFlash.alpha;
  const r = 255;
  const g = Math.round(255 * (crashFlash.alpha));
  const b = Math.round(255 * (crashFlash.alpha));
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.restore();
  crashFlash.elapsed++;
  crashFlash.alpha = Math.max(0, 1.0 - (crashFlash.elapsed / crashFlash.duration));
  if (crashFlash.elapsed >= crashFlash.duration) crashFlash.active = false;
}

// Misc
var gameoverSound;
var explosionSound;
var backgroundIngame;
var afterburnerSoundUp;      // Engine powering up
var afterburnerSoundDown;    // Engine powering down/reverse

// ── HIGH SCORE ──
function getHighScore() {
  const c = document.cookie.match(/(^|;)\s*highScore=([^;]+)/);
  return c ? parseInt(c[2]) : 0;
}

function setHighScore(score) {
  if (score > getHighScore()) {
    document.cookie = `highScore=${score}; expires=Thu, 18 Dec 2099 12:00:00 UTC; path=/`;
    return true; // new record
  }
  return false;
}

//------------------------------VARIABLES OVER-----------------------------//


function hideDiv(divID) {
  var x = document.getElementById(divID);
  x.style.display = "none";
  console.log(divID + " hidden.");
}

function showDiv(divID) {
  var x = document.getElementById(divID);
  x.style.display = divID === 'startScreen' ? "flex" : "block";
}

function closePanels() {
  ['howPlay', 'changelog', 'credits', 'settings'].forEach(id => hideDiv(id));
  hideDiv('panelBackdrop');
  showDiv('startScreen');
}

function setCard(shipKey) {
  const ship = SPACESHIPS[shipKey];
  var x = document.getElementById("spaceshipName");
  x.innerHTML = ship.name;
  var y = document.getElementById("spaceshipStats");
  y.innerHTML = getShipStatsMarkup(ship, shipKey);
  const pp = getScoreCookie();

  if (ship.purchasedKey) {
    if (!saveData.purchasedShips[ship.purchasedKey]) {
      // Not purchased — show purchase button or lock badge
      if (pp >= ship.price) {
        y.innerHTML += getPurchaseButton(ship);
      } else {
        y.innerHTML += `<div class="shipLockBadge">Need ${(ship.price - pp).toLocaleString()} more PP</div>`;
      }
    }
  }

  if (getSelectedShipCookie().at(11) !== ship.name && (ship.purchasedKey === null || saveData.purchasedShips[ship.purchasedKey])) {
    y.innerHTML += getEquipButton(shipKey);
  }

  console.log("setCard function called");
}

function shipEquiped(e) {
  e.style.display = "none";
}

function setPicture(pictureName) {
  var x = document.getElementById("spaceshipPreview");
  x.innerHTML = pictureName;
  console.log("setPicture function called");
}


function setScorebar() {
  let pixelPieces = getScoreCookie();
  let highScore = getHighScore();
  let score_hangarBar = `<span style="font-size: 20px; float:right; padding-right: 70px; padding-top: 3px; color: #e8c84a;">PIXEL PIECES: ${pixelPieces} &nbsp;|&nbsp; <span style="color:#4adc6e;">BEST: ${highScore}</span></span>`;
  document.getElementById("hangarBar").innerHTML = `<button onclick="hideDiv('hangar') || showDiv('startScreen')" style="text-size: 16; font-family: '8bit-font-text'" class="backbuttonhangarbar">-BACK</button>` + score_hangarBar;
  console.log("setScorebar function called");
}

// ── SCORE TEXT FLASH ──
var lastDisplayedScore = 0;
function flashScoreIfNeeded(currentScore) {
  const el = document.getElementById('scoreHUD');
  if (!el) return;
  const rounded = Math.round(currentScore);
  if (rounded !== lastDisplayedScore && rounded % 100 === 0 && rounded > 0) {
    el.classList.remove('score-flash');
    void el.offsetWidth; // reflow
    el.classList.add('score-flash');
  }
  lastDisplayedScore = rounded;
}

// Update DOM HUDs for score and ammo
function updateHUDs(currentScore) {
  try {
    const scoreEl = document.getElementById('scoreHUD');
    const ammoEl  = document.getElementById('ammoHUD');
    const s = typeof currentScore === 'number' ? Math.round(currentScore) : Math.round((distanceTraveled * getSelectedShipCookie().at(7)) / 6);
    if (scoreEl) scoreEl.textContent = 'SCORE: ' + s;
    if (ammoEl) {
      ammoEl.style.display = 'flex';
      const ammo = myGamePiece && myGamePiece.ammo != null ? myGamePiece.ammo : 0;
      const maxAmmo = getMaxAmmo();
      ammoEl.setAttribute('aria-label', `Ammo: ${ammo} of ${maxAmmo}`);
      ammoEl.innerHTML = Array.from({ length: maxAmmo }, (_, index) =>
        `<span class="ammo-cell${index < ammo ? ' is-loaded' : ''}" aria-hidden="true"></span>`
      ).join('');
    }
  } catch (e) { /* ignore */ }
}

// ── HEAT GAUGE HTML ──
function createHeatGauge() {
  if (document.getElementById('heatGauge')) return;
  
  const gaugeHTML = `
    <div id="heatGauge" style="position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); width: 400px; z-index: 150; pointer-events: none; display: none;">
      <div style="font-family: '8bit-font-text'; font-size: 14px; color: #c8c8d0; text-align: center; margin-bottom: 6px; text-shadow: 1px 1px #1a0808;">THERMAL LEVEL</div>
      <div style="background: #1a0808; border: 2px solid #4a1a1a; border-radius: 6px; height: 18px; overflow: hidden;">
        <div id="heatGaugeFill" style="height: 100%; width: 0%; background: #e8c84a; transition: width 0.05s ease; box-shadow: 0 0 8px rgba(232, 200, 74, 0.5);"></div>
      </div>
      <div id="heatGaugeText" style="font-family: '8bit-font-text'; font-size: 12px; color: #e8c84a; text-align: right; margin-top: 4px; text-shadow: 1px 1px #1a0808;">0%</div>
    </div>
  `;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = gaugeHTML;
  document.body.appendChild(tempDiv.firstElementChild);
}

// Update heat gauge display
function updateHeatGauge() {
  let gaugeEl = document.getElementById('heatGauge');
  let gaugeFill = document.getElementById('heatGaugeFill');
  let gaugeText = document.getElementById('heatGaugeText');
  
  if (!gaugeEl) return;
  
  // Check if afterburner upgrade is purchased for current ship
  const selectedShipName = getSelectedShipCookie().at(11);
  const selectedShipKey = selectedShipName === SPACESHIPS.pixpro.name ? 'pixpro' : 'classic';
  const upgrade = getShipUpgradeState(selectedShipKey);
  const hasAfterburner = upgrade.afterburner;
  
  // Only show gauge if afterburner upgrade is purchased
  if (hasAfterburner && (afterburnerActive || currentHeat > 0)) {
    gaugeEl.style.display = 'block';
    
    const pct = Math.min(100, currentHeat);
    if (gaugeFill) {
      gaugeFill.style.width = pct + '%';
      
      // Color-coded heat levels
      if (currentHeat < 40) {
        // LOW: GREEN - Safe zone
        gaugeFill.style.background = '#4adc6e';
        gaugeFill.style.boxShadow = '0 0 8px #4adc6e';
        gaugeText.style.color = '#4adc6e';
        gaugeText.style.textShadow = '0 0 6px #4adc6e';
      } else if (currentHeat < 65) {
        // MID: YELLOW - Getting warm
        gaugeFill.style.background = '#e8c84a';
        gaugeFill.style.boxShadow = '0 0 8px #e8c84a';
        gaugeText.style.color = '#e8c84a';
        gaugeText.style.textShadow = '0 0 6px #e8c84a';
      } else if (currentHeat < 85) {
        // HIGH: ORANGE - Danger zone
        gaugeFill.style.background = '#ff9500';
        gaugeFill.style.boxShadow = '0 0 10px #ff9500';
        gaugeText.style.color = '#ff9500';
        gaugeText.style.textShadow = '0 0 6px #ff9500';
      } else {
        // NEAR-DEATH: RED - Critical!
        gaugeFill.style.background = '#ff3333';
        gaugeFill.style.boxShadow = '0 0 12px #ff3333';
        gaugeText.style.color = '#ff3333';
        gaugeText.style.textShadow = '0 0 8px #ff3333';
      }
    }
    if (gaugeText) {
      gaugeText.textContent = Math.round(currentHeat) + '%';
    }
  } else {
    // Hide completely if no upgrade or no heat
    gaugeEl.style.display = 'none';
  }
}

function addScore(score) {
  let scorep = score * getSelectedShipCookie().at(7);
  let scoref = scorep + getScoreCookie();
  setScoreCookie(Math.round(scoref));
  console.log("Score: " + scoref);
  setScorebar();
}

function purchaseAttempt(purchasePrice, shipName) {
  if (getScoreCookie() >= purchasePrice) {
    console.log("Purchase complete!");
    let score = (getScoreCookie() - purchasePrice);
    setScoreCookie(Math.round(score));

    if (shipName == 'pixpro') {
      setPurchasedShipsCookie('yes', 'no', 'no');
      var x = document.getElementById('pixproPurchaseButton');
      if (x) x.style.display = "none";
      setCard('pixpro');
    }

  } else {
    purchaseAttemptFailed(purchasePrice);
    console.log("Purchase impossible.");
  }
  setScorebar();
}

function purchaseAttemptFailed(price) {
  var x = document.getElementById('overlay');
  x.style.display = 'block';
  var y = document.getElementById('purchaseDialog');
  y.style.display = 'block';
  let pixelPieces = getScoreCookie();
  let needPixelPieces = (price - pixelPieces);
  let dialogHeader = `<span style="font-size: 40px; color: #e03a3a;">Purchase Attempt Failed <br><br></span>`;
  let dialogContent = `<span style="font-size: 20px; color: #c8c8d0;">You need ${needPixelPieces} more Pixel Pieces.</span>`;
  let dialog = dialogHeader + dialogContent;
  y.innerHTML = dialog + `<button onclick="hideDiv('overlay') || hideDiv('purchaseDialog')" style="font-size: 20; font-family: '8bit-font-text'" class="backbuttondialog" id="backbuttondialog">BACK</button>`;
}

//--------------------------SETTING COOKIES---------------------//

//--------------------------SAVE SYSTEM---------------------//

const SAVE_KEY = 'pixelPilotSave';

const DEFAULT_SAVE = {
  score: 0,

  selectedShip: {
    speed: SPACESHIPS.classic.stats.speed,
    sensitivity: SPACESHIPS.classic.controls.sensitivity,
    guns: GUNS[SPACESHIPS.classic.guns].code,
    cooldown: GUNS[SPACESHIPS.classic.guns].cooldown,
    fireModes: GUNS[SPACESHIPS.classic.guns].fireModes.toLowerCase(),
    gunPosX: SPACESHIPS.classic.gunPosX,
    gunPosY: SPACESHIPS.classic.gunPosY,
    multiplier: SPACESHIPS.classic.stats.multiplier,
    width: SPACESHIPS.classic.width,
    height: SPACESHIPS.classic.height,
    image: SPACESHIPS.classic.image,
    name: SPACESHIPS.classic.name,
  },

  purchasedShips: {
    pixpro: false,
    ship2: false,
    ship3: false,
  },

  settings: {
    musicVolume: 0.25,
    sfxVolume: 0.25,
    showHitboxes: false,
  },

  upgrades: {
    classic: {
      doubleGun: false,
      afterburner: false,
      aimDistance: 600,
    },
    pixpro: {
      doubleGun: false,
      afterburner: false,
      aimDistance: 600,
    },
  },
};

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);

    if (!raw) {
      const defaultSave = structuredClone(DEFAULT_SAVE);
      localStorage.setItem(SAVE_KEY, JSON.stringify(defaultSave));
      return defaultSave;
    }

    const storedSave = JSON.parse(raw);
    if (!storedSave || typeof storedSave !== 'object') {
      throw new Error('Saved data is not an object');
    }

    const defaultSave = structuredClone(DEFAULT_SAVE);
    const storedSelectedShip = storedSave.selectedShip && typeof storedSave.selectedShip === 'object'
      ? storedSave.selectedShip
      : {};

    return {
      ...defaultSave,
      ...storedSave,
      selectedShip: {
        ...defaultSave.selectedShip,
        ...storedSelectedShip,
        name: storedSelectedShip.name || defaultSave.selectedShip.name,
      },
      purchasedShips: {
        ...defaultSave.purchasedShips,
        ...(storedSave.purchasedShips && typeof storedSave.purchasedShips === 'object'
          ? storedSave.purchasedShips
          : {}),
      },
      settings: {
        ...defaultSave.settings,
        ...(storedSave.settings && typeof storedSave.settings === 'object'
          ? storedSave.settings
          : {}),
      },
      upgrades: {
        ...defaultSave.upgrades,
        ...(storedSave.upgrades && typeof storedSave.upgrades === 'object'
          ? storedSave.upgrades
          : {}),
        classic: {
          ...defaultSave.upgrades.classic,
          ...(storedSave.upgrades?.classic && typeof storedSave.upgrades.classic === 'object'
            ? storedSave.upgrades.classic
            : {}),
        },
        pixpro: {
          ...defaultSave.upgrades.pixpro,
          ...(storedSave.upgrades?.pixpro && typeof storedSave.upgrades.pixpro === 'object'
            ? storedSave.upgrades.pixpro
            : {}),
        },
      },
    };
  } catch (err) {
    console.error('Failed to load save', err);
    return structuredClone(DEFAULT_SAVE);
  }
}

let saveData = loadSave();

settingsMusicVol = Number.isFinite(Number(saveData.settings.musicVolume))
  ? Math.min(1, Math.max(0, Number(saveData.settings.musicVolume)))
  : settingsMusicVol;
settingsSfxVol = Number.isFinite(Number(saveData.settings.sfxVolume))
  ? Math.min(1, Math.max(0, Number(saveData.settings.sfxVolume)))
  : settingsSfxVol;

function saveGame() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(saveData)
    );
  } catch (err) {
    console.error('Failed to save game', err);
  }
}

function setMusicVolume(value) {
  settingsMusicVol = parseFloat(value);
  saveData.settings.musicVolume = settingsMusicVol;
  saveGame();
}

function setSfxVolume(value) {
  settingsSfxVol = parseFloat(value);
  saveData.settings.sfxVolume = settingsSfxVol;
  saveGame();
}

/* ---------------- SCORE ---------------- */

function setScoreCookie(score) {
  saveData.score = Math.round(score);
  saveGame();
}

function getScoreCookie() {
  return Number(saveData.score) || 0;
}

/* ---------------- SELECTED SHIP ---------------- */

function setSelectedShipCookie(
  speed,
  sensitivity,
  guns,
  cooldown,
  fireModes,
  gunPosX,
  gunPosY,
  multiplier,
  width,
  height,
  url,
  name
) {
  saveData.selectedShip = {
    speed,
    sensitivity,
    guns,
    cooldown,
    fireModes,
    gunPosX,
    gunPosY,
    multiplier,
    width,
    height,
    image: url,
    name,
  };

  saveGame();

  console.log(
    'Selected ship saved:',
    saveData.selectedShip
  );
}

function getSelectedShipCookie() {
  const s = saveData.selectedShip;
  const gunCode = typeof s.guns === 'string' ? s.guns : GUNS[SPACESHIPS.classic.guns].code;
  const shipKey = s.name === SPACESHIPS.pixpro.name ? 'pixpro' : 'classic';
  const image = getShipUpgradeState(shipKey).doubleGun
    ? SHIP_UPGRADE_CONFIG[shipKey].upgradedImage
    : s.image;

  return [
    s.speed,
    s.sensitivity,
    gunCode,
    s.cooldown,
    s.fireModes,
    s.gunPosX,
    s.gunPosY,
    s.multiplier,
    s.width,
    s.height,
    image,
    s.name,
  ];
}

/* ---------------- PURCHASED SHIPS ---------------- */

function setPurchasedShipsCookie(
  pixpro,
  ship2,
  ship3
) {
  saveData.purchasedShips = {
    pixpro: pixpro === 'yes',
    ship2: ship2 === 'yes',
    ship3: ship3 === 'yes',
  };

  saveGame();
}

function getPurchasedShipsCookie() {
  return [
    saveData.purchasedShips.pixpro ? 'yes' : 'no',
    saveData.purchasedShips.ship2 ? 'yes' : 'no',
    saveData.purchasedShips.ship3 ? 'yes' : 'no',
  ];
}

/* ---------------- SPACESHIPS ---------------- */

function setSpaceshipsCookie(spaceShips) {
  saveData.spaceships = spaceShips;
  saveGame();
}

function getSpaceshipsCookie() {
  return saveData.spaceships || [];
}

/* ---------------- INITIALIZATION ---------------- */

function queryShipCookie() {
  if (!saveData.selectedShip || !saveData.purchasedShips || !saveData.settings || !saveData.upgrades) {
    saveData = {
      ...structuredClone(DEFAULT_SAVE),
      ...saveData,
      selectedShip: {
        ...DEFAULT_SAVE.selectedShip,
        ...(saveData.selectedShip || {}),
      },
      purchasedShips: {
        ...DEFAULT_SAVE.purchasedShips,
        ...(saveData.purchasedShips || {}),
      },
      settings: {
        ...DEFAULT_SAVE.settings,
        ...(saveData.settings || {}),
      },
      upgrades: {
        ...DEFAULT_SAVE.upgrades,
        ...(saveData.upgrades || {}),
        classic: {
          ...DEFAULT_SAVE.upgrades.classic,
          ...(saveData.upgrades?.classic || {}),
        },
        pixpro: {
          ...DEFAULT_SAVE.upgrades.pixpro,
          ...(saveData.upgrades?.pixpro || {}),
        },
      },
    };
    saveGame();
  }
}

//--------------------------- GAME MECHANICS UNDERNEATH ----------------------------------//

function startGame() {
  if (isPortraitMobile()) {
    pendingGameStart = true;
    document.getElementById('portraitGameBlocker').style.display = 'flex';
    return false;
  }

  // Create heat gauge on first game start
  createHeatGauge();

  myGamePiece = new component(
    Number(getSelectedShipCookie().at(8)),
    Number(getSelectedShipCookie().at(9)),
    getSelectedShipCookie().at(10),
    GAME_WIDTH * 0.05,
    GAME_HEIGHT * 0.50,
    "image",
    "gamePiece",
    "n/a"
  );
  myGamePiece.tiltAngle = 0;
  myGamePiece.tiltTarget = 0;
  myGamePiece.ammo = getMaxAmmo();
  // HUDs are now DOM elements, not drawn on canvas
  updateHUDs(0);
  myObstacle  = new component(30, 20, "black", 10, 0, "obstacle", "n/a", "n/a");
  myBackground = new component(
      GAME_WIDTH,
      GAME_HEIGHT,
      "./images/backgrounds/standard_background.png",
      0,
      0,
      "background",
      "n/a",
      "n/a"
  );
  myGameArea.start();
  stopMenuMusic();
gameoverSound  = new sound("./audio/freesound_community-8-bit-explosion.mp3", "effect");
  shootingSound  = new sound("./audio/shooting.mp3", "effect");
  explosionSound = new sound("./audio/u_b32baquv5u-explosion-9-340460.mp3", "effect");
  pickUpSound    = new sound("./audio/pickup.mp3", "effect");
  afterburnerSoundUp = new sound("./audio/afterburner-sfx_up.mp3", "effect");
  afterburnerSoundDown = new sound("./audio/afterburner-sfx_down.mp3", "effect");
  
  // Capture durations after metadata loads
  afterburnerSoundUp.sound.addEventListener('loadedmetadata', function() {
    afterburnerUpAudioDuration = this.duration || 5;
    console.log('[Afterburner] Up sound duration:', afterburnerUpAudioDuration.toFixed(2), 'seconds');
  });
  
  afterburnerSoundDown.sound.addEventListener('loadedmetadata', function() {
    afterburnerDownAudioDuration = this.duration || 10;
    console.log('[Afterburner] Down sound duration:', afterburnerDownAudioDuration.toFixed(2), 'seconds');
  });
  
  // Also trigger on load for cached audio
  if (afterburnerSoundUp.sound.readyState >= 2) {
    afterburnerUpAudioDuration = afterburnerSoundUp.sound.duration || 5;
  }
  if (afterburnerSoundDown.sound.readyState >= 2) {
    afterburnerDownAudioDuration = afterburnerSoundDown.sound.duration || 10;
  }
  startDynamicMusic();
  showTouchControls();

  // Show high-score HUD
  const hsEl = document.getElementById('highScoreHUD');
  if (hsEl) { hsEl.style.display = 'block'; hsEl.textContent = 'BEST: ' + getHighScore().toLocaleString(); }
}

function restartGame() {
  myGameArea.stop();
  myGamePiece.ammo = getMaxAmmo();
  firstShot = true;
  myGamePiece = null;
  myObstacles = [];
  myObstacles.spawnCount = 0;    
  myObstacles.lastGapCenterY = undefined; 
  barrierOpening = 300;
  myBarriers = [];
  myBullets = [];
  myObstacle = null;
  myBackground = null;
  explosions = [];
  speedLines = [];
  screenShake.active = false; 
  screenShake.intensity = 0;
  afterburnerShakeIntensity = 0;
  crashFlash.active = false;
  crashFlash.alpha = 0;
  crashFlash.elapsed = 0;
  crashSlowmo.active = false;
  crashSlowmo.elapsed = 0;
  lastDisplayedScore = 0;
  shipAfterburnerOffset = 0;
  afterburnerActive = false;
  afterburnerSpeedMultiplier = 1;
  myGameArea.context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  hideDiv('endScreen');
  startGame();
  setEndScreen();
  explosionSound.stop();
  myGameArea.lastTime = 0;
  gamePaused = false;
  currentHeat = 0;
  deathCause = 'crash';
  engineFlames = [];
  afterburnerActive = false;
  afterburnerKeyDownPending = false;
  isPlayingDownSound = false;
  afterburnerStartTime = 0;
  afterburnerDuration = 0;
  afterburnerSpeedMultiplier = 1;
  if (afterburnerSoundUp) {
    afterburnerSoundUp.stop();
    afterburnerSoundUp.sound.currentTime = 0;
  }
  if (afterburnerSoundDown) {
    afterburnerSoundDown.stop();
    afterburnerSoundDown.sound.currentTime = 0;
  } 
  distanceTraveled = 0;
}


const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

let GAME_WIDTH = BASE_WIDTH;
let GAME_HEIGHT = BASE_HEIGHT;

let worldScale = 1;

function updateGameSize() {
    worldScale = Math.min(
        window.innerWidth / BASE_WIDTH,
        window.innerHeight / BASE_HEIGHT
    );
}

var myGameArea = {
  canvas: document.createElement("canvas"),

  scaleX: 1,
  scaleY: 1,

  start: function() {

    this.context = this.canvas.getContext("2d");

    document.body.insertBefore(
      this.canvas,
      document.body.childNodes[0]
    );

    this.resize();

    window.addEventListener(
      "resize",
      () => this.resize()
    );

    this.frameNo = 0;
    this.lastTime = 0;
    this.rafId = null;

    const loop = (timestamp) => {

      const delta = this.lastTime
        ? (timestamp - this.lastTime) / 16.667
        : 1;

      this.lastTime = timestamp;

      updateGameArea(delta);

      this.rafId =
        requestAnimationFrame(loop);
    };

    this.rafId =
      requestAnimationFrame(loop);

    myGameArea.keys = {};

    window.addEventListener(
      "keydown",
      function(e) {
        myGameArea.keys[e.keyCode] = true;
      }
    );

    window.addEventListener(
      "keyup",
      function(e) {
        myGameArea.keys[e.keyCode] = false;
      }
    );
  },

  resize: function() {

    const scale = Math.max(
      window.innerWidth / GAME_WIDTH,
      window.innerHeight / GAME_HEIGHT
    );

    const cssW = GAME_WIDTH * scale;
    const cssH = GAME_HEIGHT * scale;
    const dpr = window.devicePixelRatio || 1;


    this.canvas.width = Math.round(GAME_WIDTH * scale * dpr);
    this.canvas.height = Math.round(GAME_HEIGHT * scale * dpr);


    this.canvas.style.width = cssW + "px";
    this.canvas.style.height = cssH + "px";
    this.canvas.style.position = "absolute";
    this.canvas.style.left = ((window.innerWidth - cssW) / 2) + "px";
    this.canvas.style.top =  ((window.innerHeight - cssH) / 2) + "px";


    this.scaleX = scale;
    this.scaleY = scale;
    this.context.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    if (this.context.imageSmoothingEnabled !== undefined) this.context.imageSmoothingEnabled = false;
  },

  clear: function() {
    this.context.clearRect(
      0,
      0,
      GAME_WIDTH,
      GAME_HEIGHT
    );
  },

  stop: function() {
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.lastTime = 0;
  }
};

function component(width, height, color, x, y, type, secondaryType, healthpoints) {
  this.type = type;
  this.width = width;
  this.height = height;
  this.speedX = 0;
  this.speedY = 0;
  this.x = x;
  this.y = y;
  this.healthpoints = healthpoints;
  this.secondaryType = secondaryType;
  this.update = function() {
    ctx = myGameArea.context;
    const sx = myGameArea.shakeX || 0;
    const sy = myGameArea.shakeY || 0;

    if (type == "image" || type == "background" || secondaryType == "mag") {
      this.image = new Image();
      this.image.src = color;
    }

    if (secondaryType == "gamePiece") {
      this.gunType    = getSelectedShipCookie().at(2);
      this.cooldown   = getSelectedShipCookie().at(3);
      this.fireModes  = getSelectedShipCookie().at(4);
      this.gunPosX    = getSelectedShipCookie().at(5);
      this.gunPosY    = getSelectedShipCookie().at(6);
    }

    if (secondaryType == "Trobstacle") {
      this.heighR = 0;
      this.gapR   = 0;
    }

    if (this.type == "text") {
      ctx.font = "30px '8bit-font-text', sans-serif";
      ctx.fillStyle = color;
      ctx.fillText(this.text, this.x + sx, this.y + sy);
    }

    if (type == "image") {
      if (this.secondaryType === "gamePiece" && this.tiltAngle !== undefined) {
        const cx = this.x + (this.width + 15) / 2 + sx;
        const cy = this.y + (this.height + 15) / 2 + sy;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.tiltAngle);
        ctx.drawImage(this.image, -(this.width + 15) / 2, -(this.height + 15) / 2, this.width + 15, this.height + 15);
        ctx.restore();
      } else {
        ctx.drawImage(this.image, this.x + sx, this.y + sy, this.width + 15, this.height + 15);
      }
    }

    if (secondaryType == "mag") {
      ctx.drawImage(this.image, this.x + sx, this.y + sy, this.width + 15, this.height + 15);
    }

    if (type == "background") {
      ctx.drawImage(this.image, this.x + sx, this.y + sy, this.width, this.height);
      ctx.drawImage(this.image, this.x + this.width + sx, this.y + sy, this.width, this.height);
    }

    if (type == "obstacles" || type == "bullets") {
      ctx.fillStyle = color;
      if (this.angle) {
        ctx.save();
        ctx.translate(this.x + this.width / 2 + sx, this.y + this.height / 2 + sy);
        ctx.rotate(this.angle);
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
      } else {
        ctx.fillRect(this.x + sx, this.y + sy, this.width, this.height);
      }
    }

    if (secondaryType == "gamePiece" && settingsShowHitbox) {
      const hitboxes = getShipHitboxes(this.x, this.y, this.width, this.height, this.tiltAngle || 0);
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      for (let b = 0; b < hitboxes.length; b++) {
        const polygon = hitboxes[b];
        ctx.beginPath();
        ctx.moveTo(polygon[0].x + sx, polygon[0].y + sy);
        for (let point = 1; point < polygon.length; point++) {
          ctx.lineTo(polygon[point].x + sx, polygon[point].y + sy);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  };

  this.newPos = function() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.type == "background") {
      if (this.x <= -(this.width)) { this.x = 0; }
    }
    this.hitBottom();
    this.hitTop();
  };

  this.hitBottom = function() {
    var rockbottom = (GAME_HEIGHT - this.height);
    if (this.y > rockbottom) { this.y = rockbottom; }
  };

  this.hitTop = function() {
    var maxScreenHeight = -10;
    if (this.y < maxScreenHeight) { this.y = maxScreenHeight; }
  };

  this.crashWith = function(otherobj) {
    if (this == myGamePiece) {
      const hitboxes = getShipHitboxes(this.x, this.y, this.width, this.height, this.tiltAngle || 0);
      const obstaclePolygon = getComponentPolygon(otherobj);
      for (let b = 0; b < hitboxes.length; b++) {
        if (polygonsIntersect(hitboxes[b], obstaclePolygon)) {
          if (!this.crashed && otherobj.secondaryType !== "mag") {
            this.crashed = true;
            console.log(otherobj.secondaryType)
            this.onCrash();
          }
          return true;
        }
      }
      return false;
    }

    var myleft   = this.x;
    var myright  = this.x + this.width;
    var mytop    = this.y;
    var mybottom = this.y + this.height;
    var otherleft   = otherobj.x;
    var otherright  = otherobj.x + otherobj.width;
    var othertop    = otherobj.y;
    var otherbottom = otherobj.y + otherobj.height;
    var crash = !((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright));

    if (this.type === "bullets" && crash) {
      spawnExplosion(this.x + this.width / 2, this.y + this.height / 2);
    }

    return crash;
  };

this.onCrash = function() {
  screenShake.active = true;
  screenShake.intensity = 14;
  screenShake.duration = 30;
  screenShake.elapsed = 0;

  crashFlash.active = true;
  crashFlash.alpha = 1.0;
  crashFlash.elapsed = 0;

  crashSlowmo.active = true;
  crashSlowmo.elapsed = 0;

  spawnExplosion(myGamePiece.x + myGamePiece.width / 2, myGamePiece.y + myGamePiece.height / 2);

  stopDynamicMusic();
  gameoverSound.play();
  hideTouchControls();
  
  // Cleanup all afterburner sounds on crash
  const crashedAfterburnerActive = afterburnerActive;
  const downWasPlaying = isPlayingDownSound;
  console.log('[Afterburner] Crashed while', crashedAfterburnerActive ? 'active' : 'inactive', '-', downWasPlaying ? 'down sound was playing' : 'down sound not active');
  
  if (afterburnerSoundUp) {
    afterburnerSoundUp.stop();
    afterburnerSoundUp.sound.currentTime = 0;
  }
  if (afterburnerSoundDown) {
    afterburnerSoundDown.stop();
    afterburnerSoundDown.sound.currentTime = 0;
  }
  afterburnerActive = false;
  afterburnerKeyDownPending = false;
  isPlayingDownSound = false;
  afterburnerStartTime = 0;
  afterburnerDuration = 0;
  const ammoEl = document.getElementById('ammoHUD');
  if (ammoEl) ammoEl.style.display = 'none';
  const hsEl = document.getElementById('highScoreHUD');
  if (hsEl) hsEl.style.display = 'none';

  const shakeInterval = setInterval(function() {
    if (!screenShake.active) {
      clearInterval(shakeInterval);
      myGameArea.stop();
      showDiv('endScreen');
      setEndScreen();
      setScorebar();
    }
  }, 16);
};
}

function setEndScreen() {
  const rawScore     = (distanceTraveled * getSelectedShipCookie().at(7)) / 6;
  const roundedScore = Math.round(rawScore);
  const prevScore    = getScoreCookie();
  const newTotal     = Math.round(rawScore + prevScore);
  const timeSecs     = Math.round(myGameArea.frameNo / 60);
  const multiplier   = getSelectedShipCookie().at(7);
  const isNewRecord  = setHighScore(roundedScore);

  // Update HUD best
  const hsEl = document.getElementById('highScoreHUD');
  if (hsEl) hsEl.textContent = 'BEST: ' + getHighScore().toLocaleString();

  let grade, gradeColor, gradeBg, tierLabel;
  if (roundedScore >= 5000)      { grade = 'S';  gradeColor = '#e8c84a'; gradeBg = '#2a1f00'; tierLabel = '— LEGENDARY PILOT —'; }
  else if (roundedScore >= 4000) { grade = 'A';  gradeColor = '#4adc6e'; gradeBg = '#0a2010'; tierLabel = '— ACE PILOT —'; }
  else if (roundedScore >= 2000) { grade = 'B';  gradeColor = '#4a9bdc'; gradeBg = '#0a1525'; tierLabel = '— SKILLED PILOT —'; }
  else if (roundedScore >= 500)  { grade = 'C';  gradeColor = '#b07adc'; gradeBg = '#180a25'; tierLabel = '— ROOKIE PILOT —'; }
  else                           { grade = 'D';  gradeColor = '#e03a3a'; gradeBg = '#250a0a'; tierLabel = '— CADET —'; }

const quips = {
  'S': [
    "Unbelievable.",
    "Please touch some grass.",
    "Umemployed.",
    "Oh... hacking?",
    "Show-off. Insufferable show-off.",
    "You've been logged for cheating until proven otherwise.",
    "You've ruined this for everyone else."
  ],
  'A': [
    "Excellent flying, pilot.",
    "Your ancestors are proud.",
    "Well done. This is as far as you'll go.",
    "So close to perfect. It's bothering me too.",
    "You clearly have nothing better to do. Respect.",
    "Certified competent."
  ],
  'B': [
    "Solid run. You've got the stuff.",
    "Not bad. Not bad at all.",
    "The obstacles respect you.",
    "Competent. Unremarkable.",
    "Good enough that nobody will bring it up again.",
    "Nothing to report. Which is good. That's the report."
  ],
  'C': [
    "A decent attempt. The obstacles disagree.",
    "You survived... mostly.",
    "Room for improvement detected.",
    "Technically a success. <i>Technically.</i>",
    "The obstacles let you get this far. Don't read into it.",
    "A C gets degrees."
  ],
  'D': [
    "The obstacles send their regards.",
    "Well, you tried.",
    "Even the obstacles felt bad for you.",
    "Better luck next time, pilot.",
    "Don't quit your day job.",
    "There's always next time.",
    "That was a choice. Several choices, actually.",
    "You made that look genuinely difficult.",
    "Somewhere out there, a beginner is watching this and feeling confident.",
    "No commentary available. Out of professional courtesy.",
    "Have you considered a different hobby?"
  ],
};
  const quip = quips[grade][Math.floor(Math.random() * quips[grade].length)];

  addScore(rawScore);

  const newRecordBadge = isNewRecord
    ? `<div style="font-size:15px; font-family:'8bit-font-text'; color:#e8c84a; background:#2a1f00; border:1px solid #e8c84a; border-radius:8px; padding:4px 12px; display:inline-block; margin-bottom:8px;">NEW PERSONAL BEST!</div><br>`
    : `<div style="font-size:13px; font-family:'8bit-font-text'; color:#5a5a6a; margin-bottom:6px;">Best: ${getHighScore().toLocaleString()} PP</div>`;

  const deathMessage = deathCause === 'overheat' 
    ? '<div style="font-size:14px; font-family:\'8bit-font-text\'; color:#ff6b6b; margin-bottom:12px;">You blew up!</div>'
    : '<div style="font-size:14px; font-family:\'8bit-font-text\'; color:#6a3a3a; margin-bottom:12px;">You crashed.</div>';

  document.getElementById("endScreen").innerHTML = `
    <div style="font-size:38px; font-family:'8bit-font-text'; color:#e03a3a; margin-bottom:4px;">GAME OVER</div>
    ${deathMessage}
    ${newRecordBadge}
    <div class="grade-badge" style="color:${gradeColor}; background:${gradeBg}; border-color:${gradeColor};">${grade}</div>
    <div class="tier-label" style="color:${gradeColor};">${tierLabel}</div>
    <div style="font-size:16px; font-family:'8bit-font-text'; color:#7a7a8a; font-style:italic; margin-bottom:18px;">"${quip}"</div>

    <div style="background:#110808; border:1px solid #2a1212; border-radius:10px; padding:12px 16px; margin-bottom:16px; text-align:left;">
      <div class="stat-row"><span>This run</span>       <span class="stat-val">${roundedScore.toLocaleString()} PP</span></div>
      <div class="stat-row"><span>Time survived</span>  <span class="stat-val">${timeSecs}s</span></div>
      <div class="stat-row"><span>Distance flown</span> <span class="stat-val">${Math.round(distanceTraveled / 6)} m</span></div>
      <div class="stat-row"><span>Multiplier</span>     <span class="stat-val">×${multiplier}</span></div>
      <div class="stat-row"><span>Previous total</span> <span class="stat-val">${prevScore.toLocaleString()} PP</span></div>
      <div class="stat-row" style="font-size:20px;"><span>New total</span><span style="color:#e8c84a; font-size:20px;">${newTotal.toLocaleString()} PP</span></div>
    </div>

    <button style="font-family:'8bit-font-text'; margin-right:8px;" class="restartGameButton" onclick="restartGame()">Restart</button>
    <button style="font-family:'8bit-font-text';" class="goHomeButton" onclick="goHome()">Main Menu</button>
  `;
}

  function goHome() {
  showDiv('startScreen');
  myGameArea.stop();
  myGamePiece.ammo = null;
  firstShot = true;
  myGamePiece = null;
  myObstacles = [];
  myBullets = [];
  myBarriers = [];
  myObstacle = null;
  myBackground = null;
  // Clear DOM HUDs
  const _sEl = document.getElementById('scoreHUD'); if (_sEl) _sEl.textContent = '';
  const _aEl = document.getElementById('ammoHUD');
  if (_aEl) {
    _aEl.textContent = '';
    _aEl.style.display = 'none';
  }
  const gaugeEl = document.getElementById('heatGauge');
  if (gaugeEl) gaugeEl.remove();
  screenShake.active = false;
  screenShake.intensity = 0;
  speedLines = [];
  explosions = [];
  afterburnerShakeIntensity = 0;
  crashFlash.active = false;
  crashFlash.alpha = 0;
  crashFlash.elapsed = 0;
  crashSlowmo.active = false;
  crashSlowmo.elapsed = 0;
  lastDisplayedScore = 0;
  shipAfterburnerOffset = 0;
  afterburnerActive = false;
  afterburnerSpeedMultiplier = 1;
  myGameArea.context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  hideDiv('endScreen');
  showDiv('menuBackground')
  document.body.removeChild(myGameArea.canvas);
  explosionSound.stop();
  gamePaused = false;
  hideDiv('pauseScreen');
  hideTouchControls();
  stopDynamicMusic();
  const hsEl = document.getElementById('highScoreHUD');
  if (hsEl) hsEl.style.display = 'none';
  currentHeat = 0;
  deathCause = 'crash';
  engineFlames = [];
  distanceTraveled = 0;
}

function updateGameArea(delta = 1) {

  // ── CRASH SHAKE MODE ──
  if (myGamePiece && myGamePiece.crashed) {
    
    let slowDelta = delta;
    if (crashSlowmo.active) {
      crashSlowmo.elapsed += delta;
      const t = crashSlowmo.elapsed / crashSlowmo.duration;
      slowDelta = delta * Math.max(0.08, 1.0 - t * 0.92);
      if (crashSlowmo.elapsed >= crashSlowmo.duration) crashSlowmo.active = false;
    }

    let shakeX = 0, shakeY = 0;
    if (screenShake.active) {
      shakeX = (Math.random() - 0.5) * screenShake.intensity * 2;
      shakeY = (Math.random() - 0.5) * screenShake.intensity * 2;
      screenShake.elapsed += delta;
      screenShake.intensity = 14 * (1 - screenShake.elapsed / screenShake.duration);
      if (screenShake.elapsed >= screenShake.duration) {
        screenShake.active = false;
        screenShake.intensity = 0;
      }
    }
    myGameArea.shakeX = shakeX;
    myGameArea.shakeY = shakeY;
    myGameArea.clear();
    myBackground.update();
    for (let oi = 0; oi < myObstacles.length; oi++) myObstacles[oi].update();
    for (let bi = 0; bi < myBarriers.length; bi++) myBarriers[bi].update();
    for (let mi = 0; mi < myMags.length; mi++) myMags[mi].update();
    for (let bi = 0; bi < myBullets.length; bi++) myBullets[bi].update();
    myGamePiece.update();
    updateHUDs();
    updateExplosions();
    drawExplosions();
    drawCrashFlash();
    return;
  }

  // ── NORMAL GAMEPLAY ──
  var x, height, gap, minHeight, maxHeight, minGap, maxGap;

  for (let ci = 0; ci < myObstacles.length; ci++) {
    if (myGamePiece.crashWith(myObstacles[ci])) {
      myGameArea.stop();
      return;
    }
  }

  for (let zi = 0; zi < myBarriers.length; zi++) {
    if (myGamePiece.crashWith(myBarriers[zi])) {
      myGameArea.stop();
      console.log('Spaceship hit barrier.');
      return;
    }
  }

  // shake offset
  let shakeX = 0, shakeY = 0;
  
  if (afterburnerActive) {
    afterburnerShakeIntensity += (AFTERBURNER_SHAKE_TARGET - afterburnerShakeIntensity) * AFTERBURNER_SHAKE_FADE_RATE;
  } else {
    afterburnerShakeIntensity += (0 - afterburnerShakeIntensity) * AFTERBURNER_SHAKE_FADE_RATE;
  }

  if (afterburnerShakeIntensity > 0.1) {
    shakeX += (Math.random() - 0.5) * afterburnerShakeIntensity * 2;
    shakeY += (Math.random() - 0.5) * afterburnerShakeIntensity * 2;
  }
  
  if (screenShake.active) {
    shakeX += (Math.random() - 0.5) * screenShake.intensity * 2;
    shakeY += (Math.random() - 0.5) * screenShake.intensity * 2;
    screenShake.elapsed += delta;
    screenShake.intensity = 14 * (1 - screenShake.elapsed / screenShake.duration);
    if (screenShake.elapsed >= screenShake.duration) {
      screenShake.active = false;
      screenShake.intensity = 0;
    }
  }
  
  myGameArea.shakeX = shakeX;
  myGameArea.shakeY = shakeY;

  myGameArea.clear();
  const difficulty = getObstacleDifficultyProfile();
  myBackground.speedX = -(difficulty.backgroundSpeed) * delta;
  
  const targetMultiplier = afterburnerActive ? 2 : 1;
  const easeRate = afterburnerActive ? AFTERBURNER_EASE_IN_RATE : AFTERBURNER_EASE_OUT_RATE;
  afterburnerSpeedMultiplier += (targetMultiplier - afterburnerSpeedMultiplier) * easeRate;
  
  afterburnerSpeedMultiplier = Math.max(1, Math.min(2, afterburnerSpeedMultiplier));
  
  worldSpeedMultiplier = afterburnerSpeedMultiplier;
  myGameArea.frameNo += 1;
  myGamePiece.speedX = 0;
  myGamePiece.speedY = 0;
  distanceTraveled += difficulty.backgroundSpeed * worldSpeedMultiplier * delta;

    const keys = myGameArea.keys || {};

    // Calculate base vertical speed from ship sensitivity
    let baseSpeedY = 0;
    
    if (keys[38] || keys[87]) { // Up Arrow or W
      baseSpeedY = -(Number(getSelectedShipCookie().at(1))) * 3 * delta;
    }

    if (keys[40] || keys[83]) { // Down Arrow or S
      baseSpeedY = Number(getSelectedShipCookie().at(1)) * 3 * delta;
    }

    if (touchDY !== 0) {
      baseSpeedY = touchDY * Number(getSelectedShipCookie().at(1)) * 3 * delta;
    }

    if (afterburnerActive) {
      baseSpeedY *= 2;
    }

    myGamePiece.speedY = baseSpeedY;

  if (myGamePiece.speedY < 0)      myGamePiece.tiltTarget = -0.22;
  else if (myGamePiece.speedY > 0) myGamePiece.tiltTarget =  0.22;
  else                              myGamePiece.tiltTarget =  0;
  myGamePiece.tiltAngle += (myGamePiece.tiltTarget - myGamePiece.tiltAngle) * 0.08;

  if (everyinterval(difficulty.spawnEvery)) {
    x = GAME_WIDTH;

    if (myObstacles.spawnCount === undefined) myObstacles.spawnCount = 0;
    myObstacles.spawnCount++;

    const decayRate = 0.96;
    const decayFactor = Math.pow(decayRate, myObstacles.spawnCount - 1);

    minGap = Math.max(difficulty.gapMin * 0.7, difficulty.gapMin * decayFactor);
    maxGap = Math.max(difficulty.gapMin, difficulty.gapMax * decayFactor);

    if (minGap >= maxGap) {
      myObstacles.gapR = difficulty.gapMin;
    } else {
      myObstacles.gapR = Math.floor(Math.random() * (maxGap - minGap + 1) + minGap);
    }

    const minHeightV = difficulty.minTop;
    const maxHeightV = GAME_HEIGHT - myObstacles.gapR - 80;
    const maxShift = difficulty.centerShift;

    let newHeight;
    if (myObstacles.lastGapCenterY === undefined) {
      newHeight = Math.floor(Math.random() * (maxHeightV - minHeightV + 1) + minHeightV);
    } else {
      const lastCenter = myObstacles.lastGapCenterY;
      const minCenter = Math.max(minHeightV + myObstacles.gapR / 2, lastCenter - maxShift);
      const maxCenter = Math.min(maxHeightV + myObstacles.gapR / 2, lastCenter + maxShift);
      const safeMin = Math.min(minCenter, maxCenter);
      const safeMax = Math.max(minCenter, maxCenter);
      const newCenter = Math.floor(Math.random() * (safeMax - safeMin + 1) + safeMin);
      newHeight = newCenter - myObstacles.gapR / 2;
    }

    myObstacles.heightR = clamp(newHeight, minHeightV, maxHeightV);
    myObstacles.lastGapCenterY = myObstacles.heightR + myObstacles.gapR / 2;

    const useDiagonalPattern = devDiagonalObstacles ||
      (difficulty.stage >= 1 && Math.random() < 0.28 + difficulty.intensity * 0.14);

    if (useDiagonalPattern) {
      spawnDiagonalObstacleGroup(x, difficulty);
    } else {
      myObstacles.push(new component(10, myObstacles.heightR, "#FF3F3F", x, 0, "obstacles", "Trobstacle", "n/a"));
      myObstacles.push(new component(10, x - myObstacles.heightR - myObstacles.gapR, "#FF3F3F", x, myObstacles.heightR + myObstacles.gapR, "obstacles", "Trobstacle", "n/a"));

      const barrierHeight = 100;
      const gapStart = myObstacles.heightR;
      const gapEnd   = myObstacles.heightR + myObstacles.gapR;
      const barrierY = gapStart + Math.floor(Math.random() * (gapEnd - gapStart - barrierHeight));
      myBarriers.push(new component(10, barrierHeight, "orange", x, barrierY, "obstacles", "n/a", 25));
    }
  }

  const random200 = Math.floor(Math.random() * 200) + 1;
  const randomGap = myObstacles.heightR !== undefined
    ? Math.floor(Math.random() * myObstacles.gapR) + myObstacles.heightR
    : GAME_HEIGHT / 2;

  if (everyinterval(600)) {
    const mag = new component(10, 10, "./images/enviromental_objects/ammo_v1.png", GAME_WIDTH - random200, randomGap, "n/a", "mag", "n/a");
    mag.baseY = randomGap;
    mag.bobPhase = Math.random() * Math.PI * 2;
    myMags.push(mag);
  }

  myBackground.newPos();
  myBackground.update();
  updateAndDrawSpeedLines();

  for (let oi = 0; oi < myObstacles.length; oi++) {
    myObstacles[oi].x += -(difficulty.obstacleSpeed) * delta * afterburnerSpeedMultiplier;
    myObstacles[oi].update();
  }
  for (let bi = 0; bi < myBarriers.length; bi++) {
    myBarriers[bi].x += -(difficulty.obstacleSpeed) * delta * afterburnerSpeedMultiplier;
    myBarriers[bi].update();
  }
  for (let mi = 0; mi < myMags.length; mi++) {
    myMags[mi].x += -(difficulty.obstacleSpeed) * delta * afterburnerSpeedMultiplier;
    myMags[mi].y = (myMags[mi].baseY ?? myMags[mi].y) + Math.sin((myGameArea.frameNo * 0.12) + (myMags[mi].bobPhase ?? 0)) * 5;
    myMags[mi].update();
  }

  myGamePiece.newPos();
  myGamePiece.update();

  
  if (afterburnerActive) {
    if (shipAfterburnerOffset < AFTERBURNER_MAX_OFFSET) {
      shipAfterburnerOffset = Math.min(AFTERBURNER_MAX_OFFSET, shipAfterburnerOffset + AFTERBURNER_RAPID_SHIFT_SPEED);
      myGamePiece.x += AFTERBURNER_RAPID_SHIFT_SPEED;
    }
    
    currentHeat = Math.min(MAX_HEAT, currentHeat + HEAT_INCREASE_RATE);
  } else {
    if (currentHeat > 0) {
      currentHeat = Math.max(0, currentHeat - HEAT_DECREASE_RATE);
    }
    
    if (shipAfterburnerOffset > 0) {
      shipAfterburnerOffset = Math.max(0, shipAfterburnerOffset - AFTERBURNER_RETURN_SPEED);
      myGamePiece.x -= AFTERBURNER_RETURN_SPEED;
    }
  }
  
  myGamePiece.update();
  
  // Check if player overheated-- bail out of this frame immediately
  if (checkOverheat()) return;
  
  // Update heat gauge display
  updateHeatGauge();
  
  if (afterburnerActive) {
    updateAndDrawEngineFlames();
  }

  const currentScore = (distanceTraveled * getSelectedShipCookie().at(7)) / 6;
  updateHUDs(currentScore);
  flashScoreIfNeeded(currentScore);
  updateDynamicMusic(currentScore);
  myObstacle.update();

  for (let bj = myBullets.length - 1; bj >= 0; bj--) {
    for (let bk = myBarriers.length - 1; bk >= 0; bk--) {
      if (myBullets[bj] && myBullets[bj].crashWith(myBarriers[bk])) {
        myBarriers.splice(bk, 1);
        myBullets.splice(bj, 1);
        break;
      }
    }
  }

  for (let bj = myBullets.length - 1; bj >= 0; bj--) {
    for (let bk = myObstacles.length - 1; bk >= 0; bk--) {
      if (myBullets[bj] && myBullets[bj].crashWith(myObstacles[bk])) {
        myBullets.splice(bj, 1);
        break;
      }
    }
  }

  for (let zi = myMags.length - 1; zi >= 0; zi--) {
    if (myGamePiece.crashWith(myMags[zi])) {
      myMags.splice(zi, 1);
      if (myGamePiece.ammo < getMaxAmmo()) {
        let ammoToAdd = Math.min(4, getMaxAmmo() - myGamePiece.ammo);
        myGamePiece.ammo += ammoToAdd;
      }
      updateHUDs();
      pickUpSound.play();
    }
  }

  for (let bi = 0; bi < myBullets.length; bi++) {
    const spd = myBullets[bi].baseBulletSpeedX !== undefined ? myBullets[bi].baseBulletSpeedX : 15;
    // Bullets also travel faster during afterburner with same easing
    myBullets[bi].x += spd * delta * afterburnerSpeedMultiplier;
    myBullets[bi].y += (myBullets[bi].baseBulletSpeedY || 0) * delta;
    myBullets[bi].update();
  }

  updateExplosions();
  drawExplosions();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getGameIntensityFromScore(score) {
  return Math.min(score / 5000, 1);
}

function getObstacleDifficultyProfile() {
  const score = (myGameArea.frameNo / 4) * Number(getSelectedShipCookie().at(7));
  const intensity = getGameIntensityFromScore(score);
  const stage = Math.min(5, Math.floor(intensity * 5));

  return {
    stage,
    intensity,
    gapMin: Math.max(120, 175 - stage * 10),
    gapMax: Math.min(360, 300 + stage * 16),
    centerShift: Math.min(220, 150 + stage * 30 + Number(getSelectedShipCookie().at(1)) * 20),
    minTop: 80,
    maxBottom: GAME_HEIGHT - 80,
    spawnEvery: Math.max(180, 300 - stage * 12),
    obstacleSpeed: 8 + intensity * 6, //
    backgroundSpeed: 3 + intensity * 2
  };
}

function spawnDiagonalObstacleGroup(x, difficulty) {
  const diagonalAngle = Math.random() < 0.5 ? -0.10 : 0.10;
  const upperWall = new component(
    10,
    myObstacles.heightR,
    "#FF3F3F",
    x,
    0,
    "obstacles",
    "DiagonalObstacle",
    "n/a"
  );
  upperWall.angle = diagonalAngle;

  const lowerWall = new component(
    10,
    GAME_HEIGHT - myObstacles.heightR - myObstacles.gapR,
    "#FF3F3F",
    x,
    myObstacles.heightR + myObstacles.gapR,
    "obstacles",
    "DiagonalObstacle",
    "n/a"
  );
  lowerWall.angle = diagonalAngle;

  const barrierHeight = 100;
  const gapStart = myObstacles.heightR;
  const gapEnd = gapStart + myObstacles.gapR;
  const barrierY = gapStart + Math.floor(Math.random() * (gapEnd - gapStart - barrierHeight));
  const barrier = new component(10, barrierHeight, "orange", x, barrierY, "obstacles", "DiagonalObstacle", 25);
  barrier.angle = diagonalAngle;

  myObstacles.push(upperWall, lowerWall);
  myBarriers.push(barrier);
}

function everyinterval(n) {
  const prev = Math.floor((myGameArea.frameNo - 1) / n);
  const curr = Math.floor(myGameArea.frameNo / n);
  return curr > prev;
}

  // ── SHOOTING ──
  document.addEventListener("keydown", keyDownHandler);
  document.addEventListener("keyup",   keyUpHandler);

  var spaceDown   = false;
  var lastShotTime = 0;
  var firstShot    = true;

  function getMaxAmmo() {
    const selectedShipName = getSelectedShipCookie().at(11);
    const selectedShipKey = selectedShipName === SPACESHIPS.pixpro.name ? 'pixpro' : 'classic';
    const doubleGun = getShipUpgradeState(selectedShipKey).doubleGun;
    return doubleGun ? 16 : 8;
  }

  function keyDownHandler(e) {
  if (e.key == " " && spaceDown == false && Date.now() - lastShotTime >= 1000) {
    spaceDown = true;
    fireBullet();
  }
}

function keyUpHandler(e) {
  if (e.key == " ") {
    spaceDown = false;
    console.log(spaceDown);
  }
}

function fireBullet() {
  if (!myGamePiece || myGameArea.rafId === null) return;
  if (Date.now() - lastShotTime < 1000) return;

  if (firstShot == true) {
    firstShot = false;
    myGamePiece.ammo = getMaxAmmo();
  }

  const selectedShipName = getSelectedShipCookie().at(11);
  const selectedShipKey = selectedShipName === SPACESHIPS.pixpro.name ? 'pixpro' : 'classic';
  const doubleGun = getShipUpgradeState(selectedShipKey).doubleGun;

if (myGamePiece.ammo >= (doubleGun ? 2 : 1)) {
  updateHUDs();
  lastShotTime = Date.now();
  shootingSound.stop();
  shootingSound.play();

  const gunCode = getSelectedShipCookie().at(2);

    if (doubleGun) {
      const facingAngle = myGamePiece.facingAngle ?? (myGamePiece.tiltAngle || 0);

      const pivotX = myGamePiece.x + myGamePiece.width - 15;
      const pivotY = myGamePiece.y + Number(myGamePiece.gunPosY);

      const sideOffset = 40;
      const aimDistance = getShipUpgradeState(selectedShipKey).aimDistance;

      const localOffsets = [
        { x: 0, y: -sideOffset },   
        { x: 0, y:  sideOffset }   
      ];

      const cos = Math.cos(facingAngle);
      const sin = Math.sin(facingAngle);

      const bullets = localOffsets.map(offset => {
        const originX = pivotX + offset.x * cos - offset.y * sin;
        const originY = pivotY + offset.x * sin + offset.y * cos;
        const aimAngle = Math.atan2(-offset.y, aimDistance);
        const finalAngle = facingAngle + aimAngle;
        const bullet = new component(30, 7, "yellow", originX, originY, "bullets", "n/a", "n/a");
        bullet.baseBulletSpeedX = 15 * Math.cos(finalAngle);
        bullet.baseBulletSpeedY = 15 * Math.sin(finalAngle);
        bullet.angle = finalAngle;
        return bullet;
      });

      myBullets.push(...bullets);
      myGamePiece.ammo -= 2;
      updateHUDs();
      console.log("Fired double bullets from both guns.");
      return;
    }

    const tilt = myGamePiece.tiltAngle || 0;
    const bulletSpeedX = 15 * Math.cos(tilt);
    const bulletSpeedY = 15 * Math.sin(tilt);

    if (gunCode.includes('1')) {
      const b = new component(30, 7, "yellow", myGamePiece.x + 110, (myGamePiece.y + Number(myGamePiece.gunPosY)), "bullets", "n/a", "n/a");
      b.baseBulletSpeedX = bulletSpeedX;
      b.baseBulletSpeedY = bulletSpeedY;
      b.angle = tilt;
      myBullets.push(b);
      myGamePiece.ammo -= 1;
      updateHUDs();
    }

    if (gunCode.includes('2')) {
      const b1 = new component(30, 7, "yellow", myGamePiece.x + 110, (myGamePiece.y + Number(myGamePiece.gunPosY) - 7), "bullets", "n/a", "n/a");
      const b2 = new component(30, 7, "yellow", myGamePiece.x + 110, (myGamePiece.y + Number(myGamePiece.gunPosY) + 55), "bullets", "n/a", "n/a");
      b1.baseBulletSpeedX = bulletSpeedX;
      b1.baseBulletSpeedY = bulletSpeedY;
      b2.baseBulletSpeedX = bulletSpeedX;
      b2.baseBulletSpeedY = bulletSpeedY;
      b1.angle = tilt;
      b2.angle = tilt;
      myBullets.push(b1, b2);
      myGamePiece.ammo -= 2;
      updateHUDs();
    }
  }
}

// ── HEAT GAUGE HTML ──
function createHeatGauge() {
  if (document.getElementById('heatGauge')) return;
  
  const gaugeHTML = `
    <div id="heatGauge" style="position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); width: 400px; z-index: 150; pointer-events: none;">
      <div style="font-family: '8bit-font-text'; font-size: 14px; color: #c8c8d0; text-align: center; margin-bottom: 6px; text-shadow: 1px 1px #1a0808;">THERMAL LEVEL</div>
      <div style="background: #1a0808; border: 2px solid #4a1a1a; border-radius: 6px; height: 18px; overflow: hidden;">
        <div id="heatGaugeFill" style="height: 100%; width: 0%; background: #e8c84a; transition: width 0.05s ease; box-shadow: 0 0 8px rgba(232, 200, 74, 0.5);"></div>
      </div>
      <div id="heatGaugeText" style="font-family: '8bit-font-text'; font-size: 12px; color: #e8c84a; text-align: right; margin-top: 4px; text-shadow: 1px 1px #1a0808;">0%</div>
    </div>
  `;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = gaugeHTML;
  document.body.appendChild(tempDiv.firstElementChild);
}

// ── FLAME PARTICLE FUNCTIONS ──
function spawnEngineFlame(ox, oy, offsetX, offsetY) {
  // Pick random flame image (flame1.png to flame8.png)
  const flameNum = Math.floor(Math.random() * 8) + 1;
  const flameSrc = `./images/flames/flame${flameNum}.png`;
  
  const sizeVariation = 0.7 + Math.random() * 0.6; 
  
  engineFlames.push({
    x: ox + offsetX,
    y: oy + offsetY,
    src: flameSrc,
    size: FLAME_BASE_SIZE * sizeVariation,
    life: FLAME_LIFETIME,
    maxLife: FLAME_LIFETIME,
    opacity: 1.0,
    scale: 1 + Math.random() * 0.3
  });
}

function updateAndDrawEngineFlames() {
  const ctx = myGameArea.context;
  const sx = myGameArea.shakeX || 0;
  const sy = myGameArea.shakeY || 0;
  
  if (!myGamePiece) return;
  
  const shipX = myGamePiece.x;
  const shipY = myGamePiece.y;
  const shipW = myGamePiece.width + 15;
  const shipH = myGamePiece.height + 15;
  
  // Top-left engine 
  const topLeftX = shipX + shipW * 0.15 + 15;
  const topLeftY = shipY + shipH * 0.15;
  
  // Bottom-left engine 
  const botLeftX = shipX + shipW * 0.15 + 15;
  const botLeftY = shipY + shipH * 0.85;
  

  if (afterburnerActive && flameEmissionTimer++ >= FLAME_EMIT_INTERVAL) {
    flameEmissionTimer = 0;
    

    spawnEngineFlame(topLeftX, topLeftY, -shipW * 0.2, -shipH * 0.005);
    spawnEngineFlame(botLeftX, botLeftY, -shipW * 0.2, shipH * 0.01);
  }

  for (let i = engineFlames.length - 1; i >= 0; i--) {
    const f = engineFlames[i];
    f.life--;
    f.opacity = f.life / f.maxLife;
  
    const currentScale = f.scale * f.opacity;
    
    if (f.life <= 0) {
      engineFlames.splice(i, 1);
      continue;
    }
    
    const img = new Image();
    img.src = f.src;
    
    ctx.save();
    ctx.globalAlpha = f.opacity;
    ctx.translate(f.x + sx, f.y + sy);
    ctx.rotate(-Math.PI / 2);
    ctx.rotate((Math.random() - 0.5) * 0.2); // Slight jitter
    ctx.scale(currentScale, currentScale);
    ctx.drawImage(img, -f.size / 2, -f.size / 2, f.size, f.size);
    ctx.restore();
  }
}

// ── AFTERBURNER STATE ──
var afterburnerActive = false;
var shipAfterburnerOffset = 0;
const AFTERBURNER_MAX_OFFSET = 150;
const AFTERBURNER_RAPID_SHIFT_SPEED = 8;
const AFTERBURNER_RETURN_SPEED = 2;

// Afterburner speed easing
var afterburnerSpeedMultiplier = 1; 
const AFTERBURNER_EASE_IN_RATE = 0.01;   
const AFTERBURNER_EASE_OUT_RATE = 0.12; 
let currentSpeedMPH = 0; 

// Afterburner screen shake
var afterburnerShakeIntensity = 0;
const AFTERBURNER_SHAKE_TARGET = 3; 
const AFTERBURNER_SHAKE_FADE_RATE = 0.15; 

// Afterburner heat system
var currentHeat = 0; 
const MAX_HEAT = 100; 
const HEAT_INCREASE_RATE = 0.3; 
const HEAT_DECREASE_RATE = 0.1; 
const OVERHEAT_WARNING_THRESHOLD = 70; 

var deathCause = 'crash'; // crash or overheat

// NEW: Track afterburner timing for synchronized audio
var afterburnerStartTime = 0;         // Timestamp when 'D' was pressed
var afterburnerDuration = 0;          // Duration in milliseconds
var afterburnerUpAudioDuration = 5;   // Known duration of up audio (seconds)
var afterburnerDownAudioDuration = 10; // Known duration of down audio (seconds)
var isPlayingDownSound = false;       // Track if down sound is currently playing

// Flame particle system
var engineFlames = [];
var flameEmissionTimer = 0;
const FLAME_EMIT_INTERVAL = 6; 
const FLAME_LIFETIME = 15; 
const FLAME_BASE_SIZE = 30;


// ── KEY HANDLERS FOR AFTERBURNER ──
let afterburnerKeyDownPending = false;

document.addEventListener("keydown", function afterburnerKeyDown(e) {
  if (e.key === 'd' && myGamePiece) {
    const selectedShipName = getSelectedShipCookie().at(11);
    const selectedShipKey = selectedShipName === SPACESHIPS.pixpro.name ? 'pixpro' : 'classic';
    const upgrade = getShipUpgradeState(selectedShipKey);
    
    if (upgrade.afterburner && !afterburnerActive && !afterburnerKeyDownPending) {
      afterburnerActive = true;
      afterburnerKeyDownPending = true;
      
      // If down sound is playing, stop it immediately (interrupt for re-engage)
      if (isPlayingDownSound && afterburnerSoundDown) {
        console.log('[Afterburner] Interrupting down sound for re-activation');
        afterburnerSoundDown.stop();
        afterburnerSoundDown.sound.currentTime = 0;
        isPlayingDownSound = false;
      }
      
      // Start/up sound with loop
      afterburnerSoundUp.sound.loop = "loop";
      afterburnerSoundUp.sound.currentTime = 0;
      afterburnerSoundUp.play();
      
      // START TIMING
      afterburnerStartTime = Date.now();
      console.log('[Afterburner] Activated at', new Date(afterburnerStartTime).toISOString());
    }
  }
});

document.addEventListener("keyup", function afterburnerKeyUp(e) {
  if (e.key === 'd') {
    afterburnerKeyDownPending = false;
    
    if (afterburnerActive) {
      // Calculate proportional playback position
      afterburnerDuration = Date.now() - afterburnerStartTime;
      const durationSec = afterburnerDuration / 1000;
      
      // INVERTED: Short holds = start at beginning of down sound, long holds = start near end
      const proportionalPosition = Math.min(
        afterburnerDownAudioDuration - ((durationSec / afterburnerUpAudioDuration) * afterburnerDownAudioDuration),
        afterburnerDownAudioDuration
      );
      
      const remainingSeconds = afterburnerDownAudioDuration - proportionalPosition;
      
      console.log('[Afterburner] Deactivated after', durationSec.toFixed(2), 'seconds');
      console.log('[Afterburner] Playing', remainingSeconds.toFixed(2), 'seconds of down sound from', proportionalPosition.toFixed(2), '/', afterburnerDownAudioDuration.toFixed(2));
      
      // Stop the up sound immediately
      afterburnerActive = false;
      if (afterburnerSoundUp) {
        afterburnerSoundUp.stop();
        afterburnerSoundUp.sound.currentTime = 0;
      }
      
      // Play proportional portion of down sound (won't stop until finished)
      if (afterburnerSoundDown) {
        afterburnerSoundDown.sound.loop = false;
        afterburnerSoundDown.sound.currentTime = 0;
        afterburnerSoundDown.sound.currentTime = proportionalPosition;
        afterburnerSoundDown.play();
        isPlayingDownSound = true;
      }
    }
  }
});

// ── OVERHEAT DETECTION AND EXPLOSION ──
function checkOverheat() {
  if (currentHeat >= MAX_HEAT) {
    afterburnerActive = false;
    afterburnerSpeedMultiplier = 1;
    shipAfterburnerOffset = 0;
    myGamePiece.crashed = true;
    deathCause = 'overheat';
    myGamePiece.onCrash();
    return true; // Overheated
  }
  return false;
}

// ── AUDIO ──
menuMusic = new sound("./audio/dstechnician-the-dying-110458.mp3", "menu");

function sound(src, type) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  if (type == 'menu') { this.sound.setAttribute("loop", "none"); }
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function() {
    if (type !== 'menu') {
      this.sound.volume = settingsSfxVol;
    }
    this.sound.play();
  };
  this.stop = function() { this.sound.pause(); };
}

window.addEventListener("click", function() { playMenuMusic(); });

function playMenuMusic() {
  console.log('Menu music function called.');
  try {
    if (musicStarted || document.getElementById('endScreen').style.display.includes('block')) {
      console.log('Menu music not playing — game active.');
    } else {
      menuMusic.sound.volume = settingsMusicVol;
      menuMusic.play();
    }
  } catch {
    menuMusic.play();
  }
}

function stopMenuMusic() {
  try { menuMusic.stop(); } catch(err) { console.log('stopping menu music error caught'); }
  console.log("Menu music pause called.");
}

const audioCtx = new AudioContext();

function hoverSound() {
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(180, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3 * settingsSfxVol, audioCtx.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.18);
}

//Adds sound for all buttons
document.addEventListener("mouseover", e => {
  if (e.target.matches("button")) {
    hoverSound();
  }
});


function getShipHitboxes(x, y, w, h, angle) {
  const shipCX = x + (w + 15) / 2;
  const shipCY = y + (h + 15) / 2;
  const cosA = Math.cos(angle || 0);
  const sinA = Math.sin(angle || 0);
  const rotatePoint = (px, py) => ({
    x: shipCX + px * cosA - py * sinA,
    y: shipCY + px * sinA + py * cosA,
  });
  const scaleX = (w + 15) / 125;
  const scaleY = (h + 15) / 105;

  function polygon(points) {
    return points.map(([px, py]) => rotatePoint(px * scaleX, py * scaleY));
  }

  const selectedShipName = getSelectedShipCookie().at(11);
  const shipKey = selectedShipName === SPACESHIPS.pixpro.name ? 'pixpro' : 'classic';
  const normalizedPolygons = window.SHIP_HITBOXES[shipKey];

  return normalizedPolygons.map(points => points.map(point => rotatePoint(
    point.x * 125 * scaleX,
    point.y * 105 * scaleY
  )));
}

function getComponentPolygon(component) {
  const centerX = component.x + component.width / 2;
  const centerY = component.y + component.height / 2;
  const halfWidth = component.width / 2;
  const halfHeight = component.height / 2;
  const angle = component.angle || 0;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  return [
    [-halfWidth, -halfHeight],
    [halfWidth, -halfHeight],
    [halfWidth, halfHeight],
    [-halfWidth, halfHeight],
  ].map(([px, py]) => ({
    x: centerX + px * cosA - py * sinA,
    y: centerY + px * sinA + py * cosA,
  }));
}

function polygonsIntersect(first, second) {
  const polygons = [first, second];
  for (const polygon of polygons) {
    for (let index = 0; index < polygon.length; index++) {
      const next = polygon[(index + 1) % polygon.length];
      const edgeX = next.x - polygon[index].x;
      const edgeY = next.y - polygon[index].y;
      const axisX = -edgeY;
      const axisY = edgeX;
      let firstMin = Infinity;
      let firstMax = -Infinity;
      let secondMin = Infinity;
      let secondMax = -Infinity;

      for (const point of first) {
        const projection = point.x * axisX + point.y * axisY;
        firstMin = Math.min(firstMin, projection);
        firstMax = Math.max(firstMax, projection);
      }
      for (const point of second) {
        const projection = point.x * axisX + point.y * axisY;
        secondMin = Math.min(secondMin, projection);
        secondMax = Math.max(secondMax, projection);
      }

      if (firstMax < secondMin || secondMax < firstMin) return false;
    }
  }
  return true;
}

//------------------------Pausing----------------------------//

//------------------------Pausing----------------------------//

let gamePaused = false;
let orientationPausedGame = false;

// Track afterburner state before pause
let wasAfterburnerActiveBeforePause = false;

function pauseGame() {
  if (!myGameArea.rafId) return;
  gamePaused = true;
  cancelAnimationFrame(myGameArea.rafId);
  myGameArea.rafId = null;
  myGameArea.lastTime = 0;
  
  // SAVE AFTERBURNER STATE BEFORE PAUSE
  wasAfterburnerActiveBeforePause = afterburnerActive;
  
  // Reset afterburner positioning
  shipAfterburnerOffset = 0;
  afterburnerActive = false;
  afterburnerSpeedMultiplier = 1;
  afterburnerShakeIntensity = 0;
  engineFlames = [];
  flameEmissionTimer = 0;
  
  // STOP AFTERBURNER AUDIO ON PAUSE
  if (afterburnerSoundUp) {
    afterburnerSoundUp.stop();
    afterburnerSoundUp.sound.currentTime = 0;
  }
  if (afterburnerSoundDown) {
    afterburnerSoundDown.stop();
    afterburnerSoundDown.sound.currentTime = 0;
  }
  isPlayingDownSound = false;
  
  showDiv('pauseScreen');
}

function resumeGame() {
  if (!gamePaused) return;
  gamePaused = false;
  hideDiv('pauseScreen');
  
  // RESTART AFTERBURNER AUDIO IF WAS ACTIVE WHEN PAUSED
  const selectedShipName = getSelectedShipCookie().at(11);
  const selectedShipKey = selectedShipName === SPACESHIPS.pixpro.name ? 'pixpro' : 'classic';
  const upgrade = getShipUpgradeState(selectedShipKey);
  
  if (wasAfterburnerActiveBeforePause && upgrade.afterburner) {
    // Check if 'D' key is currently held down
    if (myGameArea.keys && myGameArea.keys[68]) {
      // Re-engage afterburner
      afterburnerActive = true;
      afterburnerSoundUp.sound.loop = "loop";
      afterburnerSoundUp.sound.currentTime = 0;
      afterburnerSoundUp.play();
      afterburnerStartTime = Date.now(); // Reset timer on resume
      isPlayingDownSound = false;
      console.log('[Afterburner] Resumed from pause (key held)');
    } else {
      // Key was released during pause - play disengage sound proportionally
      // Use a minimal duration to play most of the disengage sound
      afterburnerActive = false;
      if (afterburnerSoundDown) {
        afterburnerSoundDown.sound.loop = false;
        afterburnerSoundDown.sound.currentTime = 0;
        afterburnerSoundDown.play();
        isPlayingDownSound = true;
      }
      console.log('[Afterburner] Disengage triggered on resume (key released)');
    }
  }
  
  // Clear the saved state
  wasAfterburnerActiveBeforePause = false;
  
  const loop = (timestamp) => {
    const delta = myGameArea.lastTime ? Math.min((timestamp - myGameArea.lastTime) / 16.667, 1) : 1;
    myGameArea.lastTime = timestamp;
    updateGameArea(delta);
    myGameArea.rafId = requestAnimationFrame(loop);
  };
  myGameArea.rafId = requestAnimationFrame(loop);
}

window.addEventListener("keydown", function(e) {
  if (e.key === "Escape" && myGameArea.rafId !== null) pauseGame();
  else if (e.key === "Escape" && gamePaused) resumeGame();
});

//------------------------TOUCH CONTROLS----------------------------//

var touchDY = 0; // -1 = up, 0 = neutral, 1 = down (normalized)
var joystickActive = false;
var joystickStartY = 0;
var joystickCenterY = 0;
var pendingGameStart = false;

function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

function isPortraitMobile() {
  return isTouchDevice() && window.matchMedia('(orientation: portrait)').matches;
}

function showTouchControls() {
  if (!isTouchDevice()) return;
  document.getElementById('touchControls').style.display = 'block';
  document.getElementById('touchFireBtn').style.display = 'flex';
}

function hideTouchControls() {
  document.getElementById('touchControls').style.display = 'none';
  document.getElementById('touchFireBtn').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function setupJoystick() {
  const outer = document.getElementById('joystickOuter');
  const knob = document.getElementById('joystickKnob');

  if (!outer || !knob) {
    console.warn('Joystick elements not found');
    return;
  }

  const maxDist = 36;

  function onStart(e) {
    e.preventDefault();
    joystickActive = true;
    const touch = e.touches ? e.touches[0] : e;
    const rect = outer.getBoundingClientRect();
    joystickCenterY = rect.top + rect.height / 2;
    joystickStartY = touch.clientY;
  }

  function onMove(e) {
    e.preventDefault();
    if (!joystickActive) return;
    const touch = e.touches ? e.touches[0] : e;
    const dy = touch.clientY - joystickCenterY;
    const clamped = Math.max(-maxDist, Math.min(maxDist, dy));
    knob.style.transform = `translate(-50%, calc(-50% + ${clamped}px))`;
    touchDY = clamped / maxDist;
  }

  function onEnd(e) {
    joystickActive = false;
    touchDY = 0;
    knob.style.transform = 'translate(-50%, -50%)';
  }

  outer.addEventListener('touchstart', onStart, { passive: false });
  outer.addEventListener('touchmove',  onMove,  { passive: false });
  outer.addEventListener('touchend',   onEnd,   { passive: false });
  outer.addEventListener('touchcancel',onEnd,   { passive: false });
});

document.addEventListener('DOMContentLoaded', function setupFireBtn() {
  const btn = document.getElementById('touchFireBtn');

  if (!btn) {
    console.warn('Fire button not found');
    return;
  }

  btn.addEventListener(
    'pointerdown',
    function (e) {
      e.preventDefault();
      fireBullet();
    },
    { passive: false }
  );
});

//------------------------SETTINGS----------------------------//

function buildSettingsPanel() {
  const panel = document.getElementById('settings');
  panel.innerHTML = `
    <p style="font-size: 60px; font-family: '8bit-font-text'; color: #e8c84a;">Settings</p>
    <div style="max-width:380px; margin: 0 auto; text-align:left;">

      <div class="settings-row">
        <label>Music Volume</label>
        <input type="range" min="0" max="1" step="0.05" value="${settingsMusicVol}"
          oninput="setMusicVolume(this.value); document.getElementById('mvLabel').textContent=Math.round(this.value*100)+'%'; if(musicMaster) musicMaster.gain.value=settingsMusicVol; menuMusic.sound.volume=settingsMusicVol;">
        <span id="mvLabel">${Math.round(settingsMusicVol * 100)}%</span>
      </div>

      <div class="settings-row">
        <label>SFX Volume</label>
        <input type="range" min="0" max="1" step="0.05" value="${settingsSfxVol}"
          oninput="setSfxVolume(this.value); document.getElementById('sfxLabel').textContent=Math.round(this.value*100)+'%';">
        <span id="sfxLabel">${Math.round(settingsSfxVol * 100)}%</span>
      </div>

      <div class="settings-row" style="margin-top:18px;">
        <label>Show Hitboxes</label>
        <button id="hitboxToggleBtn" class="settings-toggle ${settingsShowHitbox ? 'on' : ''}"
          onclick="settingsShowHitbox=!settingsShowHitbox; this.textContent=settingsShowHitbox?'ON':'OFF'; this.classList.toggle('on', settingsShowHitbox);">
          ${settingsShowHitbox ? 'ON' : 'OFF'}
        </button>
        <span></span>
      </div>

      <p style="font-size:13px; font-family:'8bit-font-text'; color:#5a5a6a; margin-top:20px;">
        Audio settings are applied immediately and save when you leave the game. Hitbox visibility is for debugging and will not save. 
      </p>
    </div>
    <br>
    <button style="font-family: '8bit-font-text'" class="button_hp button_hp1" onclick="hideDiv('settings') || hideDiv('panelBackdrop') || showDiv('startScreen')">BACK</button>
  `;
}

//------------------------End of Game Mechanics-------------------//

// build pane before showing it
    document.querySelector('.button5').addEventListener('click', function() {
      buildSettingsPanel();
    });

    function updatePortraitGameBlocker() {
      const blocker = document.getElementById('portraitGameBlocker');
      if (!blocker) return;

      if (isPortraitMobile()) {
        const gameIsRunning = myGameArea.rafId != null;
        if (!pendingGameStart && !gameIsRunning) return;

        if (gameIsRunning) {
          myGameArea.stop();
          gamePaused = true;
          orientationPausedGame = true;
          hideTouchControls();
        }
        blocker.style.display = 'flex';
        return;
      }

      if (blocker.style.display === 'flex') {
        blocker.style.display = 'none';
        if (pendingGameStart) {
          pendingGameStart = false;
          hideDiv('startScreen');
          hideDiv('menuBackground');
          startGame();
          return;
        }
        if (orientationPausedGame) {
          orientationPausedGame = false;
          showTouchControls();
          resumeGame();
          return;
        }

        hideTouchControls();
      }
    }

    window.addEventListener('resize', updatePortraitGameBlocker);
    window.addEventListener('orientationchange', updatePortraitGameBlocker);

  (function() {
    // Check if url is the dev site
    if (window.location.hostname === 'pixelpilotdev.w3spaces.com') {

      const banner = document.createElement('div');
      banner.textContent = 'Dev site: Expect unfinished features';
      
 
      Object.assign(banner.style, {
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        backgroundColor: '#ffeb3b',
        color: '#333',
        textAlign: 'center',
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: '9999',
        border: '1px solid #ffc107',
        boxShadow: '0 -2px 5px rgba(0,0,0,0.1)'
      });

     
      document.body.appendChild(banner);
    }
  })();