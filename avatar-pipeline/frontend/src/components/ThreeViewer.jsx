"use client";
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

export default function ThreeViewer({ modelUrl }) {
  const mountRef = useRef();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene + Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45, 
      mount.clientWidth / mount.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 1.6, 2.8);

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(hemi);
    
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7.5);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    scene.add(dir);

    // Ambient light for softer shadows
    const ambient = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambient);

    // Composer + Bloom
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight), 
      0.6, 
      0.4, 
      0.85
    );
    bloom.threshold = 0.1;
    bloom.strength = 0.8;
    bloom.radius = 0.8;
    composer.addPass(bloom);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 6;
    controls.dampingFactor = 0.05;

    // Load model
    const loader = new GLTFLoader();
    let model;
    
    if (modelUrl) {
      loader.load(
        modelUrl,
        (gltf) => {
          model = gltf.scene;
          
          // Configure materials and shadows
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.material.needsUpdate = true;
              
              // Enhance material properties
              if (child.material) {
                child.material.envMapIntensity = 0.5;
                child.material.needsUpdate = true;
              }
            }
          });
          
          // Center and scale
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3()).length();
          const scale = 1.2 / size;
          model.scale.setScalar(scale);
          
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);
          
          scene.add(model);
        },
        (xhr) => {
          // Progress hook if needed
          const progress = (xhr.loaded / xhr.total) * 100;
          console.log(`Loading progress: ${progress}%`);
        },
        (err) => {
          console.error("GLTF load error", err);
          // Show fallback content
          mount.innerHTML = `
            <div style="
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100%; 
              color: #666;
              flex-direction: column;
            ">
              <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
              <div>Failed to load 3D model</div>
              <div style="font-size: 0.9rem; opacity: 0.7; margin-top: 0.5rem;">
                Please try uploading again
              </div>
            </div>
          `;
        }
      );
    } else {
      // Show placeholder when no model
      mount.innerHTML = `
        <div style="
          display: flex; 
          align-items: center; 
          justify-content: center; 
          height: 100%; 
          color: #999;
          flex-direction: column;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
        ">
          <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">🎭</div>
          <div style="font-size: 1.2rem; font-weight: 500;">Your avatar will appear here</div>
          <div style="font-size: 0.9rem; opacity: 0.7; margin-top: 0.5rem;">
            Upload a photo to generate your 3D avatar
          </div>
        </div>
      `;
    }

    // Render loop
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const dt = clock.getDelta();
      controls.update();
      composer.render(dt);
    }
    animate();

    // Resize handler
    const handleResize = () => {
      const { clientWidth, clientHeight } = mount;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      composer.setSize(clientWidth, clientHeight);
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelUrl]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
