import { useState, useEffect } from 'react';

export function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);

    useEffect(() => {
        const scrollContainer = document.getElementById('main-scroll-container') || window;
        let lastScrollY = scrollContainer === window ? window.pageYOffset : (scrollContainer as HTMLElement).scrollTop;

        const updateScrollDirection = () => {
            const scrollY = scrollContainer === window ? window.pageYOffset : (scrollContainer as HTMLElement).scrollTop;
            const direction = scrollY > lastScrollY ? "down" : "up";
            if (direction !== scrollDirection && (Math.abs(scrollY - lastScrollY) > 5)) {
                setScrollDirection(direction);
            }
            lastScrollY = scrollY > 0 ? scrollY : 0;
        };

        scrollContainer.addEventListener("scroll", updateScrollDirection);
        return () => {
            scrollContainer.removeEventListener("scroll", updateScrollDirection);
        };
    }, [scrollDirection]);

    return scrollDirection;
}
