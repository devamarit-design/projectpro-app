import { useState, useEffect, useRef } from 'react';

export function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
    const lastScrollY = useRef(0);

    useEffect(() => {
        let ticking = false;
        let container: HTMLElement | Window | null = null;
        let retryInterval: NodeJS.Timeout;

        const updateScrollDirection = () => {
            if (!container) return;

            const scrollY = container instanceof HTMLElement ? container.scrollTop : window.scrollY;

            // 1. Force "up" (show) status when at the very top of the page
            if (scrollY <= 0) {
                setScrollDirection("up");
                lastScrollY.current = scrollY;
                ticking = false;
                return;
            }

            const threshold = 10;
            const diff = scrollY - lastScrollY.current;

            if (Math.abs(diff) < threshold) {
                ticking = false;
                return;
            }

            const newDirection = diff > 0 ? "down" : "up";

            if (newDirection !== scrollDirection) {
                setScrollDirection(newDirection);
            }

            lastScrollY.current = scrollY;
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateScrollDirection);
                ticking = true;
            }
        };

        // Retry logic to find the container
        const bindListener = () => {
            const el = document.getElementById("main-scroll-container");
            if (el) {
                container = el;
                lastScrollY.current = el.scrollTop;
                el.addEventListener("scroll", onScroll, { passive: true });
                if (retryInterval) clearInterval(retryInterval);
                // console.log("Bound scroll listener to main-scroll-container");
            }
        };

        // Try immediately
        bindListener();

        // If not found, keep trying for a bit
        if (!container) {
            retryInterval = setInterval(bindListener, 500);
        }

        return () => {
            if (retryInterval) clearInterval(retryInterval);
            if (container) {
                container.removeEventListener("scroll", onScroll);
            }
        };
    }, [scrollDirection]);

    return scrollDirection;
}
