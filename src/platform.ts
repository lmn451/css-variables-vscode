/**
 * Platform detection utilities for selecting the correct Rust LSP binary
 */

import * as os from 'os';
import * as path from 'path';

export type PlatformBinary = {
  platform: string;
  arch: string;
  binaryName: string;
  assetName: string;
};

// Map Node.js platform/arch to binary names
const PLATFORM_MAPPINGS: Record<
  string,
  Record<string, { binary: string; asset: string }>
> = {
  darwin: {
    x64: {
      binary: 'css-variable-lsp-darwin-x64',
      asset: 'css-variable-lsp-macos-x86_64.tar.gz',
    },
    arm64: {
      binary: 'css-variable-lsp-darwin-arm64',
      asset: 'css-variable-lsp-macos-aarch64.tar.gz',
    },
  },
  linux: {
    x64: {
      binary: 'css-variable-lsp-linux-x64',
      asset: 'css-variable-lsp-linux-x86_64.tar.gz',
    },
    arm64: {
      binary: 'css-variable-lsp-linux-arm64',
      asset: 'css-variable-lsp-linux-aarch64.tar.gz',
    },
  },
  win32: {
    x64: {
      binary: 'css-variable-lsp-win32-x64.exe',
      asset: 'css-variable-lsp-windows-x86_64.exe.zip',
    },
    arm64: {
      binary: 'css-variable-lsp-win32-arm64.exe',
      asset: 'css-variable-lsp-windows-aarch64.exe.zip',
    },
  },
};

/**
 * Get the platform binary info for the current system
 */
export function getCurrentPlatformBinary(): PlatformBinary | null {
  const platform = os.platform();
  const arch = os.arch();

  const mapping = PLATFORM_MAPPINGS[platform]?.[arch];
  if (!mapping) {
    return null;
  }

  return {
    platform,
    arch,
    binaryName: mapping.binary,
    assetName: mapping.asset,
  };
}

/**
 * Get the binary name for a specific platform/arch
 */
export function getBinaryName(platform: string, arch: string): string | null {
  return PLATFORM_MAPPINGS[platform]?.[arch]?.binary || null;
}

/**
 * Get all supported platform binaries
 */
export function getAllPlatformBinaries(): PlatformBinary[] {
  const binaries: PlatformBinary[] = [];

  for (const [platform, archs] of Object.entries(PLATFORM_MAPPINGS)) {
    for (const [arch, mapping] of Object.entries(archs)) {
      binaries.push({
        platform,
        arch,
        binaryName: mapping.binary,
        assetName: mapping.asset,
      });
    }
  }

  return binaries;
}

/**
 * Get the full path to the binary for the current platform
 */
export function getBinaryPath(
  extensionPath: string,
  binaryName?: string,
): string {
  const binary = binaryName || getCurrentPlatformBinary()?.binaryName;
  if (!binary) {
    throw new Error(`Unsupported platform: ${os.platform()} ${os.arch()}`);
  }
  return path.join(extensionPath, 'bin', binary);
}

/**
 * Check if the current platform is supported
 */
export function isPlatformSupported(): boolean {
  return getCurrentPlatformBinary() !== null;
}

/**
 * Get a human-readable platform identifier
 */
export function getPlatformIdentifier(): string {
  return `${os.platform()}-${os.arch()}`;
}

/**
 * Get the platform binary info for a specific platform/arch combination
 */
export function getPlatformBinary(
  platform: string,
  arch: string,
): PlatformBinary | null {
  const mapping = PLATFORM_MAPPINGS[platform]?.[arch];
  if (!mapping) {
    return null;
  }

  return {
    platform,
    arch,
    binaryName: mapping.binary,
    assetName: mapping.asset,
  };
}
