export async function register() {
  if (typeof globalThis.localStorage !== 'undefined') {
    try {
      globalThis.localStorage.getItem('__test__');
    } catch {
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
          key: () => null,
          length: 0,
        },
        writable: true,
        configurable: true,
      });
    }
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./app/api/metrics/route');
  }
}