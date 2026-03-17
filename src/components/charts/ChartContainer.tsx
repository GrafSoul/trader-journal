import { useState, useEffect, useRef, type ReactNode } from "react";

interface ChartContainerProps {
  children: (size: { width: number; height: number }) => ReactNode;
  className?: string;
}

/**
 * Replaces Recharts' ResponsiveContainer with a custom implementation
 * that only renders children after the container has positive dimensions.
 * Eliminates "width(-1) and height(-1)" warnings entirely.
 */
export const ChartContainer = ({ children, className = "h-64" }: ChartContainerProps) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setSize({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {size && children(size)}
    </div>
  );
};
