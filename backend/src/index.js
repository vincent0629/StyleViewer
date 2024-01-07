const express = require('express');
const cors = require('cors');
const styleTree = require('./styleTree');

if (process.argv.length < 3) {
  console.log('Usage: node index.js <res directory>');
  return;
}

const nodes = styleTree.create(process.argv.slice(2))

const app = express();
app.use(cors());

app.get('/find/style/:name', (req, res) => {
  res.json(styleTree.findStyle(nodes, req.params.name));
});

app.get('/get/style/:name', (req, res) => {
  res.json(styleTree.getStyle(nodes, req.params.name));
});

app.get('/getall/style/:name', (req, res) => {
  const result = [];
  let name = req.params.name;
  while (name) {
    const style = styleTree.getStyle(nodes, name);
    if (style !== null) {
      result.push(style);
      name = null;
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

app.get('/get/:type/:name', (req, res) => {
  res.json(styleTree.getResource(nodes, req.params.type, req.params.name));
});

app.get('/getall/:type/:name', (req, res) => {
  const result = [];
  let type = req.params.type;
  let name = req.params.name;
  while (name) {
    const res = styleTree.getResource(nodes, type, name);
    if (res !== null) {
      result.push(res);
      name = null;
      if (res.startsWith('@'))
        [type, name] = res.substring(1).split('/');
    }
  }
  res.json(result);
});

app.listen(3000, () => {
  console.log('Listening on port 3000.');
});
