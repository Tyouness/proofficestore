"use client";

import { useRef, useState, useEffect, ReactNode } from 'react';

interface FeatureItem {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
}

interface FeatureCarouselProps {
  features: FeatureItem[];
}

export default function FeatureCarousel({ features }: FeatureCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-scroll toutes les 4 secondes
  useEffect(() => {
    if (!isAutoPlaying || !carouselRef.current) return;

    const interval = setInterval(() => {
      const container = carouselRef.current;
      if (!container) return;

      const nextIndex = (activeIndex + 1) % features.length;
      const scrollWidth = container.scrollWidth / features.length;
      
      container.scrollTo({
        left: scrollWidth * nextIndex,
        behavior: 'smooth',
      });
      
      setActiveIndex(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeIndex, isAutoPlaying, features.length]);

  const handleScroll = () => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const scrollPosition = container.scrollLeft;
    const itemWidth = container.scrollWidth / features.length;
    const newIndex = Math.round(scrollPosition / itemWidth);
    
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      setIsAutoPlaying(false);
    }
  };

  const scrollToIndex = (index: number) => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const scrollWidth = container.scrollWidth / features.length;
    
    container.scrollTo({
      left: scrollWidth * index,
      behavior: 'smooth',
    });
    
    setActiveIndex(index);
    setIsAutoPlaying(false);
  };

  return (
    <>
      {/* Desktop: Grid classique */}
      <div className="hidden md:grid md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 ${feature.color} rounded-full flex items-center justify-center`}>
                {feature.icon}
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Mobile: Carrousel */}
      <div className="md:hidden">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="carousel-container flex overflow-x-auto snap-x snap-mandatory gap-6 px-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="carousel-item flex-shrink-0 w-full text-center"
              style={{ scrollSnapAlign: 'center' }}
            >
              <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 ${feature.color} rounded-full flex items-center justify-center`}>
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 px-4">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Indicateurs (dots) */}
        <div className="carousel-dots mt-6">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
              aria-label={`Aller à la fonctionnalité ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
