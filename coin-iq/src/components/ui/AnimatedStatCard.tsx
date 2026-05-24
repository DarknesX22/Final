import { motion } from '@/components/providers';
import { Card } from './card';
import { CryptoIcon } from './icons/CryptoIcon';

interface AnimatedStatCardProps {
  title: string;
  value: string | number;
  change?: string;
  iconType?: 'bitcoin' | 'ethereum' | 'trend-up' | 'trend-down' | 'chart' | 'wallet' | 'arrow-up' | 'arrow-down';
  animateOnView?: boolean;
  variant?: 'default' | 'elevated' | 'floating';
  trend?: 'up' | 'down';
}

export const AnimatedStatCard = ({
  title,
  value,
  change,
  iconType,
  animateOnView = true,
  variant = 'default',
  trend
}: AnimatedStatCardProps) => {
  return (
    <Card 
      animateOnView={animateOnView} 
      variant={variant}
      className="relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <motion.h3 
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {value}
          </motion.h3>
          {change && (
            <motion.p 
              className={`text-sm mt-2 flex items-center ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {trend && (
                <CryptoIcon 
                  iconType={trend === 'up' ? 'arrow-up' : 'arrow-down'} 
                  className={`w-4 h-4 mr-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`} 
                />
              )}
              {change}
            </motion.p>
          )}
        </div>
        {iconType && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`p-3 rounded-full ${trend === 'up' ? 'bg-green-100' : trend === 'down' ? 'bg-red-100' : 'bg-gray-100'}`}
          >
            <CryptoIcon 
              iconType={iconType} 
              className={`w-6 h-6 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`} 
            />
          </motion.div>
        )}
      </div>
      
      {/* Decorative element */}
      <motion.div 
        className="absolute top-0 right-0 w-16 h-16 bg-gray-100 rounded-full opacity-20"
        animate={{ 
          y: [-10, 10, -10],
          x: [0, 5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </Card>
  );
};