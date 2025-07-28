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
    
    // Create stylized human avatar based on type
    const createHumanAvatar = (type: string) => {
      const group = new THREE.Group();
      
      // Define skin tones
      const skinTones = [
        new THREE.Color().setHSL(0.08, 0.4, 0.75), // Light
        new THREE.Color().setHSL(0.07, 0.5, 0.65), // Medium light
        new THREE.Color().setHSL(0.06, 0.6, 0.55), // Medium
        new THREE.Color().setHSL(0.05, 0.7, 0.45), // Medium dark
        new THREE.Color().setHSL(0.04, 0.6, 0.35), // Dark
      ];
      
      const skinTone = skinTones[Math.floor(Math.random() * skinTones.length)];
      
      // Materials with better lighting
      const skinMaterial = new THREE.MeshPhongMaterial({ 
        color: skinTone,
        shininess: 20,
        specular: 0x111111
      });
      
      // Varied clothing colors
      const clothingColors = [
        baseColor,
        baseColor.clone().offsetHSL(0.1, 0, 0),
        baseColor.clone().offsetHSL(-0.1, 0, 0),
        new THREE.Color().setHSL(0.6, 0.7, 0.4), // Purple
        new THREE.Color().setHSL(0.8, 0.6, 0.5), // Blue
        new THREE.Color().setHSL(0.3, 0.6, 0.3), // Green
      ];
      
      const mainClothingColor = clothingColors[Math.floor(Math.random() * clothingColors.length)];
      const secondaryClothingColor = clothingColors[Math.floor(Math.random() * clothingColors.length)];
      
      const shirtMaterial = new THREE.MeshPhongMaterial({ 
        color: mainClothingColor,
        shininess: 30
      });
      
      const pantsMaterial = new THREE.MeshPhongMaterial({ 
        color: secondaryClothingColor.clone().multiplyScalar(0.8),
        shininess: 25
      });
      
      const hairColors = [
        new THREE.Color().setHSL(0.05, 0.8, 0.15), // Dark brown
        new THREE.Color().setHSL(0.06, 0.6, 0.25), // Brown
        new THREE.Color().setHSL(0.08, 0.4, 0.35), // Light brown
        new THREE.Color().setHSL(0.1, 0.3, 0.45), // Blonde
        new THREE.Color().setHSL(0, 0, 0.1), // Black
        new THREE.Color().setHSL(0, 0, 0.4), // Gray
      ];
      
      const hairMaterial = new THREE.MeshPhongMaterial({ 
        color: hairColors[Math.floor(Math.random() * hairColors.length)],
        shininess: 60
      });

      // Head (more oval shape)
      const headGeometry = new THREE.SphereGeometry(0.35, 16, 12);
      headGeometry.scale(1, 1.1, 0.9); // Make more oval
      const head = new THREE.Mesh(headGeometry, skinMaterial);
      head.position.y = 1.4;
      head.castShadow = true;
      group.add(head);

      // Eyes (more realistic)
      const eyeWhiteGeometry = new THREE.SphereGeometry(0.06, 8, 8);
      const eyeWhiteMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
      
      const leftEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
      leftEyeWhite.position.set(-0.12, 1.42, 0.3);
      leftEyeWhite.scale.z = 0.5;
      group.add(leftEyeWhite);
      
      const rightEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
      rightEyeWhite.position.set(0.12, 1.42, 0.3);
      rightEyeWhite.scale.z = 0.5;
      group.add(rightEyeWhite);
      
      // Pupils
      const pupilGeometry = new THREE.SphereGeometry(0.035, 8, 8);
      const pupilMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
      
      const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      leftPupil.position.set(-0.12, 1.42, 0.33);
      group.add(leftPupil);
      
      const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      rightPupil.position.set(0.12, 1.42, 0.33);
      group.add(rightPupil);

      // Nose
      const noseGeometry = new THREE.SphereGeometry(0.03, 6, 6);
      const nose = new THREE.Mesh(noseGeometry, skinMaterial);
      nose.position.set(0, 1.35, 0.32);
      nose.scale.set(0.8, 1.2, 0.6);
      group.add(nose);

      // Hair - more stylized based on type
      let hairGeometry: THREE.BufferGeometry;
      let hairScale = [1, 1, 1];
      let hairPosition = [0, 1.6, 0];
      
      switch (type) {
        case 'female-tech':
          hairGeometry = new THREE.SphereGeometry(0.4, 16, 12);
          hairScale = [1.1, 0.9, 1.1];
          hairPosition = [0, 1.55, -0.05];
          break;
        case 'male-engineer':
          hairGeometry = new THREE.BoxGeometry(0.6, 0.25, 0.6);
          hairPosition = [0, 1.65, 0];
          break;
        case 'android-fem':
          hairGeometry = new THREE.SphereGeometry(0.38, 12, 10);
          hairScale = [1, 1.2, 1];
          hairPosition = [0, 1.6, 0];
          break;
        case 'cyber-male':
          hairGeometry = new THREE.CylinderGeometry(0.32, 0.35, 0.35, 8);
          hairPosition = [0, 1.65, 0];
          break;
        case 'ai-researcher':
          hairGeometry = new THREE.SphereGeometry(0.38, 12, 10);
          hairScale = [1.05, 0.95, 1.05];
          hairPosition = [0, 1.58, 0];
          break;
        case 'neural-net':
          hairGeometry = new THREE.SphereGeometry(0.36, 8, 8);
          hairScale = [1, 1.1, 1];
          hairPosition = [0, 1.6, 0];
          break;
        default:
          hairGeometry = new THREE.SphereGeometry(0.38, 16, 12);
          hairPosition = [0, 1.58, 0];
      }
      
      const hair = new THREE.Mesh(hairGeometry, hairMaterial);
      hair.position.set(...hairPosition);
      hair.scale.set(...hairScale);
      hair.castShadow = true;
      group.add(hair);

      // Neck
      const neckGeometry = new THREE.CylinderGeometry(0.12, 0.14, 0.2, 8);
      const neck = new THREE.Mesh(neckGeometry, skinMaterial);
      neck.position.y = 1.1;
      neck.castShadow = true;
      group.add(neck);

      // Torso (shirt/jacket)
      const torsoGeometry = new THREE.BoxGeometry(0.45, 0.7, 0.25);
      const torso = new THREE.Mesh(torsoGeometry, shirtMaterial);
      torso.position.y = 0.65;
      torso.castShadow = true;
      group.add(torso);
      
      // Add shirt collar
      const collarGeometry = new THREE.BoxGeometry(0.46, 0.12, 0.26);
      const collar = new THREE.Mesh(collarGeometry, shirtMaterial);
      collar.position.y = 0.94;
      group.add(collar);

      // Arms (more realistic proportions)
      const upperArmGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.35, 8);
      const forearmGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 8);
      
      // Left arm
      const leftUpperArm = new THREE.Mesh(upperArmGeometry, shirtMaterial);
      leftUpperArm.position.set(-0.32, 0.75, 0);
      leftUpperArm.rotation.z = 0.2;
      leftUpperArm.castShadow = true;
      group.add(leftUpperArm);
      
      const leftForearm = new THREE.Mesh(forearmGeometry, skinMaterial);
      leftForearm.position.set(-0.45, 0.45, 0);
      leftForearm.rotation.z = 0.3;
      leftForearm.castShadow = true;
      group.add(leftForearm);
      
      // Right arm
      const rightUpperArm = new THREE.Mesh(upperArmGeometry, shirtMaterial);
      rightUpperArm.position.set(0.32, 0.75, 0);
      rightUpperArm.rotation.z = -0.2;
      rightUpperArm.castShadow = true;
      group.add(rightUpperArm);
      
      const rightForearm = new THREE.Mesh(forearmGeometry, skinMaterial);
      rightForearm.position.set(0.45, 0.45, 0);
      rightForearm.rotation.z = -0.3;
      rightForearm.castShadow = true;
      group.add(rightForearm);

      // Hands
      const handGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      
      const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
      leftHand.position.set(-0.52, 0.28, 0);
      leftHand.scale.set(1.2, 1, 0.8);
      group.add(leftHand);
      
      const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
      rightHand.position.set(0.52, 0.28, 0);
      rightHand.scale.set(1.2, 1, 0.8);
      group.add(rightHand);

      // Legs (pants)
      const thighGeometry = new THREE.CylinderGeometry(0.11, 0.13, 0.4, 8);
      const shinGeometry = new THREE.CylinderGeometry(0.09, 0.11, 0.35, 8);
      
      // Left leg
      const leftThigh = new THREE.Mesh(thighGeometry, pantsMaterial);
      leftThigh.position.set(-0.12, 0.1, 0);
      leftThigh.castShadow = true;
      group.add(leftThigh);
      
      const leftShin = new THREE.Mesh(shinGeometry, pantsMaterial);
      leftShin.position.set(-0.12, -0.275, 0);
      leftShin.castShadow = true;
      group.add(leftShin);
      
      // Right leg
      const rightThigh = new THREE.Mesh(thighGeometry, pantsMaterial);
      rightThigh.position.set(0.12, 0.1, 0);
      rightThigh.castShadow = true;
      group.add(rightThigh);
      
      const rightShin = new THREE.Mesh(shinGeometry, pantsMaterial);
      rightShin.position.set(0.12, -0.275, 0);
      rightShin.castShadow = true;
      group.add(rightShin);

      // Shoes
      const shoeGeometry = new THREE.BoxGeometry(0.18, 0.08, 0.25);
      const shoeMaterial = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color().setHSL(0, 0, 0.2),
        shininess: 40
      });
      
      const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
      leftShoe.position.set(-0.12, -0.52, 0.05);
      leftShoe.castShadow = true;
      group.add(leftShoe);
      
      const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
      rightShoe.position.set(0.12, -0.52, 0.05);
      rightShoe.castShadow = true;
      group.add(rightShoe);

      // Add tech accessories for certain types
      if (type.includes('tech') || type.includes('cyber') || type.includes('android')) {
        const accessoryMaterial = new THREE.MeshPhongMaterial({ 
          color: baseColor.clone().multiplyScalar(0.8),
          emissive: baseColor.clone().multiplyScalar(0.1),
          shininess: 80
        });
        
        // Tech glasses/visor
        const visorGeometry = new THREE.BoxGeometry(0.25, 0.06, 0.02);
        const visor = new THREE.Mesh(visorGeometry, accessoryMaterial);
        visor.position.set(0, 1.42, 0.35);
        group.add(visor);
        
        // Tech details on clothing
        const detailGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.02);
        const detail1 = new THREE.Mesh(detailGeometry, accessoryMaterial);
        detail1.position.set(-0.15, 0.8, 0.13);
        group.add(detail1);
        
        const detail2 = new THREE.Mesh(detailGeometry, accessoryMaterial);
        detail2.position.set(0.15, 0.8, 0.13);
        group.add(detail2);
      }

      return group;
    };

    const avatar = createHumanAvatar(avatarType);
    humanGroup.add(avatar);
    scene.add(humanGroup);

    // Enhanced lighting setup for better character visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(3, 4, 2);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 10;
    directionalLight.shadow.camera.left = -3;
    directionalLight.shadow.camera.right = 3;
    directionalLight.shadow.camera.top = 3;
    directionalLight.shadow.camera.bottom = -3;
    scene.add(directionalLight);

    // Fill light from the opposite side
    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.4);
    fillLight.position.set(-2, 2, 2);
    scene.add(fillLight);

    // Rim light for dramatic effect
    const rimLight = new THREE.DirectionalLight(baseColor, 0.6);
    rimLight.position.set(-2, 3, -2);
    scene.add(rimLight);

    // Position camera to better show the character
    camera.position.set(0.5, 1.2, 2.5);
    camera.lookAt(0, 0.7, 0);

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