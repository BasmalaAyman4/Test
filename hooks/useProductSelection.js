'use client';

import { useState, useCallback, useMemo } from 'react';
import { getAvailableSizes, getBestPrice, isInStock } from '@/lib/api-optimized';

export const useProductSelection = (product) => {
    const [selectedColorIndex, setSelectedColorIndex] = useState(0);
    const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Memoized computed values
    const selectedColor = useMemo(() =>
        product?.colors?.[selectedColorIndex] || product?.colors?.[0],
        [product?.colors, selectedColorIndex]
    );
console.log(selectedColor,'selectedColor')
    const availableSizes = useMemo(() =>
        getAvailableSizes(selectedColor),
        [selectedColor]
    );
    const selectedSize = useMemo(() =>
        availableSizes[selectedSizeIndex] || availableSizes[0],
        [availableSizes, selectedSizeIndex]
    );

    const currentImages = useMemo(() =>
        selectedColor?.productImages || [],
        [selectedColor?.productImages]
    );

    const currentImage = useMemo(() =>
        currentImages[selectedImageIndex] || currentImages[0],
        [currentImages, selectedImageIndex]
    );
    const displayPrice = useMemo(() =>
        getBestPrice(selectedSize, selectedColor),
        [selectedSize, selectedColor]
    );

    const originalPrice = useMemo(() => {
        if (selectedSize?.discountPrice > 0) {
            return selectedSize.salesPrice;
        }
        if (selectedColor?.discountPrice > 0) {
            return selectedColor.salesPrice;
        }
        return null;
    }, [selectedSize, selectedColor]);

    const inStock = useMemo(() =>
        isInStock(selectedSize),
        [selectedSize]
    );
    // Event handlers
    const handleColorChange = useCallback((colorIndex) => {
        setSelectedColorIndex(colorIndex);
        setSelectedSizeIndex(0);
        setSelectedImageIndex(0);
    }, []);

    const handleSizeChange = useCallback((sizeIndex) => {
        setSelectedSizeIndex(sizeIndex);
    }, []);
    const handleImageChange = useCallback((imageIndex) => {
        setSelectedImageIndex(imageIndex);
    }, []);
    return {
        // State
        selectedColorIndex,
        selectedSizeIndex,
        selectedImageIndex,

        // Computed values
        selectedColor,
        selectedSize,
        availableSizes,
        currentImages,
        currentImage,
        displayPrice,
        originalPrice,
        inStock,

        // Handlers
        handleColorChange,
        handleSizeChange,
        handleImageChange,
    };
};