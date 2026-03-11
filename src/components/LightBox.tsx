import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

type LightboxProps = {
  images: string[];
  startIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
};

export default function Lightbox({ images, startIndex = 0, isOpen, onClose, title }: LightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setIndex(startIndex);
      setScale(1);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, startIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, index, images]);

  if (!isOpen) return null;

  const prev = () => {
    setScale(1);
    setIndex((i) => (i - 1 + images.length) % images.length);
  };
  const next = () => {
    setScale(1);
    setIndex((i) => (i + 1) % images.length);
  };

  const zoomIn = () => setScale((s) => Math.min(3, +(s + 0.25).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(1, +(s - 0.25).toFixed(2)));

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
      {/* Close X */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Controls */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <button
          onClick={zoomOut}
          className="text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-6 w-6" />
        </button>
        <button
          onClick={zoomIn}
          className="text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-6 w-6" />
        </button>
        {title && <div className="text-white/80 text-sm hidden sm:block ml-2">{title}</div>}
      </div>

      {/* Prev/Next */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 sm:left-6 text-white p-3 rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Previous"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 sm:right-6 text-white p-3 rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Next"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </>
      )}

      {/* Image */}
      <div className="w-full h-full flex items-center justify-center px-3 py-16">
        <img
          src={images[index]}
          alt={title ?? `image-${index + 1}`}
          className="max-w-full max-h-full object-contain select-none"
          style={{ transform: `scale(${scale})`, transition: 'transform 120ms ease' }}
          draggable={false}
        />
      </div>
    </div>
  );
}