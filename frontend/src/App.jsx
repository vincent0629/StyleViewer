import { useState } from 'react'
import './App.css'

const API = 'http://localhost:3000';

function App() {
  const [nodeNames, setNodeNames] = useState();
  const [nodes, setNodes] = useState();

  const fetchNode = (name) => {
    return fetch(`${API}/get/${name}`)
      .then(node => node.json());
  };

  const parentName = (node) => {
    if (node.parent)
      return node.parent;
    else {
      const p = node.name.lastIndexOf('.');
      if (p > 0)
        return node.name.substring(0, p);
    }
    return null;
  };

  const fetchNodeFamily = (name) => {
    if (!name)
      return Promise.resolve(null);
    return new Promise((resolve) => {
      fetchNode(name)
        .then(node => {
          if (!node)
            resolve(null);
          else {
            fetchNodeFamily(parentName(node))
              .then((parent) => {
                if (parent)
                  resolve([node, ...parent]);
                else
                  resolve([node]);
              });
          }
        })
    });
  }

  const onInputChange = (e) => {
    if (e.target.value.length >= 3)
      fetch(`${API}/find/${e.target.value}`)
        .then(nodes => nodes.json())
        .then(json => {
          setNodeNames(json);
        });
  };

  const onNodeNameClick = (e) => {
    fetchNodeFamily(e.target.getAttribute('data-tag'))
      .then(nodes => {
        setNodes(nodes);
      });
  };

  const renderNodeName = (name) => {
    return (
      <div key={`name-${name}`} data-tag={name} onClick={onNodeNameClick}>
        {name}
      </div>
    );
  };

  const renderAttribute = (attr) => {
    return (
      <div key={attr[0]}>
        <span>{attr[0]}</span>
        <span>{attr[1]}</span>
      </div>
    );
  };

  const renderNode = (node) => {
    return (
      <div key={`node-${node.name}`}>
        <div>{node.name}</div>
        <div>
          {node.attributes && Object.entries(node.attributes).map(attr => renderAttribute(attr))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex">
      <div>
        <div className="p-2">
          <input className="w-full" type="text" placeholder="Type style name" onChange={onInputChange} />
        </div>
        {nodeNames && nodeNames.map(name => renderNodeName(name))}
      </div>
      <div>
        {nodes && nodes.map(node => renderNode(node))}
      </div>
    </div>
  );
}

export default App
