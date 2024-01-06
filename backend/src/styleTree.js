const fs = require('fs');
const sax = require('sax');

let st = -1;
const State = {
  ERROR: st++,
  INIT: st++,
  FINISH: st++,
  RESOURCES: st++,
  STYLE: st++,
  ITEM: st++,
};

const parseFile = (nodes, path) => {
  let state = State.INIT;
  let node = null;
  let attr = null;
  const parser = sax.parser(true);
  parser.onopentag = (tag) => {
    switch (state) {
      case State.INIT:
        if (tag.name === 'resources')
          state = State.RESOURCES;
        else
          state = State.ERROR;
        break;
      case State.RESOURCES:
        if (tag.name === 'style') {
          node = tag.attributes;
          state = State.STYLE;
        }
        break;
      case State.STYLE:
        if (tag.name === 'item') {
          attr = tag.attributes.name;
          state = State.ITEM;
        }
        break;
    }
  };
  parser.onclosetag = (tag) => {
    switch (state) {
      case State.RESOURCES:
        if (tag === 'resources')
          state = State.FINISH;
        break;
      case State.STYLE:
        if (tag === 'style') {
          nodes.push(node);
          node = null;
          state = State.RESOURCES;
        }
        break;
      case State.ITEM:
        if (tag === 'item')
          state = State.STYLE;
        break;
    }
  };
  parser.ontext = (text) => {
    if (state === State.ITEM)
      node[attr] = text;
  };

  const fd = fs.openSync(path, 'r');
  const buffer = new Int8Array(4096);
  const decoder = new TextDecoder('UTF-8');
  while (state != State.ERROR) {
    const bytes = fs.readSync(fd, buffer);
    parser.write(decoder.decode(buffer.subarray(0, bytes)));
    if (bytes < buffer.length)
      break;
  }
  fs.closeSync(fd);
  parser.close();
};

const scanDir = (nodes, dir) => {
  fs.readdirSync(dir, {withFileTypes: true}).forEach(file => {
    const path = `${dir}/${file.name}`;
    if (file.isDirectory() && file.name.indexOf('-') < 0)
      scanDir(nodes, path);
    else if (file.name.endsWith('.xml'))
      parseFile(nodes, path);
  });
};

const create = (dirs) => {
  const nodes = [];
  dirs.forEach(dir => {
    scanDir(nodes, dir);
  });
  return nodes;
};

const get = (nodes, name) => {
  return nodes.filter(node => node.name === name);
};

const find = (nodes, name) => {
  return nodes.filter(node => node.name.indexOf(name) >= 0).map(node => node.name);
};

module.exports = {
  create,
  get,
  find,
};
