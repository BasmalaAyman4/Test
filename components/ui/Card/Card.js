'use client'
import React, { useMemo, useState } from 'react'
import styles from '@/styles/ui/card.module.css'
import Image from 'next/image'

import noImg from '@/assets/noImg.png'
const Card = ({product,active}) => {
  return (
    <>
      <div className={styles.cardContainer}>

       <div  className={styles.card}>
                <div className={styles.card__shine}></div>
                <div className={styles.card__glow}></div>
                <div className={styles.card__content}>
                  <div className={styles.card__badge}>
                    {product.productType}
                  </div>
                  <div className={styles.card__image}>
                    {
                      product.productImage?
                  <Image alt="" src={product.productImage} 
                    loading="lazy"
                    quality={75}
                    placeholder="blur"
                  fill 
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Rw=="
/>
:
                    <Image alt="" src={noImg} fill />

                    }
                  </div>
                  <div className={styles.card__text}>
                    <p className={styles.card__title}>{product.productName}</p>
                    
                  </div>
                  <div className={styles.card__footer}>
                    <div className={styles.card__price}>
              {product.saleaPrice} EGP
                    </div>
                    <div className={styles.card__button}>
                      <svg height="16" width="16" viewBox="0 0 24 24">
                        <path
                          strokeWidth="2"
                          stroke="currentColor"
                          d="M4 12H20M12 4V20"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              </div>

    </>
  )
}

export default Card