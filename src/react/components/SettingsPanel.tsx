import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS } from "../config/default-settings";
import { settingsService } from "../services/settingsService";
import { startWindowDrag } from "../utils/tauri";
import "./SettingsPanel.css";

type SettingsPanelProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function SettingsPanel({ visible, onClose, onSaved }: SettingsPanelProps) {
  const [folderPath, setFolderPath] = useState("");
  const [intervalSeconds, setIntervalSeconds] = useState(DEFAULT_SETTINGS.interval_seconds);
  const [alwaysOnTop, setAlwaysOnTop] = useState(DEFAULT_SETTINGS.always_on_top);
  const [opacity, setOpacity] = useState(DEFAULT_SETTINGS.opacity);
  const [windowWidth, setWindowWidth] = useState<number | "">(DEFAULT_SETTINGS.window.width);
  const [windowHeight, setWindowHeight] = useState<number | "">(DEFAULT_SETTINGS.window.height);

  function resetFormToDefaults() {
    setFolderPath("");
    setIntervalSeconds(DEFAULT_SETTINGS.interval_seconds);
    setAlwaysOnTop(DEFAULT_SETTINGS.always_on_top);
    setOpacity(DEFAULT_SETTINGS.opacity);
    setWindowWidth(DEFAULT_SETTINGS.window.width);
    setWindowHeight(DEFAULT_SETTINGS.window.height);
  }

  useEffect(() => {
    if (!visible) return;

    void (async () => {
      const settings = (await settingsService.getSettings()) ?? {};
      setFolderPath(settings.folder_path ?? settings.folderPath ?? "");
      setIntervalSeconds(settings.interval_seconds ?? settings.intervalSeconds ?? DEFAULT_SETTINGS.interval_seconds);
      setAlwaysOnTop(settings.always_on_top ?? settings.alwaysOnTop ?? DEFAULT_SETTINGS.always_on_top);
      setOpacity(settings.opacity ?? DEFAULT_SETTINGS.opacity);
      setWindowWidth(settings.window?.width ?? DEFAULT_SETTINGS.window.width);
      setWindowHeight(settings.window?.height ?? DEFAULT_SETTINGS.window.height);
    })();
  }, [visible]);

  if (!visible) return null;

  async function save() {
    const windowSettings =
      windowWidth !== "" || windowHeight !== ""
        ? {
            width: windowWidth === "" ? undefined : Number(windowWidth),
            height: windowHeight === "" ? undefined : Number(windowHeight),
          }
        : undefined;

    await settingsService.saveSettings({
      folder_path: folderPath.trim() || null,
      interval_seconds: Math.max(1, Number(intervalSeconds) || DEFAULT_SETTINGS.interval_seconds),
      always_on_top: alwaysOnTop,
      opacity: Number(opacity),
      window: windowSettings,
    });

    if (windowSettings) {
      await settingsService.saveWindowSettings(windowSettings);
    }

    onSaved();
    onClose();
  }

  async function deleteSettings() {
    await settingsService.deleteSettings();
    resetFormToDefaults();
    onSaved();
  }

  return (
    <div className="settings-root open" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="settings-backdrop" />
      <section className="settings-inner" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drag-bar" onMouseDown={() => void startWindowDrag()} title="Drag to move window">
          <span className="drag-title">Settings</span>
          <button className="close-btn" type="button" onClick={onClose} aria-label="Close">
            {"\u00d7"}
          </button>
        </div>

        <div className="settings-body">
          <label className="row">
            <span>Folder</span>
            <input type="text" value={folderPath} onChange={(event) => setFolderPath(event.target.value)} />
          </label>

          <label className="row">
            <span>Interval (s)</span>
            <input
              type="number"
              min="1"
              value={intervalSeconds}
              onChange={(event) => setIntervalSeconds(Number(event.target.value))}
            />
          </label>

          <label className="row checkbox-row">
            <span>Always on top</span>
            <input type="checkbox" checked={alwaysOnTop} onChange={(event) => setAlwaysOnTop(event.target.checked)} />
          </label>

          <label className="row">
            <span>Opacity</span>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(event) => setOpacity(Number(event.target.value))}
            />
          </label>

          <label className="row">
            <span>Window Width (px)</span>
            <input
              type="number"
              min="200"
              value={windowWidth}
              onChange={(event) => setWindowWidth(event.target.value === "" ? "" : Number(event.target.value))}
            />
          </label>

          <label className="row">
            <span>Window Height (px)</span>
            <input
              type="number"
              min="200"
              value={windowHeight}
              onChange={(event) => setWindowHeight(event.target.value === "" ? "" : Number(event.target.value))}
            />
          </label>

          <div className="row actions">
            <button className="delete-settings-btn" type="button" onClick={() => void deleteSettings()}>
              Delete settings
            </button>
            <button className="save-btn" type="button" onClick={() => void save()}>
              Save
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
