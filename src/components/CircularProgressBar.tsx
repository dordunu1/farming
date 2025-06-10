import React from 'react';

interface CircularProgressBarProps {
  size?: number;
  strokeWidth?: number;
  value: number; // 0-100
  color?: string;
  bgColor?: string;
  label?: string | number;
  className?: string;
}

const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  size = 48,
  strokeWidth = 6,
  value,
  color = '#34d399', // emerald-400
  bgColor = '#e5e7eb', // gray-200
  label,
  className = '',
}) => {
  // Defensive checks
  const safeValue = isNaN(Number(value)) ? 0 : Math.max(0, Math.min(100, Number(value)));
  const safeSize = isNaN(Number(size)) ? 48 : Number(size);
  const safeStrokeWidth = isNaN(Number(strokeWidth)) ? 6 : Number(strokeWidth);
  const radius = (safeSize - safeStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safeValue / 100);

  return (
    <svg width={safeSize} height={safeSize} className={className} style={{ display: 'block' }}>
      <circle
        cx={safeSize / 2}
        cy={safeSize / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={safeStrokeWidth}
      />
      <circle
        cx={safeSize / 2}
        cy={safeSize / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={safeStrokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s' }}
      />
      {label !== undefined && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={safeSize * 0.32}
          fill="#222"
          fontWeight="bold"
        >
          {label}
        </text>
      )}
    </svg>
  );
};

export default CircularProgressBar; 