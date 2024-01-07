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

app.get('/get/color/:name', (req, res) => {
  res.json(styleTree.getColor(nodes, req.params.name));
});

app.get('/get/dimen/:name', (req, res) => {
  res.json(styleTree.getDimen(nodes, req.params.name));
});

app.get('/get/integer/:name', (req, res) => {
  res.json(styleTree.getInteger(nodes, req.params.name));
});

app.get('/get/:other/:name', (req, res) => {
  res.json(null);
});

app.listen(3000, () => {
  console.log('Listening on port 3000.');
});
