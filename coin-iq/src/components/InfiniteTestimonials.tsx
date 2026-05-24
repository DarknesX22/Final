'use client';

import { motion } from '@/components/providers';
import { Star, CheckCircle } from 'lucide-react';

const testimonialsRow1 = [
  {
    name: 'Stacey Lewis',
    text: 'Everything was great while using the app to purchase Bitcoin and send the tokens to my wallet. I\'ll continue to use the Coin-IQ app in the future.',
    rating: 5,
  },
  {
    name: 'Olivia Jacobson',
    text: 'The whole process went smoother than I imagined and without any irritating roadblocks. That was a refreshing transaction.',
    rating: 5,
  },
  {
    name: 'Milton Rodriguez',
    text: 'It is fast and easy to purchase crypto with Coin-IQ, totally recommended.',
    rating: 5,
  },
  {
    name: 'James Anderson',
    text: 'Coin-IQ has completely transformed how I trade cryptocurrency. The AI predictions are incredibly accurate and have helped me make better decisions.',
    rating: 5,
  },
  {
    name: 'Sarah Mitchell',
    text: 'The analytics dashboard is phenomenal. I can track all my investments and see real-time predictions in one place.',
    rating: 5,
  },
  {
    name: 'David Chen',
    text: 'Best crypto prediction platform I\'ve used. The interface is clean and the insights are valuable for making trading decisions.',
    rating: 5,
  },
];

const testimonialsRow2 = [
  {
    name: 'Stuart Graham',
    text: 'It\'s an easy platform to purchase crypto and send directly to my different wallets. One path to minimize fees instead of multiple wallet transfers requiring fees every time.',
    rating: 5,
  },
  {
    name: 'Lasharon Hill',
    text: 'It was fast and easy. Very convenient and easy to navigate through. I definitely recommend this app.',
    rating: 5,
  },
  {
    name: 'Emily Watson',
    text: 'Coin-IQ\'s risk assessment tools have saved me from several bad trades. The platform pays for itself.',
    rating: 5,
  },
  {
    name: 'Michael Brown',
    text: 'The real-time market data is impressive. I love how I can see predictions alongside actual market movements.',
    rating: 5,
  },
  {
    name: 'Jessica Taylor',
    text: 'Customer support is excellent and the platform is very user-friendly. Great experience overall.',
    rating: 5,
  },
  {
    name: 'Robert Martinez',
    text: 'I\'ve tried many crypto platforms but Coin-IQ stands out with its accurate predictions and clean design.',
    rating: 5,
  },
];

const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonialsRow1[0] }) => (
  <div className="flex-shrink-0 w-[380px] bg-gray-50 rounded-2xl p-6 mx-3 border border-gray-100 hover:border-gray-200 transition-colors">
    {/* Rating Stars */}
    <div className="flex items-center gap-1 mb-4">
      {Array.from({ length: testimonial.rating }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-black text-black" />
      ))}
      
      {/* Verified Badge */}
      <div className="flex items-center gap-1.5 ml-3 px-3 py-1 bg-white rounded-full border border-gray-200">
        <CheckCircle className="w-3.5 h-3.5 text-black" />
        <span className="text-xs font-medium text-gray-700">Verified Review</span>
      </div>
    </div>

    {/* Review Text */}
    <p className="text-sm text-gray-700 leading-relaxed mb-6 min-h-[80px]">
      {testimonial.text}
    </p>

    {/* Author Name */}
    <p className="text-sm font-semibold text-gray-900">
      {testimonial.name}
    </p>
  </div>
);

export default function InfiniteTestimonials() {
  // Duplicate arrays for seamless infinite scroll
  const duplicatedRow1 = [...testimonialsRow1, ...testimonialsRow1, ...testimonialsRow1];
  const duplicatedRow2 = [...testimonialsRow2, ...testimonialsRow2, ...testimonialsRow2];

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied traders who trust Coin-IQ for their cryptocurrency predictions
          </p>
        </motion.div>
      </div>

      {/* Row 1 - Scrolls Left to Right */}
      <div className="mb-6">
        <div className="flex animate-scroll-left">
          {duplicatedRow1.map((testimonial, index) => (
            <TestimonialCard key={`row1-${index}`} testimonial={testimonial} />
          ))}
        </div>
      </div>

      {/* Row 2 - Scrolls Right to Left */}
      <div>
        <div className="flex animate-scroll-right">
          {duplicatedRow2.map((testimonial, index) => (
            <TestimonialCard key={`row2-${index}`} testimonial={testimonial} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(-33.333%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        
        @keyframes scroll-right {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        
        .animate-scroll-left {
          animation: scroll-left 45s linear infinite;
        }
        
        .animate-scroll-right {
          animation: scroll-right 45s linear infinite;
        }
        
        .animate-scroll-left:hover,
        .animate-scroll-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
