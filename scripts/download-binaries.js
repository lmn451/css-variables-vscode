#!/usr/bin/env node

/**
 * Download css-lsp-rust binaries from GitHub releases
 * This script fetches the latest release and downloads all platform binaries
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GITHUB_API_URL =
  'https://api.github.com/repos/lmn451/css-lsp-rust/releases/latest';
const BIN_DIR = path.join(__dirname, '..', 'bin');

// Platform mapping: GitHub asset name -> local binary name
const PLATFORMS = [
  {
    asset: 'css-variable-lsp-macos-aarch64.tar.gz',
    binary: 'css-variable-lsp-darwin-arm64',
  },
  {
    asset: 'css-variable-lsp-macos-x86_64.tar.gz',
    binary: 'css-variable-lsp-darwin-x64',
  },
  {
    asset: 'css-variable-lsp-linux-x86_64.tar.gz',
    binary: 'css-variable-lsp-linux-x64',
  },
  {
    asset: 'css-variable-lsp-linux-aarch64.tar.gz',
    binary: 'css-variable-lsp-linux-arm64',
  },
  {
    asset: 'css-variable-lsp-windows-x86_64.exe.zip',
    binary: 'css-variable-lsp-win32-x64.exe',
  },
  {
    asset: 'css-variable-lsp-windows-aarch64.exe.zip',
    binary: 'css-variable-lsp-win32-arm64.exe',
  },
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'css-variables-vscode-extension',
        Accept: 'application/vnd.github.v3+json',
      },
    };

    https
      .get(url, options, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          // Follow redirect
          fetchJson(res.headers.location).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}`));
          }
        });
      })
      .on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'css-variables-vscode-extension',
      },
    };

    https
      .get(url, options, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          downloadFile(res.headers.location, destPath)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
        file.on('error', reject);
      })
      .on('error', reject);
  });
}

function extractTarGz(archivePath, destDir) {
  try {
    execSync(`tar -xzf "${archivePath}" -C "${destDir}"`, { stdio: 'inherit' });
    return true;
  } catch (e) {
    console.error(`Failed to extract ${archivePath}:`, e.message);
    return false;
  }
}

function extractZip(archivePath, destDir) {
  try {
    if (process.platform === 'win32') {
      execSync(
        `powershell -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${destDir}' -Force"`,
        { stdio: 'inherit' },
      );
    } else {
      execSync(`unzip -o "${archivePath}" -d "${destDir}"`, {
        stdio: 'inherit',
      });
    }
    return true;
  } catch (e) {
    console.error(`Failed to extract ${archivePath}:`, e.message);
    return false;
  }
}

async function main() {
  console.log('Fetching latest css-lsp-rust release...');

  let release;
  try {
    release = await fetchJson(GITHUB_API_URL);
  } catch (e) {
    console.error('Failed to fetch release info:', e.message);
    process.exit(1);
  }

  console.log(`Found release: ${release.tag_name}`);
  console.log(`\nDownloading binaries to: ${BIN_DIR}\n`);

  // Ensure bin directory exists
  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
  }

  // Save version info
  fs.writeFileSync(
    path.join(BIN_DIR, 'version.json'),
    JSON.stringify(
      { version: release.tag_name, downloaded: new Date().toISOString() },
      null,
      2,
    ),
  );

  for (const platform of PLATFORMS) {
    const asset = release.assets.find((a) => a.name === platform.asset);
    if (!asset) {
      console.warn(`⚠️  Asset not found: ${platform.asset}`);
      continue;
    }

    const archivePath = path.join(BIN_DIR, platform.asset);
    const binaryPath = path.join(BIN_DIR, platform.binary);

    // Skip if already exists
    if (fs.existsSync(binaryPath)) {
      console.log(`✓ ${platform.binary} already exists, skipping`);
      continue;
    }

    console.log(`\n📥 Downloading ${platform.asset}...`);
    try {
      await downloadFile(asset.browser_download_url, archivePath);
      console.log(`  Downloaded: ${(asset.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (e) {
      console.error(`  ✗ Failed to download:`, e.message);
      continue;
    }

    console.log(`📦 Extracting...`);
    const isZip = platform.asset.endsWith('.zip');
    const extracted = isZip
      ? extractZip(archivePath, BIN_DIR)
      : extractTarGz(archivePath, BIN_DIR);

    if (extracted) {
      // The extracted file will be named 'css-variable-lsp' or 'css-variable-lsp.exe'
      // We need to rename it to our platform-specific name
      const extractedName = platform.asset.includes('windows')
        ? 'css-variable-lsp.exe'
        : 'css-variable-lsp';
      const extractedPath = path.join(BIN_DIR, extractedName);

      if (fs.existsSync(extractedPath)) {
        fs.renameSync(extractedPath, binaryPath);
        console.log(`  ✓ Renamed to ${platform.binary}`);

        // Make executable on Unix
        if (!platform.asset.includes('windows')) {
          fs.chmodSync(binaryPath, 0o755);
          console.log(`  ✓ Made executable`);
        }
      } else {
        console.warn(
          `  ⚠️  Expected extracted file not found: ${extractedName}`,
        );
      }

      // Clean up archive
      fs.unlinkSync(archivePath);
      console.log(`  ✓ Cleaned up archive`);
    }
  }

  console.log('\n✅ Download complete!\n');

  // List downloaded binaries
  const binaries = fs
    .readdirSync(BIN_DIR)
    .filter((f) => f.startsWith('css-variable-lsp-'));
  console.log('Downloaded binaries:');
  binaries.forEach((b) => {
    const stats = fs.statSync(path.join(BIN_DIR, b));
    console.log(`  ${b} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  });
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
