'use client';

import { motion } from '@/components/providers';
import { useCryptoDetails, useTopCryptos } from '@/hooks/useCryptoData';
import { useState, useEffect } from 'react';
import { CryptoData } from '@/types/crypto';

interface PredictionData extends CryptoData {
  prediction_confidence: number;
  risk_level: 'low' | 'medium' | 'high';
  predicted_change: string;
  prediction_accuracy: number;
}

export default function PredictionPreview() {
  const { cryptos, loading, error } = useTopCryptos(5);
  const [selectedCrypto, setSelectedCrypto] = useState<PredictionData | null>(null);
  
  useEffect(() => {
    if (cryptos.length > 0 && !selectedCrypto) {
      const mockCrypto: PredictionData = {
        ...cryptos[0],
        prediction_confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
        risk_level: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        predicted_change: (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 10).toFixed(2) + '%',
        prediction_accuracy: Math.floor(Math.random() * 15) + 85, // 85-100%
      };
      setSelectedCrypto(mockCrypto);
    }
  }, [cryptos, selectedCrypto]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading prediction preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">Error loading prediction data</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <h3 className="text-lg font-semibold mb-4 text-center">Market Prediction</h3>
      
      {selectedCrypto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          {/* Main Info */}
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img 
                src={selectedCrypto.image} 
                alt={selectedCrypto.name} 
                className="w-8 h-8 rounded-full mr-3"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${selectedCrypto.name}&background=000000&color=fff`;
                }}
              />
              <div>
                <h4 className="font-medium text-sm">{selectedCrypto.name}</h4>
                <p className="text-xs text-gray-500">{selectedCrypto.symbol.toUpperCase()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">${selectedCrypto.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className={`text-xs ${(selectedCrypto.percentChange24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(selectedCrypto.percentChange24h || 0) >= 0 ? '+' : ''}{(selectedCrypto.percentChange24h || 0).toFixed(2)}%
              </p>
            </div>
          </div>
          
          {/* Prediction */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Prediction</p>
              <p className={`text-sm font-bold ${selectedCrypto.predicted_change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>
                {selectedCrypto.predicted_change}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Confidence</p>
              <p className="text-sm font-bold">{selectedCrypto.prediction_confidence}%</p>
            </div>
          </div>
          
          {/* Risk Level */}
          <div className="pt-2">
            <div className="flex justify-between mb-1">
              <span className="text-xs">Risk Level:</span>
              <span className={`text-xs font-medium ${
                selectedCrypto.risk_level === 'low' ? 'text-green-500' : 
                selectedCrypto.risk_level === 'medium' ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {selectedCrypto.risk_level.charAt(0).toUpperCase() + selectedCrypto.risk_level.slice(1)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <motion.div
                className={`h-1.5 rounded-full ${
                  selectedCrypto.risk_level === 'low' ? 'bg-green-500' : 
                  selectedCrypto.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: selectedCrypto.risk_level === 'low' ? '30%' : selectedCrypto.risk_level === 'medium' ? '60%' : '90%' }}
                transition={{ duration: 1, ease: "easeOut" }}
              ></motion.div>
            </div>
          </div>
        </motion.div>
      )}
      
      <div className="text-center pt-4">
        <p className="text-xs text-gray-500">Powered by AI Predictions</p>
      </div>
    </div>
  );
}