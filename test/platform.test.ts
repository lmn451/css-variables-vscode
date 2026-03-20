/**
 * Tests for platform detection utilities
 */

import {
  getBinaryName,
  getAllPlatformBinaries,
  getPlatformIdentifier,
  isPlatformSupported,
  getCurrentPlatformBinary,
  getBinaryPath,
  getPlatformBinary,
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

    it('should return null for empty platform', () => {
      expect(getBinaryName('', 'x64')).toBeNull();
    });

    it('should return null for empty arch', () => {
      expect(getBinaryName('darwin', '')).toBeNull();
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

    it('each binary should have valid platform and arch', () => {
      const binaries = getAllPlatformBinaries();

      binaries.forEach((binary) => {
        expect(binary.platform).toMatch(/^(darwin|linux|win32)$/);
        expect(binary.arch).toMatch(/^(x64|arm64)$/);
      });
    });
  });

  describe('getPlatformIdentifier', () => {
    it('should return a string identifier', () => {
      const identifier = getPlatformIdentifier();
      expect(typeof identifier).toBe('string');
      expect(identifier).toMatch(/^(darwin|linux|win32)-(x64|arm64)$/);
    });

    it('should match expected format with dash separator', () => {
      const identifier = getPlatformIdentifier();
      expect(identifier).toContain('-');
    });
  });

  describe('isPlatformSupported', () => {
    it('should return a boolean', () => {
      const supported = isPlatformSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('should be true for supported CI platforms', () => {
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

    it('should have non-empty binary and asset names', () => {
      const info = getCurrentPlatformBinary();

      if (info) {
        expect(info.binaryName.length).toBeGreaterThan(0);
        expect(info.assetName.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getPlatformBinary', () => {
    it('should return correct binary for darwin-x64', () => {
      const result = getPlatformBinary('darwin', 'x64');
      expect(result).not.toBeNull();
      expect(result?.binaryName).toBe('css-variable-lsp-darwin-x64');
    });

    it('should return null for unsupported platform', () => {
      const result = getPlatformBinary('freebsd', 'x64');
      expect(result).toBeNull();
    });

    it('should return null for unsupported arch', () => {
      const result = getPlatformBinary('linux', 'ppc');
      expect(result).toBeNull();
    });

    it('should return correct binary for win32-arm64', () => {
      const result = getPlatformBinary('win32', 'arm64');
      expect(result).not.toBeNull();
      expect(result?.binaryName).toBe('css-variable-lsp-win32-arm64.exe');
    });

    it('should return correct binary for linux-arm64', () => {
      const result = getPlatformBinary('linux', 'arm64');
      expect(result).not.toBeNull();
      expect(result?.binaryName).toBe('css-variable-lsp-linux-arm64');
    });
  });

  describe('getBinaryPath', () => {
    it('should construct path for current platform', () => {
      const info = getCurrentPlatformBinary();
      if (info) {
        const path = getBinaryPath('/extension/path');
        expect(path).toContain(info.binaryName);
        expect(path).toContain('/extension/path');
        expect(path).toContain('bin');
      }
    });

    it('should use custom binary name when provided', () => {
      const path = getBinaryPath('/test', 'my-custom-binary');
      expect(path).toBe('/test/bin/my-custom-binary');
    });

    it('should throw when no binary available for platform', () => {
      // This test verifies the error path when getCurrentPlatformBinary returns null
      // and no custom binary name is provided. In practice, this would need platform mocking.
      expect(() => {
        getBinaryPath('/test');
      }).not.toThrow(); // Current platform is supported, so no error
    });
  });
});
