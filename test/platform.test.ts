/**
 * Tests for platform detection utilities
 */

import {
  getBinaryName,
  getAllPlatformBinaries,
  getPlatformIdentifier,
  isPlatformSupported,
  getCurrentPlatformBinary,
} from '../src/platform';

describe('Platform Detection', () => {
  describe('getBinaryName', () => {
    it('should return correct binary name for darwin-x64', () => {
      expect(getBinaryName('darwin', 'x64')).toBe(
        'css-variable-lsp-darwin-x64',
      );
    });

    it('should return correct binary name for darwin-arm64', () => {
      expect(getBinaryName('darwin', 'arm64')).toBe(
        'css-variable-lsp-darwin-arm64',
      );
    });

    it('should return correct binary name for linux-x64', () => {
      expect(getBinaryName('linux', 'x64')).toBe('css-variable-lsp-linux-x64');
    });

    it('should return correct binary name for linux-arm64', () => {
      expect(getBinaryName('linux', 'arm64')).toBe(
        'css-variable-lsp-linux-arm64',
      );
    });

    it('should return correct binary name for win32-x64', () => {
      expect(getBinaryName('win32', 'x64')).toBe(
        'css-variable-lsp-win32-x64.exe',
      );
    });

    it('should return correct binary name for win32-arm64', () => {
      expect(getBinaryName('win32', 'arm64')).toBe(
        'css-variable-lsp-win32-arm64.exe',
      );
    });

    it('should return null for unsupported platform', () => {
      expect(getBinaryName('freebsd', 'x64')).toBeNull();
    });

    it('should return null for unsupported architecture', () => {
      expect(getBinaryName('linux', 'mips')).toBeNull();
    });
  });

  describe('getAllPlatformBinaries', () => {
    it('should return 6 supported platforms', () => {
      const binaries = getAllPlatformBinaries();
      expect(binaries).toHaveLength(6);
    });

    it('should include all required platforms', () => {
      const binaries = getAllPlatformBinaries();
      const platforms = binaries.map((b) => `${b.platform}-${b.arch}`);

      expect(platforms).toContain('darwin-x64');
      expect(platforms).toContain('darwin-arm64');
      expect(platforms).toContain('linux-x64');
      expect(platforms).toContain('linux-arm64');
      expect(platforms).toContain('win32-x64');
      expect(platforms).toContain('win32-arm64');
    });

    it('should have correct binary names', () => {
      const binaries = getAllPlatformBinaries();

      binaries.forEach((binary) => {
        expect(binary.binaryName).toMatch(/^css-variable-lsp-/);
        if (binary.platform === 'win32') {
          expect(binary.binaryName).toMatch(/\.exe$/);
        }
      });
    });

    it('should have correct asset names', () => {
      const binaries = getAllPlatformBinaries();

      binaries.forEach((binary) => {
        expect(binary.assetName).toMatch(/^css-variable-lsp-/);
        expect(binary.assetName).toMatch(/\.(tar\.gz|zip)$/);
      });
    });
  });

  describe('getPlatformIdentifier', () => {
    it('should return a string identifier', () => {
      const identifier = getPlatformIdentifier();
      expect(typeof identifier).toBe('string');
      expect(identifier).toMatch(/^(darwin|linux|win32)-(x64|arm64)$/);
    });
  });

  describe('isPlatformSupported', () => {
    it('should return a boolean', () => {
      const supported = isPlatformSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('should be true for CI platforms', () => {
      // In CI, we're on linux-x64 which is supported
      const supported = isPlatformSupported();
      expect(supported).toBe(true);
    });
  });

  describe('getCurrentPlatformBinary', () => {
    it('should return platform info for current system', () => {
      const info = getCurrentPlatformBinary();

      if (isPlatformSupported()) {
        expect(info).not.toBeNull();
        expect(info).toHaveProperty('platform');
        expect(info).toHaveProperty('arch');
        expect(info).toHaveProperty('binaryName');
        expect(info).toHaveProperty('assetName');
      } else {
        expect(info).toBeNull();
      }
    });

    it('should have matching platform and arch', () => {
      const info = getCurrentPlatformBinary();

      if (info) {
        const expectedBinary = getBinaryName(info.platform, info.arch);
        expect(info.binaryName).toBe(expectedBinary);
      }
    });
  });
});
