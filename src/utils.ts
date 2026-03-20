/**
 * Pure utility functions that don't depend on VS Code APIs.
 * These are fully testable without mocking vscode.
 */

export type PathDisplayMode = 'relative' | 'absolute' | 'abbreviated';
export type UndefinedVarFallbackMode = 'warning' | 'info' | 'off';

export const DEFAULT_LOOKUP_FILES = [
  '**/*.less',
  '**/*.scss',
  '**/*.sass',
  '**/*.css',
  '**/*.html',
  '**/*.vue',
  '**/*.svelte',
  '**/*.astro',
  '**/*.ripple',
];

export const DEFAULT_BLACKLIST_FOLDERS = [
  '**/.cache/**',
  '**/.DS_Store',
  '**/.git/**',
  '**/.hg/**',
  '**/.next/**',
  '**/.svn/**',
  '**/bower_components/**',
  '**/CVS/**',
  '**/dist/**',
  '**/node_modules/**',
  '**/tests/**',
  '**/tmp/**',
];

export const LANGUAGE_IDS = [
  'css',
  'scss',
  'sass',
  'less',
  'html',
  'javascript',
  'typescript',
  'javascriptreact',
  'typescriptreact',
  'vue',
  'svelte',
  'astro',
  'postcss',
  'ripple',
];

export function normalizeStringArray(
  value: unknown,
  fallback: string[],
): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return fallback;
}

export function normalizePathDisplay(
  value: unknown,
): PathDisplayMode | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.toLowerCase();
  if (
    normalized === 'relative' ||
    normalized === 'absolute' ||
    normalized === 'abbreviated'
  ) {
    return normalized;
  }
  return undefined;
}

export function normalizePathDisplayLength(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return Math.floor(value);
}

export function normalizeUndefinedVarFallback(
  value: unknown,
): UndefinedVarFallbackMode | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'warning':
    case 'warn':
      return 'warning';
    case 'info':
    case 'information':
      return 'info';
    case 'off':
    case 'disable':
    case 'disabled':
    case 'none':
    case 'omit':
      return 'off';
    default:
      return undefined;
  }
}

export function sanitizeRustServerEnv(
  baseEnv: NodeJS.ProcessEnv | undefined = process.env,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...(baseEnv ?? {}) };
  delete env.RUST_LOG;
  delete env.RUST_LOG_STYLE;
  return env;
}

// Type for the config object used by buildServerArgs
export type BuildServerArgsConfig = {
  lookupFiles: string[];
  blacklistFolders: string[];
  colorOnlyVariables: boolean;
  noColorPreview: boolean;
  pathDisplay?: PathDisplayMode;
  pathDisplayLength?: number;
  undefinedVarFallback?: UndefinedVarFallbackMode;
};

export function buildServerArgs(config: BuildServerArgsConfig): string[] {
  const args: string[] = [];

  if (config.noColorPreview) {
    args.push('--no-color-preview');
  } else if (config.colorOnlyVariables) {
    args.push('--color-only-variables');
  }

  for (const glob of config.lookupFiles) {
    args.push('--lookup-file', glob);
  }

  for (const glob of config.blacklistFolders) {
    args.push('--ignore-glob', glob);
  }

  if (config.pathDisplay) {
    args.push('--path-display', config.pathDisplay);
  }

  if (config.pathDisplayLength !== undefined) {
    args.push('--path-display-length', String(config.pathDisplayLength));
  }

  if (config.undefinedVarFallback) {
    args.push('--undefined-var-fallback', config.undefinedVarFallback);
  }

  return args;
}
