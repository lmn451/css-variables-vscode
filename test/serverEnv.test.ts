import { sanitizeRustServerEnv } from '../src/helpers';

describe('sanitizeRustServerEnv', () => {
  test('removes rust logging variables', () => {
    const env = sanitizeRustServerEnv({
      PATH: '/usr/bin',
      RUST_LOG: 'warn',
      RUST_LOG_STYLE: 'always',
    });

    expect(env.RUST_LOG).toBeUndefined();
    expect(env.RUST_LOG_STYLE).toBeUndefined();
  });

  test('preserves unrelated variables', () => {
    const env = sanitizeRustServerEnv({
      PATH: '/usr/bin',
      NODE_ENV: 'production',
      CSS_LSP_ENABLE_LOGS: '1',
    });

    expect(env.PATH).toBe('/usr/bin');
    expect(env.NODE_ENV).toBe('production');
    expect(env.CSS_LSP_ENABLE_LOGS).toBe('1');
  });

  test('handles undefined input', () => {
    const env = sanitizeRustServerEnv(undefined);
    expect(env).not.toBeUndefined();
    expect(env.RUST_LOG).toBeUndefined();
    expect(env.RUST_LOG_STYLE).toBeUndefined();
  });
});
