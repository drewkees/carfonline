import React, { useRef, useState } from 'react';

export const VirtualizedMenuList = (props: any) => {
  const { maxHeight, getValue } = props;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize children to always be a flat array (fixes crash when react-select
  // passes a single element, a nested array, or null/undefined)
  const childrenArray = React.Children.toArray(props.children);

  // Show "No options" message
  if (!childrenArray || childrenArray.length === 0) {
    return (
      <div style={{ padding: '8px', color: '#6b7280', fontSize: '14px' }}>
        No options
      </div>
    );
  }

  const itemHeight = 35;
  const containerHeight = Math.min(maxHeight || 300, 300);
  const totalHeight = childrenArray.length * itemHeight;

  // Scroll buffer of 5 items above and below the visible window
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
  const endIndex = Math.min(
    childrenArray.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + 5
  );

  const visibleChildren = childrenArray.slice(startIndex, endIndex);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Scroll selected item into view on first render
  React.useEffect(() => {
    const selected = getValue?.();
    if (!selected || selected.length === 0) return;

    const selectedValue = selected[0]?.value;
    const selectedIndex = (props.options ?? []).findIndex(
      (opt: any) => opt.value === selectedValue
    );

    if (selectedIndex >= 0 && containerRef.current) {
      const targetScrollTop = selectedIndex * itemHeight;
      const maxScroll = totalHeight - containerHeight;
      containerRef.current.scrollTop = Math.min(targetScrollTop, maxScroll);
      setScrollTop(Math.min(targetScrollTop, maxScroll));
    }
  }, []); // run once on mount

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {/* Full height spacer so the scrollbar reflects the true list length */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Only the visible slice is rendered in the DOM */}
        <div
          style={{
            position: 'absolute',
            top: startIndex * itemHeight,
            width: '100%',
          }}
        >
          {visibleChildren.map((child: any, index: number) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight, overflow: 'hidden' }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedMenuList;