"use client"

import { useState, useEffect, useRef } from 'react';

export function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
    const lastScrollY = useRef(0);
    const directionRef = useRef<"up" | "down" | null>(null);

    useEffect(() => {
        let ticking = false;
        let container: HTMLElement | null = null;
        let retryInterval: NodeJS.Timeout | null = null;

        const updateScrollDirection = () => {
            const scrollY = container ? container.scrollTop : 0;

            // Force "up" (show bars) when near the very top of the page
            if (scrollY <= 20) {
                if (directionRef.current !== "up") {
                    directionRef.current = "up";
                    setScrollDirection("up");
                }
                lastScrollY.current = Math.max(0, scrollY);
                ticking = false;
                return;
            }

            const threshold = 10;
            const diff = scrollY - lastScrollY.current;

            if (Math.abs(diff) >= threshold) {
                const newDir: "up" | "down" = diff > 0 ? "down" : "up";
                if (newDir !== directionRef.current) {
                    directionRef.current = newDir;
                    setScrollDirection(newDir);
                }
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

        const bindListener = () => {
            const el = document.getElementById("main-scroll-container");
            if (el && el !== container) {
                if (container) container.removeEventListener("scroll", onScroll);
                container = el;
                lastScrollY.current = el.scrollTop;
                el.addEventListener("scroll", onScroll, { passive: true });
                if (retryInterval) {
                    clearInterval(retryInterval);
                    retryInterval = null;
                }
            }
        };

        bindListener();
        if (!container) {
            retryInterval = setInterval(bindListener, 300);
        }

        return () => {
            if (retryInterval) clearInterval(retryInterval);
            if (container) container.removeEventListener("scroll", onScroll);
        };
    }, []); // ← empty deps: mount once, never re-create

    return scrollDirection;
}
