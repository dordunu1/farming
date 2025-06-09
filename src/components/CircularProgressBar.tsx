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
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <svg width={size} height={size} className={className} style={{ display: 'block' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
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
          fontSize={size * 0.32}
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