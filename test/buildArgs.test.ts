import { buildServerArgs } from '../src/helpers';

describe('buildServerArgs', () => {
  test('builds args for color settings', () => {
    const cfg = {
      lookupFiles: ['**/*.css'],
      blacklistFolders: ['**/node_modules/**'],
      colorOnlyVariables: true,
      noColorPreview: false,
    } as any;
    const args = buildServerArgs(cfg);
    expect(args).toContain('--color-only-variables');
    expect(args).toContain('--lookup-file');
    expect(args).toContain('**/*.css');
  });

  test('respects noColorPreview over colorOnly', () => {
    const cfg = {
      lookupFiles: [],
      blacklistFolders: [],
      colorOnlyVariables: true,
      noColorPreview: true,
    } as any;
    const args = buildServerArgs(cfg);
    expect(args).toContain('--no-color-preview');
    expect(args).not.toContain('--color-only-variables');
  });
});
