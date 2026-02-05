import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import styled from 'styled-components';

const ViewerContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
`;

const ControlsInfo = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 0.8rem;
  z-index: 5;
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #ffebee;
  color: #c62828;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  border: 1px solid #ffcdd2;
`;

function Model({ url }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef();
  
  useEffect(() => {
    if (scene) {
      // Center the model
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      scene.position.sub(center);
      
      // Scale the model to fit in view
      const size = box.getSize(new THREE.Vector3()).length();
      const scale = 2 / size;
      scene.scale.setScalar(scale);
      
      // Add some basic materials if none exist
      scene.traverse((child) => {
        if (child.isMesh) {
          if (!child.material) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xcccccc,
              roughness: 0.7,
              metalness: 0.1
            });
          }
          
          // Ensure the mesh is visible
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene]);
  
  useFrame(() => {
    if (modelRef.current) {
      // Optional: Add subtle rotation animation
      // modelRef.current.rotation.y += 0.005;
    }
  });
  
  return <primitive ref={modelRef} object={scene} />;
}

function Scene({ modelUrl }) {
  const [error, setError] = React.useState(null);
  
  useEffect(() => {
    setError(null);
  }, [modelUrl]);
  
  if (error) {
    return (
      <ErrorMessage>
        <h3>Failed to load 3D model</h3>
        <p>There was an error loading your avatar. Please try generating a new one.</p>
        <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>
          Error: {error.message}
        </p>
      </ErrorMessage>
    );
  }
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />
      
      {/* Environment for realistic lighting */}
      <Environment preset="studio" />
      
      {/* Model */}
      <Suspense fallback={
        <Html center>
          <LoadingOverlay>
            <LoadingSpinner />
          </LoadingOverlay>
        </Html>
      }>
        <Model url={modelUrl} />
      </Suspense>
      
      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={10}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
      
      {/* Ground plane for shadows */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#f0f0f0" transparent opacity={0.1} />
      </mesh>
      
      {/* Controls info */}
      <Html>
        <ControlsInfo>
          <div>🖱️ Left click + drag: Rotate</div>
          <div>🖱️ Right click + drag: Pan</div>
          <div>🖱️ Scroll: Zoom</div>
        </ControlsInfo>
      </Html>
    </>
  );
}

function Viewer({ modelUrl }) {
  const canvasRef = useRef();
  
  useEffect(() => {
    // Preload the model
    if (modelUrl) {
      const loader = new THREE.GLTFLoader();
      loader.load(
        modelUrl,
        () => console.log('Model preloaded successfully'),
        (error) => console.error('Model preload failed:', error)
      );
    }
  }, [modelUrl]);
  
  if (!modelUrl) {
    return (
      <ViewerContainer>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#999',
          fontSize: '1.1rem'
        }}>
          No model to display
        </div>
      </ViewerContainer>
    );
  }
  
  return (
    <ViewerContainer>
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0, 3], fov: 50 }}
        shadows
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <Scene modelUrl={modelUrl} />
      </Canvas>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </ViewerContainer>
  );
}

export default Viewer;

