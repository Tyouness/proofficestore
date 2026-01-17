"use client";

import { useRef, useState, useEffect } from 'react';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  description: string;
  image_url: string;
  family: string;
  version: string;
  delivery_type: string;
}

interface ProductCarouselProps {
  products: Product[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-scroll toutes les 5 secondes
  useEffect(() => {
    if (!isAutoPlaying || !carouselRef.current) return;

    const interval = setInterval(() => {
      const container = carouselRef.current;
      if (!container) return;

      const nextIndex = (activeIndex + 1) % products.length;
      const scrollWidth = container.scrollWidth / products.length;
      
      container.scrollTo({
        left: scrollWidth * nextIndex,
        behavior: 'smooth',
      });
      
      setActiveIndex(nextIndex);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeIndex, isAutoPlaying, products.length]);

  // Détecter le scroll manuel
  const handleScroll = () => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const scrollPosition = container.scrollLeft;
    const itemWidth = container.scrollWidth / products.length;
    const newIndex = Math.round(scrollPosition / itemWidth);
    
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      setIsAutoPlaying(false); // Arrêter l'auto-scroll si scroll manuel
    }
  };

  const scrollToIndex = (index: number) => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const scrollWidth = container.scrollWidth / products.length;
    
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
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Mobile: Carrousel */}
      <div className="sm:hidden">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="carousel-container flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="carousel-item flex-shrink-0 w-[85%]"
              style={{ scrollSnapAlign: 'center' }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Indicateurs (dots) */}
        <div className="carousel-dots mt-4">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
              aria-label={`Aller au produit ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
