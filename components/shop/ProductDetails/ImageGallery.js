'use client';

import { ZoomIn, ChevronLeft, ChevronRight, Plus, Minus, RotateCcw, X } from "lucide-react";
import { useCallback, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/styles/shop/ProductDetails.module.css';
import Image from "next/image";

export const ImageGallery = ({ images, selectedImageIndex = 0, onImageChange }) => {
    const [currentIndex, setCurrentIndex] = useState(selectedImageIndex);

    // Zoom states
    const [showZoom, setShowZoom] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isLoading, setIsLoading] = useState(false);

    // Refs for better performance
/*     const zoomImageRef = useRef(null);
    const lastTouchDistance = useRef(0); */

    // Sync with parent component
    useEffect(() => {
        if (selectedImageIndex !== currentIndex) {
            setCurrentIndex(selectedImageIndex);
        }
    }, [selectedImageIndex]);

    // Navigation functions
    const nextImage = useCallback(() => {
        const newIndex = (currentIndex + 1) % images.length;
        setCurrentIndex(newIndex);
        onImageChange?.(newIndex);
    }, [currentIndex, images.length, onImageChange]);

    const prevImage = useCallback(() => {
        const newIndex = (currentIndex - 1 + images.length) % images.length;
        setCurrentIndex(newIndex);
        onImageChange?.(newIndex);
    }, [currentIndex, images.length, onImageChange]);

     const goToImage = useCallback((index) => {
        if (index >= 0 && index < images.length) {
            setCurrentIndex(index);
            onImageChange?.(index);
        }
    }, [images.length, onImageChange]); 

    // Reset zoom when image changes or zoom modal opens
    useEffect(() => {
        if (showZoom) {
            setZoomLevel(1);
            setPanOffset({ x: 0, y: 0 });
            setIsDragging(false);
        }
    }, [currentIndex, showZoom]);

    // Zoom handlers
    const handleImageZoom = useCallback(() => {
        setShowZoom(true);
        setIsLoading(true);
    }, []);

    const handleZoomIn = useCallback(() => {
        setZoomLevel(prev => Math.min(prev + 0.5, 4));
    }, []);

    const handleZoomOut = useCallback(() => {
       /*  setZoomLevel(prev => {
            const newLevel = Math.max(prev - 0.5, 1);
            if (newLevel <= 1) {
                setPanOffset({ x: 0, y: 0 });
            }
            return newLevel;
        }); */
        setZoomLevel(prev => Math.max(prev - 0.5, 1));

    }, []);

    const handleResetZoom = useCallback(() => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
    }, []);

    // Enhanced wheel handler with smooth zooming
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        const delta = e.deltaY > 0 ? -0.3 : 0.3;
        const newZoomLevel = Math.min(Math.max(zoomLevel + delta, 1));
        setZoomLevel(newZoomLevel);

        if (newZoomLevel <= 1) {
            setPanOffset({ x: 0, y: 0 });
        }
    }, [zoomLevel]);

    // Mouse drag handlers
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (zoomLevel > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - panOffset.x,
                y: e.clientY - panOffset.y
            });
            document.body.style.cursor = 'grabbing';
