"use client"

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
    const lastScrollY = useRef(0);
    const pathname = usePathname();

    // 1. Reset to "up" whenever navigating to a new route
    useEffect(() => {
        setScrollDirection("up");
        lastScrollY.current = 0;
    }, [pathname]);

    useEffect(() => {
        let ticking = false;
        let container: HTMLElement | Window | null = null;
        let retryInterval: NodeJS.Timeout | null = null;

        const updateScrollDirection = () => {
            if (!container) return;

            const scrollY = container instanceof HTMLElement ? container.scrollTop : window.scrollY;

            // 1. Force "up" (show bars) when near the very top of the page
            if (scrollY <= 20) {
                setScrollDirection("up");
                lastScrollY.current = Math.max(0, scrollY);
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

        // Attach listener to main-scroll-container
        const bindListener = () => {
            const el = document.getElementById("main-scroll-container");
            if (el) {
                container = el;
                lastScrollY.current = el.scrollTop;
                el.addEventListener("scroll", onScroll, { passive: true });
                if (retryInterval) {
                    clearInterval(retryInterval);
                    retryInterval = null;
                }
            } else if (typeof window !== "undefined") {
                container = window;
                window.addEventListener("scroll", onScroll, { passive: true });
            }
        };

        bindListener();

        if (!container || container === window) {
            retryInterval = setInterval(bindListener, 400);
        }

        return () => {
            if (retryInterval) clearInterval(retryInterval);
            if (container instanceof HTMLElement) {
                container.removeEventListener("scroll", onScroll);
            } else if (typeof window !== "undefined") {
                window.removeEventListener("scroll", onScroll);
            }
        };
    }, [scrollDirection]);

    return scrollDirection;
}
