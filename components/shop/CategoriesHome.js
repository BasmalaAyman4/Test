

'use client'
import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/shop/categoriesHome.module.css";
import Image from "next/image";
import localFont from 'next/font/local'

const myFont = localFont({
  src: '../../public/fonts/Quentin.otf',
})

const CategoriesHome = ({categories}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);
  const autoScrollRef = useRef(null);
  const visibleCategories = 3;
    const totalGroups = Math.ceil(categories.length / visibleCategories);
    useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, []);

  const startAutoScroll = () => {
    stopAutoScroll();
    autoScrollRef.current = setInterval(() => {
      nextGroup();
    }, 5000); // Change slide every 3 seconds
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
  };

  const nextGroup = () => {
    setCurrentIndex(prev => (prev + 1) % totalGroups);
  };

  const prevGroup = () => {
    setCurrentIndex(prev => (prev - 1 + totalGroups) % totalGroups);
  };

  const visibleItems = categories.slice(
    currentIndex * visibleCategories,
    (currentIndex + 1) * visibleCategories
  );

  const paddedItems = visibleItems.length < visibleCategories 
    ? [...visibleItems, ...categories.slice(0, visibleCategories - visibleItems.length)]
    : visibleItems;

  return (
    <section className={`${styles.sec}`}>
      <h2 className={`${styles.h2} ${myFont.className}`}>Shop By Category</h2>
      <p className={`${styles.p}`}>Get gorgeous skin with natural-biocompatible skincare</p>
      
      <div className={styles.categories__container}>
       
        
        <div className={styles.categories__body} ref={containerRef}>
          {paddedItems.map((category) => (
            <div key={`${category.id}-${currentIndex}`} className={`${styles.category}`}>
              <div className={styles.category__figure}>
                <Image 
                  alt={category.name} 
                  className={styles.category__img} 
                  src={category.imageUrl} 
                  width={250} 
                  height={280}
                  priority
                />
              </div>
              <p className={`${myFont.className}`}>{category.name}</p>
            </div>
          ))}
        </div>
        
       
      </div>

      {/* Dots indicator */}
      {totalGroups > 1 && (
        <div className={styles.dots}>
          {Array.from({ length: totalGroups }).map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
              onClick={() => {
                setCurrentIndex(index);
                startAutoScroll();
              }}
              aria-label={`Go to group ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default CategoriesHome;