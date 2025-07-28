import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';
import { X } from '@phosphor-icons/react';
import { AIAgent } from '@/lib/types';

interface SpeakingOverlayProps {
  agent: AIAgent;
  isVisible: boolean;
  onClose: () => void;
  voiceLevel?: number; // 0-1 representing voice activity level
}

export function SpeakingOverlay({ agent, isVisible, onClose, voiceLevel = 0.5 }: SpeakingOverlayProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    head: THREE.Mesh;
    facialFeatures: {
      leftEye: THREE.Group;
      rightEye: THREE.Group;
      mouth: THREE.Group;
      leftEyebrow: THREE.Mesh;
      rightEyebrow: THREE.Mesh;
    };
    animationId: number;
  }>();
  
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  
  useEffect(() => {
    if (!isVisible || !mountRef.current) return;

    // Scene setup for close-up avatar
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(400, 400);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Parse color from agent
    const baseColor = new THREE.Color(agent.color.includes('oklch') ? '#4f46e5' : agent.color);
    
    // Create detailed head for close-up
    const createDetailedHead = () => {
      const headGroup = new THREE.Group();
      
      // Skin tone
      const skinTones = [
        new THREE.Color().setHSL(0.08, 0.4, 0.75), // Light
        new THREE.Color().setHSL(0.07, 0.5, 0.65), // Medium light  
        new THREE.Color().setHSL(0.06, 0.6, 0.55), // Medium
        new THREE.Color().setHSL(0.05, 0.7, 0.45), // Medium dark
        new THREE.Color().setHSL(0.04, 0.6, 0.35), // Dark
      ];
      
      const skinTone = skinTones[Math.floor(Math.random() * skinTones.length)];
      const skinMaterial = new THREE.MeshPhongMaterial({ 
        color: skinTone,
        shininess: 20,
        specular: 0x111111
      });

      // Head (larger for close-up detail)
      const headGeometry = new THREE.SphereGeometry(1.2, 32, 24);
      headGeometry.scale(1, 1.1, 0.9);
      const head = new THREE.Mesh(headGeometry, skinMaterial);
      head.castShadow = true;
      headGroup.add(head);

      // Facial features with high detail for close-up
      const facialFeatures = {
        leftEye: new THREE.Group(),
        rightEye: new THREE.Group(),
        mouth: new THREE.Group(),
        leftEyebrow: null as THREE.Mesh | null,
        rightEyebrow: null as THREE.Mesh | null,
      };

      // Detailed eyes for close-up
      const createDetailedEye = () => {
        const eyeGroup = new THREE.Group();
        
        // Eye socket
        const socketGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const socketMaterial = skinMaterial.clone();
        socketMaterial.color = socketMaterial.color.clone().multiplyScalar(0.9);
        const socket = new THREE.Mesh(socketGeometry, socketMaterial);
        socket.scale.z = 0.3;
        eyeGroup.add(socket);
        
        // Eye white
        const eyeWhiteGeometry = new THREE.SphereGeometry(0.22, 16, 16);
        const eyeWhiteMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xffffff,
          shininess: 100,
          specular: 0x333333
        });
        const eyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
        eyeWhite.scale.z = 0.6;
        eyeWhite.position.z = 0.05;
        eyeGroup.add(eyeWhite);
        
        // Iris with color variation
        const irisColors = [0x8B4513, 0x4682B4, 0x228B22, 0x708090, 0x8A2BE2, 0x2F4F4F];
        const irisGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        const irisMaterial = new THREE.MeshPhongMaterial({ 
          color: irisColors[Math.floor(Math.random() * irisColors.length)],
          shininess: 80
        });
        const iris = new THREE.Mesh(irisGeometry, irisMaterial);
        iris.position.z = 0.08;
        eyeGroup.add(iris);
        
        // Pupil
        const pupilGeometry = new THREE.SphereGeometry(0.06, 12, 12);
        const pupilMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        pupil.position.z = 0.1;
        eyeGroup.add(pupil);
        
        // Multiple eye highlights for realism
        const highlightGeometry = new THREE.SphereGeometry(0.025, 8, 8);
        const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        const highlight1 = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlight1.position.set(0.05, 0.05, 0.12);
        eyeGroup.add(highlight1);
        
        const highlight2 = new THREE.Mesh(highlightGeometry.clone(), highlightMaterial);
        highlight2.scale.setScalar(0.6);
        highlight2.position.set(-0.03, -0.02, 0.11);
        eyeGroup.add(highlight2);
        
        // Detailed eyelashes
        const lashMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
        for (let i = 0; i < 12; i++) {
          const lashGeometry = new THREE.CylinderGeometry(0.003, 0.001, 0.08, 4);
          const lash = new THREE.Mesh(lashGeometry, lashMaterial);
          const angle = (i / 11) * Math.PI - Math.PI / 2;
          lash.position.set(Math.cos(angle) * 0.18, Math.sin(angle) * 0.12, 0.1);
          lash.rotation.z = angle;
          lash.rotation.x = -0.3;
          eyeGroup.add(lash);
        }
        
        return eyeGroup;
      };
      
      // Position eyes for close-up
      const leftEye = createDetailedEye();
      leftEye.position.set(-0.4, 0.15, 0.8);
      facialFeatures.leftEye = leftEye;
      head.add(leftEye);
      
      const rightEye = createDetailedEye();
      rightEye.position.set(0.4, 0.15, 0.8);
      facialFeatures.rightEye = rightEye;
      head.add(rightEye);

      // Detailed eyebrows
      const hairMaterial = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color().setHSL(0.05, 0.8, 0.15),
        shininess: 60
      });
      
      const createDetailedEyebrow = () => {
        const browGeometry = new THREE.BoxGeometry(0.35, 0.06, 0.12);
        return new THREE.Mesh(browGeometry, hairMaterial);
      };
      
      const leftEyebrow = createDetailedEyebrow();
      leftEyebrow.position.set(-0.4, 0.35, 0.9);
      leftEyebrow.rotation.z = 0.1;
      facialFeatures.leftEyebrow = leftEyebrow;
      head.add(leftEyebrow);
      
      const rightEyebrow = createDetailedEyebrow();
      rightEyebrow.position.set(0.4, 0.35, 0.9);
      rightEyebrow.rotation.z = -0.1;
      facialFeatures.rightEyebrow = rightEyebrow;
      head.add(rightEyebrow);

      // Detailed nose
      const noseGeometry = new THREE.SphereGeometry(0.12, 12, 12);
      const nose = new THREE.Mesh(noseGeometry, skinMaterial);
      nose.position.set(0, -0.1, 0.9);
      nose.scale.set(0.8, 1.3, 0.7);
      head.add(nose);
      
      // Nostrils
      const nostrilGeometry = new THREE.SphereGeometry(0.025, 8, 8);
      const nostrilMaterial = skinMaterial.clone();
      nostrilMaterial.color = nostrilMaterial.color.clone().multiplyScalar(0.7);
      
      const leftNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
      leftNostril.position.set(-0.05, -0.18, 0.98);
      head.add(leftNostril);
      
      const rightNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
      rightNostril.position.set(0.05, -0.18, 0.98);
      head.add(rightNostril);

      // Highly detailed mouth for lip sync
      const createDetailedMouth = () => {
        const mouthGroup = new THREE.Group();
        
        // Lip material with subtle color
        const lipMaterial = new THREE.MeshPhongMaterial({ 
          color: skinTone.clone().offsetHSL(0, 0.3, -0.1),
          shininess: 40
        });
        
        // Upper lip with more segments for better animation
        const upperLipGeometry = new THREE.SphereGeometry(0.15, 16, 12);
        upperLipGeometry.scale(1.3, 0.5, 0.8);
        const upperLip = new THREE.Mesh(upperLipGeometry, lipMaterial);
        upperLip.position.y = 0.03;
        mouthGroup.add(upperLip);
        
        // Lower lip
        const lowerLipGeometry = new THREE.SphereGeometry(0.16, 16, 12);
        lowerLipGeometry.scale(1.2, 0.6, 0.7);
        const lowerLip = new THREE.Mesh(lowerLipGeometry, lipMaterial);
        lowerLip.position.y = -0.05;
        mouthGroup.add(lowerLip);
        
        // Mouth interior (teeth and tongue visible during speech)
        const teethGeometry = new THREE.BoxGeometry(0.25, 0.08, 0.1);
        const teethMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xf5f5dc,
          shininess: 60
        });
        const teeth = new THREE.Mesh(teethGeometry, teethMaterial);
        teeth.position.set(0, 0.02, 0.05);
        teeth.visible = false;
        mouthGroup.add(teeth);
        
        // Tongue for advanced speech animation
        const tongueGeometry = new THREE.SphereGeometry(0.12, 12, 8);
        tongueGeometry.scale(1.2, 0.8, 1.5);
        const tongueMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xcc6666,
          shininess: 20
        });
        const tongue = new THREE.Mesh(tongueGeometry, tongueMaterial);
        tongue.position.set(0, -0.05, 0.02);
        tongue.visible = false;
        mouthGroup.add(tongue);
        
        // Mouth cavity
        const cavityGeometry = new THREE.SphereGeometry(0.08, 12, 8);
        const cavityMaterial = new THREE.MeshPhongMaterial({ color: 0x2a1810 });
        const cavity = new THREE.Mesh(cavityGeometry, cavityMaterial);
        cavity.scale.set(1.8, 1, 1);
        cavity.visible = false;
        mouthGroup.add(cavity);
        
        return mouthGroup;
      };
      
      const mouth = createDetailedMouth();
      mouth.position.set(0, -0.4, 0.9);
      facialFeatures.mouth = mouth;
      head.add(mouth);

      // Add facial structure details
      const cheekGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const cheekMaterial = skinMaterial.clone();
      cheekMaterial.color = cheekMaterial.color.clone().offsetHSL(0, 0.1, 0.05);
      
      const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
      leftCheek.position.set(-0.6, -0.1, 0.7);
      leftCheek.scale.set(1, 0.8, 0.6);
      head.add(leftCheek);
      
      const rightCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
      rightCheek.position.set(0.6, -0.1, 0.7);
      rightCheek.scale.set(1, 0.8, 0.6);
      head.add(rightCheek);

      return { headGroup, head, facialFeatures };
    };

    const { headGroup, head, facialFeatures } = createDetailedHead();
    scene.add(headGroup);

    // Enhanced lighting for close-up detail
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(2, 3, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.6);
    fillLight.position.set(-2, 1, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(baseColor, 0.8);
    rimLight.position.set(-1, 2, -2);
    scene.add(rimLight);

    // Position camera for close-up face shot
    camera.position.set(0, 0, 4);
    camera.lookAt(0, 0, 0);

    // Advanced lip sync animation
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      const time = Date.now();
      
      // Advanced lip sync based on voice level and phoneme patterns
      applyAdvancedLipSync(facialFeatures, voiceLevel, time);
      
      // Apply facial expressions based on agent mood
      applyCloseUpExpression(facialFeatures, agent.mood || 'neutral', time);
      
      // Realistic head movement during speech
      if (voiceLevel > 0.1) {
        applySpeechHeadMovement(head, voiceLevel, time);
      }
      
      renderer.render(scene, camera);
      
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId;
      }
    };

    // Advanced lip sync function with phoneme-like movements
    const applyAdvancedLipSync = (features: typeof facialFeatures, level: number, time: number) => {
      if (level < 0.05) {
        // Mouth closed when not speaking
        features.mouth.scale.y = 1;
        features.mouth.scale.x = 1;
        features.mouth.rotation.z = 0;
        
        // Hide teeth and tongue
        features.mouth.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            const material = child.material as THREE.MeshPhongMaterial;
            if (material.color.getHex() === 0xf5f5dc || material.color.getHex() === 0xcc6666) {
              child.visible = false;
            }
          }
        });
        return;
      }

      // Create phoneme-like mouth shapes based on voice level and time
      const speechFreq = time * 0.02;
      const vowelShape = Math.sin(speechFreq) * 0.5 + 0.5;
      const consonantShape = Math.sin(speechFreq * 1.7 + 1) * 0.5 + 0.5;
      const bilabialShape = Math.sin(speechFreq * 2.3 + 2) * 0.5 + 0.5;
      
      // Blend different mouth shapes based on voice activity
      const openness = level * (vowelShape * 0.6 + consonantShape * 0.3);
      const width = level * (consonantShape * 0.4 + bilabialShape * 0.6);
      const pucker = bilabialShape * level * 0.3;
      
      // Apply mouth deformations for realistic speech
      features.mouth.scale.y = 1 + openness * 0.8;
      features.mouth.scale.x = 1 + width * 0.6 - pucker * 0.4;
      features.mouth.scale.z = 1 - pucker * 0.3;
      
      // Asymmetric mouth movement for natural speech
      features.mouth.rotation.z = (vowelShape - 0.5) * level * 0.1;
      features.mouth.position.y = -0.4 - openness * 0.05;
      
      // Show teeth for open mouth positions
      const teethMesh = features.mouth.children.find(child => 
        child instanceof THREE.Mesh && 
        (child.material as THREE.MeshPhongMaterial).color.getHex() === 0xf5f5dc
      );
      if (teethMesh) {
        teethMesh.visible = openness > 0.3;
        teethMesh.scale.y = 0.5 + openness * 0.5;
      }
      
      // Show tongue for certain mouth positions
      const tongueMesh = features.mouth.children.find(child => 
        child instanceof THREE.Mesh && 
        (child.material as THREE.MeshPhongMaterial).color.getHex() === 0xcc6666
      );
      if (tongueMesh) {
        tongueMesh.visible = openness > 0.4 && consonantShape > 0.6;
        tongueMesh.position.z = 0.02 + consonantShape * 0.08;
        tongueMesh.scale.y = 0.8 + consonantShape * 0.3;
      }
      
      // Show mouth cavity for wide open positions
      const cavityMesh = features.mouth.children.find(child => 
        child instanceof THREE.Mesh && 
        (child.material as THREE.MeshPhongMaterial).color.getHex() === 0x2a1810
      );
      if (cavityMesh) {
        cavityMesh.visible = openness > 0.5;
        cavityMesh.scale.x = 1.8 + openness * 0.5;
        cavityMesh.scale.y = 1 + openness * 0.8;
      }
    };

    // Close-up facial expressions with more detail
    const applyCloseUpExpression = (features: typeof facialFeatures, mood: string, time: number) => {
      if (!features.leftEyebrow || !features.rightEyebrow) return;
      
      const microMovement = Math.sin(time * 0.001) * 0.01;
      const expressionIntensity = 0.4;
      
      // Enhanced blinking for close-up
      const blinkCycle = Math.sin(time * 0.003);
      const isBlinking = blinkCycle > 0.97;
      
      if (isBlinking) {
        features.leftEye.scale.y = 0.1;
        features.rightEye.scale.y = 0.1;
      } else {
        features.leftEye.scale.y = 1;
        features.rightEye.scale.y = 1;
      }
      
      // Apply mood-specific expressions with more detail for close-up
      switch (mood.toLowerCase()) {
        case 'happy':
        case 'excited':
          features.leftEyebrow.rotation.z = 0.1 + expressionIntensity * 0.8;
          features.rightEyebrow.rotation.z = -0.1 - expressionIntensity * 0.8;
          features.leftEye.scale.y = isBlinking ? 0.1 : 0.8;
          features.rightEye.scale.y = isBlinking ? 0.1 : 0.8;
          features.mouth.rotation.z = 0.12 + Math.sin(time * 0.002) * 0.03;
          break;
          
        case 'focused':
          features.leftEyebrow.rotation.z = 0.1 - expressionIntensity * 0.7;
          features.rightEyebrow.rotation.z = -0.1 + expressionIntensity * 0.7;
          features.leftEye.scale.y = isBlinking ? 0.1 : 0.85;
          features.rightEye.scale.y = isBlinking ? 0.1 : 0.85;
          break;
          
        case 'surprised':
          features.leftEyebrow.rotation.z = 0.1 + expressionIntensity * 2.5;
          features.rightEyebrow.rotation.z = -0.1 - expressionIntensity * 2.5;
          features.leftEye.scale.setScalar(isBlinking ? 0.1 : 1.6);
          features.rightEye.scale.setScalar(isBlinking ? 0.1 : 1.6);
          break;
          
        default:
          features.leftEyebrow.rotation.z = 0.1 + microMovement;
          features.rightEyebrow.rotation.z = -0.1 - microMovement;
          if (!isBlinking) {
            features.leftEye.scale.setScalar(1 + microMovement * 0.5);
            features.rightEye.scale.setScalar(1 + microMovement * 0.5);
          }
      }
    };

    // Realistic head movement during speech
    const applySpeechHeadMovement = (headMesh: THREE.Mesh, level: number, time: number) => {
      const intensity = level * 0.8;
      
      // Natural head nods and tilts while speaking
      headMesh.rotation.x = Math.sin(time * 0.008) * intensity * 0.08;
      headMesh.rotation.y = Math.sin(time * 0.006) * intensity * 0.06;
      headMesh.rotation.z = Math.sin(time * 0.005) * intensity * 0.03;
      
      // Slight head movement forward/back with speech rhythm
      headMesh.position.z = Math.sin(time * 0.01) * intensity * 0.02;
      headMesh.position.y = Math.sin(time * 0.009) * intensity * 0.01;
    };

    animate();

    sceneRef.current = {
      scene,
      renderer,
      camera,
      head,
      facialFeatures,
      animationId: 0
    };

    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        if (mountRef.current && sceneRef.current.renderer.domElement) {
          mountRef.current.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current.renderer.dispose();
        
        // Dispose all resources
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
  }, [isVisible, agent, voiceLevel]);

  // Initialize audio context for real-time voice analysis
  useEffect(() => {
    if (isVisible && !audioContext) {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyserNode = context.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.8;
        
        setAudioContext(context);
        setAnalyser(analyserNode);
      } catch (error) {
        console.warn('Could not initialize audio context for voice analysis:', error);
      }
    }
    
    return () => {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [isVisible, audioContext]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[3000] flex items-center justify-center">
      <Card className="relative bg-card/95 backdrop-blur-sm border-primary/20 p-6 max-w-md w-full mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
        >
          <X size={20} className="text-foreground" />
        </button>
        
        {/* Agent info */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {agent.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Speaking...
          </p>
        </div>
        
        {/* 3D Avatar close-up */}
        <div className="flex justify-center mb-4">
          <div 
            ref={mountRef} 
            className="relative bg-gradient-to-br from-background/50 to-card/50 rounded-lg overflow-hidden border border-border/50"
            style={{ width: 400, height: 400 }}
          />
        </div>
        
        {/* Voice level indicator */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground text-center">
            Voice Activity
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100 ease-out"
              style={{ width: `${Math.min(voiceLevel * 100, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Speaking indicator */}
        <div className="flex items-center justify-center mt-4 space-x-2">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-pulse"
                style={{ 
                  animationDelay: `${i * 200}ms`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground ml-2">
            {agent.name} is speaking
          </span>
        </div>
      </Card>
    </div>
  );
}