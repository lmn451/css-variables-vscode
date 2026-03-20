import { buildServerArgs } from '../src/utils';
import type { PathDisplayMode, UndefinedVarFallbackMode } from '../src/utils';

// Create properly typed config objects instead of using `as any`
function createTestConfig(overrides: Partial<{
  lookupFiles: string[];
  blacklistFolders: string[];
  colorOnlyVariables: boolean;
  noColorPreview: boolean;
  pathDisplay: PathDisplayMode;
  pathDisplayLength: number;
  undefinedVarFallback: UndefinedVarFallbackMode;
}> = {}) {
  return {
    lookupFiles: ['**/*.css'],
    blacklistFolders: ['**/node_modules/**'],
    colorOnlyVariables: true,
    noColorPreview: false,
    serverImplementation: 'auto' as const,
    serverBinaryPath: '',
    ...overrides,
  };
}

describe('buildServerArgs', () => {
  test('builds args for color settings', () => {
    const cfg = createTestConfig();
    const args = buildServerArgs(cfg);
    expect(args).toContain('--color-only-variables');
    expect(args).toContain('--lookup-file');
    expect(args).toContain('**/*.css');
  });

  test('respects noColorPreview over colorOnly', () => {
    const cfg = createTestConfig({
      colorOnlyVariables: true,
      noColorPreview: true,
    });
    const args = buildServerArgs(cfg);
    expect(args).toContain('--no-color-preview');
    expect(args).not.toContain('--color-only-variables');
  });

  test('includes blacklist folders', () => {
    const cfg = createTestConfig({
      blacklistFolders: ['**/dist/**', '**/.git/**'],
    });
    const args = buildServerArgs(cfg);
    expect(args).toContain('--ignore-glob');
    expect(args).toContain('**/dist/**');
    expect(args).toContain('**/.git/**');
  });

  test('includes path display settings', () => {
    const cfg = createTestConfig({
      pathDisplay: 'absolute',
      pathDisplayLength: 2,
    });
    const args = buildServerArgs(cfg);
    expect(args).toContain('--path-display');
    expect(args).toContain('absolute');
    expect(args).toContain('--path-display-length');
    expect(args).toContain('2');
  });

  test('includes undefined var fallback setting', () => {
    const cfg = createTestConfig({
      undefinedVarFallback: 'warning',
    });
    const args = buildServerArgs(cfg);
    expect(args).toContain('--undefined-var-fallback');
    expect(args).toContain('warning');
  });

  test('handles abbreviated path display', () => {
    const cfg = createTestConfig({
      pathDisplay: 'abbreviated',
      pathDisplayLength: 0,
    });
    const args = buildServerArgs(cfg);
    expect(args).toContain('--path-display');
    expect(args).toContain('abbreviated');
    expect(args).toContain('--path-display-length');
    expect(args).toContain('0');
  });
});
