const EvdevReader = require('evdev');

const Device = require('./lib/Device');

function searchAndListenToFirst() {
  const reader = new EvdevReader();
  reader.search('/dev/input/by-path', 'event-joystick', function (err, devicePaths) {
    if (err) { throw err; }
    console.log('devicePaths', devicePaths);
    if (!devicePaths[0]) {
      console.log('nothing found');
      return;
    }

    // const device = new Device(devicePaths[0], 'N64-USB');
    // const device = new Device(devicePaths[0], 'Nintendo-USB');
    const device = new Device(devicePaths[0]);
    device
      .on('open', (id) => console.log('opened, id:', id))
      .on('key', (id, value) => console.log('key:', id, value))
      .on('axis', (id, value) => console.log('axis:', id, value))
      .on('error', (err) => {
        console.error('error', err);
        searchAndListenToFirst();
      });
  });
}

searchAndListenToFirst();
