'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

import { IconButton } from '@e-pharmacy/ui/primitives';

import css from './ScrollToTopButton.module.css';

//===================================================================

const SCROLL_TO_TOP_VISIBILITY_THRESHOLD = 360;

//===================================================================

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > SCROLL_TO_TOP_VISIBILITY_THRESHOLD);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <IconButton
      className={css.button}
      label="Scroll to top"
      icon={<ArrowUp size={22} aria-hidden="true" />}
      onClick={() => {
        const prefersReducedMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;

        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      }}
    />
  );
}

export default ScrollToTopButton;
export { ScrollToTopButton };
