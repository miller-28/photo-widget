export async function startWindowDrag() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().startDragging();
  } catch {
    // Browser dev mode cannot drag native windows.
  }
}

export async function closeApp() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().close();
    return;
  } catch (error) {
    console.warn("Window close failed", error);
  }

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("force_quit");
    return;
  } catch (error) {
    console.warn("Force quit failed", error);
  }

  window.close();
}

export async function toImageSrc(path: string) {
  try {
    const { convertFileSrc } = await import("@tauri-apps/api/core");
    return convertFileSrc(path);
  } catch {
    return path;
  }
}
