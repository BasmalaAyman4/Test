'use client';

import { useState, useCallback, memo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn } from 'lucide-react';
import styles from '@/styles/shop/ProductDetails.module.css';

const ProductImage = memo(({
    image,
    alt,
    priority = false,
    onLoad,
    onClick,
    className = styles.mainImage
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = useCallback(() => {
        setIsLoading(false);
        setHasError(false);
        onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
        setIsLoading(false);
        setHasError(true);
    }, []);

    // Fix for CORS issue: Use Next.js Image Optimization
    const getOptimizedImageSrc = (src) => {
        if (!src) return '/placeholder-image.jpg';
        // Use Next.js Image Optimization API to handle CORS
        return `/_next/image?url=${encodeURIComponent(src)}&w=800&q=75`;
    };

    if (!image?.fileLink || hasError) {
        return (
            <div className={styles.imageWrapper}>
                <div className={styles.imagePlaceholder}>
                    <span>Image not available</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.imageWrapper}>
            {isLoading && <div className={styles.imageSkeleton} />}
            <Image
                src={getOptimizedImageSrc(image.fileLink)}
                alt={alt || 'Product image'}
                fill
                className={className}
                priority={priority}
                onLoad={handleLoad}
                onError={handleError}
                onClick={onClick}
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized={false} // Use Next.js optimization
            />
            {onClick && !isLoading && (
                <button className={styles.zoomButton} onClick={onClick}>
                    <ZoomIn size={20} />
                </button>
            )}
        </div>
    );
});

ProductImage.displayName = 'ProductImage';

export const ImageGallery = memo(({
    currentImages,
    currentImage,
    selectedImageIndex,
    selectedColorIndex,
    productName,
    onImageChange,
    onImageClick
}) => {
    return (
        <div className={styles.imageSection}>
            <div className={styles.mainImageContainer}>
                <AnimatePresence mode="wait">
                    {currentImage?.fileLink && (
                        <motion.div
                            key={`${selectedColorIndex}-${selectedImageIndex}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ProductImage
                                image={currentImage}
                                alt={productName}
                                priority={selectedImageIndex === 0}
                                onClick={onImageClick}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Thumbnail Images */}
            {currentImages && currentImages.length > 1 && (
                <div className={styles.thumbnailContainer}>
                    {currentImages.map((image, index) => (
                        <button
                            key={`${selectedColorIndex}-${index}`}
                            className={`${styles.thumbnail} ${index === selectedImageIndex ? styles.thumbnailActive : ''}`}
                            onClick={() => onImageChange(index)}
                            aria-label={`View image ${index + 1}`}
                        >
                            <Image
                                src={`/_next/image?url=${encodeURIComponent(image.fileLink || '/placeholder-image.jpg')}&w=150&q=60`}
                                alt={`${productName} view ${index + 1}`}
                                fill
                                className={styles.thumbnailImage}
                                sizes="100px"
                                unoptimized={false}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
});

ImageGallery.displayName = 'ImageGallery';