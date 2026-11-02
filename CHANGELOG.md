# Changelog

## 0.3.7

- Wait for language-server startup and queued restarts before shutting down, preventing leaked server processes and restarts after deactivation.
- Cancel pending configuration restarts when the extension deactivates.
- Handle replacement-server startup failures without unhandled promise rejections.
- Require TypeScript server 1.0.22 or newer, including workspace-root scanning, case-sensitive URI identity, and cross-document diagnostic lifecycle fixes.
