import { useRef } from 'react'

function DelayedInput(props) {
  const { className, type, placeholder } = props;
  const contextRef = useRef({});

  const onTimeout = () => {
    contextRef.current.timer = 0;
    props.onChange(contextRef.current.event);
  };

  const onChange = (e) => {
    if (contextRef.current.timer)
      window.clearTimeout(contextRef.current.timer);
    contextRef.current.event = e;
    contextRef.current.timer = window.setTimeout(onTimeout, 1000);
  };

  return (
    <input className={className} type={type} placeholder={placeholder} onChange={onChange} />
  );
}

export default DelayedInput;
