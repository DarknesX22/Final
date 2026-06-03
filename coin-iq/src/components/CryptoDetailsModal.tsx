'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CryptoData } from '@/types/crypto';
import { useState, useEffect } from 'react';
import { getCoinImage } from '@/lib/coinImages';

interface CryptoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  crypto: CryptoData;
}

const CryptoDetailsModal = ({ isOpen, onClose, crypto }: CryptoDetailsModalProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle escape key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close modal when clicking on backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isClient) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center">
                <img 
                  src={getCoinImage(crypto.symbol) || crypto.image || ''} 
                  alt={crypto.name} 
                  className="w-16 h-16 rounded-full mr-4 border border-gray-200 object-contain p-0.5"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{crypto.name}</h2>
                  <p className="text-gray-600 text-lg">{crypto.symbol.toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Price Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Price Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Price:</span>
                      <span className="font-bold">${crypto.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">24h Change:</span>
                      <span className={`font-bold ${crypto.percentChange24h !== null && crypto.percentChange24h !== undefined && crypto.percentChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {crypto.percentChange24h !== null && crypto.percentChange24h !== undefined ? (
                          <>{crypto.percentChange24h >= 0 ? '+' : ''}{crypto.percentChange24h.toFixed(2)}%</>
                        ) : 'N/A'}
                      </span>
                    </div>
                    {crypto.percentChange7d !== undefined && crypto.percentChange7d !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">7d Change:</span>
                        <span className={`font-bold ${crypto.percentChange7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {crypto.percentChange7d >= 0 ? '+' : ''}{crypto.percentChange7d.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Market Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Market Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Market Cap:</span>
                      <span className="font-bold">
                        {crypto.marketCap !== null && crypto.marketCap !== undefined ? (
                          `${(crypto.marketCap / 1000000000).toFixed(2)}B`
                        ) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volume (24h):</span>
                      <span className="font-bold">
                        {crypto.volume24h !== null && crypto.volume24h !== undefined ? (
                          `${(crypto.volume24h / 1000000).toFixed(2)}M`
                        ) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Market Cap Rank:</span>
                      <span className="font-bold">#{crypto.marketCapRank || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Supply Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Supply Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Circulating Supply:</span>
                      <span className="font-bold">{crypto.circulatingSupply?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 'N/A'}</span>
                    </div>
                    {crypto.totalSupply !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Supply:</span>
                        <span className="font-bold">{crypto.totalSupply?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 'N/A'}</span>
                      </div>
                    )}
                    {crypto.maxSupply !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Supply:</span>
                        <span className="font-bold">{crypto.maxSupply?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 'N/A'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Additional Stats</h3>
                  <div className="space-y-2">
                    {crypto.ath && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">All-Time High:</span>
                        <span className="font-bold">${crypto.ath?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                      </div>
                    )}
                    {crypto.atl && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">All-Time Low:</span>
                        <span className="font-bold">${crypto.atl?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                      </div>
                    )}
                    {crypto.athChangePercentage !== null && crypto.athChangePercentage !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">From ATH:</span>
                        <span className={`font-bold ${crypto.athChangePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {crypto.athChangePercentage >= 0 ? '+' : ''}{crypto.athChangePercentage.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Chart Placeholder */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Price Chart (7 Days)</h3>
                <div className="bg-gray-50 rounded-lg p-8 flex items-center justify-center min-h-[200px]">
                  <p className="text-gray-500 italic">Interactive price chart would be displayed here</p>
                </div>
              </div>

              {/* Description */}
              {crypto.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{crypto.description}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CryptoDetailsModal;