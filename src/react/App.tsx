import { useCallback, useState } from "react";
import { PhotoViewer } from "./components/PhotoViewer";
import { SettingsPanel } from "./components/SettingsPanel";
import "./App.css";

export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleSaved = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  return (
    <main className="app-shell full-bleed">
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
