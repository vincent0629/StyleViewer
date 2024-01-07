import { useRef, useState } from 'react'
import classNames from 'classnames';
import './App.css'

const API = 'http://localhost:3000';

function App() {
  const [styleNames, setStyleNames] = useState();
  const [styles, setStyles] = useState();
  const inputRef = useRef();
  const contextRef = useRef({});

  const request = (path) => {
    return fetch(`${API}${path}`)
      .then(res => res.json());
  }

  const fetchStyle = (name) => {
    request(`/getall/style/${name}`)
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
    request(`/find/style/${input.value}`)
      .then(names => {
        setStyleNames(names);
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

    request(`/getall/${name}`)
      .then(values => {
        if (values.length > 0) {
          item.data = values;
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
    return data.map((d, index) => {
      const item = {
        name: null,
        value: d,
      };
      return renderStyleItem(item, index);
    });
  };

  const renderStyleItem = (item, index) => {
    const onClick = () => {
      onStyleItemClick(item);
    };
    return (
      <div key={index}>
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
          {style.items && style.items.map((item, index) => renderStyleItem(item, index))}
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
        <div className="grow pl-2 pr-2 pb-2 overflow-x-hidden overflow-y-auto">
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
