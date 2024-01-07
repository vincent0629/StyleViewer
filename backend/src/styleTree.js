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
  SIMPLE: st++,
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
          nodes.style.push(node);
          state = State.STYLE;
        } else if (tag.name === 'color') {
          node = nodes.color;
          attr = tag.attributes.name;
          state = State.SIMPLE;
        } else if (tag.name === 'dimen') {
          node = nodes.dimen;
          attr = tag.attributes.name;
          state = State.SIMPLE;
        } else if (tag.name === 'integer') {
          node = nodes.integer;
          attr = tag.attributes.name;
          state = State.SIMPLE;
        }
        break;
      case State.STYLE:
        if (tag.name === 'item') {
          if (node.items === undefined)
            node.items = {};
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
        if (tag === 'style')
          state = State.RESOURCES;
        break;
      case State.ITEM:
        if (tag === 'item')
          state = State.STYLE;
        break;
      case State.SIMPLE:
        if (tag === 'color' || tag === 'dimen' || tag === 'integer')
          state = State.RESOURCES;
        break;
    }
  };
  parser.ontext = (text) => {
    if (state === State.ITEM)
      node.items[attr] = text;
    else if (state === State.SIMPLE)
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
  const nodes = {
    style: [],
    color: {},
    dimen: {},
    integer: {},
  };
  dirs.forEach(dir => {
    scanDir(nodes, dir);
  });
  return nodes;
};

const findStyle = (nodes, name) => {
  return nodes.style.filter(style => style.name.indexOf(name) >= 0).map(style => style.name).sort();
};

const getStyle = (nodes, name) => {
  const array = nodes.style.filter(style => style.name === name);
  return array.length > 0 ? array[0] : null;
};

const getColor = (nodes, name) => {
  return nodes.color[name] || null;
};

const getDimen = (nodes, name) => {
  return nodes.dimen[name] || null;
};

const getInteger = (nodes, name) => {
  return nodes.integer[name] || null;
};

module.exports = {
  create,
  findStyle,
  getStyle,
  getColor,
  getDimen,
  getInteger,
};
