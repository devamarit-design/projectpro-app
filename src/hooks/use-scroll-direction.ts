import { useState, useEffect, useRef } from 'react';

export function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
    const lastScrollY = useRef(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        lastScrollY.current = window.scrollY;
        let ticking = false;

        const updateScrollDirection = () => {
            const scrollY = window.scrollY;

            // 1. Force "up" (show) status when at the very top of the page
            if (scrollY <= 10) {
                setScrollDirection("up");
                lastScrollY.current = scrollY;
                ticking = false;
                return;
            }

            // 2. Minimum scroll threshold to trigger a change (avoids jitter)
            const threshold = 15;
            const diff = scrollY - lastScrollY.current;

            if (Math.abs(diff) < threshold) {
                ticking = false;
                return;
            }

            // 3. Determine direction
            const newDirection = diff > 0 ? "down" : "up";

            // 4. State update
            setScrollDirection(newDirection);

            lastScrollY.current = scrollY > 0 ? scrollY : 0;
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateScrollDirection);
                ticking = true;
            }
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []); // Empty dependency array - we use refs for tracking

    return scrollDirection;
}
