/*
 * Copyright 2015 Boris Smus. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */



/**
 * Helper for getting in and out of VR mode.
 * Here we assume VR mode == full screen mode.
 *
 * 1. Detects whether or not VR mode is possible by feature detecting for
 * WebVR (or polyfill).
 *
 * 2. If WebVR is available, provides means of entering VR mode:
 * - Double click
 * - Double tap
 * - Click "Enter VR" button
 *
 * 3. Provides best practices while in VR mode.
 * - Full screen
 * - Wake lock
 * - Orientation lock (mobile only)
 */
(function() {

function WebVRManager(renderer, effect, params) {
  this.params = params || {};

  // Set option to hide the button.
  this.hideButton = this.params.hideButton || false;

  // Save the THREE.js renderer and effect for later.
  this.renderer = renderer;
  this.effect = effect;

  // Create the button regardless.
  this.vrButton = this.createVRButton();

  // Check if the browser is compatible with WebVR.
  this.getHMD().then(function(hmd) {
    // Activate either VR or Immersive mode.
    if (hmd) {
      this.activateVR();
    } else {
      this.activateImmersive();
    }
    // Set the right mode.
    this.defaultMode = hmd ? Modes.COMPATIBLE : Modes.INCOMPATIBLE;
    this.setMode(this.defaultMode);
  }.bind(this));

  this.os = this.getOS();
  this.logo = this.base64('image/png', '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');
  this.logoDisabled = this.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4xLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMTkyIDE5MiIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTkyIDE5MiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8cGF0aCBmaWxsPSJncmF5IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0xNDMuOSw5Ni40YzAtNy42LTYuMi0xMy45LTEzLjktMTMuOWMtNy41LDAtMTMuNSw1LjktMTMuOCwxMy4zbDE0LjQsMTQuNEMxMzgsMTA5LjksMTQzLjksMTAzLjksMTQzLjksOTYuNHoiLz4NCgk8cGF0aCBmaWxsPSJncmF5IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0xMDUuOCw3N2M2LjItNS43LDE0LjEtMTAuNiwyMy42LTEwLjZjMjMuMiwwLDM3LjcsMjkuMywzNy43LDI5LjNzLTkuMiwxOC43LTI0LjgsMjYuMmwxMC45LDEwLjkNCgkJYzIwLjUtMTIuNCwzMi41LTM2LjksMzIuNS0zNi45cy0yMS42LTQzLjgtNTYuMS00My45YzAsMC0zOC4zLDAtNTcuMiwwLjFsMjkuMSwyOS4xQzEwMi45LDc5LjksMTA0LjMsNzguNCwxMDUuOCw3N3oiLz4NCgk8cGF0aCBmaWxsPSJncmF5IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0xNjIuOSwxNjIuOWwtMjQtMjRjMCwwLDAsMCwwLDBsLTE0LjItMTQuMmMwLDAsMCwwLDAsMEw2Ni45LDY2LjljMCwwLDAsMCwwLDBMNTMuMyw1My4yYzAsMCwwLDAsMCwwTDIzLjEsMjMuMUwxMywzMy4zDQoJCWwyNS45LDI1LjlDMTguMyw3MS41LDYuMiw5Niw2LjIsOTZzMjEuNiw0My44LDU2LjEsNDMuOGMxMy4zLDAsMjQuNy02LjUsMzMuNi0xNC41YzYuMiw1LjUsMTMuNSwxMC4zLDIxLjgsMTIuN2wzNC45LDM0LjkNCgkJTDE2Mi45LDE2Mi45eiBNODUuNywxMTQuNWMtNi4yLDUuNy0xNC4xLDEwLjYtMjMuNSwxMC42Yy0yMy4yLDAtMzcuNy0yOS4zLTM3LjctMjkuM3M5LjMtMTguNywyNC44LTI2LjJsMTMsMTMNCgkJYy03LjYsMC4xLTEzLjcsNi4yLTEzLjcsMTMuOGMwLDcuNyw2LjIsMTMuOSwxMy45LDEzLjljNy42LDAsMTMuOC02LjEsMTMuOC0xMy43bDEzLjYsMTMuNkM4OC42LDExMS43LDg3LjIsMTEzLjEsODUuNywxMTQuNXoiLz4NCgk8cGF0aCBmaWxsPSJub25lIiBkPSJNMCwwaDE5MnYxOTJIMFYweiIvPg0KPC9nPg0KPC9zdmc+DQo=');
}

var Modes = {
  // Incompatible with WebVR.
  INCOMPATIBLE: 1,
  // Compatible with WebVR.
  COMPATIBLE: 2,
  // In virtual reality via WebVR.
  VR: 3,
};

/**
 * Promise returns true if there is at least one HMD device available.
 */
WebVRManager.prototype.getHMD = function() {
  return new Promise(function(resolve, reject) {
    navigator.getVRDevices().then(function(devices) {
      // Promise succeeds, but check if there are any devices actually.
      for (var i = 0; i < devices.length; i++) {
        if (devices[i] instanceof HMDVRDevice) {
          resolve(devices[i]);
          break;
        }
      }
      resolve(null);
    }, function() {
      // No devices are found.
      resolve(null);
    });
  });
};

WebVRManager.prototype.isVRMode = function() {
  return this.mode == Modes.VR;
};

WebVRManager.prototype.render = function(scene, camera) {
  if (this.isVRMode()) {
    this.effect.render(scene, camera);
  } else {
    this.renderer.render(scene, camera);
  }
};

WebVRManager.prototype.createVRButton = function() {
  var button = document.createElement('img');
  var s = button.style;
  s.position = 'absolute';
  s.bottom = '5px';
  s.left = 0;
  s.right = 0;
  s.marginLeft = 'auto';
  s.marginRight = 'auto';
  s.width = '64px'
  s.height = '64px';
  s.backgroundSize = 'cover';
  s.backgroundColor = 'transparent';
  s.border = 0;
  s.userSelect = 'none';
  s.webkitUserSelect = 'none';
  s.MozUserSelect = 'none';
  s.cursor = 'pointer';
  // Prevent button from being dragged.
  button.draggable = false;
  button.addEventListener('dragstart', function(e) {
    e.preventDefault();
  });
  if (!this.hideButton) {
    document.body.appendChild(button);
  }
  return button;
};

WebVRManager.prototype.setMode = function(mode) {
  this.mode = mode;
  switch (mode) {
    case Modes.INCOMPATIBLE:
      this.vrButton.src = this.logo;
      this.vrButton.title = 'Open in immersive mode';
      break;
    case Modes.COMPATIBLE:
      this.vrButton.src = this.logo;
      this.vrButton.title = 'Open in VR mode';
      break;
    case Modes.VR:
      this.vrButton.src = this.logoDisabled;
      this.vrButton.title = 'Leave VR mode';
      break;
  }

  // Hack for Safari Mac/iOS to force relayout (svg-specific issue)
  // http://goo.gl/hjgR6r
  this.vrButton.style.display = 'inline-block';
  this.vrButton.offsetHeight;
  this.vrButton.style.display = 'block';
};

/**
 * Sets the contrast on the button (percent in [0, 1]).
 */
WebVRManager.prototype.setContrast = function(percent) {
  var value = Math.floor(percent * 100);
  this.vrButton.style.webkitFilter = 'contrast(' + value + '%)';
  this.vrButton.style.filter = 'contrast(' + value + '%)';
};

WebVRManager.prototype.base64 = function(format, base64) {
  var out = 'data:' + format + ';base64,' + base64;
  return out;
};

/**
 * Makes it possible to go into VR mode.
 */
WebVRManager.prototype.activateVR = function() {
  // Make it possible to enter VR via double click.
  window.addEventListener('dblclick', this.enterVR.bind(this));
  // Or via double tap.
  window.addEventListener('touchend', this.onTouchEnd.bind(this));
  // Or via clicking on the VR button.
  this.vrButton.addEventListener('mousedown', this.onButtonClick.bind(this));
  this.vrButton.addEventListener('touchstart', this.onButtonClick.bind(this));
  // Or by hitting the 'f' key.
  window.addEventListener('keydown', this.onKeyDown.bind(this));

  // Whenever we enter fullscreen, this is tantamount to entering VR mode.
  document.addEventListener('webkitfullscreenchange',
      this.onFullscreenChange.bind(this));
  document.addEventListener('mozfullscreenchange',
      this.onFullscreenChange.bind(this));

  // Create the necessary elements for wake lock to work.
  this.setupWakeLock();
};

WebVRManager.prototype.activateImmersive = function() {
  // Next time a user does anything with their mouse, we trigger immersive mode.
  this.vrButton.addEventListener('click', this.enterImmersive.bind(this));
};

WebVRManager.prototype.enterImmersive = function() {
  this.requestPointerLock();
  this.requestFullscreen();
};

WebVRManager.prototype.setupWakeLock = function() {
  // Create a small video element.
  this.wakeLockVideo = document.createElement('video');

  // Loop the video.
  this.wakeLockVideo.addEventListener('ended', function(ev) {
    this.wakeLockVideo.play();
  }.bind(this));

  // Turn on wake lock as soon as the screen is tapped.
  triggerWakeLock = function() {
    this.requestWakeLock();
  }.bind(this);
  window.addEventListener('touchstart', triggerWakeLock, false);
};

WebVRManager.prototype.onTouchEnd = function(e) {
  // TODO: Implement better double tap that takes distance into account.
  // https://github.com/mckamey/doubleTap.js/blob/master/doubleTap.js

  var now = new Date();
  if (now - this.lastTouchTime < 300) {
    this.enterVR();
  }
  this.lastTouchTime = now;
};

WebVRManager.prototype.onButtonClick = function(e) {
  e.stopPropagation();
  e.preventDefault();
  this.toggleVRMode();
};

WebVRManager.prototype.onKeyDown = function(e) {
  if (e.keyCode == 70) { // 'f'
    this.toggleVRMode();
  }
};

WebVRManager.prototype.toggleVRMode = function() {
  if (!this.isVRMode()) {
    // Enter VR mode.
    this.enterVR();
  } else {
    this.exitVR();
  }
};

WebVRManager.prototype.onFullscreenChange = function(e) {
  // If we leave full-screen, also exit VR mode.
  if (document.webkitFullscreenElement === null ||
      document.mozFullScreenElement === null) {
    this.exitVR();
  }
};

/**
 * Add cross-browser functionality to keep a mobile device from
 * auto-locking.
 */
WebVRManager.prototype.requestWakeLock = function() {
  this.releaseWakeLock();
  if (this.os == 'iOS') {
    // If the wake lock timer is already running, stop.
    if (this.wakeLockTimer) {
      return;
    }
    this.wakeLockTimer = setInterval(function() {
      window.location = window.location;
      setTimeout(window.stop, 0);
    }, 30000);
  } else if (this.os == 'Android') {
    // If the video is already playing, do nothing.
    if (this.wakeLockVideo.paused === false) {
      return;
    }
    // See videos_src/no-sleep.webm.
    this.wakeLockVideo.src = this.base64('video/webm', 'GkXfowEAAAAAAAAfQoaBAUL3gQFC8oEEQvOBCEKChHdlYm1Ch4ECQoWBAhhTgGcBAAAAAAACWxFNm3RALE27i1OrhBVJqWZTrIHfTbuMU6uEFlSua1OsggEuTbuMU6uEHFO7a1OsggI+7AEAAAAAAACkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmAQAAAAAAAEMq17GDD0JATYCMTGF2ZjU2LjQuMTAxV0GMTGF2ZjU2LjQuMTAxc6SQ20Yv/Elws73A/+KfEjM11ESJiEBkwAAAAAAAFlSuawEAAAAAAABHrgEAAAAAAAA+14EBc8WBAZyBACK1nIN1bmSGhVZfVlA4g4EBI+ODhAT3kNXgAQAAAAAAABKwgRC6gRBTwIEBVLCBEFS6gRAfQ7Z1AQAAAAAAALHngQCgAQAAAAAAAFyho4EAAIAQAgCdASoQABAAAEcIhYWIhYSIAgIADA1gAP7/q1CAdaEBAAAAAAAALaYBAAAAAAAAJO6BAaWfEAIAnQEqEAAQAABHCIWFiIWEiAICAAwNYAD+/7r/QKABAAAAAAAAQKGVgQBTALEBAAEQEAAYABhYL/QACAAAdaEBAAAAAAAAH6YBAAAAAAAAFu6BAaWRsQEAARAQABgAGFgv9AAIAAAcU7trAQAAAAAAABG7j7OBALeK94EB8YIBgfCBAw==');
    this.wakeLockVideo.play();
  }

}

/**
 * Turn off cross-browser functionality to keep a mobile device from
 * auto-locking.
 */
WebVRManager.prototype.releaseWakeLock = function() {
  if (this.os == 'iOS') {
    if (this.wakeLockTimer) {
      clearInterval(this.wakeLockTimer);
      this.wakeLockTimer = null;
    }
  } else if (this.os == 'Android') {
    this.wakeLockVideo.pause();
    this.wakeLockVideo.src = '';
  }
};

WebVRManager.prototype.requestPointerLock = function() {
  var canvas = this.renderer.domElement;
  canvas.requestPointerLock = canvas.requestPointerLock ||
      canvas.mozRequestPointerLock ||
      canvas.webkitRequestPointerLock;

  if (canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
};

WebVRManager.prototype.releasePointerLock = function() {
  document.exitPointerLock = document.exitPointerLock ||
      document.mozExitPointerLock ||
      document.webkitExitPointerLock;

  document.exitPointerLock();
};

WebVRManager.prototype.requestOrientationLock = function() {
  if (screen.orientation) {
    screen.orientation.lock('landscape');
  }
};

WebVRManager.prototype.releaseOrientationLock = function() {
  if (screen.orientation) {
    screen.orientation.unlock();
  }
};

WebVRManager.prototype.requestFullscreen = function() {
  var canvas = this.renderer.domElement;
  if (canvas.mozRequestFullScreen) {
    canvas.mozRequestFullScreen();
  } else if (canvas.webkitRequestFullscreen) {
    canvas.webkitRequestFullscreen();
  }
};

WebVRManager.prototype.releaseFullscreen = function() {
};

WebVRManager.prototype.getOS = function(osName) {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
    return 'iOS';
  } else if (userAgent.match(/Android/i)) {
    return 'Android';
  }
  return 'unknown';
};

WebVRManager.prototype.enterVR = function() {
  console.log('Entering VR.');
  // Enter fullscreen mode (note: this doesn't work in iOS).
  this.effect.setFullScreen(true);
  // Lock down orientation, pointer, etc.
  this.requestOrientationLock();
  // Set style on button.
  this.setMode(Modes.VR);
};

WebVRManager.prototype.exitVR = function() {
  console.log('Exiting VR.');
  // Leave fullscreen mode (note: this doesn't work in iOS).
  this.effect.setFullScreen(false);
  // Release orientation, wake, pointer lock.
  this.releaseOrientationLock();
  this.releaseWakeLock();
  // Also, work around a problem in VREffect and resize the window.
  this.effect.setSize(window.innerWidth, window.innerHeight);

  // Go back to the default mode.
  this.setMode(this.defaultMode);
};

// Expose the WebVRManager class globally.
window.WebVRManager = WebVRManager;

})();
