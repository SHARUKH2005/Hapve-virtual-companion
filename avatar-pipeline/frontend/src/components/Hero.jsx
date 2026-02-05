"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import ThreeViewer from "./ThreeViewer";

export default function Hero({ modelUrl, demoVideoUrl }) {
  const headlineRef = useRef();
  const ctaRef = useRef();
  const videoRef = useRef();
  // eslint-disable-next-line no-unused-vars
  const logoLottieRef = useRef();

  useEffect(() => {
    // Type-in and underline reveal
    const words = headlineRef.current?.querySelectorAll(".word");
    if (words) {
      gsap.from(words, {
        y: 36, 
        opacity: 0, 
        stagger: 0.06, 
        duration: 0.55, 
        ease: "power3.out"
      });
    }

    // CTA pulse loop
    if (ctaRef.current) {
      gsap.to(ctaRef.current, { 
        scale: 1.03, 
        boxShadow: "0 0 40px rgba(0,208,255,0.12)", 
        repeat: -1, 
        yoyo: true, 
        duration: 1.6, 
        ease: "sine.inOut"
      });
    }

    // Video subtle parallax on scroll
    const vid = videoRef.current;
    if (vid) {
      vid.play().catch(() => {
        // Autoplay failed, that's okay
      });
    }
  }, []);

  return (
    <section className="relative w-full h-screen flex items-center justify-between overflow-hidden bg-gradient-to-br from-white via-blue-50 to-purple-50">
      {/* Left text */}
      <div className="w-1/2 px-12 z-20">
        <div className="mb-6">
          <div className="text-sm uppercase tracking-wider text-muted font-medium">
            Hapve — MIND ZEN AI
          </div>
        </div>
        
        <h1 ref={headlineRef} className="hero-heading text-6xl font-heading leading-tight text-black mb-6">
          <span className="word block">Turn your photo</span>
          <span className="word block">into a 3D interactive</span>
          <span className="word block">AI companion.</span>
        </h1>

        <p className="mt-6 text-lg text-gray-600 max-w-xl leading-relaxed">
          Preserve memories. Interact emotionally. Own via NFT.
        </p>

        <div className="mt-8 flex gap-4">
          <button 
            ref={ctaRef} 
            className="cta-primary rounded-md px-6 py-3 text-white shadow-lg font-semibold"
          >
            Create Your Avatar
          </button>
          <button className="cta-secondary rounded-md px-6 py-3 font-medium">
            Watch Demo
          </button>
        </div>
      </div>

      {/* Right: 3D viewer over masked video */}
      <div className="w-1/2 relative h-full flex items-center justify-center">
        {/* Masked video background */}
        <video 
          ref={videoRef} 
          src={demoVideoUrl || "/demo-video.mp4"} 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-0 md:opacity-40"
          style={{
            maskImage: 'radial-gradient(circle at 30% 30%, black 0%, transparent 70%)'
          }}
        />
        
        <div className="relative z-10 w-[520px] h-[720px] drop-shadow-2xl">
          <ThreeViewer modelUrl={modelUrl} />
        </div>
      </div>

      {/* Floating particles background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="particle-burst" style={{
          top: '20%',
          left: '10%',
          width: '4px',
          height: '4px',
          background: 'var(--accent-start)',
          borderRadius: '50%',
          animation: 'float 3s ease-in-out infinite'
        }} />
        <div className="particle-burst" style={{
          top: '60%',
          right: '15%',
          width: '6px',
          height: '6px',
          background: 'var(--accent-mid)',
          borderRadius: '50%',
          animation: 'float 4s ease-in-out infinite 1s'
        }} />
        <div className="particle-burst" style={{
          bottom: '30%',
          left: '20%',
          width: '3px',
          height: '3px',
          background: 'var(--accent-end)',
          borderRadius: '50%',
          animation: 'float 5s ease-in-out infinite 2s'
        }} />
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.7; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 1; }
        }
      `}</style>
    </section>
  );
}
