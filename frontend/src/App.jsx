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
        const keys = {};
        nodes.forEach(node => {
          if (node.attributes)
            Object.keys(node.attributes).forEach(key => {
              if (key in keys)
                node.attributes[key] = '--' + node.attributes[key];
              else
                keys[key] = 1;
            });
        });
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
    let value = attr[1];
    let overwrite = undefined;
    if (value.startsWith('--')) {
      overwrite = 'line-through';
      value = value.substring(2);
    }
    return (
      <div key={attr[0]} className="flex px-2">
        <div className="w-80 overflow-x-hidden">{attr[0]}</div>
        <div className={`grow ml-2 ${overwrite}`}>{value}</div>
      </div>
    );
  };

  const renderNode = (node) => {
    return (
      <div key={`node-${node.name}`}>
        <div className="p-2 text-gray-200 bg-gray-800">{node.name}</div>
        <div>
          {node.attributes && Object.entries(node.attributes).map(attr => renderAttribute(attr))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-row h-full">
      <div className="max-w-[30%] flex flex-col">
        <div className="p-2">
          <input className="w-full border" type="text" placeholder="Type style name" onChange={onInputChange} />
        </div>
        <div className="grow p-2 overflow-x-hidden overflow-y-auto">
          {nodeNames && nodeNames.map(name => renderNodeName(name))}
        </div>
      </div>
      <div className="grow overflow-auto">
        {nodes && nodes.map(node => renderNode(node))}
      </div>
    </div>
  );
}

export default App
