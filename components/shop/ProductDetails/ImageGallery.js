

import { ZoomIn, ChevronLeft, ChevronRight, Plus, Minus, RotateCcw, X } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/styles/shop/ProductDetails.module.css';
import Image from "next/image";

export const ImageGallery = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Zoom states
    const [showZoom, setShowZoom] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const nextImage = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevImage = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    // Reset zoom when image changes or zoom modal opens
    useEffect(() => {
        if (showZoom) {
            setZoomLevel(1);
            setPanOffset({ x: 0, y: 0 });
        }
    }, [currentIndex, showZoom]);

    // Zoom handlers
    const handleImageZoom = useCallback(() => {
        setShowZoom(true);
    }, []);

    const handleZoomIn = useCallback(() => {
        setZoomLevel(prev => Math.min(prev + 0.5, 4));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoomLevel(prev => Math.max(prev - 0.5, 1));
    }, []);

    const handleResetZoom = useCallback(() => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
    }, []);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.3 : 0.3;
        const newZoomLevel = Math.min(Math.max(zoomLevel + delta, 1), 4);
        setZoomLevel(newZoomLevel);

        if (newZoomLevel <= 1) {
            setPanOffset({ x: 0, y: 0 });
        }
    }, [zoomLevel]);

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
        }
    }, [zoomLevel, panOffset]);

    const handleMouseMove = useCallback((e) => {
        if (isDragging && zoomLevel > 1) {
            e.preventDefault();
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
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
    }, []);

    const closeZoom = useCallback(() => {
        setShowZoom(false);
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
        setIsDragging(false);
        document.body.style.cursor = 'default';
    }, []);

    // Navigate in zoom modal
    const navigateInZoom = useCallback((direction) => {
        if (direction === 'next') {
            nextImage();
        } else {
            prevImage();
        }
    }, [nextImage, prevImage]);

    // Keyboard navigation in zoom modal
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

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showZoom, closeZoom, navigateInZoom, handleZoomIn, handleZoomOut, handleResetZoom]);

    if (!images.length) {
        return (
            <div className={styles.mainImageContainer}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#999'
                }}>
                    No image available
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={styles.imageSection}>
                <div className={styles.mainImageContainer}>
                    <Image
                        src={images[currentIndex]}
                        alt={`Product ${currentIndex + 1}`}
                        className={styles.mainImage}
                        onClick={handleImageZoom}
                        fill
                    />

                    <div className={styles.zoomIndicator}>
                        <ZoomIn size={16} />
                    </div>

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className={`${styles.navigationButton} ${styles.prevButton}`}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={nextImage}
                                className={`${styles.navigationButton} ${styles.nextButton}`}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </>
                    )}
                </div>

                {images.length > 1 && (
                    <div className={styles.thumbnailContainer}>
                        {images.slice(0, 4).map((image, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`${styles.thumbnail} ${index === currentIndex ? styles.active : ''}`}
                            >
                                <Image
                                fill
                                    src={image}
                                    alt={`Thumbnail ${index + 1}`}
                                    className={styles.thumbnailImage}
                                />
                            </button>
                        ))}
                        {images.length > 4 && (
                            <div className={styles.moreImages}>
                                +{images.length - 4}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Enhanced Image Zoom Modal */}
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


                        {/* Zoom Controls */}
                        <div className={styles.zoomControls} onClick={(e) => e.stopPropagation()}>
                            <button onClick={handleZoomOut} className={styles.zoomButton}>
                                <Minus size={20} />
                            </button>
                            <span className={styles.zoomLevel}>{Math.round(zoomLevel * 100)}%</span>
                            <button onClick={handleZoomIn} className={styles.zoomButton}>
                                <Plus size={20} />
                            </button>
                            <button onClick={handleResetZoom} className={styles.zoomButton}>
                                <RotateCcw size={20} />
                            </button>
                        </div>

                        {/* Navigation in zoom modal */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigateInZoom('prev');
                                    }}
                                    className={`${styles.zoomNavigationButton} ${styles.zoomPrevButton}`}
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigateInZoom('next');
                                    }}
                                    className={`${styles.zoomNavigationButton} ${styles.zoomNextButton}`}
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}

                        {/* Image counter */}
                        {images.length > 1 && (
                            <div className={styles.imageCounter} onClick={(e) => e.stopPropagation()}>
                                {currentIndex + 1} / {images.length}
                            </div>
                        )}

                        {/* Zoomed Image */}
                        <Image
                            src={images[currentIndex]}
                            alt="Zoomed product"
                            className={styles.zoomImage}
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
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};