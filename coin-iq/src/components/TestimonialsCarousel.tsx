'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
}

const TestimonialsCarousel = () => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Hassan Mukhtar",
      role: "Professional Trader",
      content: "Coin-IQ has transformed my trading strategy.",
      rating: 5
    },
    {
      id: 2,
      name: "Umair Ahmed",
      role: "Financial Analyst",
      content: "The real-time analytics are unparalleled.",
      rating: 5
    },
    {
      id: 3,
      name: "Rian Siddique",
      role: "Investment Manager",
      content: "I've seen significant improvement in my portfolio ",
      rating: 5
    },
    {
      id: 4,
      name: "Asad Qureshi",
      role: "Crypto Enthusiast",
      content: "Very impressed with the ",
      rating: 5
    },
    {
      id: 5,
      name: "Umair Ahmed",
      role: "Quantitative Trader",
      content: "The precision of the AI algorithms is impressive.",
      rating: 5
    }
  ];

  // Duplicate testimonials for smooth infinite loop
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  // State to handle client-side rendering
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Render star ratings
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <svg
        key={index}
        className={`w-5 h-5 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  // Don't render the marquee until client-side hydration is complete
  if (!isClient) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Trusted by Thousands of Traders</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from professionals who have transformed their trading with Coin-IQ
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Trusted by Thousands of Traders</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hear from professionals who have transformed their trading with Coin-IQ
          </p>
        </motion.div>

        <div className="overflow-hidden">
          {/* Infinite Scrolling Testimonials */}
          <div className="flex animate-marquee whitespace-nowrap">
            {duplicatedTestimonials.map((testimonial, index) => (
              <div 
                key={`${testimonial.id}-${index}`} 
                className="flex-shrink-0 w-[300px] sm:w-[350px] md:w-[400px] lg:w-[450px] xl:w-[500px] px-4 py-4"
              >
                <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-shrink-0">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center text-gray-400">
                        <span className="text-xs font-bold">{testimonial.name.charAt(0)}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-left">{testimonial.name}</h4>
                      <p className="text-gray-500 text-left">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex justify-center mb-4">
                    {renderStars(testimonial.rating)}
                  </div>
                  <div className="flex-grow text-left">
                    <p className="text-gray-600 text-lg italic overflow-hidden">
                      <span className="line-clamp-6">"{testimonial.content}"</span>
                    </p>
                    <p className="text-gray-400 text-sm mt-2 italic">Trusted by professionals worldwide</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(-100%);
          }
        }
        
        .animate-marquee {
          animation: marquee 40s linear infinite;
          display: flex;
        }
        
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        
        .line-clamp-6 {
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
};

export default TestimonialsCarousel;