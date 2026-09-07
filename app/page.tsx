'use client';
import { useEffect, useRef } from 'react';
export default function Home() {
  const mount = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    import('../lib/courtyard').then(({ createCourtyard }) => {
      if (!cancelled && mount.current) dispose = createCourtyard(mount.current);
    });
    return () => { cancelled = true; dispose?.(); };
  }, []);
  return <main ref={mount} className="courtyard" aria-label="春日桃花庭院三维模型，拖拽旋转，滚轮缩放，右键拖动平移。方向键旋转，加减号缩放。" />;
}
