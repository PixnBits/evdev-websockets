const path = require('path');
const EventEmitter = require('events');
const EvdevReader = require('evdev');
const shush = require('shush');
const getIdMaps = require('../id-maps');

const typeMap = {
  'key': 'key',
  'btn': 'key',
  'abs': 'axis',
  'rel': 'axis',
};

function compileNameMap(names) {
  const nameMap = {
    key: {},
    axis: {},
  };

  if (names && names.key) {
    Object.assign(nameMap.key, names.key);
  }
  if (names && names.axis) {
    Object.assign(nameMap.axis, names.axis);
  }

  return nameMap;
}

function compileValueMaps(values) {
  const compiled = {};

  Object.keys(values).forEach(id => {
    const points = values[id];

    const ins = Object.keys(points).map(Number).sort();
    const outs = ins.map(k => points[k]);

    compiled[id] = (input) => {
      // avoid the loop if possible
      if (input in points) {
        return points[input];
      }

      // interpolate between some points
      // TODO: make this fancier? for now just linear
      for (let i = 0; i < ins.length - 1; i+=1) {
        if (input >= ins[i] && input < ins[i+1]) {
          const inDiffPercent = (input - ins[i]) / (ins[i+1] - ins[i]);
          const outDiff = (outs[i+1] - outs[i]) * inDiffPercent;
          return outs[i] + outDiff;
        }
      }

      // out of bounds? clamp to max/min
      if (input < ins[0]) {
        return outs[0];
      }
      if (input > ins[ins.length - 1]) {
        return outs[outs.length - 1];
      }

      // wat
      throw new Error(`unable to map input ${input} using map ${JSON.stringify(points)}`);
    };
  });

  return compiled;
}

class Device extends EventEmitter {
  constructor(devicePath, nameMap, valueMaps) {
    super();
    const reader = new EvdevReader();
    this.reader = reader;
    const device = reader.open(devicePath);
    this.device = device; // TODO: needed?
    device.on('open', () => {
      const detectedIdMaps = getIdMaps(device.id);
      if (detectedIdMaps) {
        if (detectedIdMaps.names && !nameMap) {
          this.nameMap = compileNameMap(detectedIdMaps.names);
        }
        if (detectedIdMaps.values && !valueMaps) {
          this.valueMaps = compileValueMaps(detectedIdMaps.values);
        }
      }
      this.emit('open', device.id);
    });

    reader.on('EV_KEY', data => this.mapAndEmit(data));
    reader.on('EV_ABS', data => this.mapAndEmit(data));
    reader.on('EV_REL', data => this.mapAndEmit(data));
    reader.on('error', err => this.emit('error', err));

    this.nameMap = compileNameMap(nameMap);
    this.valueMaps = valueMaps ? compileValueMaps(valueMaps) : {};
  }

  mapAndEmit(data) {
    const { code, value } = data;
    if (!(code && code.toLowerCase)) {
      // console.warn(`code was not a string (${typeof code}): ${code}`);
      return;
    }
    const [type, id] = `${code}`.toLowerCase().split('_');
    const mappedType = typeMap[type] || type;
    const mappedId = this.nameMap[mappedType] && this.nameMap[mappedType][id];
    if (mappedId === null) {
      // don't report
      return;
    }
    const valueMap = this.valueMaps[mappedId || id];
    const mappedValue = valueMap ? valueMap(value) : value;
    this.emit(mappedType, mappedId || id, mappedValue);
  }

  close() {
    this.reader.close();
  }
}

module.exports = Device;
