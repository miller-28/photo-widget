import { DEFAULT_SETTINGS, type AppSettings } from "../config/default-settings";

type FsModule = {
  mkdir?: (path: string, options?: { recursive?: boolean }) => Promise<void>;
  readDir?: (path: string | URL) => Promise<Array<{ name: string; isDirectory: boolean; isFile: boolean }>>;
  readTextFile?: (path: string) => Promise<string>;
  remove?: (path: string | URL, options?: { recursive?: boolean }) => Promise<void>;
  writeTextFile?: (path: string, contents: string) => Promise<void>;
};

const SETTINGS_KEY = "luma_frame_settings";
const SETTINGS_JSON_KEY = `${SETTINGS_KEY}_json`;
const APP_DIR_NAME = "com.miller28.luma-frame";
const ALWAYS_ON_TOP_KEY = "luma_frame_always_on_top";
const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".webp",
  ".tiff",
  ".tif",
]);

function normalizeSettings(settings: AppSettings | null | undefined): AppSettings | null {
  if (!settings) return null;

  return {
    ...settings,
    folder_path: settings.folder_path ?? settings.folderPath ?? null,
    interval_seconds: settings.interval_seconds ?? settings.intervalSeconds ?? DEFAULT_SETTINGS.interval_seconds,
    always_on_top: settings.always_on_top ?? settings.alwaysOnTop ?? DEFAULT_SETTINGS.always_on_top,
    opacity: settings.opacity ?? DEFAULT_SETTINGS.opacity,
    max_images: settings.max_images ?? DEFAULT_SETTINGS.max_images,
    window: settings.window ?? DEFAULT_SETTINGS.window,
  };
}

async function loadFs(): Promise<FsModule | null> {
  try {
    return await import("@tauri-apps/plugin-fs");
  } catch {
    return null;
  }
}

function isImagePath(path: string) {
  const dot = path.lastIndexOf(".");
  if (dot < 0) return false;
  return IMAGE_EXTENSIONS.has(path.slice(dot).toLowerCase());
}

async function joinPath(...parts: string[]) {
  const path = await import("@tauri-apps/api/path");
  return path.join(...parts);
}

export class PhotoService {
  getAlwaysOnTop(): boolean {
    try {
      return JSON.parse(localStorage.getItem(ALWAYS_ON_TOP_KEY) ?? "false");
    } catch {
      return false;
    }
  }

  async setAlwaysOnTop(on: boolean) {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setAlwaysOnTop(on);
    } catch (error) {
      console.warn("setAlwaysOnTop failed", error);
    }

    localStorage.setItem(ALWAYS_ON_TOP_KEY, JSON.stringify(Boolean(on)));
  }

  loadFolder(): string | null {
    const legacyValue = localStorage.getItem(SETTINGS_KEY);
    if (legacyValue && !legacyValue.trim().startsWith("{")) return legacyValue;

    try {
      const raw = localStorage.getItem(SETTINGS_JSON_KEY);
      const parsed = raw ? normalizeSettings(JSON.parse(raw)) : null;
      return parsed?.folder_path ?? null;
    } catch {
      return null;
    }
  }

  async ensureAppDirs() {
    try {
      const fs = await loadFs();
      if (!fs?.mkdir) return null;

      const path = await import("@tauri-apps/api/path");
      const root = await path.join(await path.appDataDir(), APP_DIR_NAME);
      await fs.mkdir(root, { recursive: true });
      await fs.mkdir(await path.join(root, "cache"), { recursive: true });
      await fs.mkdir(await path.join(root, "thumbnails"), { recursive: true });
      return root;
    } catch {
      return null;
    }
  }

  async getSettingsFilePath() {
    try {
      const path = await import("@tauri-apps/api/path");
      return path.join(await path.appDataDir(), APP_DIR_NAME, "settings.json");
    } catch {
      return null;
    }
  }

  async saveSettings(settings: AppSettings) {
    const normalized = normalizeSettings(settings) ?? {};
    localStorage.setItem(SETTINGS_JSON_KEY, JSON.stringify(normalized));

    try {
      const fs = await loadFs();
      const filePath = await this.getSettingsFilePath();
      if (!fs?.writeTextFile || !filePath) return true;

      await this.ensureAppDirs();
      await fs.writeTextFile(filePath, JSON.stringify(normalized, null, 2));
      return true;
    } catch {
      return true;
    }
  }

  async deleteSettings() {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(SETTINGS_JSON_KEY);
    localStorage.removeItem(ALWAYS_ON_TOP_KEY);

    try {
      const fs = await loadFs();
      const filePath = await this.getSettingsFilePath();
      if (fs?.remove && filePath) {
        await fs.remove(filePath);
      }
    } catch (error) {
      console.warn("Could not delete native settings file", error);
    }

    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setAlwaysOnTop(DEFAULT_SETTINGS.always_on_top);
    } catch {
      // Ignore platform errors while resetting local state.
    }
  }

  async loadSettingsAsync(): Promise<AppSettings | null> {
    try {
      const fs = await loadFs();
      const filePath = await this.getSettingsFilePath();
      if (fs?.readTextFile && filePath) {
        const text = await fs.readTextFile(filePath);
        const parsed = normalizeSettings(JSON.parse(text));
        const merged = normalizeSettings({ ...DEFAULT_SETTINGS, ...parsed });
        localStorage.setItem(SETTINGS_JSON_KEY, JSON.stringify(merged));
        return merged;
      }
    } catch (error) {
      console.warn("Could not read settings file, using local settings fallback", error);
      // Browser dev and first-run Tauri installs land here.
    }

    try {
      const raw = localStorage.getItem(SETTINGS_JSON_KEY);
      const parsed = raw ? normalizeSettings(JSON.parse(raw)) : null;
      return normalizeSettings({ ...DEFAULT_SETTINGS, ...(parsed ?? {}) });
    } catch {
      return normalizeSettings(DEFAULT_SETTINGS);
    }
  }

  async saveWindowSettings(windowSettings: NonNullable<AppSettings["window"]>) {
    const current = (await this.loadSettingsAsync()) ?? {};
    return this.saveSettings({
      ...current,
      window: { ...current.window, ...windowSettings },
    });
  }

  async getEffectiveFolder(proposed?: string | null): Promise<string | null> {
    if (proposed?.trim()) return proposed.trim();

    const settings = await this.loadSettingsAsync();
    const savedFolder = settings?.folder_path ?? this.loadFolder();
    if (savedFolder) return savedFolder;

    try {
      const path = await import("@tauri-apps/api/path");
      return await path.pictureDir();
    } catch {
      return null;
    }
  }

  async getImagePaths(folder?: string | null, options?: { limit?: number }): Promise<string[]> {
    const root = await this.getEffectiveFolder(folder ?? null);
    if (!root) return [];

    const settings = await this.loadSettingsAsync();
    const limit = Math.min(options?.limit ?? settings?.max_images ?? DEFAULT_SETTINGS.max_images, 1000);
    const fs = await loadFs();
    if (!fs?.readDir) return [];

    const results: string[] = [];
    const stack = [root];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      let entries: Awaited<ReturnType<NonNullable<FsModule["readDir"]>>>;
      try {
        entries = await fs.readDir(current);
      } catch {
        continue;
      }

      for (const entry of entries) {
        const childPath = await joinPath(current, entry.name);

        if (entry.isDirectory) {
          stack.push(childPath);
          continue;
        }

        if (isImagePath(childPath)) {
          results.push(childPath);
          if (limit && results.length >= limit) return results;
        }
      }
    }

    return results;
  }
}

export const photoService = new PhotoService();
