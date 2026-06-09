import { useCallback, useEffect, useRef, useState } from "react";
import { PhotoViewer } from "./components/PhotoViewer";
import { SettingsPanel } from "./components/SettingsPanel";
import { DEFAULT_SETTINGS } from "./config/default-settings";
import { settingsService } from "./services/settingsService";
import "./App.css";

export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [appOpacity, setAppOpacity] = useState(DEFAULT_SETTINGS.opacity);
  const saveWindowTimer = useRef<number | undefined>(undefined);

  const loadAppAppearance = useCallback(async () => {
    const settings = await settingsService.getSettings();
    const opacity = Number(settings?.opacity ?? DEFAULT_SETTINGS.opacity);
    setAppOpacity(Math.min(1, Math.max(0.2, Number.isFinite(opacity) ? opacity : DEFAULT_SETTINGS.opacity)));
  }, []);

  const handleSaved = useCallback(() => {
    setRefreshToken((value) => value + 1);
    void loadAppAppearance();
  }, [loadAppAppearance]);

  useEffect(() => {
    void loadAppAppearance();
  }, [loadAppAppearance]);

  useEffect(() => {
    let disposed = false;
    let unlistenResize: (() => void) | undefined;

    void (async () => {
      try {
        const [{ getCurrentWindow, LogicalSize }, settings] = await Promise.all([
          import("@tauri-apps/api/window"),
          settingsService.getSettings(),
        ]);
        const appWindow = getCurrentWindow();
        const savedWindow = settings?.window;

        if (savedWindow?.width && savedWindow?.height) {
          await appWindow.setSize(new LogicalSize(savedWindow.width, savedWindow.height));
        }

        unlistenResize = await appWindow.onResized(({ payload }) => {
          if (disposed) return;

          window.clearTimeout(saveWindowTimer.current);
          saveWindowTimer.current = window.setTimeout(() => {
            void (async () => {
              try {
                const scaleFactor = await appWindow.scaleFactor();
                await settingsService.saveWindowSettings({
                  width: Math.round(payload.width / scaleFactor),
                  height: Math.round(payload.height / scaleFactor),
                });
              } catch (error) {
                console.warn("Could not persist window size", error);
              }
            })();
          }, 450);
        });
      } catch {
        // Browser preview has no native Tauri window to restore or observe.
      }
    })();

    return () => {
      disposed = true;
      window.clearTimeout(saveWindowTimer.current);
      unlistenResize?.();
    };
  }, []);

  return (
    <main className="app-shell full-bleed" style={{ opacity: appOpacity }}>
      <PhotoViewer
        refreshToken={refreshToken}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsPanel
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={handleSaved}
      />
    </main>
  );
}
