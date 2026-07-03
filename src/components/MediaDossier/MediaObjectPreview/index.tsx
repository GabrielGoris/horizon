import type { MediaItem } from "../../../types";

interface MediaObjectPreviewProps {
  item: MediaItem;
}

function getBookDepth(item: MediaItem) {
  const pageCount = Number(item.page_count ?? item.pages ?? item.progress?.total);

  if (!Number.isFinite(pageCount) || pageCount <= 0) {
    return 44;
  }

  if (pageCount < 200) return 30;
  if (pageCount < 400) return 42;
  if (pageCount < 700) return 54;
  return 68;
}

export function MediaObjectPreview({ item }: MediaObjectPreviewProps) {
  const isBook = item.type === "books";
  const isGame = item.type === "games";
  const depth = isBook ? getBookDepth(item) : 26;
  const width = 148;
  const height = 210;
  const spineColor = isBook ? "#08080a" : isGame ? "#1e222b" : "#111114";
  const edgeColor = isBook ? "#d8c08a" : spineColor;
  const backColor = isBook ? "#151515" : isGame ? "#151923" : "#09090b";
  const spineTextColor = isBook ? "#d8c08a" : "rgba(255,255,255,0.35)";
  const spineTitle = item.title.length > 28 ? `${item.title.slice(0, 28)}...` : item.title;
  const backgroundImage = item.backdrop || item.cover;

  return (
    <div className="relative mx-auto mb-8 flex h-[250px] items-center justify-center overflow-hidden rounded-2xl [perspective:900px]">
      {backgroundImage && (
        <>
          <img
            src={backgroundImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-105 object-cover opacity-60 blur-sm"
          />
          <div className="absolute inset-0 bg-[#17171a]/42" />
          <div className="absolute inset-x-8 bottom-4 h-20 rounded-full bg-black/35 blur-2xl" />
        </>
      )}

      <div
        className="animate-media-object-float transform-style-3d relative z-10 h-[210px] w-[148px]"
        style={{
          ["--object-depth" as string]: `${depth}px`,
          ["--object-width" as string]: `${width}px`,
          ["--object-height" as string]: `${height}px`,
          ["--object-half-depth" as string]: `${depth / 2}px`,
          ["--object-half-width" as string]: `${width / 2}px`,
          ["--object-half-height" as string]: `${height / 2}px`,
        }}
      >
        <div className="transform-style-3d absolute inset-0 rounded-md shadow-2xl shadow-black/60">
          <div className="absolute inset-0 overflow-hidden rounded-md border border-white/15 bg-[#111] [backface-visibility:hidden] [transform:translateZ(var(--object-half-depth))]">
            <img
              src={item.cover}
              alt={`Capa de ${item.title}`}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/35" />
          </div>

          <div
            className="absolute inset-0 rounded-md border border-white/10 shadow-inner [transform:rotateY(180deg)_translateZ(var(--object-half-depth))]"
            style={{ background: backColor }}
          />

          <div
            className="absolute top-0 h-full border border-white/10 shadow-inner [left:calc(50%_-_var(--object-half-depth))] [transform:rotateY(-90deg)_translateZ(var(--object-half-width))]"
            style={{ width: `${depth}px`, background: spineColor }}
          >
            <div className="flex h-full items-center justify-center">
              <span
                className="rotate-180 [writing-mode:vertical-rl] font-mono text-[8px] font-bold uppercase tracking-[0.24em]"
                style={{ color: spineTextColor }}
              >
                {spineTitle}
              </span>
            </div>
          </div>

          <div
            className="absolute top-0 h-full border border-white/10 shadow-inner [left:calc(50%_-_var(--object-half-depth))] [transform:rotateY(90deg)_translateZ(var(--object-half-width))]"
            style={{ width: `${depth}px`, background: edgeColor }}
          />

          <div
            className="absolute left-0 w-full border border-white/10 [top:calc(50%_-_var(--object-half-depth))] [transform:rotateX(90deg)_translateZ(var(--object-half-height))]"
            style={{ height: `${depth}px`, background: edgeColor }}
          />

          <div
            className="absolute left-0 w-full border border-black/40 [top:calc(50%_-_var(--object-half-depth))] [transform:rotateX(-90deg)_translateZ(var(--object-half-height))]"
            style={{ height: `${depth}px`, background: edgeColor }}
          />
        </div>

      </div>
    </div>
  );
}
