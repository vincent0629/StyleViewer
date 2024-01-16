const express = require('express');
const cors = require('cors');
const styleTree = require('./styleTree');

let res = ['../res'];
if (process.argv.length > 2)
  res = process.argv.slice(2);

const nodes = styleTree.create(res)

const app = express();
app.use(cors());

const getFinalValue = (value) => {
  if (value instanceof Array) {
    return value.map(v => getFinalValue(v));
  }

  while (value.startsWith('@')) {
    const [type, name] = value.substring(1).split('/');
    const v = styleTree.getResource(nodes, type, name);
    if (v)
      value = v;
  }
  return value;
};

app.get('/api/find/style/:name', (req, res) => {
  res.json(styleTree.findStyle(nodes, req.params.name));
});

app.get('/api/get/style/:name', (req, res) => {
  res.json(styleTree.getStyle(nodes, req.params.name));
});

app.get('/api/getall/style/:name', (req, res) => {
  const result = [];
  let name = req.params.name;
  while (name) {
    const style = styleTree.getStyle(nodes, name);
    name = null;
    if (style !== null) {
      result.push(style);
      if (style.parent)
        name = style.parent;
      else {
        const index = style.name.lastIndexOf('.');
        if (index > 0)
          name = style.name.substring(0, index);
      }
    }
  }
  res.json(result);
});

app.get('/api/get/:type/:name', (req, res) => {
  res.json(styleTree.getResource(nodes, req.params.type, req.params.name));
});

app.get('/api/getall/:type/:name', (req, res) => {
  const result = [];
  let type = req.params.type;
  let name = req.params.name;
  while (name) {
    const res = styleTree.getResource(nodes, type, name);
    name = null;
    if (res !== null) {
      result.push(res);
      if (res instanceof Array) {
        if (res.map(v => v.startsWith('@')).length > 0)
          result.push(getFinalValue(res));
      } else {
        if (res.startsWith('@'))
          [type, name] = res.substring(1).split('/');
      }
    }
  }
  res.json(result);
});

app.get('/style/*', (req, res) => {
  res.redirect('/');
});

app.get('/*', (req, res) => {
  const options = {
    root: '../frontend/dist',
  };
  res.sendFile(req.path, options);
});

app.listen(3000, () => {
  console.log('Listening on port 3000.');
});
