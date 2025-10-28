import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + height) / itemHeight) + overscan
    );
    return { start, end };
  }, [scrollTop, height, itemHeight, items.length, overscan]);

  // Generate rendered items
  const renderedItems = useMemo(() => {
    const visibleItems = [];
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      visibleItems.push({
        index: i,
        item: items[i],
        top: i * itemHeight
      });
    }
    return visibleItems;
  }, [items, visibleRange, itemHeight]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height,
        overflow: 'auto',
        position: 'relative',
        willChange: 'transform'
      }}
      className="irc-scrollbar"
    >
      <div
        style={{
          height: items.length * itemHeight,
          position: 'relative',
          minHeight: '100%'
        }}
      >
        {renderedItems.map(({ item, index, top }) => (
          <div
            key={`virtual-item-${index}`}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              width: '100%',
              height: itemHeight,
              contain: 'layout style paint',
              zIndex: 1
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}