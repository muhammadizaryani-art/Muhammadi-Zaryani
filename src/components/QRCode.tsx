import React, { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCode: React.FC<QRCodeProps> = ({ value, size = 110, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error('QR Code generation error:', error);
      });
    }
  }, [value, size]);

  return (
    <canvas ref={canvasRef} width={size} height={size} className={className} />
  );
};
