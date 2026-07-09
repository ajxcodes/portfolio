import '@testing-library/jest-dom';
Object.defineProperty(global, 'crypto', { value: { randomUUID: () => Math.random().toString() } });
Element.prototype.scrollTo = jest.fn();
