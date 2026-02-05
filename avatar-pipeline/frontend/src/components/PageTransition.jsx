"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function PageTransition({ children }) {
  const container = useRef();

  useEffect(() => {
    const el = container.current;
    if (!el) return;

    // Initial enter animation: ripple wipe + fadeUp
    gsap.fromTo(el.querySelectorAll(".pt-animate"), 
      { 
        y: 30, 
        opacity: 0 
      }, 
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.7, 
        stagger: 0.06, 
        ease: "power3.out" 
      }
    );

    // Page exit will be triggered by router navigation
    // Implement in route change handlers
  }, []);

  const playExitAnimation = () => {
    return new Promise((resolve) => {
      const el = container.current;
      if (!el) {
        resolve();
        return;
      }

      // Create ripple effect
      const overlay = document.createElement('div');
      overlay.className = 'page-transition-overlay';
      overlay.style.opacity = '0';
      document.body.appendChild(overlay);

      // Animate ripple
      gsap.to(overlay, {
        opacity: 1,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => {
          resolve();
          // Clean up after navigation
          setTimeout(() => {
            document.body.removeChild(overlay);
          }, 100);
        }
      });
    });
  };

  // Expose exit animation for use in navigation
  useEffect(() => {
    window.playPageExit = playExitAnimation;
  }, []);

  return (
    <div ref={container} className="w-full h-full">
      {children}
    </div>
  );
}
