export function createEventBus() {
  const handlers = {};
  return {
    on(event, fn) {
      (handlers[event] ??= []).push(fn);
      return () => {
        handlers[event] = handlers[event].filter(f => f !== fn);
      };
    },
    emit(event, ...args) {
      const fns = handlers[event];
      if (fns) for (let i = 0; i < fns.length; i++) fns[i](...args);
    },
    clear() {
      for (const k in handlers) delete handlers[k];
    }
  };
}
