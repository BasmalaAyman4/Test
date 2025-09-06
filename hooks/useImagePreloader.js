import { useState, useCallback } from 'react';
export const useImagePreloader = (images = []) => {
    const [loadedImages, setLoadedImages] = useState(new Set());
    const [isLoading, setIsLoading] = useState(false);

    const preloadImage = useCallback((src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = reject;
            img.src = src;
            img.crossOrigin = 'anonymous'; // Handle CORS
        });
    }, []);

    const preloadImages = useCallback(async (imageSources) => {
        if (!imageSources?.length) return;

        setIsLoading(true);

        try {
            const promises = imageSources.map(src => preloadImage(src));
            const loaded = await Promise.allSettled(promises);

            const successful = loaded
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);

            setLoadedImages(prev => new Set([...prev, ...successful]));
        } catch (error) {
            console.error('Failed to preload images:', error);
        } finally {
            setIsLoading(false);
        }
    }, [preloadImage]);

    // Preload images when they change
    useState(() => {
        const imageSources = images
            ?.filter(img => img?.fileLink)
            ?.map(img => img.fileLink);

        if (imageSources?.length) {
            preloadImages(imageSources);
        }
    }, [images, preloadImages]);

    return {
        loadedImages,
        isLoading,
        isImageLoaded: (src) => loadedImages.has(src),
    };
};