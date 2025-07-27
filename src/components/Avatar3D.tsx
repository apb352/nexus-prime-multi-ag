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
    humanGroup: THREE.Group;
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Parse color from oklch or use default
    const baseColor = new THREE.Color(color.includes('oklch') ? '#4f46e5' : color);
    
    // Create human avatar group
    const humanGroup = new THREE.Group();
    
    // Create human-like avatar based on type
    const createHumanAvatar = (type: string) => {
      const group = new THREE.Group();
      
      // Common materials
      const skinMaterial = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color().setHSL(0.08, 0.3, 0.7),
        shininess: 30
      });
      
      const clothingMaterial = new THREE.MeshPhongMaterial({ 
        color: baseColor,
        shininess: 50
      });
      
      const hairMaterial = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color().setHSL(0.05, 0.6, 0.2),
        shininess: 80
      });

      // Head
      const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
      const head = new THREE.Mesh(headGeometry, skinMaterial);
      head.position.y = 1.2;
      head.castShadow = true;
      group.add(head);

      // Eyes
      const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.1, 1.25, 0.35);
      group.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.1, 1.25, 0.35);
      group.add(rightEye);

      // Hair based on avatar type
      let hairGeometry: THREE.BufferGeometry;
      switch (type) {
        case 'female-tech':
          hairGeometry = new THREE.SphereGeometry(0.45, 16, 16);
          break;
        case 'male-engineer':
          hairGeometry = new THREE.BoxGeometry(0.7, 0.3, 0.7);
          break;
        case 'android-fem':
          hairGeometry = new THREE.ConeGeometry(0.4, 0.6, 8);
          break;
        case 'cyber-male':
          hairGeometry = new THREE.CylinderGeometry(0.35, 0.4, 0.4, 8);
          break;
        case 'ai-researcher':
          hairGeometry = new THREE.SphereGeometry(0.42, 12, 12);
          break;
        case 'neural-net':
          hairGeometry = new THREE.OctahedronGeometry(0.35);
          break;
        default:
          hairGeometry = new THREE.SphereGeometry(0.42, 16, 16);
      }
      
      const hair = new THREE.Mesh(hairGeometry, hairMaterial);
      hair.position.y = 1.4;
      hair.castShadow = true;
      group.add(hair);

      // Body
      const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.8, 12);
      const body = new THREE.Mesh(bodyGeometry, clothingMaterial);
      body.position.y = 0.4;
      body.castShadow = true;
      group.add(body);

      // Arms
      const armGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.6, 8);
      
      const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
      leftArm.position.set(-0.4, 0.5, 0);
      leftArm.rotation.z = 0.3;
      leftArm.castShadow = true;
      group.add(leftArm);
      
      const rightArm = new THREE.Mesh(armGeometry, skinMaterial);
      rightArm.position.set(0.4, 0.5, 0);
      rightArm.rotation.z = -0.3;
      rightArm.castShadow = true;
      group.add(rightArm);

      // Legs
      const legGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.7, 8);
      
      const leftLeg = new THREE.Mesh(legGeometry, clothingMaterial);
      leftLeg.position.set(-0.15, -0.35, 0);
      leftLeg.castShadow = true;
      group.add(leftLeg);
      
      const rightLeg = new THREE.Mesh(legGeometry, clothingMaterial);
      rightLeg.position.set(0.15, -0.35, 0);
      rightLeg.castShadow = true;
      group.add(rightLeg);

      // Add tech accessories for certain types
      if (type.includes('tech') || type.includes('cyber') || type.includes('android')) {
        const accessoryMaterial = new THREE.MeshPhongMaterial({ 
          color: baseColor,
          emissive: baseColor.clone().multiplyScalar(0.2),
          shininess: 100
        });
        
        // Tech visor/glasses
        const visorGeometry = new THREE.BoxGeometry(0.3, 0.08, 0.02);
        const visor = new THREE.Mesh(visorGeometry, accessoryMaterial);
        visor.position.set(0, 1.25, 0.38);
        group.add(visor);
        
        // Shoulder pads
        const padGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.1);
        const leftPad = new THREE.Mesh(padGeometry, accessoryMaterial);
        leftPad.position.set(-0.35, 0.7, 0);
        group.add(leftPad);
        
        const rightPad = new THREE.Mesh(padGeometry, accessoryMaterial);
        rightPad.position.set(0.35, 0.7, 0);
        group.add(rightPad);
      }

      return group;
    };

    const avatar = createHumanAvatar(avatarType);
    humanGroup.add(avatar);
    scene.add(humanGroup);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Rim light for dramatic effect
    const rimLight = new THREE.DirectionalLight(baseColor, 0.5);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    // Position camera
    camera.position.set(0, 1, 3);
    camera.lookAt(0, 0.5, 0);

    // Animation
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      
      // Gentle rotation
      humanGroup.rotation.y += 0.008;
      
      // Breathing animation
      const breathe = Math.sin(Date.now() * 0.003) * 0.02;
      humanGroup.scale.y = 1 + breathe;
      
      if (isActive) {
        // More pronounced animation when active
        humanGroup.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.05);
        
        // Add subtle floating effect
        humanGroup.position.y = Math.sin(Date.now() * 0.002) * 0.1;
      } else {
        humanGroup.scale.x = 1;
        humanGroup.scale.z = 1;
        humanGroup.position.y = 0;
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
      humanGroup,
      animationId: 0
    };

    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        if (mountRef.current && sceneRef.current.renderer.domElement) {
          mountRef.current.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current.renderer.dispose();
        
        // Dispose all geometries and materials
        sceneRef.current.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, [avatarType, color, isActive, size]);

  return <div ref={mountRef} className="flex items-center justify-center" />;
}