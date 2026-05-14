import { describe, it, expect } from 'vitest';
import { server } from './msw-handlers';

describe('MSW setup', () => {
  it('server is defined', () => {
    expect(server).toBeDefined();
  });
});
