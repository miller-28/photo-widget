import { useCallback, useEffect, useMemo, useState } from "react";
import { photoService } from "../services/photoService";
import { closeApp, startWindowDrag, toImageSrc } from "../utils/tauri";
import "./PhotoViewer.css";

type PhotoViewerProps = {
  refreshToken: number;
  onOpenSettings: () => void;
};

const SOURCE_WINDOW_RADIUS = 5;
const MAX_IMAGE_PATHS = 1000;

function getSourceWindowIndexes(currentIndex: number, length: number) {
  const indexes: number[] = [];

  for (let offset = -SOURCE_WINDOW_RADIUS; offset <= SOURCE_WINDOW_RADIUS; offset += 1) {
    indexes.push((currentIndex + offset + length) % length);
  }

  return indexes.filter((index, position) => indexes.indexOf(index) === position);
}

export function PhotoViewer({ refreshToken, onOpenSettings }: PhotoViewerProps) {
  const [images, setImages] = useState<string[]>([]);
  const [imageSources, setImageSources] = useState<Record<number, string>>({});
  const [folder, setFolder] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(1);
  const [intervalSeconds, setIntervalSeconds] = useState(5);
  const [hovered, setHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshImages = useCallback(async () => {
    setLoading(true);
    setImages([]);
    setImageSources({});
    setCurrentIndex(0);

    const settings = (await photoService.loadSettingsAsync()) ?? {};
    const savedFolder = settings.folder_path ?? settings.folderPath ?? photoService.loadFolder();
    const nextOpacity = settings.opacity ?? 1;
    const nextInterval = settings.interval_seconds ?? settings.intervalSeconds ?? 5;

    setOpacity(nextOpacity);
    setIntervalSeconds(Math.max(1, Number(nextInterval) || 5));

    const folderToUse = await photoService.getEffectiveFolder(savedFolder ?? null);
    setFolder(folderToUse);

    const files = folderToUse ? await photoService.getImagePaths(folderToUse, { limit: MAX_IMAGE_PATHS }) : [];
    setImages(files);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshImages();
  }, [refreshImages, refreshToken]);

  useEffect(() => {
    if (images.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % images.length);
    }, intervalSeconds * 1000);

    return () => window.clearInterval(timer);
  }, [images.length, intervalSeconds]);

  useEffect(() => {
    if (!images.length) return undefined;

    let cancelled = false;
    const windowIndexes = getSourceWindowIndexes(currentIndex, images.length);

    void (async () => {
      const entries = await Promise.all(
        windowIndexes.map(async (index) => [index, await toImageSrc(images[index])] as const),
      );

      if (cancelled) return;

      setImageSources(Object.fromEntries(entries));

      entries.forEach(([index, src]) => {
        if (index === currentIndex) return;
        const image = new Image();
        image.src = src;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [currentIndex, images]);

  const hasImages = images.length > 0;
  const normalizedIndex = hasImages ? currentIndex % images.length : 0;
  const currentSrc = imageSources[normalizedIndex] ?? "";
  const title = useMemo(() => {
    if (!folder) return "LumaFrame";
    return `LumaFrame - ${images.length} image${images.length === 1 ? "" : "s"}`;
  }, [folder, images.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((index) => (images.length ? (index + 1) % images.length : index));
  }, [images.length]);

  const goPrevious = useCallback(() => {
    setCurrentIndex((index) => (images.length ? (index - 1 + images.length) % images.length : index));
  }, [images.length]);

  const skipBrokenImage = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((index) => (index + 1) % images.length);
  }, [images.length]);

  return (
    <section
      className="viewer"
      style={{ opacity }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`top-stripe ${hovered ? "visible" : ""}`}
        onMouseDown={(event) => {
          if ((event.target as HTMLElement).closest(".icon-btn")) return;
          void startWindowDrag();
        }}
      >
        <div className="left">
          <span className="title">{title}</span>
        </div>
        <div className="right">
          <button className="icon-btn" type="button" onClick={onOpenSettings} title="Settings" aria-label="Settings">
            {"\u2699"}
          </button>
          <button className="icon-btn" type="button" onClick={() => void closeApp()} title="Close" aria-label="Close">
            {"\u00d7"}
          </button>
        </div>
      </div>

      <div className="image-area">
        {hasImages && currentSrc ? (
          <>
            <img src={currentSrc} alt="Selected slideshow item" onError={skipBrokenImage} />
            <button className="nav left-nav" type="button" onClick={goPrevious} aria-label="Previous photo">
              {"\u2039"}
            </button>
            <button className="nav right-nav" type="button" onClick={goNext} aria-label="Next photo">
              {"\u203a"}
            </button>
          </>
        ) : loading || hasImages ? (
          <div className="empty">Loading images from Pictures...</div>
        ) : (
          <div className="empty">No images found. Set a folder in settings.</div>
        )}
      </div>
    </section>
  );
}
