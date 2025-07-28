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
      
      // Define hair material early to avoid initialization order issues
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

      // Head (more oval shape with better proportions)
      const headGeometry = new THREE.SphereGeometry(0.35, 24, 18);
      headGeometry.scale(1, 1.15, 0.85); // More realistic head shape
      const head = new THREE.Mesh(headGeometry, skinMaterial);
      head.position.y = 1.4;
      head.castShadow = true;
      // Enhanced facial structure with wrinkles and expression lines
      const addFacialDetails = (head: THREE.Mesh) => {
        // Nasolabial folds (smile lines)
        const nasolabialMaterial = skinMaterial.clone();
        nasolabialMaterial.color = nasolabialMaterial.color.clone().multiplyScalar(0.92);
        
        const leftNasolabialGeometry = new THREE.CylinderGeometry(0.002, 0.003, 0.08, 6);
        const leftNasolabial = new THREE.Mesh(leftNasolabialGeometry, nasolabialMaterial);
        leftNasolabial.position.set(-0.08, 1.32, 0.31);
        leftNasolabial.rotation.z = 0.5;
        leftNasolabial.rotation.x = 0.2;
        head.add(leftNasolabial);
        
        const rightNasolabialGeometry = new THREE.CylinderGeometry(0.002, 0.003, 0.08, 6);
        const rightNasolabial = new THREE.Mesh(rightNasolabialGeometry, nasolabialMaterial);
        rightNasolabial.position.set(0.08, 1.32, 0.31);
        rightNasolabial.rotation.z = -0.5;
        rightNasolabial.rotation.x = 0.2;
        head.add(rightNasolabial);
        
        // Crow's feet (eye wrinkles)
        for (let i = 0; i < 3; i++) {
          const crowsFootGeometry = new THREE.CylinderGeometry(0.001, 0.001, 0.025, 4);
          
          // Left eye crow's feet
          const leftCrowsFoot = new THREE.Mesh(crowsFootGeometry, nasolabialMaterial);
          leftCrowsFoot.position.set(-0.18 - i * 0.01, 1.43 + i * 0.02, 0.25);
          leftCrowsFoot.rotation.z = 0.8 + i * 0.2;
          leftCrowsFoot.userData.isCrowsFoot = true;
          leftCrowsFoot.userData.isLeft = true;
          head.add(leftCrowsFoot);
          
          // Right eye crow's feet
          const rightCrowsFoot = new THREE.Mesh(crowsFootGeometry, nasolabialMaterial);
          rightCrowsFoot.position.set(0.18 + i * 0.01, 1.43 + i * 0.02, 0.25);
          rightCrowsFoot.rotation.z = -0.8 - i * 0.2;
          rightCrowsFoot.userData.isCrowsFoot = true;
          rightCrowsFoot.userData.isLeft = false;
          head.add(rightCrowsFoot);
        }
        
        // Forehead wrinkles
        for (let i = 0; i < 2; i++) {
          const foreheadWrinkleGeometry = new THREE.CylinderGeometry(0.001, 0.001, 0.12, 6);
          const foreheadWrinkle = new THREE.Mesh(foreheadWrinkleGeometry, nasolabialMaterial);
          foreheadWrinkle.position.set(0, 1.55 + i * 0.04, 0.28);
          foreheadWrinkle.rotation.z = Math.PI / 2;
          foreheadWrinkle.userData.isForeheadWrinkle = true;
          head.add(foreheadWrinkle);
        }
        
        // Marionette lines (mouth to chin)
        const leftMarionetteGeometry = new THREE.CylinderGeometry(0.0015, 0.002, 0.06, 6);
        const leftMarionette = new THREE.Mesh(leftMarionetteGeometry, nasolabialMaterial);
        leftMarionette.position.set(-0.05, 1.22, 0.31);
        leftMarionette.rotation.z = 0.3;
        leftMarionette.userData.isMarionetteLines = true;
        head.add(leftMarionette);
        
        const rightMarionetteGeometry = new THREE.CylinderGeometry(0.0015, 0.002, 0.06, 6);
        const rightMarionette = new THREE.Mesh(rightMarionetteGeometry, nasolabialMaterial);
        rightMarionette.position.set(0.05, 1.22, 0.31);
        rightMarionette.rotation.z = -0.3;
        rightMarionette.userData.isMarionetteLines = true;
        head.add(rightMarionette);
        
        // Glabella lines (between eyebrows)
        const glabellaGeometry = new THREE.CylinderGeometry(0.001, 0.001, 0.03, 4);
        const glabella = new THREE.Mesh(glabellaGeometry, nasolabialMaterial);
        glabella.position.set(0, 1.48, 0.32);
        glabella.rotation.x = Math.PI / 2;
        glabella.userData.isGlabellaLines = true;
        head.add(glabella);
      };
      
      addFacialDetails(head);
      
      bodyParts.head = head;
      group.add(head);

      // Enhanced Eyes with more detail and realistic features
      const createEye = (isLeft: boolean) => {
        const eyeGroup = new THREE.Group();
        
        // Eye socket (subtle indentation with more definition)
        const socketGeometry = new THREE.SphereGeometry(0.09, 16, 16);
        const socketMaterial = skinMaterial.clone();
        socketMaterial.color = socketMaterial.color.clone().multiplyScalar(0.88);
        const socket = new THREE.Mesh(socketGeometry, socketMaterial);
        socket.scale.set(1, 0.8, 0.25);
        eyeGroup.add(socket);
        
        // Upper eyelid crease for depth
        const creaseGeometry = new THREE.TorusGeometry(0.065, 0.004, 6, 12, Math.PI);
        const crease = new THREE.Mesh(creaseGeometry, socketMaterial);
        crease.position.set(0, 0.02, 0.01);
        crease.rotation.x = -Math.PI / 6;
        eyeGroup.add(crease);
        
        // Eye white with more realistic shape
        const eyeWhiteGeometry = new THREE.SphereGeometry(0.07, 16, 16);
        const eyeWhiteMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xfefefe,
          shininess: 120,
          specular: 0x333333,
          transparent: true,
          opacity: 0.95
        });
        const eyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
        eyeWhite.scale.set(1.1, 1, 0.6);
        eyeWhite.position.z = 0.02;
        eyeGroup.add(eyeWhite);
        
        // Iris with more realistic colors and depth
        const irisColors = [
          0x8B4513, // Brown
          0x4682B4, // Blue  
          0x228B22, // Green
          0x708090, // Gray
          0x654321, // Dark brown
          0x2F4F4F, // Dark slate gray
          0x006400, // Dark green
          0x191970  // Midnight blue
        ];
        const irisColor = irisColors[Math.floor(Math.random() * irisColors.length)];
        
        // Iris base
        const irisGeometry = new THREE.SphereGeometry(0.042, 16, 16);
        const irisMaterial = new THREE.MeshPhongMaterial({ 
          color: irisColor,
          shininess: 90,
          specular: 0x222222,
          transparent: true,
          opacity: 0.9
        });
        const iris = new THREE.Mesh(irisGeometry, irisMaterial);
        iris.position.z = 0.03;
        iris.scale.z = 0.8;
        eyeGroup.add(iris);
        
        // Iris texture/pattern simulation
        const irisPattern = new THREE.RingGeometry(0.02, 0.04, 12);
        const irisPatternMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(irisColor).multiplyScalar(0.7),
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide
        });
        const irisPatternMesh = new THREE.Mesh(irisPattern, irisPatternMaterial);
        irisPatternMesh.position.z = 0.031;
        eyeGroup.add(irisPatternMesh);
        
        // Pupil with dynamic sizing capability
        const pupilGeometry = new THREE.SphereGeometry(0.022, 12, 12);
        const pupilMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x000000,
          shininess: 200
        });
        const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        pupil.position.z = 0.035;
        pupil.scale.z = 0.9;
        pupil.userData.isEyePupil = true; // Mark for animation
        eyeGroup.add(pupil);
        
        // Multiple eye highlights for more life-like appearance
        const highlight1Geometry = new THREE.SphereGeometry(0.01, 8, 8);
        const highlightMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xffffff,
          transparent: true,
          opacity: 0.9
        });
        const highlight1 = new THREE.Mesh(highlight1Geometry, highlightMaterial);
        highlight1.position.set(0.018, 0.018, 0.042);
        eyeGroup.add(highlight1);
        
        // Secondary smaller highlight
        const highlight2Geometry = new THREE.SphereGeometry(0.005, 6, 6);
        const highlight2 = new THREE.Mesh(highlight2Geometry, highlightMaterial);
        highlight2.position.set(-0.012, -0.008, 0.041);
        eyeGroup.add(highlight2);
        
        // Upper eyelid
        const upperLidGeometry = new THREE.SphereGeometry(0.075, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const upperLidMaterial = skinMaterial.clone();
        upperLidMaterial.color = upperLidMaterial.color.clone().multiplyScalar(0.95);
        const upperLid = new THREE.Mesh(upperLidGeometry, upperLidMaterial);
        upperLid.position.set(0, 0.015, 0.025);
        upperLid.scale.set(1.1, 0.8, 0.7);
        upperLid.userData.isUpperEyelid = true; // Mark for blinking animation
        eyeGroup.add(upperLid);
        
        // Lower eyelid
        const lowerLidGeometry = new THREE.SphereGeometry(0.07, 12, 6, 0, Math.PI * 2, Math.PI * 0.7, Math.PI * 0.3);
        const lowerLid = new THREE.Mesh(lowerLidGeometry, upperLidMaterial);
        lowerLid.position.set(0, -0.02, 0.025);
        lowerLid.scale.set(1.05, 0.6, 0.7);
        upperLid.userData.isLowerEyelid = true; // Mark for animation
        eyeGroup.add(lowerLid);
        
        // Enhanced eyelashes with more variation
        const lashMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x2a2a2a,
          shininess: 60
        });
        
        // Upper lashes
        for (let i = 0; i < 12; i++) {
          const lashLength = 0.025 + Math.random() * 0.015;
          const lashThickness = 0.0008 + Math.random() * 0.0004;
          const lashGeometry = new THREE.CylinderGeometry(lashThickness, lashThickness * 0.3, lashLength, 3);
          const lash = new THREE.Mesh(lashGeometry, lashMaterial);
          
          const angle = (i / 11) * Math.PI * 0.8 - Math.PI * 0.4;
          const radius = 0.062 + Math.random() * 0.008;
          const height = Math.abs(Math.sin(angle)) * 0.03 + 0.02;
          
          lash.position.set(
            Math.cos(angle) * radius, 
            height, 
            0.04 + Math.random() * 0.005
          );
          lash.rotation.z = angle + (Math.random() - 0.5) * 0.2;
          lash.rotation.x = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
          eyeGroup.add(lash);
        }
        
        // Lower lashes (shorter and fewer)
        for (let i = 0; i < 6; i++) {
          const lashLength = 0.012 + Math.random() * 0.008;
          const lashThickness = 0.0006;
          const lashGeometry = new THREE.CylinderGeometry(lashThickness, lashThickness * 0.4, lashLength, 3);
          const lash = new THREE.Mesh(lashGeometry, lashMaterial);
          
          const angle = (i / 5) * Math.PI * 0.6 - Math.PI * 0.3;
          const radius = 0.055;
          
          lash.position.set(
            Math.cos(angle) * radius, 
            -0.025, 
            0.035
          );
          lash.rotation.z = angle;
          lash.rotation.x = -Math.PI / 6;
          eyeGroup.add(lash);
        }
        
        // Tear duct for more realism
        const tearDuctGeometry = new THREE.SphereGeometry(0.008, 8, 8);
        const tearDuctMaterial = new THREE.MeshPhongMaterial({
          color: skinTone.clone().offsetHSL(0, 0.1, -0.15),
          shininess: 80
        });
        const tearDuct = new THREE.Mesh(tearDuctGeometry, tearDuctMaterial);
        tearDuct.position.set(isLeft ? 0.05 : -0.05, -0.01, 0.03);
        tearDuct.scale.set(0.8, 1.2, 0.6);
        eyeGroup.add(tearDuct);
        
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

      // Enhanced Eyebrows with realistic hair structure
      const createEyebrow = (isLeft: boolean) => {
        const browGroup = new THREE.Group();
        const browMaterial = hairMaterial.clone();
        browMaterial.color = browMaterial.color.clone().multiplyScalar(0.75);
        
        // Main eyebrow shape with natural arch
        const browMainGeometry = new THREE.BoxGeometry(0.14, 0.025, 0.045);
        const browMain = new THREE.Mesh(browMainGeometry, browMaterial);
        browMain.scale.set(1, 0.8 + Math.random() * 0.4, 1); // Natural thickness variation
        browGroup.add(browMain);
        
        // Brow hairs for texture
        const browHairMaterial = new THREE.MeshPhongMaterial({ 
          color: browMaterial.color.clone().multiplyScalar(0.9),
          shininess: 40
        });
        
        // Create individual eyebrow hairs for realistic texture
        for (let i = 0; i < 15; i++) {
          const hairLength = 0.008 + Math.random() * 0.006;
          const hairThickness = 0.0008 + Math.random() * 0.0004;
          const hairGeometry = new THREE.CylinderGeometry(hairThickness, hairThickness * 0.5, hairLength, 3);
          const hair = new THREE.Mesh(hairGeometry, browHairMaterial);
          
          // Natural hair distribution
          const xPos = (i / 14 - 0.5) * 0.13;
          const yPos = (Math.random() - 0.5) * 0.012;
          const zPos = (Math.random() - 0.5) * 0.01;
          
          hair.position.set(xPos, yPos, zPos);
          
          // Natural hair angles
          const hairAngle = (Math.random() - 0.5) * 0.8;
          hair.rotation.z = isLeft ? -Math.abs(xPos) * 0.5 + hairAngle : Math.abs(xPos) * 0.5 + hairAngle;
          hair.rotation.x = (Math.random() - 0.5) * 0.3;
          
          browGroup.add(hair);
        }
        
        // Subtle brow muscle definition
        const muscleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const muscleMaterial = skinMaterial.clone();
        muscleMaterial.color = muscleMaterial.color.clone().multiplyScalar(0.95);
        const muscle = new THREE.Mesh(muscleGeometry, muscleMaterial);
        muscle.position.set(isLeft ? -0.04 : 0.04, -0.01, -0.02);
        muscle.scale.set(1.5, 0.5, 0.8);
        browGroup.add(muscle);
        
        return browGroup;
      };
      
      const leftEyebrow = createEyebrow(true);
      leftEyebrow.position.set(-0.12, 1.5, 0.32);
      leftEyebrow.rotation.z = 0.08;
      facialFeatures.leftEyebrow = leftEyebrow;
      head.add(leftEyebrow);
      
      const rightEyebrow = createEyebrow(false);
      rightEyebrow.position.set(0.12, 1.5, 0.32);
      rightEyebrow.rotation.z = -0.08;
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

      // Enhanced Mouth with realistic lip structure and expression capabilities
      const createMouth = () => {
        const mouthGroup = new THREE.Group();
        
        // Natural lip color variation
        const lipHue = Math.random() * 0.1; // Slight color variation
        const lipMaterial = new THREE.MeshPhongMaterial({ 
          color: skinTone.clone().offsetHSL(lipHue, 0.4, -0.08),
          shininess: 60,
          specular: 0x442222
        });
        
        // Upper lip with natural cupid's bow shape
        const upperLipGeometry = new THREE.SphereGeometry(0.048, 16, 10);
        upperLipGeometry.scale(1.3, 0.45, 0.85);
        const upperLip = new THREE.Mesh(upperLipGeometry, lipMaterial);
        upperLip.position.y = 0.012;
        upperLip.userData.isUpperLip = true;
        mouthGroup.add(upperLip);
        
        // Cupid's bow detail
        const cupidsBowGeometry = new THREE.SphereGeometry(0.015, 8, 8);
        const cupidsBow = new THREE.Mesh(cupidsBowGeometry, lipMaterial);
        cupidsBow.position.set(0, 0.018, 0.002);
        cupidsBow.scale.set(1.2, 0.6, 0.8);
        mouthGroup.add(cupidsBow);
        
        // Lower lip with natural fullness
        const lowerLipGeometry = new THREE.SphereGeometry(0.052, 16, 10);
        lowerLipGeometry.scale(1.2, 0.55, 0.75);
        const lowerLip = new THREE.Mesh(lowerLipGeometry, lipMaterial);
        lowerLip.position.y = -0.018;
        lowerLip.userData.isLowerLip = true;
        mouthGroup.add(lowerLip);
        
        // Lip line/border
        const lipLineGeometry = new THREE.TorusGeometry(0.045, 0.002, 4, 16, Math.PI);
        const lipLineMaterial = new THREE.MeshPhongMaterial({
          color: lipMaterial.color.clone().multiplyScalar(0.7),
          shininess: 40
        });
        const lipLine = new THREE.Mesh(lipLineGeometry, lipLineMaterial);
        lipLine.position.y = 0.002;
        lipLine.rotation.x = Math.PI;
        lipLine.scale.set(1.1, 1, 0.8);
        mouthGroup.add(lipLine);
        
        // Mouth corners for smile/frown control
        const cornerMaterial = skinMaterial.clone();
        cornerMaterial.color = cornerMaterial.color.clone().multiplyScalar(0.92);
        
        const leftCornerGeometry = new THREE.SphereGeometry(0.008, 8, 8);
        const leftCorner = new THREE.Mesh(leftCornerGeometry, cornerMaterial);
        leftCorner.position.set(-0.05, -0.005, 0.01);
        leftCorner.userData.isMouthCorner = true;
        leftCorner.userData.isLeft = true;
        mouthGroup.add(leftCorner);
        
        const rightCornerGeometry = new THREE.SphereGeometry(0.008, 8, 8);
        const rightCorner = new THREE.Mesh(rightCornerGeometry, cornerMaterial);
        rightCorner.position.set(0.05, -0.005, 0.01);
        rightCorner.userData.isMouthCorner = true;
        rightCorner.userData.isLeft = false;
        mouthGroup.add(rightCorner);
        
        // Mouth cavity for speaking animation
        const mouthCavityGeometry = new THREE.SphereGeometry(0.025, 12, 8);
        const mouthCavityMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x2a1810,
          shininess: 20
        });
        const mouthCavity = new THREE.Mesh(mouthCavityGeometry, mouthCavityMaterial);
        mouthCavity.scale.set(1.6, 1, 0.6);
        mouthCavity.position.y = -0.002;
        mouthCavity.visible = false;
        mouthCavity.userData.isMouthCavity = true;
        mouthGroup.add(mouthCavity);
        
        // Teeth for realistic speaking (upper teeth)
        const upperTeethGeometry = new THREE.BoxGeometry(0.06, 0.012, 0.015);
        const teethMaterial = new THREE.MeshPhongMaterial({
          color: 0xfefefe,
          shininess: 100,
          specular: 0x111111
        });
        const upperTeeth = new THREE.Mesh(upperTeethGeometry, teethMaterial);
        upperTeeth.position.set(0, 0.006, 0.008);
        upperTeeth.visible = false;
        upperTeeth.userData.isUpperTeeth = true;
        mouthGroup.add(upperTeeth);
        
        // Individual teeth details
        for (let i = 0; i < 6; i++) {
          const toothGeometry = new THREE.BoxGeometry(0.008, 0.015, 0.01);
          const tooth = new THREE.Mesh(toothGeometry, teethMaterial);
          tooth.position.set((i - 2.5) * 0.01, 0.008, 0.01);
          tooth.scale.y = 0.8 + Math.random() * 0.4; // Natural variation
          tooth.visible = false;
          tooth.userData.isTooth = true;
          mouthGroup.add(tooth);
        }
        
        // Lower teeth
        const lowerTeethGeometry = new THREE.BoxGeometry(0.055, 0.01, 0.012);
        const lowerTeeth = new THREE.Mesh(lowerTeethGeometry, teethMaterial);
        lowerTeeth.position.set(0, -0.015, 0.005);
        lowerTeeth.visible = false;
        lowerTeeth.userData.isLowerTeeth = true;
        mouthGroup.add(lowerTeeth);
        
        // Tongue for advanced speaking animation
        const tongueGeometry = new THREE.SphereGeometry(0.028, 12, 8);
        const tongueMaterial = new THREE.MeshPhongMaterial({
          color: 0xcc6666,
          shininess: 80
        });
        const tongue = new THREE.Mesh(tongueGeometry, tongueMaterial);
        tongue.scale.set(1.2, 0.6, 1.8);
        tongue.position.set(0, -0.012, -0.008);
        tongue.visible = false;
        tongue.userData.isTongue = true;
        mouthGroup.add(tongue);
        
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

    // Facial expression functions with advanced micro-expressions and emotional nuance
    const applyFacialExpression = (features: typeof facialFeatures, currentMood: string, time: number) => {
      if (!features.leftEyebrow || !features.rightEyebrow) return;
      
      const baseRotation = 0.08;
      const expressionIntensity = 0.4;
      const microMovement = Math.sin(time * 0.0012) * 0.015; // Subtle life-like micro-movements
      
      // Enhanced eye tracking with more natural movement patterns
      const eyeMovement = {
        x: Math.sin(time * 0.0008) * 0.025 + Math.sin(time * 0.0032) * 0.008, // Compound movement
        y: Math.cos(time * 0.0012) * 0.015 + Math.cos(time * 0.0041) * 0.005,
        saccade: Math.random() < 0.002 ? (Math.random() - 0.5) * 0.1 : 0 // Occasional quick saccadic movements
      };
      
      // Enhanced blinking with natural variation
      const blinkPattern = Math.sin(time * 0.0018);
      const isFullBlink = blinkPattern > 0.985; // Full blinks
      const isPartialBlink = blinkPattern > 0.97 && blinkPattern <= 0.985; // Partial blinks
      const blinkIntensity = isFullBlink ? 0.05 : (isPartialBlink ? 0.6 : 1);
      
      // Apply blinking to eyelids
      features.leftEye.traverse((child) => {
        if (child.userData.isUpperEyelid) {
          child.scale.y = blinkIntensity;
          child.position.y = child.userData.originalY || child.position.y;
          if (isFullBlink) child.position.y -= 0.02;
        }
        if (child.userData.isLowerEyelid) {
          child.scale.y = blinkIntensity;
          child.position.y = child.userData.originalY || child.position.y;
          if (isFullBlink) child.position.y += 0.01;
        }
      });
      
      features.rightEye.traverse((child) => {
        if (child.userData.isUpperEyelid) {
          child.scale.y = blinkIntensity;
          child.position.y = child.userData.originalY || child.position.y;
          if (isFullBlink) child.position.y -= 0.02;
        }
        if (child.userData.isLowerEyelid) {
          child.scale.y = blinkIntensity;
          child.position.y = child.userData.originalY || child.position.y;
          if (isFullBlink) child.position.y += 0.01;
        }
      });
      
      // Apply eye movement to both eyes with saccades
      const currentEyeX = eyeMovement.x + eyeMovement.saccade;
      const currentEyeY = eyeMovement.y;
      
      features.leftEye.rotation.x = currentEyeY;
      features.leftEye.rotation.y = currentEyeX;
      features.rightEye.rotation.x = currentEyeY;
      features.rightEye.rotation.y = currentEyeX;
      
      // Pupil dilation based on mood/emotion
      const pupilDilation = {
        'excited': 1.3,
        'surprised': 1.5,
        'curious': 1.2,
        'happy': 1.1,
        'focused': 0.8,
        'serious': 0.7,
        'angry': 0.6,
        'default': 1.0
      };
      
      const dilationFactor = pupilDilation[currentMood.toLowerCase()] || pupilDilation.default;
      features.leftEye.traverse((child) => {
        if (child.userData.isEyePupil) {
          child.scale.setScalar(dilationFactor + microMovement * 0.1);
        }
      });
      features.rightEye.traverse((child) => {
        if (child.userData.isEyePupil) {
          child.scale.setScalar(dilationFactor + microMovement * 0.1);
        }
      });
      
      switch (currentMood.toLowerCase()) {
        case 'happy':
        case 'excited':
        case 'joyful':
          // Genuine Duchenne smile with comprehensive muscle involvement
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 0.6;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 0.6;
          features.leftEyebrow.position.y = 1.508 + microMovement;
          features.rightEyebrow.position.y = 1.508 + microMovement;
          
          // Crow's feet simulation (eye crinkles)
          if (!isFullBlink) {
            features.leftEye.scale.y = 0.75 + Math.sin(time * 0.003) * 0.08;
            features.rightEye.scale.y = 0.75 + Math.sin(time * 0.003) * 0.08;
            features.leftEye.scale.x = 0.95; // Slightly squeezed
            features.rightEye.scale.x = 0.95;
          }
          
          // Raised cheeks effect
          features.leftEye.position.y = 1.425;
          features.rightEye.position.y = 1.425;
          
          // Mouth expression
          features.mouth.rotation.z = 0.12 + Math.sin(time * 0.002) * 0.04;
          features.mouth.scale.x = 1.15 + microMovement;
          features.mouth.position.y = 0.005; // Slightly raised
          
          // Animate mouth corners
          features.mouth.traverse((child) => {
            if (child.userData.isMouthCorner) {
              child.position.y = 0.005 + (child.userData.isLeft ? 0.008 : 0.008);
            }
          });
          break;
          
        case 'curious':
        case 'interested':
        case 'intrigued':
          // Asymmetric eyebrow raise with interest markers
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 1.4;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 0.8;
          features.leftEyebrow.position.y = 1.52 + microMovement;
          features.rightEyebrow.position.y = 1.51 + microMovement * 0.5;
          
          // Wide, alert eyes with forward focus
          if (!isFullBlink) {
            features.leftEye.scale.setScalar(1.15 + microMovement);
            features.rightEye.scale.setScalar(1.15 + microMovement);
          }
          
          // Head slightly tilted forward
          features.leftEye.position.z = 0.285;
          features.rightEye.position.z = 0.285;
          
          // Slightly parted lips
          features.mouth.scale.y = 1.08;
          features.mouth.scale.x = 0.92;
          
          // Show slight teeth separation for breath intake
          features.mouth.traverse((child) => {
            if (child.userData.isMouthCavity) {
              child.visible = true;
              child.scale.set(0.8, 0.4, 0.6);
            }
          });
          break;
          
        case 'focused':
        case 'analytical':
        case 'concentrated':
          // Furrowed brow with muscle tension
          features.leftEyebrow.rotation.z = baseRotation - expressionIntensity * 0.9;
          features.rightEyebrow.rotation.z = -baseRotation + expressionIntensity * 0.9;
          features.leftEyebrow.position.y = 1.485 + microMovement * 0.3;
          features.rightEyebrow.position.y = 1.485 + microMovement * 0.3;
          
          // Slightly narrowed, intense gaze
          if (!isFullBlink) {
            features.leftEye.scale.y = 0.8;
            features.rightEye.scale.y = 0.8;
            features.leftEye.scale.x = 1.05; // Slightly wider for focus
            features.rightEye.scale.x = 1.05;
          }
          
          // Compressed lips with determination
          features.mouth.scale.x = 0.82;
          features.mouth.scale.y = 0.88;
          features.mouth.rotation.z = 0;
          
          // Tensed mouth corners
          features.mouth.traverse((child) => {
            if (child.userData.isMouthCorner) {
              child.position.y = -0.008;
              child.scale.setScalar(0.8);
            }
          });
          break;
          
        case 'thoughtful':
        case 'contemplative':
        case 'pensive':
          // Asymmetric, contemplative expression
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 0.7;
          features.rightEyebrow.rotation.z = -baseRotation + expressionIntensity * 0.3;
          features.leftEyebrow.position.y = 1.505 + microMovement;
          features.rightEyebrow.position.y = 1.495 + microMovement * 0.5;
          
          // Distant, contemplative gaze
          const contemplativeGaze = Math.sin(time * 0.0006) * 0.08;
          features.leftEye.rotation.x = -0.12 + contemplativeGaze;
          features.rightEye.rotation.x = -0.12 + contemplativeGaze;
          features.leftEye.rotation.y = 0.15 + Math.sin(time * 0.0004) * 0.05;
          features.rightEye.rotation.y = 0.15 + Math.sin(time * 0.0004) * 0.05;
          
          // Slightly pursed, thinking lips
          features.mouth.scale.x = 0.88;
          features.mouth.scale.y = 0.95;
          features.mouth.position.x = Math.sin(time * 0.001) * 0.005; // Slight asymmetry
          break;
          
        case 'confident':
        case 'determined':
        case 'assertive':
          // Strong, determined brow position
          features.leftEyebrow.rotation.z = baseRotation - expressionIntensity * 0.4;
          features.rightEyebrow.rotation.z = -baseRotation + expressionIntensity * 0.4;
          features.leftEyebrow.position.y = 1.49;
          features.rightEyebrow.position.y = 1.49;
          
          // Direct, unwavering gaze with confidence
          features.leftEye.rotation.set(0, 0, 0);
          features.rightEye.rotation.set(0, 0, 0);
          
          if (!isFullBlink) {
            features.leftEye.scale.setScalar(1.02);
            features.rightEye.scale.setScalar(1.02);
          }
          
          // Subtle confident smile
          features.mouth.rotation.z = 0.06;
          features.mouth.scale.x = 1.08;
          features.mouth.scale.y = 1.02;
          
          // Firm mouth corners
          features.mouth.traverse((child) => {
            if (child.userData.isMouthCorner) {
              child.position.y = 0.002;
            }
          });
          break;
          
        case 'surprised':
        case 'amazed':
        case 'shocked':
          // Dramatically raised eyebrows
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 2.5;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 2.5;
          features.leftEyebrow.position.y = 1.55;
          features.rightEyebrow.position.y = 1.55;
          
          // Wide, opened eyes
          if (!isFullBlink) {
            features.leftEye.scale.setScalar(1.5);
            features.rightEye.scale.setScalar(1.5);
          }
          
          // Dropped jaw with visible teeth
          features.mouth.scale.y = 2.2;
          features.mouth.position.y = -0.025;
          features.mouth.rotation.z = 0;
          
          // Show mouth cavity and teeth
          features.mouth.traverse((child) => {
            if (child.userData.isMouthCavity) {
              child.visible = true;
              child.scale.set(1.8, 1.5, 1);
            }
            if (child.userData.isUpperTeeth || child.userData.isTooth) {
              child.visible = true;
            }
          });
          break;
          
        case 'empathetic':
        case 'caring':
        case 'compassionate':
          // Soft, caring expression with warmth
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 0.5;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 0.5;
          features.leftEyebrow.position.y = 1.504;
          features.rightEyebrow.position.y = 1.504;
          
          // Warm, soft eyes
          if (!isFullBlink) {
            features.leftEye.scale.y = 0.88;
            features.rightEye.scale.y = 0.88;
            features.leftEye.scale.x = 1.05;
            features.rightEye.scale.x = 1.05;
          }
          
          // Gentle, understanding smile
          features.mouth.rotation.z = 0.08;
          features.mouth.scale.x = 1.06;
          features.mouth.scale.y = 1.01;
          
          // Soft mouth corners
          features.mouth.traverse((child) => {
            if (child.userData.isMouthCorner) {
              child.position.y = 0.006;
            }
          });
          break;
          
        case 'creative':
        case 'artistic':
        case 'inspired':
          // Inspired, dreamy expression with asymmetry
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 0.8;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 0.4;
          features.leftEyebrow.position.y = 1.512;
          features.rightEyebrow.position.y = 1.502;
          
          // Slightly unfocused, inspired gaze with movement
          const inspirationGaze = Math.sin(time * 0.0008) * 0.12;
          features.leftEye.rotation.x = -0.06 + inspirationGaze;
          features.rightEye.rotation.x = -0.06 + inspirationGaze;
          features.leftEye.rotation.y = Math.sin(time * 0.0005) * 0.08;
          features.rightEye.rotation.y = Math.sin(time * 0.0005) * 0.08;
          
          // Slightly parted lips as if about to speak or breathe inspiration
          features.mouth.scale.y = 1.08;
          features.mouth.scale.x = 0.96;
          
          // Slight mouth opening
          features.mouth.traverse((child) => {
            if (child.userData.isMouthCavity) {
              child.visible = true;
              child.scale.set(0.6, 0.3, 0.4);
            }
          });
          break;
          
        case 'skeptical':
        case 'doubtful':
        case 'suspicious':
          // Classic skeptical look with one raised eyebrow
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 1.8;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 0.3;
          features.leftEyebrow.position.y = 1.525;
          features.rightEyebrow.position.y = 1.485;
          
          // Narrowed, scrutinizing eyes
          if (!isFullBlink) {
            features.leftEye.scale.y = 0.75;
            features.rightEye.scale.y = 0.78;
            features.leftEye.scale.x = 0.95;
            features.rightEye.scale.x = 0.95;
          }
          
          // Compressed, skeptical mouth
          features.mouth.scale.x = 0.75;
          features.mouth.scale.y = 0.9;
          features.mouth.rotation.z = -0.04;
          
          // Asymmetric mouth corners
          features.mouth.traverse((child) => {
            if (child.userData.isMouthCorner) {
              const offset = child.userData.isLeft ? -0.008 : -0.003;
              child.position.y = offset;
            }
          });
          break;
          
        case 'playful':
        case 'mischievous':
        case 'cheeky':
          // Playful asymmetric expression
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 0.9;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 1.3;
          features.leftEyebrow.position.y = 1.508;
          features.rightEyebrow.position.y = 1.515;
          
          // Bright, mischievous eyes with sparkle
          if (!isFullBlink) {
            features.leftEye.scale.setScalar(1.08);
            features.rightEye.scale.setScalar(1.08);
          }
          
          // Playful smirk with movement
          const playfulSmirk = Math.sin(time * 0.004) * 0.03;
          features.mouth.rotation.z = 0.09 + playfulSmirk;
          features.mouth.scale.x = 1.12;
          features.mouth.scale.y = 1.05;
          
          // Animated mouth corners
          features.mouth.traverse((child) => {
            if (child.userData.isMouthCorner) {
              const lift = child.userData.isLeft ? 0.012 : 0.008;
              child.position.y = lift + Math.sin(time * 0.003) * 0.003;
            }
          });
          break;
          
        case 'serious':
        case 'stern':
        case 'grave':
          // Serious, authoritative expression
          features.leftEyebrow.rotation.z = baseRotation - expressionIntensity * 1.0;
          features.rightEyebrow.rotation.z = -baseRotation + expressionIntensity * 1.0;
          features.leftEyebrow.position.y = 1.475;
          features.rightEyebrow.position.y = 1.475;
          
          // Intense, focused gaze
          if (!isFullBlink) {
            features.leftEye.scale.y = 0.82;
            features.rightEye.scale.y = 0.82;
            features.leftEye.scale.x = 1.08;
            features.rightEye.scale.x = 1.08;
          }
          
          // Firm, straight mouth
          features.mouth.scale.x = 0.85;
          features.mouth.scale.y = 0.92;
          features.mouth.rotation.z = 0;
          
          // Tensed mouth corners
          features.mouth.traverse((child) => {
            if (child.userData.isMouthCorner) {
              child.position.y = -0.005;
              child.scale.setScalar(0.9);
            }
          });
          break;
          
        case 'angry':
        case 'frustrated':
        case 'irritated':
          // Angry expression with tension
          features.leftEyebrow.rotation.z = baseRotation - expressionIntensity * 1.5;
          features.rightEyebrow.rotation.z = -baseRotation + expressionIntensity * 1.5;
          features.leftEyebrow.position.y = 1.47;
          features.rightEyebrow.position.y = 1.47;
          
          // Narrowed, intense eyes
          if (!isFullBlink) {
            features.leftEye.scale.y = 0.7;
            features.rightEye.scale.y = 0.7;
            features.leftEye.scale.x = 0.9;
            features.rightEye.scale.x = 0.9;
          }
          
          // Tightened mouth
          features.mouth.scale.x = 0.7;
          features.mouth.scale.y = 0.85;
          features.mouth.rotation.z = -0.02;
          
          // Downturned mouth corners
          features.mouth.traverse((child) => {
            if (child.userData.isMouthCorner) {
              child.position.y = -0.012;
            }
          });
          break;
          
        case 'sad':
        case 'melancholy':
        case 'disappointed':
          // Sad expression with drooping features
          features.leftEyebrow.rotation.z = baseRotation + expressionIntensity * 0.3;
          features.rightEyebrow.rotation.z = -baseRotation - expressionIntensity * 0.3;
          features.leftEyebrow.position.y = 1.495;
          features.rightEyebrow.position.y = 1.495;
          
          // Slightly drooping eyes
          if (!isFullBlink) {
            features.leftEye.scale.y = 0.9;
            features.rightEye.scale.y = 0.9;
          }
          features.leftEye.rotation.z = 0.05;
          features.rightEye.rotation.z = -0.05;
          
          // Downturned mouth
          features.mouth.rotation.z = -0.08;
          features.mouth.scale.x = 0.95;
          features.mouth.scale.y = 0.88;
          
          // Sad mouth corners
          features.mouth.traverse((child) => {
            if (child.userData.isMouthCorner) {
              child.position.y = -0.015;
            }
          });
          break;
          
        default: // neutral
          // Natural resting expression with subtle life-like movements
          features.leftEyebrow.rotation.z = baseRotation + microMovement * 0.3;
          features.rightEyebrow.rotation.z = -baseRotation - microMovement * 0.3;
          features.leftEyebrow.position.y = 1.5 + microMovement * 0.2;
          features.rightEyebrow.position.y = 1.5 + microMovement * 0.2;
          
          if (!isFullBlink) {
            features.leftEye.scale.setScalar(1 + microMovement * 0.3);
            features.rightEye.scale.setScalar(1 + microMovement * 0.3);
          }
          
          features.mouth.rotation.z = microMovement * 0.2;
          features.mouth.scale.x = 1 + microMovement * 0.15;
          features.mouth.scale.y = 1 + microMovement * 0.1;
          features.mouth.position.y = 0; // Reset position
          
          // Reset mouth corner positions
          features.mouth.traverse((child) => {
            if (child.userData.isMouthCorner) {
              child.position.y = -0.005;
              child.scale.setScalar(1);
            }
            if (child.userData.isMouthCavity || child.userData.isUpperTeeth || 
                child.userData.isLowerTeeth || child.userData.isTooth || child.userData.isTongue) {
              child.visible = false;
            }
          });
      }
      
      // Apply environmental responsiveness (ambient emotional state)
      const ambientResponse = Math.sin(time * 0.0003) * 0.005;
      features.leftEyebrow.position.y += ambientResponse;
      features.rightEyebrow.position.y += ambientResponse;
      
      // Dynamic wrinkle animation based on expressions
      if (bodyParts.head) {
        bodyParts.head.traverse((child) => {
          if (child.userData.isCrowsFoot) {
            // Crow's feet become more visible with happiness and squinting
            const intensity = (currentMood === 'happy' || currentMood === 'excited' || currentMood === 'playful') ? 1.3 : 
                            (currentMood === 'focused' || currentMood === 'serious') ? 1.1 : 0.8;
            child.scale.y = intensity;
            child.material.opacity = intensity > 1 ? 0.8 : 0.4;
          }
          
          if (child.userData.isForeheadWrinkle) {
            // Forehead wrinkles with surprise, curiosity, and concentration
            const intensity = (currentMood === 'surprised' || currentMood === 'curious') ? 1.4 :
                            (currentMood === 'focused' || currentMood === 'thoughtful') ? 1.2 : 0.7;
            child.scale.y = intensity;
            child.material.opacity = intensity > 1 ? 0.7 : 0.3;
          }
          
          if (child.userData.isMarionetteLines) {
            // Marionette lines with sadness and serious expressions
            const intensity = (currentMood === 'sad' || currentMood === 'serious') ? 1.3 :
                            (currentMood === 'skeptical' || currentMood === 'angry') ? 1.1 : 0.6;
            child.scale.y = intensity;
            child.material.opacity = intensity > 1 ? 0.6 : 0.2;
          }
          
          if (child.userData.isGlabellaLines) {
            // Glabella lines with concentration and anger
            const intensity = (currentMood === 'focused' || currentMood === 'angry') ? 1.5 :
                            (currentMood === 'serious' || currentMood === 'skeptical') ? 1.2 : 0.5;
            child.scale.setScalar(intensity);
            child.material.opacity = intensity > 1 ? 0.8 : 0.2;
          }
        });
      }
      
      // Subtle eye moisture/sparkle animation
      features.leftEye.traverse((child) => {
        if (child.material && child.material.color && child.material.color.r === 1) { // Highlights
          child.scale.setScalar(1 + Math.sin(time * 0.008 + child.position.x) * 0.3);
        }
      });
      features.rightEye.traverse((child) => {
        if (child.material && child.material.color && child.material.color.r === 1) { // Highlights
          child.scale.setScalar(1 + Math.sin(time * 0.008 + child.position.x) * 0.3);
        }
      });
    };

    const applySpeakingAnimation = (features: typeof facialFeatures, time: number) => {
      // Advanced phoneme-based speech animation system
      const speechCycle = time * 0.015; // Base speech rhythm
      const breathingCycle = time * 0.004; // Breathing rhythm
      
      // Multiple overlapping speech patterns for natural variation
      const vowelPhoneme = Math.sin(speechCycle) * 0.5 + 0.5; // Open vowels (a, e, i, o, u)
      const bilabialPhoneme = Math.sin(speechCycle * 1.4 + 1.2) * 0.5 + 0.5; // Lip sounds (m, b, p, w)
      const dentalPhoneme = Math.sin(speechCycle * 0.8 + 2.1) * 0.5 + 0.5; // Tongue sounds (t, d, th, l)
      const fricativePhoneme = Math.sin(speechCycle * 2.1 + 0.7) * 0.5 + 0.5; // Friction sounds (f, v, s, z, sh)
      const nasalPhoneme = Math.sin(speechCycle * 0.6 + 1.8) * 0.5 + 0.5; // Nasal sounds (n, ng)
      
      // Combine phonemes for realistic mouth shapes
      const mouthOpenness = (vowelPhoneme * 0.4 + fricativePhoneme * 0.2 + dentalPhoneme * 0.15) * 0.85;
      const lipCompression = (bilabialPhoneme * 0.6 + nasalPhoneme * 0.3) * 0.7;
      const mouthWidth = (vowelPhoneme * 0.3 + fricativePhoneme * 0.25 + dentalPhoneme * 0.2) * 0.6;
      
      // Apply mouth deformation based on phoneme analysis
      features.mouth.traverse((child) => {
        if (child.userData.isUpperLip) {
          child.scale.y = 1 + mouthOpenness * 0.3;
          child.position.y = 0.012 + mouthOpenness * 0.008;
        }
        if (child.userData.isLowerLip) {
          child.scale.y = 1 + mouthOpenness * 0.4;
          child.position.y = -0.018 - mouthOpenness * 0.015;
        }
      });
      
      // Overall mouth scaling
      features.mouth.scale.y = 1 + mouthOpenness * 0.8;
      features.mouth.scale.x = 1 + mouthWidth * 0.5 - lipCompression * 0.3;
      
      // Advanced mouth cavity and teeth visibility
      features.mouth.traverse((child) => {
        if (child.userData.isMouthCavity) {
          child.visible = mouthOpenness > 0.25;
          if (child.visible) {
            child.scale.set(
              1.4 + mouthOpenness * 0.8,
              0.8 + mouthOpenness * 1.2,
              0.6 + mouthOpenness * 0.4
            );
            child.position.y = -0.002 - mouthOpenness * 0.01;
          }
        }
        
        if (child.userData.isUpperTeeth || child.userData.isTooth) {
          child.visible = mouthOpenness > 0.35;
          if (child.visible) {
            child.scale.y = 1 + mouthOpenness * 0.2;
          }
        }
        
        if (child.userData.isLowerTeeth) {
          child.visible = mouthOpenness > 0.5;
          if (child.visible) {
            child.position.y = -0.015 - mouthOpenness * 0.008;
          }
        }
        
        if (child.userData.isTongue) {
          // Tongue movement for dental and alveolar sounds
          child.visible = mouthOpenness > 0.3 && dentalPhoneme > 0.6;
          if (child.visible) {
            child.position.y = -0.012 + dentalPhoneme * 0.015;
            child.position.z = -0.008 + dentalPhoneme * 0.012;
            child.scale.x = 1 + dentalPhoneme * 0.2;
          }
        }
      });
      
      // Realistic head movement patterns while speaking
      if (bodyParts.head) {
        // Natural head nodding and tilting during speech
        const emphasisNod = Math.sin(time * 0.006) * 0.06; // Emphasis nods
        const conversationalTilt = Math.sin(time * 0.004) * 0.04; // Conversational tilts
        const gesticulationBob = Math.sin(time * 0.008) * 0.03; // Speech rhythm bobs
        
        bodyParts.head.rotation.x = emphasisNod + Math.sin(time * 0.012) * 0.02;
        bodyParts.head.rotation.y = conversationalTilt + Math.sin(time * 0.007) * 0.025;
        bodyParts.head.rotation.z = Math.sin(time * 0.005) * 0.02;
        
        // Head position changes with speech intensity
        const speechIntensity = (mouthOpenness + lipCompression) / 2;
        bodyParts.head.position.y = Math.sin(time * 0.009) * 0.015 + speechIntensity * 0.008;
        bodyParts.head.position.z = Math.sin(time * 0.011) * 0.005;
      }
      
      // Enhanced eye behavior during speech
      if (features.leftEye && features.rightEye) {
        // More expressive eyes when speaking
        const speakingEngagement = 1.08 + mouthOpenness * 0.1;
        features.leftEye.scale.x = speakingEngagement;
        features.rightEye.scale.x = speakingEngagement;
        
        // Natural eye contact patterns and occasional glances
        const eyeContactPattern = Math.sin(time * 0.002) * 0.03;
        const occasionalGlance = Math.random() < 0.001 ? (Math.random() - 0.5) * 0.15 : 0;
        
        features.leftEye.rotation.y = eyeContactPattern + occasionalGlance;
        features.rightEye.rotation.y = eyeContactPattern + occasionalGlance;
        
        // Slight eye narrowing for consonants
        const consonantSquint = (bilabialPhoneme + dentalPhoneme + fricativePhoneme) / 3;
        if (consonantSquint > 0.7) {
          features.leftEye.scale.y = 0.95;
          features.rightEye.scale.y = 0.95;
        }
        
        // Enhanced blink patterns during speech
        const speechBlinkRate = 0.003; // Slightly faster blinking when speaking
        const speechBlink = Math.sin(time * speechBlinkRate);
        if (speechBlink > 0.98) {
          features.leftEye.traverse((child) => {
            if (child.userData.isUpperEyelid) {
              child.scale.y = 0.1;
              child.position.y -= 0.015;
            }
          });
          features.rightEye.traverse((child) => {
            if (child.userData.isUpperEyelid) {
              child.scale.y = 0.1;
              child.position.y -= 0.015;
            }
          });
        }
      }
      
      // Eyebrow movement for emphasis and expression
      if (features.leftEyebrow && features.rightEyebrow) {
        const expressiveLift = Math.sin(time * 0.007) * 0.02;
        const emphasisRaise = vowelPhoneme > 0.8 ? 0.01 : 0;
        
        features.leftEyebrow.position.y += expressiveLift + emphasisRaise;
        features.rightEyebrow.position.y += expressiveLift + emphasisRaise;
        
        // Slight eyebrow tension during consonants
        const browTension = (bilabialPhoneme + fricativePhoneme) / 2;
        if (browTension > 0.6) {
          features.leftEyebrow.rotation.z -= 0.01;
          features.rightEyebrow.rotation.z += 0.01;
        }
      }
      
      // Facial muscle coordination - cheeks and jaw
      features.mouth.position.x = Math.sin(time * 0.013) * 0.002; // Slight asymmetry
      
      // Breath support simulation - subtle chest/torso movement
      if (bodyParts.torso) {
        const breathSupport = Math.sin(breathingCycle) * 0.015;
        bodyParts.torso.scale.y = 1.02 + breathSupport;
        bodyParts.torso.position.y = 0.65 + breathSupport * 0.5;
      }
      
      // Neck tension and movement during speech
      const neckMovement = Math.sin(time * 0.008) * 0.01;
      if (bodyParts.head) {
        bodyParts.head.position.x = neckMovement;
      }
      
      // Micro-expressions during speech pauses
      const speechPause = Math.random() < 0.001; // Occasional micro-pauses
      if (speechPause) {
        // Brief pause expression - slight lip compression and eye blink
        features.mouth.scale.x *= 0.95;
        setTimeout(() => {
          // Reset after micro-pause
          features.mouth.scale.x = 1 + mouthWidth * 0.5 - lipCompression * 0.3;
        }, 100);
      }
      
      // Prosodic features - stress and intonation
      const stressPattern = Math.sin(time * 0.003) * 0.02;
      features.mouth.rotation.z = stressPattern; // Slight mouth tilt for prosody
      
      // Co-articulation effects - smooth transitions between phonemes
      const transitionSmoothing = 0.85; // Smoothing factor
      features.mouth.scale.y = features.mouth.scale.y * transitionSmoothing + 
                              (1 + mouthOpenness * 0.8) * (1 - transitionSmoothing);
      features.mouth.scale.x = features.mouth.scale.x * transitionSmoothing + 
                              (1 + mouthWidth * 0.5 - lipCompression * 0.3) * (1 - transitionSmoothing);
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