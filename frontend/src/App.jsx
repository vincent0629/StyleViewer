import { useEffect, useRef, useState } from 'react'
import classNames from 'classnames';
import DelayedInput from './DelayedInput.jsx';
import './App.css'

const API = '/api';

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
        return styles;
      });
  };

  const rememberScrollOffset = () => {
    history.replaceState(Object.assign({}, history.state, {
      offset: [styleRef.current.scrollLeft, styleRef.current.scrollTop],
    }), null);
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
      .then((styles) => {
        rememberScrollOffset();
        history.pushState({style: name}, null, `/${name}`);
        setStyles(styles);
      });
  };

  const onFilterInputChange = (e) => {
    setFilter(e.target.value.toLowerCase());
  };

  const onStyleItemClick = (item) => {
    if (item.data !== undefined) {
      delete item.data;
      rememberScrollOffset();
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
        .then((styles) => {
          rememberScrollOffset();
          history.pushState({style: name}, null, `/${name}`);
          setStyles(styles);
        });
      return;
    }

    request(`/getall/${name}`)
      .then(values => {
        if (values.length > 0) {
          item.data = values;
          rememberScrollOffset();
          setStyles([...styles]);
        }
      });
  };

  const renderStyleName = (name) => {
    return (
      <div key={`name-${name}`} className="px-2" data-tag={name} onClick={onStyleNameClick}>
        {name}
      </div>
    );
  };

  const renderStyleItemData = (data) => {
    return data.map((d, index) => {
      const item = {
        name: '-',
        value: d,
      };
      return renderStyleItem(item, index);
    });
  };

  const renderStyleItem = (item, index) => {
    let onClick;
    if (item.name !== '-')
      onClick = () => {
        onStyleItemClick(item);
      };
    return (
      <>
        <div key={index} className="relative px-2" onClick={onClick}>
          <div className="w-80 truncate">{item.name}</div>
          <div className={classNames('absolute left-[336px] top-0 truncate', {'line-through': item.overwrite})}>{item.value}</div>
        </div>
        {item.data && renderStyleItemData(item.data)}
      </>
    );
  };

  const renderStyle = (style) => {
    return (
      <>
        <div key={style.name} className="p-2 text-gray-200 bg-gray-800">{style.name}</div>
        {style.items && style.items.filter(item => item.name.toLowerCase().indexOf(filter) >= 0).map((item, index) => renderStyleItem(item, index))}
      </>
    );
  };

  useEffect(() => {
    const offset = history.state?.offset || [0, 0];
    if (styleRef.current)
      styleRef.current.scrollTo(offset[0], offset[1]);
  }, [styles]);

  useEffect(() => {
    const onPopState = () => {
      const name = history.state?.style;
      if (name)
        fetchStyle(name)
          .then((styles) => {
            setStyles(styles);
          });
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
        <div className="grow pb-2 overflow-x-hidden overflow-y-auto">
          {styleNames && styleNames.map(name => renderStyleName(name))}
        </div>
      </div>
      <div className="grow flex flex-col">
        <div className="p-2">
          <DelayedInput className="w-full border p-1" type="text" placeholder="Filter" onChange={onFilterInputChange} />
        </div>
        <div className="grow pb-2 overflow-x-hidden overflow-y-auto" ref={styleRef}>
          {styles && styles.map(style => renderStyle(style))}
        </div>
      </div>
    </div>
  );
}

export default App;
