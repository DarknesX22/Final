'use client';

import { motion } from '@/components/providers';
import { useState, useRef } from 'react';

interface LineChartDataPoint {
  x: number;
  y: number;
  label?: string;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  height?: number;
  width?: number;
  title?: string;
  color?: string;
  predictionLine?: boolean;
}

export default function LineChart({ 
  data, 
  height = 350, 
  width = 800, 
  title = 'Trend Analysis',
  color = '#2563eb',
  predictionLine = false
}: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  if (data.length === 0) return null;

  // Calculate min and max values for scaling
  const minX = Math.min(...data.map(d => d.x));
  const maxX = Math.max(...data.map(d => d.x));
  const minY = Math.min(...data.map(d => d.y));
  const maxY = Math.max(...data.map(d => d.y));
  const xRange = maxX - minX;
  const yRange = maxY - minY;

  // Calculate dimensions with margins
  const margin = { top: 20, right: 20, bottom: 50, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Function to map data values to coordinates
  const getX = (xVal: number) => {
    return ((xVal - minX) / xRange) * chartWidth;
  };

  const getY = (yVal: number) => {
    return chartHeight - ((yVal - minY) / yRange) * chartHeight;
  };

  // Generate path for the line
  const pathData = data.map((point, index) => {
    const x = margin.left + getX(point.x);
    const y = margin.top + getY(point.y);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate area fill path
  const areaPathData = `${pathData} L ${margin.left + getX(maxX)} ${margin.top + chartHeight} L ${margin.left + getX(minX)} ${margin.top + chartHeight} Z`;

  // Generate points for the circles
  const points = data.map((point, index) => ({
    x: margin.left + getX(point.x),
    y: margin.top + getY(point.y),
    value: point.y,
    label: point.label || new Date(point.x).toLocaleDateString()
  }));

  // Format Y-axis labels
  const formatYLabel = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toFixed(0);
  };

  // Format X-axis labels
  const formatXLabel = (timestamp: number, index: number) => {
    const date = new Date(timestamp);
    if (data.length <= 7) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (data.length <= 31) {
      return index % 5 === 0 ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    } else {
      return index % 10 === 0 ? date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : '';
    }
  };

  return (
    <div className="w-full" ref={containerRef}>
      <div className="relative">
        <svg 
          width="100%" 
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Defs for gradients */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines - horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={`grid-h-${i}`}
              x1={margin.left}
              y1={margin.top + ratio * chartHeight}
              x2={width - margin.right}
              y2={margin.top + ratio * chartHeight}
              stroke="#e5e7eb"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}

          {/* Grid lines - vertical */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const index = Math.floor(ratio * (data.length - 1));
            if (index >= 0 && index < data.length) {
              return (
                <line
                  key={`grid-v-${i}`}
                  x1={margin.left + ratio * chartWidth}
                  y1={margin.top}
                  x2={margin.left + ratio * chartWidth}
                  y2={margin.top + chartHeight}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              );
            }
            return null;
          })}
          
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const value = maxY - ratio * yRange;
            return (
              <text
                key={`ylabel-${i}`}
                x={margin.left - 12}
                y={margin.top + ratio * chartHeight + 4}
                textAnchor="end"
                fontSize={11}
                fill="#6b7280"
                fontWeight="500"
              >
                {formatYLabel(value)}
              </text>
            );
          })}
          
          {/* X-axis labels */}
          {data.map((point, i) => {
            const label = formatXLabel(point.x, i);
            if (!label) return null;
            return (
              <text
                key={`xlabel-${i}`}
                x={margin.left + getX(point.x)}
                y={height - 10}
                textAnchor="middle"
                fontSize={10}
                fill="#6b7280"
                fontWeight="500"
              >
                {label}
              </text>
            );
          })}

          {/* Area fill under the line */}
          <motion.path
            d={areaPathData}
            fill="url(#areaGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />
          
          {/* Line path */}
          <motion.path
            d={pathData}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Interactive overlay for hover */}
          {points.map((point, index) => (
            <g key={`hover-${index}`}>
              {/* Invisible larger hit area */}
              <circle
                cx={point.x}
                cy={point.y}
                r={20}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              
              {/* Visible data point */}
              <motion.circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === index ? 6 : 4}
                fill="white"
                stroke={color}
                strokeWidth={hoveredPoint === index ? 3 : 2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="transition-all duration-200"
              />

              {/* Tooltip on hover */}
              {hoveredPoint === index && (
                <g>
                  {/* Vertical line */}
                  <line
                    x1={point.x}
                    y1={margin.top}
                    x2={point.x}
                    y2={margin.top + chartHeight}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    opacity={0.5}
                  />
                  
                  {/* Tooltip background */}
                  <rect
                    x={point.x - 60}
                    y={point.y - 45}
                    width={120}
                    height={35}
                    rx={8}
                    fill="#1f2937"
                    opacity={0.95}
                  />
                  
                  {/* Tooltip text */}
                  <text
                    x={point.x}
                    y={point.y - 23}
                    textAnchor="middle"
                    fontSize={12}
                    fill="white"
                    fontWeight="600"
                  >
                    {point.value.toFixed(2)}
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* Axis lines */}
          <line
            x1={margin.left}
            y1={margin.top + chartHeight}
            x2={width - margin.right}
            y2={margin.top + chartHeight}
            stroke="#d1d5db"
            strokeWidth={2}
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + chartHeight}
            stroke="#d1d5db"
            strokeWidth={2}
          />
        </svg>
      </div>
    </div>
  );
}