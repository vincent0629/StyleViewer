import { useEffect, useRef, useState } from 'react'
import classNames from 'classnames';
import DelayedInput from './DelayedInput.jsx';
import './App.css'

const API = 'http://localhost:3000';

function App() {
  const [styleNames, setStyleNames] = useState();
  const [styles, setStyles] = useState();
  const [filter, setFilter] = useState('');
  const styleRef = useRef();
  const contextRef = useRef({});

  const request = (path) => {
    return fetch(`${API}${path}`)
      .then(res => res.json());
  }

  const fetchStyle = (name) => {
    return request(`/getall/style/${name}`)
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
        styleRef.current.scrollTo(0, 0);
      });
  };

  const onStyleInputChange = (e) => {
    const value = e.target.value;
    if (value.length >= 3)
      request(`/find/style/${value}`)
        .then(names => {
          setStyleNames(names);
        });
    else
      setStyleNames([]);
  };

  const onStyleNameClick = (e) => {
    const name = e.target.getAttribute('data-tag');
    fetchStyle(name)
      .then(() => {
        history.pushState({style: name}, null, `/${name}`);
      });
  };

  const onFilterInputChange = (e) => {
    setFilter(e.target.value.toLowerCase());
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
      name = name.substring(6);
      fetchStyle(name)
        .then(() => {
          history.pushState({style: name}, null, `/${name}`);
        });
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
          {style.items && style.items.filter(item => item.name.toLowerCase().indexOf(filter) >= 0).map((item, index) => renderStyleItem(item, index))}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const onPopState = () => {
      const name = history.state?.style;
      if (name)
        fetchStyle(name);
      else
        setStyles([]);
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  return (
    <div className="flex flex-row h-full">
      <div className="max-w-[30%] flex flex-col">
        <div className="p-2">
          <DelayedInput className="w-full border p-1" type="text" placeholder="Type style name" onChange={onStyleInputChange} />
        </div>
        <div className="grow pl-2 pr-2 pb-2 overflow-x-hidden overflow-y-auto">
          {styleNames && styleNames.map(name => renderStyleName(name))}
        </div>
      </div>
      <div className="grow overflow-auto" ref={styleRef}>
        <div className="p-2">
          <DelayedInput className="w-full border p-1" type="text" placeholder="Filter" onChange={onFilterInputChange} />
        </div>
        {styles && styles.map(style => renderStyle(style))}
      </div>
    </div>
  );
}

export default App;
