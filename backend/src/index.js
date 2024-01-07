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

app.get('/get/:type/:name', (req, res) => {
  res.json(styleTree.getResource(nodes, req.params.type, req.params.name));
});

app.listen(3000, () => {
  console.log('Listening on port 3000.');
});
