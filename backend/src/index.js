const express = require('express');
const styleTree = require('./styleTree');

if (process.argv.length < 3) {
  console.log('Usage: node index.js <res directory>');
  return;
}

const nodes = styleTree.create(process.argv.slice(2))

const app = express();

app.get('/get/:name', (req, res) => {
  res.json(styleTree.get(nodes, req.params.name));
});

app.get('/find/:name', (req, res) => {
  res.json(styleTree.find(nodes, req.params.name));
});

app.listen(3000, () => {
  console.log('Listening on port 3000.');
});
