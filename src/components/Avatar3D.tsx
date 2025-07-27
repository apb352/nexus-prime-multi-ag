import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface Avatar3DProps {
  avatarType: string;
  color: string;
  isActive: boolean;
  size?: number;
}

export function Avatar3D({ avatarType, color, isActive, size = 100 }: Avatar3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    mesh: THREE.Mesh;
    animationId: number;
  }>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create geometry based on avatar type
    let geometry: THREE.BufferGeometry;
    
    switch (avatarType) {
      case 'female-tech':
        geometry = new THREE.SphereGeometry(1, 32, 32);
        break;
      case 'abstract-swirl':
        geometry = new THREE.TorusGeometry(0.8, 0.4, 16, 100);
        break;
      case 'geometric-core':
        geometry = new THREE.OctahedronGeometry(1);
        break;
      case 'flowing-energy':
        geometry = new THREE.ConeGeometry(0.8, 2, 8);
        break;
      case 'particle-field':
        geometry = new THREE.IcosahedronGeometry(1);
        break;
      case 'crystal-structure':
        geometry = new THREE.DodecahedronGeometry(1);
        break;
      default:
        geometry = new THREE.SphereGeometry(1, 32, 32);
    }

    // Parse color from oklch
    const tempColor = new THREE.Color(color.includes('oklch') ? '#4f46e5' : color);
    
    const material = new THREE.MeshPhongMaterial({
      color: tempColor,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    camera.position.z = 3;

    // Animation
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.02;
      
      if (isActive) {
        mesh.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.1);
      } else {
        mesh.scale.setScalar(1);
      }
      
      renderer.render(scene, camera);
      
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId;
      }
    };

    animate();

    sceneRef.current = {
      scene,
      renderer,
      camera,
      mesh,
      animationId: 0
    };

    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        if (mountRef.current && sceneRef.current.renderer.domElement) {
          mountRef.current.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current.renderer.dispose();
        geometry.dispose();
        material.dispose();
      }
    };
  }, [avatarType, color, isActive, size]);

  return <div ref={mountRef} className="flex items-center justify-center" />;
}