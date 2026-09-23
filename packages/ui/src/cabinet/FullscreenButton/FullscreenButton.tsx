'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Maximize2, Minimize2 } from 'lucide-react';

import { isFullscreenAvailable, toggleFullscreen } from './fullscreen';

import css from './FullscreenButton.module.css';

//===================================================================

export type FullscreenButtonProps = Readonly<{
  className?: string;
  enterLabel?: string;
  exitLabel?: string;
}>;

//===================================================================

function FullscreenButton({
  className,
  enterLabel = 'Enter fullscreen',
  exitLabel = 'Exit fullscreen',
}: FullscreenButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsSupported(isFullscreenAvailable(document));
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    handleFullscreenChange();
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!isSupported) return null;

  return (
    <button
      className={clsx(css.button, className)}
      type="button"
      aria-label={isFullscreen ? exitLabel : enterLabel}
      onClick={() => void toggleFullscreen(document)}
    >
      {isFullscreen ? (
        <Minimize2 size={18} aria-hidden="true" />
      ) : (
        <Maximize2 size={18} aria-hidden="true" />
      )}
    </button>
  );
}

export default FullscreenButton;
export { FullscreenButton };
