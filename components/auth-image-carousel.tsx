'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export interface AuthCarouselImage {
  src: string;
  alt: string;
}

export const LOGIN_AUTH_IMAGES: AuthCarouselImage[] = [
  { src: '/assets/images/dashboard/login_hero_1440w_web-xl.webp', alt: 'A family building a home together in Kenya' },
  { src: '/assets/images/funds/family/family_1440w_web-xl.webp', alt: 'Family members sharing a moment together' },
  { src: '/assets/images/funds/education/pexels-valerie-sutton-34163824-14935332.webp', alt: 'School children learning together' },
  { src: '/assets/images/funds/community/community_1080w_web.webp', alt: 'Community members working together in a garden' },
];

export const SIGNUP_AUTH_IMAGES: AuthCarouselImage[] = [
  { src: '/assets/images/funds/community/community_1080w_web.webp', alt: 'Community members working together in a garden' },
  { src: '/assets/images/funds/community/pexels-droneafrica-12431091.webp', alt: 'A group joining hands around a shared goal' },
  { src: '/assets/images/funds/community/rural/pexels-oladele-olaniyi-541492341-16658745.webp', alt: 'A rural community landscape' },
  { src: '/assets/images/funds/education/pexels-artempodrez-8088092.webp', alt: 'Students learning in a classroom' },
];

export default function AuthImageCarousel({ images, onError }: {
  images: AuthCarouselImage[];
  onError: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const activeImage = images[activeIndex];

  useEffect(() => {
    if (!isPlaying || images.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % images.length);
    }, 60000);
    return () => window.clearInterval(timer);
  }, [images.length, isPlaying]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e8eee7]">
      <Image
        key={activeImage.src}
        src={activeImage.src}
        alt={activeImage.alt}
        fill
        priority={activeIndex === 0}
        sizes="(max-width: 767px) 100vw, 50vw"
        className="auth-carousel-image object-cover object-top"
        onError={onError}
      />

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/25 px-2 py-1.5 backdrop-blur-sm">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            aria-label={`Show image ${index + 1} of ${images.length}`}
            aria-pressed={activeIndex === index}
            onClick={() => setActiveIndex(index)}
            className={`h-1.5 rounded-full transition-all ${activeIndex === index ? 'w-5 bg-white' : 'w-1.5 bg-white/65 hover:bg-white'}`}
          />
        ))}
        <button
          type="button"
          aria-label={isPlaying ? 'Pause image rotation' : 'Play image rotation'}
          onClick={() => setIsPlaying((playing) => !playing)}
          className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-white/90 hover:bg-white/15 hover:text-white"
        >
          {isPlaying ? (
            <svg aria-hidden="true" viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="currentColor"><path d="M3 2h2v8H3zM7 2h2v8H7z" /></svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="currentColor"><path d="M3 2.1v7.8L10 6z" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}
