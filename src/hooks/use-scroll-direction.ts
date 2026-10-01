"use client"

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>("up");
    const lastScrollY = useRef(0);
    const pathname = usePathname();

    // 1. Reset to "up" whenever navigating to a new route so the header is never stuck hidden
    useEffect(() => {
        setScrollDirection("up");
        lastScrollY.current = 0;
    }, [pathname]);

    useEffect(() => {
        let ticking = false;
        let container: HTMLElement | null = null;
        let retryInterval: NodeJS.Timeout | null = null;

        const getScrollY = () => {
            const elScroll = container ? container.scrollTop : 0;
            const winScroll = typeof window !== 'undefined' ? window.scrollY : 0;
            return Math.max(elScroll, winScroll);
        };

        const updateScrollDirection = () => {
            const scrollY = getScrollY();

            // 1. Force "up" (show bars) when near the very top of the page (or on iOS rubber-band bounce)
            if (scrollY <= 30) {
                setScrollDirection("up");
                lastScrollY.current = Math.max(0, scrollY);
                ticking = false;
                return;
            }

            const diff = scrollY - lastScrollY.current;

            // Highly responsive when scrolling up: even a slight upward scroll (diff < -6) brings the header down
            if (diff < -6) {
                setScrollDirection("up");
                lastScrollY.current = scrollY;
            } else if (diff > 12 && scrollY > 50) {
                // Only hide when scrolling down by at least 12px and past the top threshold
                setScrollDirection("down");
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

        // Listen on window for general scrolling and mobile viewport
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
