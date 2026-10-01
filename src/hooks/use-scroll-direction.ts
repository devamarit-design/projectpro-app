import { useState, useEffect, useRef } from 'react';

export function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
    const lastScrollY = useRef(0);

    useEffect(() => {
        let ticking = false;
        let container: HTMLElement | null = null;
        let retryInterval: NodeJS.Timeout | null = null;

        const getScrollY = () => {
            if (container) {
                return container.scrollTop;
            }
            return typeof window !== 'undefined' ? window.scrollY : 0;
        };

        const updateScrollDirection = () => {
            const scrollY = getScrollY();

            // 1. Force "up" (show bars) when near the very top of the page
            if (scrollY <= 20) {
                setScrollDirection("up");
                lastScrollY.current = Math.max(0, scrollY);
                ticking = false;
                return;
            }

            const threshold = 10;
            const diff = scrollY - lastScrollY.current;

            if (Math.abs(diff) >= threshold) {
                const newDirection = diff > 0 ? "down" : "up";
                setScrollDirection(prev => (prev !== newDirection ? newDirection : prev));
                lastScrollY.current = scrollY;
            }

            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateScrollDirection);
                ticking = true;
            }
        };

        // Listen on window as well for mobile/browser viewport scrolls
        window.addEventListener("scroll", onScroll, { passive: true });

        // Retry logic to find and attach to main-scroll-container
        const bindContainerListener = () => {
            const el = document.getElementById("main-scroll-container");
            if (el && el !== container) {
                if (container) {
                    container.removeEventListener("scroll", onScroll);
                }
                container = el;
                lastScrollY.current = getScrollY();
                el.addEventListener("scroll", onScroll, { passive: true });
                if (retryInterval) {
                    clearInterval(retryInterval);
                    retryInterval = null;
                }
            }
        };

        bindContainerListener();
        if (!container) {
            retryInterval = setInterval(bindContainerListener, 300);
        }

        return () => {
            if (retryInterval) clearInterval(retryInterval);
            window.removeEventListener("scroll", onScroll);
            if (container) {
                container.removeEventListener("scroll", onScroll);
            }
        };
    }, []);

    return scrollDirection;
}
