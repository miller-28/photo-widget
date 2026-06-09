export const DEFAULT_SETTINGS = {
  folder_path: null as string | null,
  interval_seconds: 5,
  always_on_top: false,
  opacity: 1,
  max_images: 1000,
  window: {
    width: 800,
    height: 600,
  },
};

export type AppSettings = {
  folder_path?: string | null;
  folderPath?: string | null;
  interval_seconds?: number;
  intervalSeconds?: number;
  always_on_top?: boolean;
  alwaysOnTop?: boolean;
  opacity?: number;
  max_images?: number | null;
  window?: { x?: number; y?: number; width?: number; height?: number };
};
