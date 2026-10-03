'use client';

import React, { useMemo } from 'react';
import { encodeData, generateQrSvgPath } from '@/lib/utils/qr-code';

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
  label?: string;
}

export default function QrCode({ value, size = 180, className = '', label }: QrCodeProps) {
  const { path, matrixSize } = useMemo(() => {
    try {
      const { matrix, size: mSize } = encodeData(value);
      return { path: generateQrSvgPath(matrix), matrixSize: mSize };
    } catch {
      return { path: '', matrixSize: 21 };
    }
  }, [value]);

  if (!path) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-xl bg-neutral-100 text-[10px] text-neutral-400 dark:bg-neutral-800"
      >
        QR unavailable
      </div>
    );
  }

  // Quiet zone margin of 2 modules around the QR matrix
  const viewBoxSize = matrixSize + 4;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative rounded-xl bg-white p-2.5 shadow-xs border border-neutral-100 dark:border-neutral-800">
        <svg
          viewBox={`-2 -2 ${viewBoxSize} ${viewBoxSize}`}
          width={size}
          height={size}
          className="shape-rendering-crispEdges block"
          role="img"
          aria-label={label || 'QR Code'}
        >
          {/* Background */}
          <rect x="-2" y="-2" width={viewBoxSize} height={viewBoxSize} fill="#ffffff" />
          {/* Dark modules */}
          <path d={path} fill="#0f172a" />
          {/* Center Brand Accent Pill */}
          <rect
            x={matrixSize / 2 - 2}
            y={matrixSize / 2 - 2}
            width={4}
            height={4}
            rx={0.8}
            fill="#ffffff"
          />
          <circle
            cx={matrixSize / 2}
            cy={matrixSize / 2}
            r={1.2}
            fill="#059669"
          />
        </svg>
      </div>
      {label && (
        <span className="mt-1.5 text-[10px] font-medium text-neutral-500 text-center">
          {label}
        </span>
      )}
    </div>
  );
}