/*             document.body.style.userSelect = 'none';
 */        }
    }, [zoomLevel, panOffset]);

    const handleMouseMove = useCallback((e) => {
        if (isDragging && zoomLevel > 1) {
            e.preventDefault();
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;

            // Calculate max pan based on zoom level
            const maxPan = 200 * zoomLevel;

            setPanOffset({
                x: Math.max(-maxPan, Math.min(maxPan, newX)),
                y: Math.max(-maxPan, Math.min(maxPan, newY))
            });
        }
    }, [isDragging, dragStart, zoomLevel]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        document.body.style.cursor = 'default';
/*         document.body.style.userSelect = 'auto';
 */    }, []);

    // Touch handlers for mobile support
   /*  const handleTouchStart = useCallback((e) => {
        if (e.touches.length === 1 && zoomLevel > 1) {
            // Single touch for panning
            const touch = e.touches[0];
            setIsDragging(true);
            setDragStart({
                x: touch.clientX - panOffset.x,
                y: touch.clientY - panOffset.y
            });
        } else if (e.touches.length === 2) {
            // Two fingers for pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            lastTouchDistance.current = distance;
        }
    }, [zoomLevel, panOffset]);

    const handleTouchMove = useCallback((e) => {
        e.preventDefault();

        if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
            // Single touch panning
            const touch = e.touches[0];
            const newX = touch.clientX - dragStart.x;
            const newY = touch.clientY - dragStart.y;

            const maxPan = 150 * (zoomLevel - 1);
            setPanOffset({
                x: Math.max(-maxPan, Math.min(maxPan, newX)),
                y: Math.max(-maxPan, Math.min(maxPan, newY))
            });
        } else if (e.touches.length === 2) {
            // Pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            if (lastTouchDistance.current > 0) {
                const scale = distance / lastTouchDistance.current;
                const newZoomLevel = Math.min(Math.max(zoomLevel * scale, 1), 4);
                setZoomLevel(newZoomLevel);

                if (newZoomLevel <= 1) {
                    setPanOffset({ x: 0, y: 0 });
                }
            }

            lastTouchDistance.current = distance;
        }
    }, [isDragging, dragStart, zoomLevel]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
        lastTouchDistance.current = 0;
    }, []); */

    const closeZoom = useCallback(() => {
        setShowZoom(false);
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
        setIsDragging(false);
        setIsLoading(false);
        document.body.style.cursor = 'default';
/*         document.body.style.userSelect = 'auto';
 */    }, []);

    // Navigate in zoom modal
    const navigateInZoom = useCallback((direction) => {
        if (direction === 'next') {
            nextImage();
        } else {
            prevImage();
        }
    }, [nextImage, prevImage]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showZoom) return;

            switch (e.key) {
                case 'Escape':
                    closeZoom();
                    break;
                case 'ArrowLeft':
                    navigateInZoom('prev');
                    break;
                case 'ArrowRight':
                    navigateInZoom('next');
                    break;
                case '+':
                case '=':
                    handleZoomIn();
                    break;
                case '-':
                    handleZoomOut();
                    break;
                case '0':
                    handleResetZoom();
                    break;
            }
        };

        if (showZoom) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [showZoom, closeZoom, navigateInZoom, handleZoomIn, handleZoomOut, handleResetZoom]);

    // Handle image load in zoom modal
    const handleImageLoad = useCallback(() => {
        setIsLoading(false);
    }, []);

    // Validate images array
    if (!images || !Array.isArray(images) || images.length === 0) {
        return (
            
             <div className={styles.mainImageContainer}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%', 
          color: '#999' 
        }}>
                    <p className={styles.noImageIcon}>📷</p>

          <p>No image available</p>
        </div>
      </div>
        );
    }

    // Ensure currentIndex is valid
    const validCurrentIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
    const currentImage = images[validCurrentIndex];
    console.log(images,'currentImage')
    return (
        <>
            <div className={styles.imageSection}>
                {/* Main Image Container */}
                <div className={styles.mainImageContainer}>
                    <motion.div
                        key={validCurrentIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
/*                         className={styles.mainImageWrapper}
 */                    >
                        <Image
                            src={currentImage.fileLink}
                            alt={`Product image ${validCurrentIndex + 1}`}
                            className={styles.mainImage}
                            onClick={handleImageZoom}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority={validCurrentIndex === 0}
                            quality={85}
                        />

                    </motion.div>

                    <div className={styles.zoomIndicator}>
                        <ZoomIn size={16} />
                    </div>


                    {images.length > 1 && (
                        <>
                            <motion.button
                                onClick={prevImage}
                                className={`${styles.navigationButton} ${styles.prevButton}`}                            
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={20} />
                            </motion.button>
                            <motion.button
                                onClick={nextImage}
                                className={`${styles.navigationButton} ${styles.nextButton}`}
                                aria-label="Next image"
                            >
                                <ChevronRight size={20} />
                            </motion.button>
                        </>
                    )}


























{/* 
                    <motion.div
                        className={styles.zoomIndicator}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <ZoomIn size={16} />
                        <span>Click to zoom</span>
                    </motion.div>

                   

                    {images.length > 1 && (
                        <div className={styles.imageCounter}>
                            {validCurrentIndex + 1} / {images.length}
                        </div>
                    )} */}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                    <div className={styles.thumbnailContainer}>
{/*                         <div className={styles.thumbnailScrollArea}>
 */}                            {images.slice(0, 4).map((image, index) => (
                                <motion.button
                                    key={index}
                                    onClick={() => goToImage(index)}
                                    className={`${styles.thumbnail} ${index === validCurrentIndex ? styles.active : ''}`}
                                    aria-label={`View image ${index + 1}`}
                                >
                                    <Image
                                        src={image.fileLink}
                                        alt={`Thumbnail ${index + 1}`}
                                        className={styles.thumbnailImage}
                                        fill
                                        sizes="80px"
                                        quality={60}
                                    />
                                    {/* {index === validCurrentIndex && (
                                        <div className={styles.thumbnailActiveIndicator} />
                                    )} */}
                                </motion.button>
                            ))}
                            {images.length > 4 && (
                                <div className={styles.moreImages}>
                                    +{images.length - 4}
                                </div>
                            )}
{/*                         </div>
 */}                    </div>
                )}
            </div>





            {/* Enhanced Zoom Modal */}
            <AnimatePresence>
                {showZoom && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.zoomModal}
                        onClick={closeZoom}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* Close Button */}
                        {/* <motion.button
                            className={styles.zoomCloseButton}
                            onClick={closeZoom}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Close zoom view"
                        >
                            <X size={24} />
                        </motion.button> */}

                        {/* Zoom Controls */}
                        <motion.div
                            className={styles.zoomControls}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <button
                                onClick={handleZoomOut}
                                className={styles.zoomButton}
                                aria-label="Zoom out"
                            >
                                <Minus size={18} />
                            </button>
                            <span className={styles.zoomLevel}>{Math.round(zoomLevel * 100)}%</span>
                            <button
                                onClick={handleZoomIn}
                                className={styles.zoomButton}
                                aria-label="Zoom in"
                            >
                                <Plus size={18} />
                            </button>
                            <button
                                onClick={handleResetZoom}
                                className={styles.zoomButton}
                                aria-label="Reset zoom"
                            >
                                <RotateCcw size={18} />
                            </button>
                        </motion.div>

                        {/* Navigation in zoom modal */}
                        {images.length > 1 && (
                            <>
                                <motion.button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigateInZoom('prev');
                                    }}
                                    className={`${styles.zoomNavigationButton} ${styles.zoomPrevButton}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft size={24} />
                                </motion.button>
                                <motion.button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigateInZoom('next');
                                    }}
                                    className={`${styles.zoomNavigationButton} ${styles.zoomNextButton}`}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    aria-label="Next image"
                                >
                                    <ChevronRight size={24} />
                                </motion.button>
                            </>
                        )}

                        {/* Image counter in zoom */}
                        {images.length > 1 && (
                            <motion.div
                                className={styles.imageCounter}
                                onClick={(e) => e.stopPropagation()}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                {validCurrentIndex + 1} of {images.length}
                            </motion.div>
                        )}

                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className={styles.zoomLoadingIndicator}>
                                <div className={styles.loadingSpinner} />
                            </div>
                        )}

                        {/* Zoomed Image */}
                        <Image
/*                             ref={zoomImageRef}
 */                            src={currentImage.fileLink}
                            alt={`Zoomed product image ${validCurrentIndex + 1}`}
                            className={styles.zoomImage}
                            fill
                            quality={95}
                            sizes="100vw"
                            onLoad={handleImageLoad}
                            style={{
                                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                                transformOrigin: 'center center',
                                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                                userSelect: 'none',
                                pointerEvents: 'auto'
                            }}
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (zoomLevel <= 1.5) {
                                    setZoomLevel(2);
                                } 
                            }}
                            draggable={false}
                        />

                        {/* Zoom Instructions */}
                       {/*  <motion.div
                            className={styles.zoomInstructions}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: zoomLevel > 1 ? 0 : 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p>Click image to zoom • Scroll to zoom • Drag to pan</p>
                        </motion.div> */}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};