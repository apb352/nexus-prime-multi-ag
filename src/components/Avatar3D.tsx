import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface Avatar3DProps {
  avatarType: string;
  color: string;
  isActive: boolean;
  size?: number;
  mood?: string;
  isSpeaking?: boolean;
}

export function Avatar3D({ avatarType, color, isActive, size = 100, mood = 'neutral', isSpeaking = false }: Avatar3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    humanGroup: THREE.Group;
    facialFeatures: {
      leftEye: THREE.Group;
      rightEye: THREE.Group;
      mouth: THREE.Group;
      leftEyebrow: THREE.Mesh;
      rightEyebrow: THREE.Mesh;
    };
    bodyParts: {
      head: THREE.Mesh;
      leftArm: THREE.Group;
      rightArm: THREE.Group;
      torso: THREE.Mesh;
    };
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
    
    // Store references to facial features and body parts for animation
    const facialFeatures = {
      leftEye: new THREE.Group(),
      rightEye: new THREE.Group(),
      mouth: new THREE.Group(),
      leftEyebrow: null as THREE.Mesh | null,
      rightEyebrow: null as THREE.Mesh | null,
    };
    
    const bodyParts = {
      head: null as THREE.Mesh | null,
      leftArm: new THREE.Group(),
      rightArm: new THREE.Group(),
      torso: null as THREE.Mesh | null,
    };
    
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

      // Head (more oval shape with better proportions)
      const headGeometry = new THREE.SphereGeometry(0.35, 24, 18);
      headGeometry.scale(1, 1.15, 0.85); // More realistic head shape
      const head = new THREE.Mesh(headGeometry, skinMaterial);
      head.position.y = 1.4;
      head.castShadow = true;
      bodyParts.head = head;
      group.add(head);

      // Enhanced Eyes with more detail
      const createEye = (isLeft: boolean) => {
        const eyeGroup = new THREE.Group();
        
        // Eye socket (subtle indentation)
        const socketGeometry = new THREE.SphereGeometry(0.08, 12, 12);
        const socketMaterial = skinMaterial.clone();
        socketMaterial.color = socketMaterial.color.clone().multiplyScalar(0.9);
        const socket = new THREE.Mesh(socketGeometry, socketMaterial);
        socket.scale.z = 0.3;
        eyeGroup.add(socket);
        
        // Eye white
        const eyeWhiteGeometry = new THREE.SphereGeometry(0.07, 12, 12);
        const eyeWhiteMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xffffff,
          shininess: 100,
          specular: 0x222222
        });
        const eyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
        eyeWhite.scale.z = 0.6;
        eyeWhite.position.z = 0.02;
        eyeGroup.add(eyeWhite);
        
        // Iris (colored part)
        const irisColors = [0x8B4513, 0x4682B4, 0x228B22, 0x708090, 0x8A2BE2];
        const irisGeometry = new THREE.SphereGeometry(0.04, 12, 12);
        const irisMaterial = new THREE.MeshPhongMaterial({ 
          color: irisColors[Math.floor(Math.random() * irisColors.length)],
          shininess: 80
        });
        const iris = new THREE.Mesh(irisGeometry, irisMaterial);
        iris.position.z = 0.03;
        eyeGroup.add(iris);
        
        // Pupil
        const pupilGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const pupilMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        pupil.position.z = 0.035;
        eyeGroup.add(pupil);
        
        // Eye highlight
        const highlightGeometry = new THREE.SphereGeometry(0.008, 6, 6);
        const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlight.position.set(0.015, 0.015, 0.04);
        eyeGroup.add(highlight);
        
        // Eyelashes
        const lashMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
        for (let i = 0; i < 8; i++) {
          const lashGeometry = new THREE.CylinderGeometry(0.001, 0.001, 0.03, 3);
          const lash = new THREE.Mesh(lashGeometry, lashMaterial);
          const angle = (i / 7) * Math.PI - Math.PI / 2;
          lash.position.set(Math.cos(angle) * 0.06, Math.sin(angle) * 0.04, 0.04);
          lash.rotation.z = angle;
          eyeGroup.add(lash);
        }
        
        return eyeGroup;
      };
      
      // Position eyes
      const leftEye = createEye(true);
      leftEye.position.set(-0.12, 1.42, 0.28);
      facialFeatures.leftEye = leftEye;
      head.add(leftEye);
      
      const rightEye = createEye(false);
      rightEye.position.set(0.12, 1.42, 0.28);
      facialFeatures.rightEye = rightEye;
      head.add(rightEye);

      // Enhanced Eyebrows
      const createEyebrow = () => {
        const browGeometry = new THREE.BoxGeometry(0.12, 0.02, 0.04);
        const browMaterial = hairMaterial.clone();
        browMaterial.color = browMaterial.color.clone().multiplyScalar(0.8);
        return new THREE.Mesh(browGeometry, browMaterial);
      };
      
      const leftEyebrow = createEyebrow();
      leftEyebrow.position.set(-0.12, 1.5, 0.32);
      leftEyebrow.rotation.z = 0.1;
      facialFeatures.leftEyebrow = leftEyebrow;
      head.add(leftEyebrow);
      
      const rightEyebrow = createEyebrow();
      rightEyebrow.position.set(0.12, 1.5, 0.32);
      rightEyebrow.rotation.z = -0.1;
      facialFeatures.rightEyebrow = rightEyebrow;
      head.add(rightEyebrow);

      // Enhanced Nose with nostrils
      const noseGeometry = new THREE.SphereGeometry(0.035, 8, 8);
      const nose = new THREE.Mesh(noseGeometry, skinMaterial);
      nose.position.set(0, 1.35, 0.32);
      nose.scale.set(0.8, 1.3, 0.7);
      head.add(nose);
      
      // Nostrils
      const nostrilGeometry = new THREE.SphereGeometry(0.008, 6, 6);
      const nostrilMaterial = skinMaterial.clone();
      nostrilMaterial.color = nostrilMaterial.color.clone().multiplyScalar(0.7);
      
      const leftNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
      leftNostril.position.set(-0.015, 1.33, 0.35);
      head.add(leftNostril);
      
      const rightNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
      rightNostril.position.set(0.015, 1.33, 0.35);
      head.add(rightNostril);

      // Enhanced Mouth with expression capabilities
      const createMouth = () => {
        const mouthGroup = new THREE.Group();
        
        // Lip material
        const lipMaterial = new THREE.MeshPhongMaterial({ 
          color: skinTone.clone().offsetHSL(0, 0.3, -0.1),
          shininess: 40
        });
        
        // Upper lip
        const upperLipGeometry = new THREE.SphereGeometry(0.045, 12, 8);
        upperLipGeometry.scale(1.2, 0.4, 0.8);
        const upperLip = new THREE.Mesh(upperLipGeometry, lipMaterial);
        upperLip.position.y = 0.01;
        mouthGroup.add(upperLip);
        
        // Lower lip
        const lowerLipGeometry = new THREE.SphereGeometry(0.05, 12, 8);
        lowerLipGeometry.scale(1.1, 0.5, 0.7);
        const lowerLip = new THREE.Mesh(lowerLipGeometry, lipMaterial);
        lowerLip.position.y = -0.015;
        mouthGroup.add(lowerLip);
        
        // Mouth opening (for speaking animation)
        const mouthOpenGeometry = new THREE.SphereGeometry(0.02, 8, 6);
        const mouthOpenMaterial = new THREE.MeshPhongMaterial({ color: 0x2a1810 });
        const mouthOpen = new THREE.Mesh(mouthOpenGeometry, mouthOpenMaterial);
        mouthOpen.scale.set(1.5, 0.8, 0.5);
        mouthOpen.visible = false;
        mouthGroup.add(mouthOpen);
        
        return mouthGroup;
      };
      
      const mouth = createMouth();
      mouth.position.set(0, 1.28, 0.32);
      facialFeatures.mouth = mouth;
      head.add(mouth);

      // Cheeks for better face structure
      const cheekGeometry = new THREE.SphereGeometry(0.06, 12, 12);
      const cheekMaterial = skinMaterial.clone();
      cheekMaterial.color = cheekMaterial.color.clone().offsetHSL(0, 0.1, 0.05);
      
      const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
      leftCheek.position.set(-0.2, 1.32, 0.25);
      leftCheek.scale.set(1, 0.8, 0.6);
      head.add(leftCheek);
      
      const rightCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
      rightCheek.position.set(0.2, 1.32, 0.25);
      rightCheek.scale.set(1, 0.8, 0.6);
      head.add(rightCheek);

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

      // Neck with more definition
      const neckGeometry = new THREE.CylinderGeometry(0.12, 0.14, 0.2, 12);
      const neck = new THREE.Mesh(neckGeometry, skinMaterial);
      neck.position.y = 1.1;
      neck.castShadow = true;
      group.add(neck);
      
      // Adam's apple for male types
      if (type.includes('male') || type.includes('engineer')) {
        const adamsAppleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const adamsApple = new THREE.Mesh(adamsAppleGeometry, skinMaterial);
        adamsApple.position.set(0, 1.08, 0.11);
        adamsApple.scale.set(1, 1.5, 0.8);
        group.add(adamsApple);
      }

      // Enhanced Torso with better proportions
      const torsoGeometry = new THREE.BoxGeometry(0.45, 0.7, 0.25);
      const torso = new THREE.Mesh(torsoGeometry, shirtMaterial);
      torso.position.y = 0.65;
      torso.castShadow = true;
      bodyParts.torso = torso;
      group.add(torso);
      
      // Add shirt collar with more detail
      const collarGeometry = new THREE.BoxGeometry(0.46, 0.12, 0.26);
      const collar = new THREE.Mesh(collarGeometry, shirtMaterial);
      collar.position.y = 0.94;
      group.add(collar);
      
      // Shirt buttons
      const buttonMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        shininess: 80
      });
      
      for (let i = 0; i < 4; i++) {
        const buttonGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.005, 8);
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.set(0, 0.8 - (i * 0.15), 0.13);
        button.rotation.x = Math.PI / 2;
        group.add(button);
      }

      // Enhanced Arms with natural poses
      const createArm = (isLeft: boolean) => {
        const armGroup = new THREE.Group();
        
        const upperArmGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.35, 12);
        const forearmGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 12);
        
        const upperArm = new THREE.Mesh(upperArmGeometry, shirtMaterial);
        upperArm.position.y = 0;
        upperArm.castShadow = true;
        armGroup.add(upperArm);
        
        const forearm = new THREE.Mesh(forearmGeometry, skinMaterial);
        forearm.position.set(0, -0.32, 0);
        forearm.castShadow = true;
        armGroup.add(forearm);
        
        // Enhanced hand with fingers
        const handGroup = new THREE.Group();
        
        // Palm
        const palmGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.03);
        const palm = new THREE.Mesh(palmGeometry, skinMaterial);
        handGroup.add(palm);
        
        // Fingers
        for (let i = 0; i < 4; i++) {
          const fingerGeometry = new THREE.CylinderGeometry(0.008, 0.01, 0.06, 6);
          const finger = new THREE.Mesh(fingerGeometry, skinMaterial);
          finger.position.set(-0.025 + (i * 0.017), 0.08, 0);
          finger.rotation.x = Math.PI / 6;
          handGroup.add(finger);
        }
        
        // Thumb
        const thumbGeometry = new THREE.CylinderGeometry(0.01, 0.012, 0.05, 6);
        const thumb = new THREE.Mesh(thumbGeometry, skinMaterial);
        thumb.position.set(isLeft ? 0.04 : -0.04, 0.02, 0.02);
        thumb.rotation.z = isLeft ? -Math.PI / 3 : Math.PI / 3;
        handGroup.add(thumb);
        
        handGroup.position.set(0, -0.52, 0);
        armGroup.add(handGroup);
        
        return armGroup;
      };
      
      // Position arms naturally
      const leftArmGroup = createArm(true);
      leftArmGroup.position.set(-0.32, 0.75, 0);
      leftArmGroup.rotation.z = 0.2;
      leftArmGroup.rotation.x = -0.1;
      bodyParts.leftArm = leftArmGroup;
      group.add(leftArmGroup);
      
      const rightArmGroup = createArm(false);
      rightArmGroup.position.set(0.32, 0.75, 0);
      rightArmGroup.rotation.z = -0.2;
      rightArmGroup.rotation.x = -0.1;
      bodyParts.rightArm = rightArmGroup;
      group.add(rightArmGroup);

      // Enhanced Legs with better proportions
      const createLeg = () => {
        const legGroup = new THREE.Group();
        
        const thighGeometry = new THREE.CylinderGeometry(0.11, 0.13, 0.4, 12);
        const shinGeometry = new THREE.CylinderGeometry(0.09, 0.11, 0.35, 12);
        
        const thigh = new THREE.Mesh(thighGeometry, pantsMaterial);
        thigh.position.y = 0;
        thigh.castShadow = true;
        legGroup.add(thigh);
        
        const shin = new THREE.Mesh(shinGeometry, pantsMaterial);
        shin.position.y = -0.375;
        shin.castShadow = true;
        legGroup.add(shin);
        
        return legGroup;
      };
      
      const leftLeg = createLeg();
      leftLeg.position.set(-0.12, 0.1, 0);
      group.add(leftLeg);
      
      const rightLeg = createLeg();
      rightLeg.position.set(0.12, 0.1, 0);
      group.add(rightLeg);

      // Enhanced Shoes with more detail
      const createShoe = () => {
        const shoeGroup = new THREE.Group();
        const shoeMaterial = new THREE.MeshPhongMaterial({ 
          color: new THREE.Color().setHSL(0, 0, 0.2),
          shininess: 40
        });
        
        // Main shoe body
        const shoeGeometry = new THREE.BoxGeometry(0.18, 0.08, 0.25);
        const shoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        shoeGroup.add(shoe);
        
        // Shoe sole
        const soleGeometry = new THREE.BoxGeometry(0.19, 0.03, 0.26);
        const soleMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
        const sole = new THREE.Mesh(soleGeometry, soleMaterial);
        sole.position.y = -0.055;
        shoeGroup.add(sole);
        
        // Laces
        const laceMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        for (let i = 0; i < 3; i++) {
          const laceGeometry = new THREE.CylinderGeometry(0.002, 0.002, 0.08, 4);
          const lace = new THREE.Mesh(laceGeometry, laceMaterial);
          lace.position.set(0, 0.02, 0.05 - (i * 0.05));
          lace.rotation.z = Math.PI / 2;
          shoeGroup.add(lace);
        }
        
        return shoeGroup;
      };
      
      const leftShoe = createShoe();
      leftShoe.position.set(-0.12, -0.52, 0.05);
      leftShoe.castShadow = true;
      group.add(leftShoe);
      
      const rightShoe = createShoe();
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
        head.add(visor);
        
        // Tech details on clothing
        const detailGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.02);
        const detail1 = new THREE.Mesh(detailGeometry, accessoryMaterial);
        detail1.position.set(-0.15, 0.8, 0.13);
        group.add(detail1);
        
        const detail2 = new THREE.Mesh(detailGeometry, accessoryMaterial);
        detail2.position.set(0.15, 0.8, 0.13);
        group.add(detail2);
        
        // Neural interface for android types
        if (type.includes('android')) {
          const interfaceGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 6);
          const interface1 = new THREE.Mesh(interfaceGeometry, accessoryMaterial);
          interface1.position.set(-0.25, 1.45, 0.15);
          interface1.rotation.z = Math.PI / 2;
          head.add(interface1);
        }
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

    // Animation with facial expressions and body language
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      const time = Date.now();
      
      if (sceneRef.current) {
        const { facialFeatures, bodyParts } = sceneRef.current;
        
        // Apply facial expressions based on mood
        applyFacialExpression(facialFeatures, mood, time);
        
        // Apply speaking animation
        if (isSpeaking) {
          applySpeakingAnimation(facialFeatures, time);
        }
        
        // Apply body language based on mood and active state
        applyBodyLanguage(bodyParts, humanGroup, mood, isActive, time);
      }
      
      // Gentle rotation
      humanGroup.rotation.y += 0.008;
      
      // Breathing animation
      const breathe = Math.sin(time * 0.003) * 0.02;
      humanGroup.scale.y = 1 + breathe;
      
      if (isActive) {
        // More pronounced animation when active
        humanGroup.scale.setScalar(1 + Math.sin(time * 0.005) * 0.05);
        
        // Add subtle floating effect
        humanGroup.position.y = Math.sin(time * 0.002) * 0.1;
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

    // Facial expression functions with micro-expressions
    const applyFacialExpression = (features: typeof facialFeatures, currentMood: string, time: number) => {
      if (!features.leftEyebrow || !features.rightEyebrow) return;
      
      const baseRotation = 0.1;
      const expressionIntensity = 0.3;
      const microMovement = Math.sin(time * 0.001) * 0.02; // Subtle micro-movements
      
      // Apply eye tracking - subtle eye movements for life-like appearance
      const eyeMovement = {
        x: Math.sin(time * 0.0008) * 0.02,
        y: Math.cos(time * 0.0012) * 0.01
      };
      
      // Apply subtle blinking animation
      const blinkCycle = Math.sin(time * 0.002);
      const isBlinking = blinkCycle > 0.98; // Very brief blinks
      
      features.leftEye.scale.y = isBlinking ? 0.1 : 1;
      features.rightEye.scale.y = isBlinking ? 0.1 : 1;
      
      // Apply eye movement to both eyes
      features.leftEye.rotation.x = eyeMovement.y;
      features.leftEye.rotation.y = eyeMovement.x;
      features.rightEye.rotation.x = eyeMovement.y;
      features.rightEye.rotation.y = eyeMovement.x;
      
      switch (currentMood.toLowerCase()) {
        case 'happy':
        case 'excited':
          // Genuine happiness - Duchenne smile with eye crinkles
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 0.8;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 0.8;
          features.leftEyebrow.position.y = 1.51 + microMovement;
          features.rightEyebrow.position.y = 1.51 + microMovement;
          
          // Eyes slightly squinted (happy eyes - Duchenne marker)
          if (!isBlinking) {
            features.leftEye.scale.y = 0.75 + Math.sin(time * 0.003) * 0.1;
            features.rightEye.scale.y = 0.75 + Math.sin(time * 0.003) * 0.1;
          }
          
          // Mouth slightly upward with micro-smile variations
          features.mouth.rotation.z = 0.08 + Math.sin(time * 0.002) * 0.03;
          features.mouth.scale.x = 1.1 + microMovement;
          break;
          
        case 'curious':
        case 'interested':
          // Raised eyebrows, wide alert eyes
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 1.2;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 1.2;
          features.leftEyebrow.position.y = 1.52 + microMovement;
          features.rightEyebrow.position.y = 1.52 + microMovement;
          
          // Slightly wider eyes, more alert
          if (!isBlinking) {
            features.leftEye.scale.setScalar(1.1 + microMovement);
            features.rightEye.scale.setScalar(1.1 + microMovement);
          }
          
          // Slightly parted lips
          features.mouth.scale.y = 1.1;
          features.mouth.scale.x = 0.95;
          break;
          
        case 'focused':
        case 'analytical':
          // Slightly furrowed brow, concentrated look
          features.leftEyebrow.rotation.z = baseRotation - expressionIntensity * 0.7;
          features.rightEyebrow.rotation.z = -baseRotation + expressionIntensity * 0.7;
          features.leftEyebrow.position.y = 1.485 + microMovement * 0.5;
          features.rightEyebrow.position.y = 1.485 + microMovement * 0.5;
          
          // Slightly narrowed eyes
          if (!isBlinking) {
            features.leftEye.scale.y = 0.85;
            features.rightEye.scale.y = 0.85;
          }
          
          // Compressed lips
          features.mouth.scale.x = 0.85;
          features.mouth.scale.y = 0.9;
          break;
          
        case 'thoughtful':
        case 'contemplative':
          // Asymmetric expression - one eyebrow slightly raised
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 0.9;
          features.rightEyebrow.rotation.z = -baseRotation + expressionIntensity * 0.2;
          features.leftEyebrow.position.y = 1.505 + microMovement;
          features.rightEyebrow.position.y = 1.495 + microMovement * 0.5;
          
          // Eyes looking slightly up/away, contemplative gaze
          features.leftEye.rotation.x = -0.15 + Math.sin(time * 0.0005) * 0.05;
          features.rightEye.rotation.x = -0.15 + Math.sin(time * 0.0005) * 0.05;
          features.leftEye.rotation.y = 0.1;
          features.rightEye.rotation.y = 0.1;
          
          // Slightly pursed lips
          features.mouth.scale.x = 0.9;
          break;
          
        case 'confident':
        case 'determined':
          // Lowered, determined eyebrows
          features.leftEyebrow.rotation.z = baseRotation - expressionIntensity * 0.5;
          features.rightEyebrow.rotation.z = -baseRotation + expressionIntensity * 0.5;
          features.leftEyebrow.position.y = 1.485;
          features.rightEyebrow.position.y = 1.485;
          
          // Direct, unwavering gaze
          features.leftEye.rotation.set(0, 0, 0);
          features.rightEye.rotation.set(0, 0, 0);
          
          // Slight confident smile
          features.mouth.rotation.z = 0.03;
          features.mouth.scale.x = 1.05;
          break;
          
        case 'surprised':
        case 'amazed':
          // Very raised eyebrows
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 2.2;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 2.2;
          features.leftEyebrow.position.y = 1.54;
          features.rightEyebrow.position.y = 1.54;
          
          // Wide eyes
          if (!isBlinking) {
            features.leftEye.scale.setScalar(1.4);
            features.rightEye.scale.setScalar(1.4);
          }
          
          // Dropped jaw
          features.mouth.scale.y = 1.8;
          features.mouth.position.y = features.mouth.position.y - 0.02;
          break;
          
        case 'empathetic':
        case 'caring':
          // Soft, caring expression
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 0.4;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 0.4;
          features.leftEyebrow.position.y = 1.502;
          features.rightEyebrow.position.y = 1.502;
          
          // Soft, warm eyes
          if (!isBlinking) {
            features.leftEye.scale.y = 0.9;
            features.rightEye.scale.y = 0.9;
          }
          
          // Gentle smile
          features.mouth.rotation.z = 0.05;
          features.mouth.scale.x = 1.02;
          break;
          
        case 'creative':
        case 'artistic':
          // Inspired, dreamy expression
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 0.6;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 0.3;
          features.leftEyebrow.position.y = 1.508;
          features.rightEyebrow.position.y = 1.498;
          
          // Slightly unfocused, inspired gaze
          features.leftEye.rotation.x = -0.05 + Math.sin(time * 0.0008) * 0.08;
          features.rightEye.rotation.x = -0.05 + Math.sin(time * 0.0008) * 0.08;
          
          // Slightly parted lips, as if about to speak
          features.mouth.scale.y = 1.05;
          break;
          
        case 'skeptical':
        case 'doubtful':
          // One eyebrow raised higher (skeptical look)
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 1.5;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 0.2;
          features.leftEyebrow.position.y = 1.52;
          features.rightEyebrow.position.y = 1.49;
          
          // Slightly narrowed eyes
          if (!isBlinking) {
            features.leftEye.scale.y = 0.8;
            features.rightEye.scale.y = 0.8;
          }
          
          // Compressed, skeptical mouth
          features.mouth.scale.x = 0.8;
          features.mouth.rotation.z = -0.02;
          break;
          
        case 'playful':
        case 'mischievous':
          // Slightly raised eyebrows with playful asymmetry
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 0.8;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 1.2;
          features.leftEyebrow.position.y = 1.505;
          features.rightEyebrow.position.y = 1.51;
          
          // Bright, mischievous eyes
          if (!isBlinking) {
            features.leftEye.scale.setScalar(1.05);
            features.rightEye.scale.setScalar(1.05);
          }
          
          // Slight smirk
          features.mouth.rotation.z = 0.06 + Math.sin(time * 0.004) * 0.02;
          features.mouth.scale.x = 1.08;
          break;
          
        case 'serious':
        case 'stern':
          // Lowered, serious eyebrows
          features.leftEyebrow.rotation.z = baseRotation - expressionIntensity * 0.8;
          features.rightEyebrow.rotation.z = -baseRotation + expressionIntensity * 0.8;
          features.leftEyebrow.position.y = 1.48;
          features.rightEyebrow.position.y = 1.48;
          
          // Intense, focused gaze
          if (!isBlinking) {
            features.leftEye.scale.y = 0.85;
            features.rightEye.scale.y = 0.85;
          }
          
          // Firm, straight mouth
          features.mouth.scale.x = 0.9;
          features.mouth.rotation.z = 0;
          break;
          
        default: // neutral
          // Reset to default positions with subtle life-like movements
          features.leftEyebrow.rotation.z = baseRotation + microMovement * 0.5;
          features.rightEyebrow.rotation.z = -baseRotation - microMovement * 0.5;
          features.leftEyebrow.position.y = 1.5 + microMovement * 0.3;
          features.rightEyebrow.position.y = 1.5 + microMovement * 0.3;
          
          if (!isBlinking) {
            features.leftEye.scale.setScalar(1 + microMovement * 0.5);
            features.rightEye.scale.setScalar(1 + microMovement * 0.5);
          }
          
          features.mouth.rotation.z = microMovement * 0.3;
          features.mouth.scale.x = 1 + microMovement * 0.2;
          features.mouth.scale.y = 1;
          features.mouth.position.y = 0; // Reset position
      }
    };

    const applySpeakingAnimation = (features: typeof facialFeatures, time: number) => {
      // More realistic talking animation with multiple phoneme shapes
      const talkCycle = time * 0.012; // Faster for more natural speech rhythm
      
      // Create varied mouth shapes for different phonemes
      const phonemeA = Math.sin(talkCycle) * 0.5 + 0.5; // Open sounds (a, e, i, o, u)
      const phonemeB = Math.sin(talkCycle * 1.3 + 1) * 0.5 + 0.5; // Closed sounds (m, b, p)
      const phonemeC = Math.sin(talkCycle * 0.7 + 2) * 0.5 + 0.5; // Mid sounds (l, r, n)
      
      // Blend phonemes for natural variation
      const mouthOpen = (phonemeA * 0.5 + phonemeC * 0.3) * 0.8;
      const mouthWide = (phonemeB * 0.4 + phonemeA * 0.3) * 0.6;
      
      // Mouth opening and closing with realistic constraints
      features.mouth.scale.y = 1 + mouthOpen * 0.6;
      features.mouth.scale.x = 1 + mouthWide * 0.4;
      
      // Show teeth/mouth opening for larger mouth movements
      const mouthOpenMesh = features.mouth.children.find(child => 
        child instanceof THREE.Mesh && 
        child.material instanceof THREE.MeshPhongMaterial &&
        child.material.color?.r === 0x2a / 255
      );
      if (mouthOpenMesh) {
        mouthOpenMesh.visible = mouthOpen > 0.3;
        mouthOpenMesh.scale.setScalar(mouthOpen);
      }
      
      // Realistic head movement while speaking - subtle nods and tilts
      if (bodyParts.head) {
        bodyParts.head.rotation.x = Math.sin(time * 0.008) * 0.04; // Vertical nods
        bodyParts.head.rotation.y = Math.sin(time * 0.006) * 0.03; // Side tilts
        bodyParts.head.rotation.z = Math.sin(time * 0.005) * 0.015; // Slight head tilts
        
        // Slight head bob while speaking
        bodyParts.head.position.y = Math.sin(time * 0.01) * 0.01;
      }
      
      // Eye engagement - more alert and focused when speaking
      const alertness = 1.05;
      if (features.leftEye && features.rightEye) {
        features.leftEye.scale.x = alertness;
        features.rightEye.scale.x = alertness;
        
        // Occasional eye focus shifts
        const eyeFocus = Math.sin(time * 0.003) * 0.02;
        features.leftEye.rotation.y = eyeFocus;
        features.rightEye.rotation.y = eyeFocus;
      }
      
      // Subtle facial muscle tension while speaking
      if (features.leftEyebrow && features.rightEyebrow) {
        const speakingTension = Math.sin(time * 0.009) * 0.01;
        features.leftEyebrow.position.y += speakingTension;
        features.rightEyebrow.position.y += speakingTension;
      }
    };

    const applyBodyLanguage = (
      parts: typeof bodyParts, 
      group: THREE.Group, 
      currentMood: string, 
      active: boolean, 
      time: number
    ) => {
      const { leftArm, rightArm, torso } = parts;
      
      switch (currentMood.toLowerCase()) {
        case 'excited':
        case 'enthusiastic':
          // More animated arm movements, open posture
          if (leftArm && rightArm) {
            leftArm.rotation.z = 0.3 + Math.sin(time * 0.006) * 0.4;
            rightArm.rotation.z = -0.3 - Math.sin(time * 0.006) * 0.4;
            leftArm.rotation.x = -0.1 + Math.sin(time * 0.008) * 0.3;
            rightArm.rotation.x = -0.1 + Math.cos(time * 0.008) * 0.3;
            leftArm.position.x = -0.34; // Wider stance
            rightArm.position.x = 0.34;
          }
          
          // More upright, energetic posture
          if (torso) {
            torso.rotation.x = -0.08;
            torso.position.y = 0.68;
            torso.scale.y = 1.02; // Slightly expanded chest
          }
          
          // Slight bouncing movement
          group.position.y = Math.sin(time * 0.008) * 0.05;
          break;
          
        case 'confident':
        case 'determined':
          // Power pose - hands on hips or assertive stance
          if (leftArm && rightArm) {
            leftArm.rotation.z = 0.9;
            rightArm.rotation.z = -0.9;
            leftArm.rotation.x = 0.3;
            rightArm.rotation.x = 0.3;
            leftArm.rotation.y = 0.1;
            rightArm.rotation.y = -0.1;
          }
          
          // Chest out, shoulders back posture
          if (torso) {
            torso.rotation.x = -0.12;
            torso.scale.z = 1.08; // Broader chest
            torso.scale.y = 1.03;
            torso.position.y = 0.67;
          }
          
          // Stable, grounded stance
          group.position.y = 0;
          group.rotation.z = 0;
          break;
          
        case 'thoughtful':
        case 'contemplative':
          // Classic thinking pose - hand near chin
          if (rightArm) {
            rightArm.rotation.z = -1.4;
            rightArm.rotation.x = 0.6;
            rightArm.rotation.y = -0.2;
            rightArm.position.x = 0.25;
            rightArm.position.y = 0.8;
          }
          
          if (leftArm) {
            leftArm.rotation.z = 0.4;
            leftArm.rotation.x = 0.2;
          }
          
          // Slight forward lean, contemplative posture
          group.rotation.z = 0.03;
          if (torso) {
            torso.rotation.x = 0.05;
          }
          break;
          
        case 'focused':
        case 'analytical':
          // Arms crossed or hands clasped, concentrated posture
          if (leftArm && rightArm) {
            leftArm.rotation.z = 0.7;
            leftArm.rotation.x = 0.4;
            leftArm.rotation.y = 0.1;
            rightArm.rotation.z = -0.7;
            rightArm.rotation.x = 0.4;
            rightArm.rotation.y = -0.1;
            leftArm.position.x = -0.28;
            rightArm.position.x = 0.28;
          }
          
          // Straight, focused posture
          if (torso) {
            torso.rotation.x = 0;
            torso.position.y = 0.65;
          }
          
          // Minimal movement, very controlled
          group.position.y = Math.sin(time * 0.002) * 0.01;
          break;
          
        case 'surprised':
        case 'amazed':
          // Arms slightly raised, open posture
          if (leftArm && rightArm) {
            leftArm.rotation.z = 0.5;
            rightArm.rotation.z = -0.5;
            leftArm.rotation.x = -0.4;
            rightArm.rotation.x = -0.4;
            leftArm.position.x = -0.35;
            rightArm.position.x = 0.35;
          }
          
          // Slightly leaning back, surprised posture
          if (torso) {
            torso.rotation.x = -0.05;
            torso.position.y = 0.64;
          }
          
          // Slight backward lean
          group.rotation.x = -0.02;
          break;
          
        case 'empathetic':
        case 'caring':
          // Open, welcoming arm position
          if (leftArm && rightArm) {
            leftArm.rotation.z = 0.15;
            rightArm.rotation.z = -0.15;
            leftArm.rotation.x = -0.05;
            rightArm.rotation.x = -0.05;
            leftArm.position.x = -0.35;
            rightArm.position.x = 0.35;
          }
          
          // Slightly forward lean, approachable posture
          if (torso) {
            torso.rotation.x = 0.03;
            torso.position.y = 0.66;
          }
          
          // Gentle swaying
          group.rotation.z = Math.sin(time * 0.002) * 0.02;
          break;
          
        case 'creative':
        case 'artistic':
          // Expressive, dynamic arm positions
          if (leftArm && rightArm) {
            leftArm.rotation.z = 0.4 + Math.sin(time * 0.004) * 0.3;
            rightArm.rotation.z = -0.5 - Math.cos(time * 0.005) * 0.2;
            leftArm.rotation.x = 0.1 + Math.sin(time * 0.003) * 0.2;
            rightArm.rotation.x = -0.2 + Math.cos(time * 0.004) * 0.3;
          }
          
          // Dynamic, fluid torso movement
          if (torso) {
            torso.rotation.x = Math.sin(time * 0.003) * 0.05;
            torso.rotation.z = Math.cos(time * 0.004) * 0.03;
          }
          
          // Flowing, artistic movement
          group.rotation.z = Math.sin(time * 0.003) * 0.04;
          group.position.y = Math.sin(time * 0.005) * 0.03;
          break;
          
        case 'playful':
        case 'mischievous':
          // Animated, bouncy movements
          if (leftArm && rightArm) {
            leftArm.rotation.z = 0.3 + Math.sin(time * 0.007) * 0.2;
            rightArm.rotation.z = -0.3 - Math.sin(time * 0.009) * 0.2;
            leftArm.rotation.x = Math.sin(time * 0.008) * 0.2;
            rightArm.rotation.x = Math.cos(time * 0.007) * 0.2;
          }
          
          // Playful body movement
          if (torso) {
            torso.rotation.z = Math.sin(time * 0.006) * 0.03;
          }
          
          // Bouncy, energetic movement
          group.position.y = Math.abs(Math.sin(time * 0.008)) * 0.04;
          group.rotation.z = Math.sin(time * 0.005) * 0.03;
          break;
          
        case 'serious':
        case 'stern':
          // Rigid, formal posture
          if (leftArm && rightArm) {
            leftArm.rotation.z = 0.1;
            rightArm.rotation.z = -0.1;
            leftArm.rotation.x = 0;
            rightArm.rotation.x = 0;
            leftArm.position.x = -0.32;
            rightArm.position.x = 0.32;
          }
          
          // Straight, authoritative posture
          if (torso) {
            torso.rotation.x = -0.02;
            torso.position.y = 0.65;
            torso.scale.y = 1.01;
          }
          
          // Very minimal movement
          group.position.y = 0;
          group.rotation.z = 0;
          break;
          
        case 'curious':
        case 'interested':
          // Leaning forward, engaged posture
          if (leftArm && rightArm) {
            leftArm.rotation.z = 0.25;
            rightArm.rotation.z = -0.25;
            leftArm.rotation.x = 0.1;
            rightArm.rotation.x = 0.1;
          }
          
          // Forward lean, interested posture
          if (torso) {
            torso.rotation.x = 0.08;
            torso.position.y = 0.66;
          }
          
          // Slight forward lean
          group.rotation.x = 0.02;
          break;
          
        case 'skeptical':
        case 'doubtful':
          // Defensive posture
          if (leftArm && rightArm) {
            leftArm.rotation.z = 0.6;
            rightArm.rotation.z = -0.6;
            leftArm.rotation.x = 0.3;
            rightArm.rotation.x = 0.3;
            leftArm.position.x = -0.3;
            rightArm.position.x = 0.3;
          }
          
          // Slightly closed off posture
          if (torso) {
            torso.rotation.x = 0.02;
            torso.position.y = 0.64;
          }
          
          // Slight backward lean
          group.rotation.x = -0.01;
          break;
          
        default: // neutral and happy
          // Natural relaxed pose with subtle life-like movements
          if (leftArm && rightArm) {
            leftArm.rotation.z = 0.2 + Math.sin(time * 0.003) * 0.08;
            rightArm.rotation.z = -0.2 - Math.sin(time * 0.003) * 0.08;
            leftArm.rotation.x = -0.1 + Math.sin(time * 0.002) * 0.05;
            rightArm.rotation.x = -0.1 + Math.cos(time * 0.002) * 0.05;
            leftArm.position.x = -0.32;
            rightArm.position.x = 0.32;
            leftArm.position.y = 0.75;
            rightArm.position.y = 0.75;
          }
          
          if (torso) {
            torso.rotation.x = Math.sin(time * 0.001) * 0.01;
            torso.position.y = 0.65 + Math.sin(time * 0.002) * 0.005;
            torso.scale.z = 1;
            torso.scale.y = 1;
          }
          
          // Reset other transformations
          group.rotation.z = Math.sin(time * 0.002) * 0.01;
          group.rotation.x = 0;
      }
      
      // Enhanced active state animations
      if (active) {
        // More pronounced movements when active
        const activePulse = Math.sin(time * 0.005) * 0.03;
        group.scale.x = 1 + activePulse;
        group.scale.z = 1 + activePulse;
        
        // Enhanced swaying and micro-movements
        group.rotation.x += Math.sin(time * 0.004) * 0.015;
        
        // More visible breathing
        if (torso) {
          torso.scale.y += Math.sin(time * 0.006) * 0.02;
        }
        
        // Subtle head movement awareness
        if (bodyParts.head) {
          bodyParts.head.rotation.y += Math.sin(time * 0.003) * 0.02;
        }
      } else {
        // Subtle resting state
        group.scale.x = 1;
        group.scale.z = 1;
      }
    };

    animate();

    sceneRef.current = {
      scene,
      renderer,
      camera,
      humanGroup,
      facialFeatures,
      bodyParts,
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
  }, [avatarType, color, isActive, size, mood, isSpeaking]);

  return <div ref={mountRef} className="flex items-center justify-center" />;
}