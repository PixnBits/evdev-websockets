#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const shush = require('shush');
const glob = require('glob');

const idMapDirPath = path.resolve(__dirname, '../id-maps');
const indexMap = {};
const indexTree = {};

glob('!(tree|map).json', { cwd: idMapDirPath }, (err, files) => {
  if (err) { throw err; }
  files.forEach(filename => {
    const deviceId = shush(path.join(idMapDirPath, filename)).id;
    if (!deviceId) { return; }
    indexMap[filename] = deviceId;

    indexTree.bustype = indexTree.bustype || {};
    const bustype = indexTree.bustype[deviceId.bustype] = indexTree.bustype[deviceId.bustype] || {};
    bustype.vendor = bustype.vendor || {};
    const vendor = bustype.vendor[deviceId.vendor] = bustype.vendor[deviceId.vendor] || {};
    vendor.product = vendor.product || {};
    const product = vendor.product[deviceId.product] = vendor.product[deviceId.product] || {};
    product.version = product.version || {};
    product.version[deviceId.version] = filename;
  });
  fs.writeFile(path.join(idMapDirPath, 'map.json'), JSON.stringify(indexMap));
  fs.writeFile(path.join(idMapDirPath, 'tree.json'), JSON.stringify(indexTree));
});
