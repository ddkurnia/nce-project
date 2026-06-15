const state = {
  user: null,
  commodities: [],
  requests: [],
  currentView: null,
  currentRoute: '/',
  notifications: 0,
  loading: false,
};

const listeners = new Map();

export function getState(key) {
  return state[key];
}

export function setState(key, value) {
  const oldValue = state[key];
  state[key] = value;
  if (oldValue !== value) {
    const fns = listeners.get(key);
    if (fns) fns.forEach(fn => fn(value, oldValue));
  }
}

export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, []);
  listeners.get(key).push(fn);
  return () => {
    const fns = listeners.get(key);
    if (fns) {
      const idx = fns.indexOf(fn);
      if (idx > -1) fns.splice(idx, 1);
    }
  };
}

export function getAllState() {
  return { ...state };
}
