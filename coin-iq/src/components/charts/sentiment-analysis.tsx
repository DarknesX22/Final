'use client';

import { motion } from '@/components/providers';

interface SentimentAnalysisProps {
  bullishPercentage: number;
  bearishPercentage: number;
  neutralPercentage: number;
  title?: string;
}

export default function SentimentAnalysis({ 
  bullishPercentage, 
  bearishPercentage, 
  neutralPercentage, 
  title = 'Market Sentiment Analysis' 
}: SentimentAnalysisProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-green-500">Bullish</span>
            <span className="text-sm font-medium">{bullishPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <motion.div
              className="h-2.5 rounded-full bg-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${bullishPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            ></motion.div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-500">Neutral</span>
            <span className="text-sm font-medium">{neutralPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <motion.div
              className="h-2.5 rounded-full bg-gray-400"
              initial={{ width: 0 }}
              animate={{ width: `${neutralPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
            ></motion.div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-red-500">Bearish</span>
            <span className="text-sm font-medium">{bearishPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <motion.div
              className="h-2.5 rounded-full bg-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${bearishPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            ></motion.div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-center space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm">Bullish (Positive)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
          <span className="text-sm">Neutral</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm">Bearish (Negative)</span>
        </div>
      </div>
    </div>
  );
}