// Touch controls, settings UI, and viewport-orientation handling.

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

function setupTouchControls() {
  const outer = document.getElementById('joystickOuter');
  const knob = document.getElementById('joystickKnob');

  if (!outer || !knob) {
    console.warn('Joystick elements not found');
    return;
  }

  const maxDist = 36;

  function onStart(event) {
    event.preventDefault();
    joystickActive = true;
    const touch = event.touches ? event.touches[0] : event;
    const rect = outer.getBoundingClientRect();
    joystickCenterY = rect.top + rect.height / 2;
    joystickStartY = touch.clientY;
  }

  function onMove(event) {
    event.preventDefault();
    if (!joystickActive) return;
    const touch = event.touches ? event.touches[0] : event;
    const dy = touch.clientY - joystickCenterY;
    const clamped = Math.max(-maxDist, Math.min(maxDist, dy));
    knob.style.transform = `translate(-50%, calc(-50% + ${clamped}px))`;
    touchDY = clamped / maxDist;
  }

  function onEnd() {
    joystickActive = false;
    touchDY = 0;
    knob.style.transform = 'translate(-50%, -50%)';
  }

  outer.addEventListener('touchstart', onStart, { passive: false });
  outer.addEventListener('touchmove', onMove, { passive: false });
  outer.addEventListener('touchend', onEnd, { passive: false });
  outer.addEventListener('touchcancel', onEnd, { passive: false });

  const fireButton = document.getElementById('touchFireBtn');
  if (!fireButton) {
    console.warn('Fire button not found');
    return;
  }

  fireButton.addEventListener('pointerdown', function(event) {
    event.preventDefault();
    fireBullet();
  }, { passive: false });
}

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

const settingsButton = document.querySelector('.button5');
if (settingsButton) {
  settingsButton.addEventListener('click', buildSettingsPanel);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTouchControls, { once: true });
} else {
  setupTouchControls();
}

window.addEventListener('resize', updatePortraitGameBlocker);
window.addEventListener('orientationchange', updatePortraitGameBlocker);

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
