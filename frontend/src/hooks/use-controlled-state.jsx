import * as React from 'react';

export function useControlledState(props) {
  const { value, defaultValue, onChange } = props;
  const controlled = value !== undefined;
  const [internalState, setInternalState] = React.useState(defaultValue);
  const state = controlled ? value : internalState;

  const setState = React.useCallback((next, ...args) => {
    const nextValue = typeof next === 'function' ? next(state) : next;
    if (!controlled) setInternalState(nextValue);
    onChange?.(nextValue, ...args);
  }, [controlled, onChange, state]);

  return [state, setState];
}
