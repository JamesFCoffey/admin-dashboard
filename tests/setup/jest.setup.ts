import '@testing-library/jest-dom';

// Provide a default matchMedia implementation for tests that rely on it.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

// Silence verbose debug logs emitted during hook tests.
const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => undefined);

afterAll(() => {
  debugSpy.mockRestore();
});
