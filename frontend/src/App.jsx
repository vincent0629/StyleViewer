import { useRef, useState } from 'react'
import classNames from 'classnames';
import './App.css'

const API = 'http://localhost:3000';

function App() {
  const [styleNames, setStyleNames] = useState();
  const [styles, setStyles] = useState();
  const inputRef = useRef();
  const contextRef = useRef({});

  const fetchNode = (name) => {
    return fetch(`${API}/get/${name}`)
      .then(node => node.json());
  };

  const styleParentName = (style) => {
    if (style.parent)
      return style.parent;
    else {
      const p = style.name.lastIndexOf('.');
      if (p > 0)
        return style.name.substring(0, p);
    }
    return null;
  };

  const fetchStyleFamily = (name) => {
    if (!name)
      return Promise.resolve(null);
    return new Promise((resolve) => {
      fetchNode(`style/${name}`)
        .then(style => {
          if (!style)
            resolve(null);
          else {
            fetchStyleFamily(styleParentName(style))
              .then((parent) => {
                if (parent)
                  resolve([style, ...parent]);
                else
                  resolve([style]);
              });
          }
        })
    });
  };

  const fetchStyle = (name) => {
    fetchStyleFamily(name)
      .then(styles => {
        const keys = {};
        styles.forEach(style => {
          if (style.items) {
            const items = [];
            Object.keys(style.items).forEach(key => {
              const item = {
                name: key,
                value: style.items[key],
              };
              if (key in keys)
                item.overwrite = true;
              else
                keys[key] = 1;
              items.push(item);
            });
            style.items = items;
          }
        });
        setStyles(styles);
      });
  };

  const onTimeout = () => {
    contextRef.current.timer = 0;
    const input = inputRef.current;
    fetch(`${API}/find/style/${input.value}`)
      .then(styles => styles.json())
      .then(json => {
        setStyleNames(json);
      });
  };

  const onInputChange = (e) => {
    if (contextRef.current.timer)
      window.clearTimeout(contextRef.current.timer);
    if (e.target.value.length >= 3)
      contextRef.current.timer = window.setTimeout(onTimeout, 1000);
  };

  const onStyleNameClick = (e) => {
    fetchStyle(e.target.getAttribute('data-tag'));
  };

  const onStyleItemClick = (item) => {
    if (item.data !== undefined) {
      delete item.data;
      setStyles([...styles]);
      return;
    }

    let name = item.value;
    if (!name.startsWith('@') || name.indexOf('/') < 0)
      return;
    name = name.substring(1);
    if (name.startsWith('style/')) {
      fetchStyle(name.substring(6));
      return;
    }

    fetchNode(name)
      .then(value => {
        if (value != null) {
          item.data = value;
          setStyles([...styles]);
        }
      });
  };

  const renderStyleName = (name) => {
    return (
      <div key={`name-${name}`} data-tag={name} onClick={onStyleNameClick}>
        {name}
      </div>
    );
  };

  const renderStyleItemData = (data) => {
    const item = {
      name: null,
      value: data,
    };
    return renderStyleItem(item);
  };

  const renderStyleItem = (item) => {
    const onClick = () => {
      onStyleItemClick(item);
    };
    return (
      <div key={item.name}>
        <div className="flex px-2">
          <div className="grow-0 shrink-0 w-80 overflow-x-hidden">{item.name}</div>
          <div className={classNames('grow shrink ml-2', {'line-through': item.overwrite})} onClick={onClick}>{item.value}</div>
        </div>
        {item.data && renderStyleItemData(item.data)}
      </div>
    );
  };

  const renderStyle = (style) => {
    return (
      <div key={`style-${style.name}`}>
        <div className="p-2 text-gray-200 bg-gray-800">{style.name}</div>
        <div>
          {style.items && style.items.map(item => renderStyleItem(item))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-row h-full">
      <div className="max-w-[30%] flex flex-col">
        <div className="p-2">
          <input className="w-full border" type="text" placeholder="Type style name" onChange={onInputChange} ref={inputRef} />
        </div>
        <div className="grow p-2 overflow-x-hidden overflow-y-auto">
          {styleNames && styleNames.map(name => renderStyleName(name))}
        </div>
      </div>
      <div className="grow overflow-auto">
        {styles && styles.map(style => renderStyle(style))}
      </div>
    </div>
  );
}

export default App
