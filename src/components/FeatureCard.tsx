import React, {useEffect, useRef, useState} from 'react';
import {
  clampCardLayout,
  parseCardLayout,
  type CardLayout,
  type ViewportSize
} from '../featureCard/cardLayout';
import styles from './FeatureCard.module.css';

type FeatureCardProps = {
  id: string;
  title: string;
  defaultLayout: CardLayout;
  onClose: () => void;
  children: React.ReactNode;
};

type DragState = {
  pointerId: number;
  originX: number;
  originY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  mode: 'move' | 'resize';
};

function PinIcon({filled}: {filled: boolean}) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M9 4h6l-1 6 3 3v2H7v-2l3-3L9 4zm3 11v5"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function viewportSize(): ViewportSize {
  return {width: window.innerWidth, height: window.innerHeight};
}

type StoredCard = CardLayout & {placed?: boolean};

function storageKey(id: string): string {
  return `feature-card:${id}`;
}

function readStoredCard(
  id: string,
  fallback: CardLayout
): {layout: CardLayout; placed: boolean} {
  const raw = localStorage.getItem(storageKey(id));
  if (!raw) {
    return {layout: fallback, placed: false};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    const layout = clampCardLayout(parseCardLayout(parsed, fallback), viewportSize());
    const placed =
      !!parsed &&
      typeof parsed === 'object' &&
      ('placed' in parsed ? Boolean((parsed as StoredCard).placed) : true);
    return {layout, placed};
  } catch {
    return {layout: clampCardLayout(fallback, viewportSize()), placed: false};
  }
}

let zSeed = 2;

export default function FeatureCard({
  id,
  title,
  defaultLayout,
  onClose,
  children
}: FeatureCardProps) {
  const stored = useRef(readStoredCard(id, defaultLayout));
  const [layout, setLayout] = useState<CardLayout>(stored.current.layout);
  const [placed, setPlaced] = useState(stored.current.placed);
  const [zIndex, setZIndex] = useState(1);
  const dragRef = useRef<DragState | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!placed && !layout.pinned && !localStorage.getItem(storageKey(id))) {
      return;
    }
    const record: StoredCard = {...layout, placed};
    localStorage.setItem(storageKey(id), JSON.stringify(record));
  }, [id, layout, placed]);

  useEffect(() => {
    if (!placed) {
      return;
    }
    const onResize = () => setLayout(current => clampCardLayout(current, viewportSize()));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [placed]);

  const beginPointer =
    (mode: DragState['mode']) => (event: React.PointerEvent<HTMLElement>) => {
      if (layout.pinned || event.button !== 0) {
        return;
      }
      const target = event.target;
      if (mode === 'move' && target instanceof Element && target.closest('button')) {
        return;
      }
      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        originX: event.clientX,
        originY: event.clientY,
        startX: rect.left,
        startY: rect.top,
        startWidth: rect.width,
        startHeight: rect.height,
        mode
      };
      if (!placed) {
        setLayout(current => ({
          ...current,
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        }));
        setPlaced(true);
      }
      zSeed += 1;
      setZIndex(zSeed);
    };

  const movePointer = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || layout.pinned) {
      return;
    }
    const dx = event.clientX - drag.originX;
    const dy = event.clientY - drag.originY;
    const next =
      drag.mode === 'move'
        ? {
            x: drag.startX + dx,
            y: drag.startY + dy,
            width: drag.startWidth,
            height: drag.startHeight
          }
        : {
            x: drag.startX,
            y: drag.startY,
            width: drag.startWidth + dx,
            height: drag.startHeight + dy
          };
    setLayout(current => clampCardLayout({...current, ...next}, viewportSize()));
  };

  const endPointer = (event: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  return (
    <section
      ref={sectionRef}
      className={styles.card}
      style={
        placed
          ? {
              left: layout.x,
              top: layout.y,
              width: layout.width,
              height: layout.height,
              zIndex
            }
          : undefined
      }
      data-placed={placed}
      data-pinned={layout.pinned}
      aria-label={title}
    >
      <header
        className={styles.header}
        onPointerDown={beginPointer('move')}
        onPointerMove={movePointer}
        onPointerUp={endPointer}
      >
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.actions}>
          <button
            type="button"
            className="icon-button"
            aria-pressed={layout.pinned}
            aria-label={`${title} 고정`}
            onClick={() => setLayout(current => ({...current, pinned: !current.pinned}))}
          >
            <PinIcon filled={layout.pinned} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={`${title} 닫기`}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </span>
      </header>
      <div className={styles.body}>{children}</div>
      {layout.pinned ? null : (
        <div
          className={styles.resize}
          aria-hidden="true"
          onPointerDown={beginPointer('resize')}
          onPointerMove={movePointer}
          onPointerUp={endPointer}
        />
      )}
    </section>
  );
}
