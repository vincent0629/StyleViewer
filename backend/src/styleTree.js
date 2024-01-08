const fs = require('fs');
const sax = require('sax');

let st = -1;
const State = {
  ERROR: st++,
  INIT: st++,
  FINISH: st++,
  RESOURCES: st++,
  STYLE: st++,
  STYYLE_ITEM: st++,
  ARRAY: st++,
  ARRAY_ITEM: st++,
  SIMPLE: st++,
};

const SimpleTypes = [
  'color', 'dimen', 'integer', 'string', 'bool', 'fraction',
];

const parseFile = (nodes, path) => {
  let state = State.INIT;
  let node = null;
  let name = null;
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
        } else if (tag.name.endsWith('array')) {
          node = [];
          nodes.array[tag.attributes.name] = node;
          state = State.ARRAY;
        } else if (tag.name === 'item') {
          const type = tag.attributes.type;
          if (nodes[type] === undefined)
            nodes[type] = {};
          node = nodes[type];
          name = tag.attributes.name;
          state = State.SIMPLE;
        } else if (SimpleTypes.indexOf(tag.name) >= 0) {
          const type = tag.name;
          if (nodes[type] === undefined)
            nodes[type] = {};
          node = nodes[type];
          name = tag.attributes.name;
          state = State.SIMPLE;
        }
        break;
      case State.ARRAY:
        if (tag.name === 'item')
          state = State.ARRAY_ITEM;
        break;
      case State.STYLE:
        if (tag.name === 'item') {
          if (node.items === undefined)
            node.items = {};
          name = tag.attributes.name;
          state = State.STYLE_ITEM;
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
      case State.STYLE_ITEM:
        if (tag === 'item')
          state = State.STYLE;
        break;
      case State.ARRAY:
        if (tag.endsWith('array'))
          state = State.RESOURCES;
        break;
      case State.ARRAY_ITEM:
        if (tag === 'item')
          state = State.ARRAY;
        break;
      case State.SIMPLE:
        state = State.RESOURCES;
        break;
    }
  };
  parser.ontext = (text) => {
    switch (state) {
      case State.STYLE_ITEM:
        node.items[name] = text;
        break;
      case State.ARRAY_ITEM:
        node.push(text);
        break;
      case State.SIMPLE:
        node[name] = text;
        break;
    }
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
    array: {},
  };
  dirs.forEach(dir => {
    scanDir(nodes, dir);
  });
  return nodes;
};

const findStyle = (nodes, name) => {
  name = name.toLowerCase();
  return nodes.style.filter(style => style.name.toLowerCase().indexOf(name) >= 0).map(style => style.name).sort();
};

const getStyle = (nodes, name) => {
  const array = nodes.style.filter(style => style.name === name);
  return array.length > 0 ? array[0] : null;
};

const getResource = (nodes, type, name) => {
  if (!nodes[type])
    return null;
  return nodes[type][name] || null;
};

module.exports = {
  create,
  findStyle,
  getStyle,
  getResource,
};
