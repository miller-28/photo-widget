# LumaFrame

LumaFrame is a lightweight floating desktop photo frame for local image folders. It opens as a small frameless window that can stay out of the way while cycling through photos from a selected folder, making it useful for ambient desktop slideshows, reference images, family photos, or a quiet visual companion while working.

The app stores user preferences locally, including the selected folder, slideshow interval, random playback, opacity, always-on-top behavior, and window size. It is designed to work as a native desktop app while keeping the UI simple, fast, and easy to preview during development.

## Tech Stack

- React 19 for the desktop UI
- TypeScript for typed application code
- Vite for frontend development and production builds
- Tauri 2 for the native desktop shell
- Rust for Tauri commands and native application integration
- `@tauri-apps/plugin-fs` for local filesystem access
- `@tauri-apps/plugin-opener` for native open behavior

## Development

Install dependencies:

```powershell
npm install
```

Start the frontend dev server:

```powershell
npm run start
```

In another terminal, launch the Tauri desktop app against the running dev server:

```powershell
npm run start-app
```

Create a frontend production bundle without packaging the desktop app:

```powershell
npm run build
```

Preview the frontend production bundle:

```powershell
npm run preview
```

## Production

Build the Tauri desktop app:

```powershell
npm run tauri -- build
```

Tauri runs the frontend build automatically through `src-tauri/tauri.conf.json`, then compiles and bundles the desktop app.

## EXE Artifacts

The portable Windows application executable is created here:

```text
src-tauri\target\release\luma-frame.exe
```

The bundled Windows installer executable is created under:

```text
src-tauri\target\release\bundle\nsis\
```

For version `0.1.0`, the installer is usually named similar to:

```text
LumaFrame_0.1.0_x64-setup.exe
```

Use the `bundle\nsis` setup executable when you want a single EXE artifact to upload or share as an installer. Use `target\release\luma-frame.exe` when you want to run the compiled app directly on the same machine.

## Package Details

- Package/repo name: `luma-frame`
- Tauri identifier: `com.miller28.luma-frame`
- Window title: `LumaFrame`

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer).
