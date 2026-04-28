import React, { useRef, useEffect, useState } from 'react';

interface TracingCanvasProps {
  text: string;
  onClearRef?: (clear: () => void) => void;
  onDrawEnd?: () => void;
}

export function TracingCanvas({ text, onClearRef, onDrawEnd }: TracingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;

      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        const ctx = canvas.getContext('2d');
        let tempCanvas;
        
        // Save current canvas content
        if (canvas.width > 0 && canvas.height > 0) {
          tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          tempCanvas.getContext('2d')?.drawImage(canvas, 0, 0);
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Restore content
        if (tempCanvas && ctx) {
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (onClearRef && canvasRef.current) {
      onClearRef(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      });
    }
  }, [onClearRef]);

  // Update stroke when theme is taken into account? No just a colorful stroke is fine.
  
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 20;
    const isDark = document.documentElement.classList.contains('dark');
    ctx.strokeStyle = isDark ? '#ffffff' : '#111827';
    setIsDrawing(true);
    canvas.setPointerCapture(e.pointerId);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId);
      }
      onDrawEnd?.();
    }
  };

  const getFontSizeClass = (text: string) => {
    const len = text?.length || 0;
    if (len <= 1) return "text-[280px] sm:text-[320px]";
    if (len <= 2) return "text-[200px] sm:text-[240px]";
    if (len <= 4) return "text-[120px] sm:text-[150px]";
    if (len <= 6) return "text-[80px] sm:text-[100px]";
    return "text-[50px] sm:text-[60px] break-words";
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-on-surface-variant/40 dark:text-on-surface-variant/30 -z-10 px-4 w-full h-full">
         <svg width="100%" height="100%">
           <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="currentColor" stroke="none" className={`${getFontSizeClass(text)} font-medium tracking-normal`}>{text}</text>
         </svg>
      </div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none z-10"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
      />
    </div>
  );
}
