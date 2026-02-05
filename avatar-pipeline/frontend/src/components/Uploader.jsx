"use client";
import { useRef, useState } from "react";
import { gsap } from "gsap";

export default function Uploader({ onJobCreated }) {
  const inputRef = useRef();
  const [consentOpen, setConsentOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [jobId, setJobId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const onFile = async (file) => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or MP4 file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("style", "realistic");
      
      const res = await fetch("/api/upload", { 
        method: "POST", 
        body: fd 
      });
      
      if (!res.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await res.json();
      setJobId(data.jobId);
      pollStatus(data.jobId);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  const pollStatus = async (jobId) => {
    let done = false;
    while (!done) {
      try {
        const r = await fetch(`/api/job/${jobId}/status`);
        const j = await r.json();
        setProgress(j.progress || 0);
        
        if (j.status === "finished") {
          done = true;
          setIsUploading(false);
          playReveal();
          onJobCreated(j.modelUrl);
          break;
        }
        
        if (j.status === "failed") {
          done = true;
          setIsUploading(false);
          alert("Generation failed: " + (j.error || "Unknown error"));
          break;
        }
        
        await new Promise(r => setTimeout(r, 1500));
      } catch (error) {
        console.error('Status poll error:', error);
        done = true;
        setIsUploading(false);
      }
    }
  };

  const playReveal = () => {
    const el = document.querySelector(".reveal-target");
    if (el) {
      gsap.fromTo(el, 
        { opacity: 0, scale: 0.9 }, 
        { opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" }
      );
      
      // Particle burst effect
      createParticleBurst();
    }
  };

  const createParticleBurst = () => {
    const container = document.querySelector('.uploader-card');
    if (!container) return;

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: linear-gradient(45deg, var(--accent-start), var(--accent-end));
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
      `;
      
      const rect = container.getBoundingClientRect();
      particle.style.left = rect.width / 2 + 'px';
      particle.style.top = rect.height / 2 + 'px';
      
      container.appendChild(particle);
      
      gsap.to(particle, {
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        opacity: 0,
        scale: 0,
        duration: 1,
        ease: "power2.out",
        onComplete: () => particle.remove()
      });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="uploader-card relative p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <input 
        type="file" 
        ref={inputRef} 
        hidden 
        accept="image/jpeg,image/jpg,image/png,video/mp4"
        onChange={(e) => onFile(e.target.files[0])} 
      />
      
      <div 
        className={`border-2 border-dashed rounded-lg p-8 transition-all duration-300 cursor-pointer ${
          dragActive 
            ? 'border-accentStart bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-accentMid hover:bg-gray-50'
        }`}
        onClick={() => inputRef.current.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="mb-4 text-lg font-medium text-gray-700">
            {dragActive ? 'Drop your file here' : 'Drag & Drop your photo or click to upload'}
          </div>
          <div className="text-sm text-gray-500 mb-2">
            Allowed: JPG, PNG, MP4 (max 50MB)
          </div>
          <div className="text-xs text-gray-400">
            For best results, use a clear front-facing photo
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {isUploading && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Generating Avatar</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accentStart via-accentMid to-accentEnd transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            This may take 2-5 minutes depending on complexity
          </div>
        </div>
      )}

      {/* Success message */}
      <div className="mt-4 reveal-target opacity-0">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-green-500 mr-2">✅</div>
            <div className="text-green-800 font-medium">
              Avatar generated successfully!
            </div>
          </div>
        </div>
      </div>

      {/* Consent Modal */}
      {consentOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Privacy & Consent</h3>
            <p className="text-gray-600 mb-4">
              By uploading your photo, you confirm that:
            </p>
            <ul className="text-sm text-gray-600 mb-6 space-y-2">
              <li>• You own the rights to this photo</li>
              <li>• You consent to AI processing for avatar generation</li>
              <li>• Your data will be processed securely</li>
              <li>• You can delete your data at any time</li>
            </ul>
            <div className="flex gap-3">
              <button 
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setConsentOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 px-4 py-2 bg-accentStart text-white rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => {
                  setConsentOpen(false);
                  // Proceed with upload
                }}
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
