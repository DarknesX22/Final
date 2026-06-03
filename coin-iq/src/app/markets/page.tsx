'use client';

import { motion } from '@/components/providers';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTopCryptos } from '@/hooks/useCryptoData';
import CryptoDetailsModal from '@/components/CryptoDetailsModal';
import { useState } from 'react';
import { CryptoData } from '@/types/crypto';
import { getCoinImage } from '@/lib/coinImages';

export default function MarketsPage() {
  const { cryptos, loading, error } = useTopCryptos(20);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-black flex items-center justify-center">
        <Navbar />
        <div className="h-16"></div>
        <div className="text-center">
          <p className="text-xl">Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-black flex items-center justify-center">
        <Navbar />
        <div className="h-16"></div>
        <div className="text-center">
          <p className="text-xl text-red-500">Error loading market data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-black">
      <Navbar />
      
      {/* Spacing for fixed navbar */}
      <div className="h-16"></div>
      
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Cryptocurrency Markets</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real-time market data and insights for top cryptocurrencies
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cryptos.map((crypto, index) => (
              <motion.div
                key={crypto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="h-full"
              >
                <Card className="h-full bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex items-center mb-4">
                        <img 
                          src={getCoinImage(crypto.symbol) || crypto.image || ''} 
                          alt={crypto.name} 
                          className="w-12 h-12 rounded-full mr-4 border border-gray-200 object-contain p-0.5"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{crypto.name}</h3>
                          <p className="text-gray-500 font-medium">{crypto.symbol.toUpperCase()}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-bold text-lg">${crypto.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">24h Change:</span>
                          <span className={`font-bold ${crypto.percentChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {crypto.percentChange24h >= 0 ? '+' : ''}{crypto.percentChange24h?.toFixed(2)}%
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600">Market Cap:</span>
                          <span className="font-medium">${(crypto.marketCap / 1000000000).toFixed(2)}B</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Volume (24h):</span>
                          <span className="font-medium">${(crypto.volume24h / 1000000).toFixed(2)}M</span>
                        </div>
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-gray-100">
                        <Button 
                          variant="outline" 
                          className="w-full border-black text-black hover:bg-black hover:text-white transition-colors duration-200"
                          onClick={() => {
                            setSelectedCrypto(crypto);
                            setIsModalOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
      {selectedCrypto && (
        <CryptoDetailsModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          crypto={selectedCrypto}
        />
      )}
    </div>
  );
}