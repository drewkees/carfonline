import React, { useRef, useEffect, useState } from 'react';

export default function FloatingScrollWrapper({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbWidth, setThumbWidth] = useState(0);
  const [thumbLeft, setThumbLeft] = useState(0);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStart = useRef(0);

  // Update thumb size and position
  const updateThumb = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const scrollWidth = wrapper.scrollWidth;
    const clientWidth = wrapper.clientWidth;
    const scrollLeft = wrapper.scrollLeft;
    if (scrollWidth <= clientWidth) {
      setThumbWidth(0);
      setThumbLeft(0);
    } else {
      setThumbWidth((clientWidth / scrollWidth) * clientWidth);
      setThumbLeft((scrollLeft / scrollWidth) * clientWidth);
    }
  };

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    wrapper.addEventListener('scroll', updateThumb);
    window.addEventListener('resize', updateThumb);
    updateThumb();
    return () => {
      wrapper.removeEventListener('scroll', updateThumb);
      window.removeEventListener('resize', updateThumb);
    };
  }, []);

  // Dragging logic
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStartX.current = e.clientX;
    scrollStart.current = wrapperRef.current?.scrollLeft || 0;
    document.body.style.userSelect = 'none';
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const delta = e.clientX - dragStartX.current;
    const scrollableWidth = wrapper.scrollWidth - wrapper.clientWidth;
    const thumbMovableWidth = wrapper.clientWidth - thumbWidth;
    wrapper.scrollLeft = scrollStart.current + (delta * (scrollableWidth / thumbMovableWidth));
  };

  const onMouseUp = () => {
    dragging.current = false;
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [thumbWidth]);

  return (
    <div
      ref={wrapperRef}
      className="relative overflow-x-auto overflow-y-hidden w-full"
      style={{ maxHeight: '100%' }}
    >
      {children}

      {thumbWidth > 0 && (
        <div
          ref={thumbRef}
          className="absolute bottom-1 h-2 bg-blue-500 rounded-lg cursor-pointer z-50"
          style={{ width: thumbWidth, left: thumbLeft }}
          onMouseDown={onMouseDown}
        />
      )}
    </div>
  );
}
