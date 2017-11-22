const shush = require('shush');

function findMapsFilename({bustype, vendor, product, version}) {
  const tree = require('./tree.json');
  try {
    return tree.bustype[bustype].vendor[vendor].product[product].version[version];
  } catch (err) {
    return null;
  }
}

function getMaps(id) {
  const mapFilename = findMapsFilename(id);
  if (!mapFilename) {
    return undefined;
  }
  return shush(`./${mapFilename}`);
}

module.exports = getMaps;
