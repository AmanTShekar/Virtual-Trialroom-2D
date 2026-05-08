import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function FullHumanModel() {
  const { scene, animations } = useGLTF('/HumanFull.glb');
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    // Play the default animation
    if (actions) {
      const action = Object.values(actions)[0];
      if (action) action.play();
    }

    // Enhance materials with vibrant colors and realism
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Target specific clothing parts if names exist, or just add a vibrant touch
        const name = child.name.toLowerCase();
        if (name.includes('hair')) {
          child.material = new THREE.MeshStandardMaterial({ color: '#4a3728', roughness: 0.8 }); // Real hair color
        } else if (name.includes('top') || name.includes('shirt')) {
          child.material = new THREE.MeshStandardMaterial({ color: '#43A1D5', roughness: 0.5 }); // Argentina Blue Shirt
        } else if (name.includes('skin')) {
          child.material.roughness = 0.4; // Real skin sheen
        }
      }
    });
  }, [scene, actions]);

  return (
    <primitive 
      object={scene} 
      scale={3.5} 
      position={[0, -3.2, 0]} 
    />
  );
}

export default function Brutalist3DModel() {
  return (
    <div className="w-full h-full relative cursor-move touch-none bg-[#050505]">
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 40 }}>
        {/* Cinematic Lighting Setup */}
        <ambientLight intensity={0.7} />
        <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -5, -10]} intensity={1.5} color="#43A1D5" />
        <directionalLight position={[0, 5, 5]} intensity={1} />

        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          autoRotate={true} 
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
          makeDefault
        />

        <ContactShadows 
          opacity={0.4} 
          scale={10} 
          blur={2} 
          far={4.5} 
          resolution={256} 
          color="#000000" 
        />
        
        <React.Suspense fallback={null}>
          <FullHumanModel />
        </React.Suspense>
      </Canvas>
      
      {/* Bells and Whistles HUD */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-white text-black px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-tighter">
          3D_RENDER: ACTIVE
        </div>
        <div className="bg-black/50 text-white/50 px-2 py-0.5 text-[7px] font-mono border border-neutral-800">
          LOD: ULTRA / SHADERS: PBR
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 text-[8px] font-mono text-neutral-600 uppercase tracking-widest">
        Full Spatial Mesh V1.0
      </div>
    </div>
  );
}
