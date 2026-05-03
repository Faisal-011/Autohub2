// This file runs before everything else in Next.js.
// Node.js v25 exposes localStorage globally via the --localstorage-file flag,
// but without a valid file path it throws "localStorage.getItem is not a function".
// We patch it here to be a safe no-op on the server.
export async function register() {
  if (typeof globalThis.localStorage !== 'undefined') {
    try {
      // Quick test — if this throws, patch it
      globalThis.localStorage.getItem('__test__');
    } catch {
      // Patch with a safe no-op implementation
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
}
