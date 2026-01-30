/**
 * Enhanced smooth scroll utility for fluid scrolling experience
 */

interface SmoothScrollOptions {
  duration?: number;
  easing?: (t: number) => number;
  offset?: number;
  behavior?: ScrollBehavior;
}

// Custom easing function for smooth, natural feeling scroll
const easeInOutCubic = (t: number): number => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Enhanced easing - more fluid and natural
const fluidEase = (t: number): number => {
  return t < 0.5
    ? 2 * t * t * (3 - 2 * t)
    : 1 - Math.pow(-2 * t + 2, 2) * (2 * t - 1) / 2;
};

/**
 * Smooth scroll to a specific element or position
 */
export function smoothScrollTo(
  target: HTMLElement | number | string,
  options: SmoothScrollOptions = {}
): void {
  const {
    duration = 800,
    easing = fluidEase,
    offset = 0,
    behavior = 'smooth'
  } = options;

  let targetElement: HTMLElement | null = null;
  let targetPosition = 0;

  // Determine target
  if (typeof target === 'string') {
    targetElement = document.querySelector(target);
  } else if (typeof target === 'number') {
    targetPosition = target;
  } else {
    targetElement = target;
  }

  // Calculate target position
  if (targetElement) {
    const elementTop = targetElement.getBoundingClientRect().top + window.pageYOffset;
    targetPosition = elementTop - offset;
  }

  // Get current scroll position
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime: number | null = null;

  // Use native smooth scroll for better performance, but enhance with easing
  if (behavior === 'smooth' && typeof window !== 'undefined') {
    // Use requestAnimationFrame for smooth animation
    const animateScroll = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }

      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easedProgress = easing(progress);

      window.scrollTo({
        top: startPosition + distance * easedProgress,
        behavior: 'auto' // Use manual scroll for custom easing
      });

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  } else {
    // Fallback to native smooth scroll
    window.scrollTo({
      top: targetPosition,
      behavior: behavior
    });
  }
}

/**
 * Smooth scroll to top
 */
export function scrollToTop(options: SmoothScrollOptions = {}): void {
  smoothScrollTo(0, { duration: 600, ...options });
}

/**
 * Smooth scroll to element by ID
 */
export function scrollToElement(
  elementId: string,
  options: SmoothScrollOptions = {}
): void {
  const element = document.getElementById(elementId);
  if (element) {
    smoothScrollTo(element, { offset: 80, ...options });
  }
}

/**
 * Initialize smooth scroll for all anchor links
 */
export function initSmoothScroll(): void {
  if (typeof window === 'undefined') return;

  // Handle anchor links
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement;
    
    if (anchor && anchor.hash && anchor.hash !== '#') {
      const hash = anchor.hash;
      const targetElement = document.querySelector(hash);
      
      if (targetElement) {
        e.preventDefault();
        smoothScrollTo(targetElement as HTMLElement, {
          duration: 800,
          offset: 80
        });
        
        // Update URL without triggering scroll
        if (window.history.pushState) {
          window.history.pushState(null, '', hash);
        }
      }
    }
  }, { passive: false });

  // Handle programmatic navigation
  const originalScrollTo = window.scrollTo;
  window.scrollTo = function(optionsOrX?: ScrollToOptions | number, y?: number) {
    if (typeof optionsOrX === 'object' && optionsOrX?.behavior === 'smooth') {
      if (typeof optionsOrX.top === 'number') {
        smoothScrollTo(optionsOrX.top, { duration: 800 });
      } else {
        (originalScrollTo as any).call(this, optionsOrX);
      }
    } else if (typeof optionsOrX === 'number') {
      (originalScrollTo as any).call(this, optionsOrX, y || 0);
    } else if (optionsOrX) {
      (originalScrollTo as any).call(this, optionsOrX);
    }
  };
}

/**
 * Smooth scroll for scroll events (like scroll buttons, etc.)
 */
export function smoothScroll(
  direction: 'up' | 'down' | 'left' | 'right',
  amount: number = 300
): void {
  const currentScroll = {
    up: window.pageYOffset,
    down: window.pageYOffset,
    left: window.pageXOffset,
    right: window.pageXOffset
  };

  const targetPosition = {
    up: currentScroll.up - amount,
    down: currentScroll.down + amount,
    left: currentScroll.left - amount,
    right: currentScroll.right + amount
  };

  smoothScrollTo(targetPosition[direction], {
    duration: 600
  });
}

