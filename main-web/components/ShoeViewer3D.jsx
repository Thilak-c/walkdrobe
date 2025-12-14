"use client";
import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows, OrbitControls } from "@react-three/drei";

// 3D Shoe Model Component
function ShoeModel({ url }) {
  const { scene } = useGLTF(url);

  return (
    <primitive 
      object={scene} 
      scale={2}
      position={[0, -0.5, 0]}
    />
  );
}

// Loading placeholder - subtle ring spinner
function LoadingPlaceholder() {
  const meshRef = useRef();
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.03;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <torusGeometry args={[0.5, 0.08, 16, 32]} />
      <meshStandardMaterial color="#d1d5db" transparent opacity={0.6} />
    </mesh>
  );
}

// Main 3D Viewer Component
export default function ShoeViewer3D({ modelPath = "/3d/shoe.glb", className = "" }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 1, 5], fov: 45 }}
        style={{ background: "transparent" }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.7} />
        <spotLight 
          position={[10, 10, 10]} 
          angle={0.15} 
          penumbra={1} 
          intensity={1.2}
          castShadow
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />

        {/* Environment for reflections */}
        <Environment preset="city" />

        {/* 3D Model */}
        <Suspense fallback={<LoadingPlaceholder />}>
          <ShoeModel url={modelPath} />
        </Suspense>

        {/* Orbit Controls - drag to rotate */}
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={2}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />

        {/* Shadow */}
        <ContactShadows 
          position={[0, -1, 0]} 
          opacity={0.5} 
          scale={10} 
          blur={2} 
          far={4}
        />
      </Canvas>
    </div>
  );
}

// Preload the models
useGLTF.preload("/3d/shoe.glb");
