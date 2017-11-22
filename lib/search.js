// really just expose a specific evdev search
const EvdevReader = require('evdev');

function search(cb) {
  const reader = new EvdevReader();
  reader.search('/dev/input/by-path', 'event-joystick', cb);
}

module.exports = search;
