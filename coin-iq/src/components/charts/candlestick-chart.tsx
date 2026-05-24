'use client';

import { motion } from '@/components/providers';
import { useEffect, useRef } from 'react';

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  data: CandlestickData[];
  height?: number;
  width?: number;
  title?: string;
}

export default function CandlestickChart({ 
  data, 
  height = 300, 
  width = 600, 
  title = 'Price Movement' 
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate min and max values for scaling
  const minPrice = Math.min(...data.map(d => d.low));
  const maxPrice = Math.max(...data.map(d => d.high));
  const priceRange = maxPrice - minPrice;

  // Calculate min and max time for scaling
  const minTime = Math.min(...data.map(d => d.time));
  const maxTime = Math.max(...data.map(d => d.time));
  const timeRange = maxTime - minTime;

  // Calculate dimensions with margins
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Function to map data values to coordinates
  const getX = (time: number) => {
    return ((time - minTime) / timeRange) * chartWidth;
  };

  const getY = (price: number) => {
    return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  // Calculate candle width based on number of candles
  const candleWidth = Math.max(5, Math.min(15, chartWidth / data.length * 0.8));

  return (
    <div className="w-full" ref={containerRef}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <svg 
          ref={svgRef} 
          width={width} 
          height={height}
          className="overflow-visible"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={`grid-${i}`}
              x1={margin.left}
              y1={margin.top + ratio * chartHeight}
              x2={width - margin.right}
              y2={margin.top + ratio * chartHeight}
              stroke="#f0f0f0"
              strokeWidth={1}
            />
          ))}
          
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const price = minPrice + (1 - ratio) * priceRange;
            return (
              <text
                key={`label-${i}`}
                x={margin.left - 10}
                y={margin.top + ratio * chartHeight + 4}
                textAnchor="end"
                fontSize={10}
                fill="#666"
              >
                {price.toFixed(2)}
              </text>
            );
          })}
          
          {/* X-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const index = Math.floor(ratio * (data.length - 1));
            const time = data[index]?.time || 0;
            const date = new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <text
                key={`xlabel-${i}`}
                x={margin.left + ratio * chartWidth}
                y={height - 5}
                textAnchor="middle"
                fontSize={10}
                fill="#666"
              >
                {date}
              </text>
            );
          })}
          
          {/* Candlesticks */}
          {data.map((candle, index) => {
            const x = margin.left + getX(candle.time);
            const yOpen = margin.top + getY(candle.open);
            const yClose = margin.top + getY(candle.close);
            const yHigh = margin.top + getY(candle.high);
            const yLow = margin.top + getY(candle.low);
            const isUp = candle.close > candle.open;
            
            return (
              <g key={index}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={margin.top + yHigh}
                  x2={x}
                  y2={margin.top + yLow}
                  stroke={isUp ? '#10b981' : '#ef4444'}
                  strokeWidth={1}
                />
                
                {/* Body */}
                <motion.rect
                  x={x - candleWidth / 2}
                  y={Math.min(yOpen, yClose)}
                  width={candleWidth}
                  height={Math.abs(yClose - yOpen)}
                  fill={isUp ? '#10b981' : '#ef4444'}
                  initial={{ height: 0 }}
                  animate={{ height: Math.abs(yClose - yOpen) }}
                  transition={{ duration: 0.5, delay: index * 0.01 }}
                />
              </g>
            );
          })}
          
          {/* X and Y axis lines */}
          <line
            x1={margin.left}
            y1={margin.top + chartHeight}
            x2={width - margin.right}
            y2={margin.top + chartHeight}
            stroke="#000"
            strokeWidth={1}
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="#000"
            strokeWidth={1}
          />
        </svg>
      </div>
    </div>
  );
}