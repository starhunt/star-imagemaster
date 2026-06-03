# Star ImageMaster

[English](./README.md) | [한국어](./README_KO.md)

Manage vault images with auto-save, gallery view, duplicate detection, smart delete, and link updates.

## Features

- Automatically save pasted or dropped images into configurable folders.
- Browse images in grid and list gallery views.
- Detect duplicate images with SHA-256 hashes.
- Find orphaned images that are no longer referenced by notes.
- Update links when images are moved or renamed.

## Installation

### From Community Plugins

1. Open Settings → Community plugins.
2. Search for **Star ImageMaster**.
3. Install and enable the plugin.

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [GitHub release](https://github.com/starhunt/star-imagemaster/releases/latest).
2. Create the plugin folder: `<vault>/.obsidian/plugins/star-imagemaster/`.
3. Copy the downloaded files into that folder.
4. Restart the app or reload plugins, then enable **Star ImageMaster** in Community plugins.

### Build from source

```bash
git clone https://github.com/starhunt/star-imagemaster.git
cd star-imagemaster
npm install
npm run build
```

Copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/star-imagemaster/`.

## Usage

1. Enable **Star ImageMaster** in Community plugins.
2. Open the command palette or use the plugin ribbon/sidebar entry.
3. Configure provider keys, folders, templates, or review options in plugin settings as needed.
4. Run the relevant command for your workflow.

## Commands

- `Open Gallery`

## Privacy and network use

Star ImageMaster works with image files inside your vault. It does not require an account, does not call external services, and does not collect telemetry.

## Platform

This plugin is desktop-only because it uses desktop-only APIs.

## License

MIT License. See [LICENSE](./LICENSE).
