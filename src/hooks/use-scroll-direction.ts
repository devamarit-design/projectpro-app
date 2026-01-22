import { useState, useEffect } from 'react';

export function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);

    useEffect(() => {
        let lastScrollY = window.pageYOffset;

        const updateScrollDirection = () => {
            const scrollY = window.pageYOffset;
            const direction = scrollY > lastScrollY ? "down" : "up";

            // Only update if direction changed and we've scrolled more than 10px
            if (direction !== scrollDirection && (Math.abs(scrollY - lastScrollY) > 10)) {
                setScrollDirection(direction);
            }
            lastScrollY = scrollY > 0 ? scrollY : 0;
        };

        window.addEventListener("scroll", updateScrollDirection, { passive: true });
        return () => {
            window.removeEventListener("scroll", updateScrollDirection);
        };
    }, [scrollDirection]);

    return scrollDirection;
}
