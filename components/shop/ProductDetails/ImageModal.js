'use client';

import { memo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';
import styles from '@/styles/shop/ProductDetails.module.css';

export const ImageModal = memo(({
    isOpen,
    currentImage,
    productName,
    onClose
}) => {
    const getOptimizedImageSrc = (src) => {
        if (!src) return '/placeholder-image.jpg';
        return `/_next/image?url=${encodeURIComponent(src)}&w=1200&q=95`;
    };

    return (
        <AnimatePresence>
            {isOpen && currentImage?.fileLink && (
                <motion.div
                    className={styles.imageModal}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={styles.imageModalContent}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.8 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className={styles.closeModal}
                            onClick={onClose}
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                        <Image
                            src={getOptimizedImageSrc(currentImage.fileLink)}
                            alt={productName}
                            fill
                            className={styles.modalImage}
                            sizes="100vw"
                            unoptimized={false}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

ImageModal.displayName = 'ImageModal';