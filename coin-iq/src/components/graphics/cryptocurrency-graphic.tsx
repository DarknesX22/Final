import { motion } from '@/components/providers';

export default function CryptocurrencyGraphic() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating crypto icons */}
      <motion.div
        className="absolute top-1/4 left-1/4 text-gray-300"
        animate={{
          y: [-10, 10, -10],
          x: [0, 5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 12H16M12 8L16 12L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.div>
      
      <motion.div
        className="absolute top-1/3 right-1/3 text-gray-300"
        animate={{
          y: [5, -15, 5],
          x: [-5, 5, -5],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 12H16M12 8V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.div>
      
      <motion.div
        className="absolute bottom-1/4 left-1/3 text-gray-300"
        animate={{
          y: [10, -10, 10],
          x: [5, -5, 5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M12 3V21M3 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </motion.div>
      
      {/* Abstract market trend lines */}
      <motion.svg 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 opacity-10"
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,70 Q50,30 100,50 T200,30"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gray-400"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        />
      </motion.svg>
    </div>
  );
}