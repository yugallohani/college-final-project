import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Neuron {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  connections: number[];
  pulsePhase: number;
}

interface Pulse {
  fromNeuron: number;
  toNeuron: number;
  progress: number;
  speed: number;
}

const BrainAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const neuronsRef = useRef<Neuron[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize neurons in a brain-like shape
    const initializeNeurons = () => {
      const neurons: Neuron[] = [];
      const centerX = canvas.clientWidth / 2;
      const centerY = canvas.clientHeight / 2;
      const brainWidth = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.7;
      const brainHeight = brainWidth * 0.75;

      // Create brain regions with different densities
      const regions = [
        { name: 'frontal', centerX: centerX - brainWidth * 0.15, centerY: centerY - brainHeight * 0.2, neurons: 25 },
        { name: 'parietal', centerX: centerX + brainWidth * 0.1, centerY: centerY - brainHeight * 0.25, neurons: 20 },
        { name: 'temporal', centerX: centerX - brainWidth * 0.2, centerY: centerY + brainHeight * 0.1, neurons: 18 },
        { name: 'occipital', centerX: centerX + brainWidth * 0.25, centerY: centerY + brainHeight * 0.15, neurons: 15 },
        { name: 'cerebellum', centerX: centerX + brainWidth * 0.3, centerY: centerY + brainHeight * 0.3, neurons: 12 }
      ];

      regions.forEach((region, regionIndex) => {
        for (let i = 0; i < region.neurons; i++) {
          // Create brain-like distribution within each region
          const angle = (Math.PI * 2 * i) / region.neurons + regionIndex * 0.5;
          const radiusVariation = 0.3 + Math.random() * 0.7;
          
          // Brain shape using organic curves
          const regionRadius = (brainWidth / 8) * (1 + regionIndex * 0.1);
          const x = region.centerX + Math.cos(angle) * regionRadius * radiusVariation;
          const y = region.centerY + Math.sin(angle) * regionRadius * radiusVariation * 0.8;
          
          // Add 3D depth with layered positioning
          const z = (Math.random() - 0.5) * 150 + regionIndex * 20;

          neurons.push({
            x: Math.max(50, Math.min(canvas.clientWidth - 50, x)),
            y: Math.max(50, Math.min(canvas.clientHeight - 50, y)),
            z,
            vx: (Math.random() - 0.5) * 0.15,
            vy: (Math.random() - 0.5) * 0.15,
            vz: (Math.random() - 0.5) * 0.15,
            size: 1.5 + Math.random() * 2.5 + (regionIndex === 0 ? 1 : 0), // Frontal lobe slightly larger
            connections: [],
            pulsePhase: Math.random() * Math.PI * 2
          });
        }
      });

      // Create connections between nearby neurons with brain-like patterns
      neurons.forEach((neuron, i) => {
        neurons.forEach((otherNeuron, j) => {
          if (i !== j) {
            const dx = neuron.x - otherNeuron.x;
            const dy = neuron.y - otherNeuron.y;
            const dz = neuron.z - otherNeuron.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Create more connections in frontal regions (first 25 neurons)
            const maxConnections = i < 25 ? 5 : 3;
            const connectionDistance = i < 25 ? 100 : 80;
            
            if (distance < connectionDistance && neuron.connections.length < maxConnections) {
              neuron.connections.push(j);
            }
          }
        });
      });

      neuronsRef.current = neurons;
    };

    initializeNeurons();

    // Animation loop
    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      const neurons = neuronsRef.current;
      const pulses = pulsesRef.current;

      // Update neuron positions with subtle movement
      neurons.forEach((neuron) => {
        neuron.x += neuron.vx;
        neuron.y += neuron.vy;
        neuron.z += neuron.vz;
        neuron.pulsePhase += 0.02;

        // Bounce off edges
        if (neuron.x < 50 || neuron.x > canvas.clientWidth - 50) neuron.vx *= -1;
        if (neuron.y < 50 || neuron.y > canvas.clientHeight - 50) neuron.vy *= -1;
      });

      // Create new pulses randomly with brain-like firing patterns
      if (Math.random() < 0.04 && pulses.length < 20) {
        const fromNeuron = Math.floor(Math.random() * neurons.length);
        const neuron = neurons[fromNeuron];
        if (neuron.connections.length > 0) {
          const toNeuron = neuron.connections[Math.floor(Math.random() * neuron.connections.length)];
          pulses.push({
            fromNeuron,
            toNeuron,
            progress: 0,
            speed: 0.012 + Math.random() * 0.008
          });
        }
      }

      // Update pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        pulse.progress += pulse.speed;
        
        if (pulse.progress >= 1) {
          pulses.splice(i, 1);
        }
      }

      // Draw connections
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)'; // Indigo with low opacity
      ctx.lineWidth = 0.8;
      
      neurons.forEach((neuron, i) => {
        neuron.connections.forEach((connectionIndex) => {
          const connectedNeuron = neurons[connectionIndex];
          if (connectedNeuron) {
            ctx.beginPath();
            ctx.moveTo(neuron.x, neuron.y);
            ctx.lineTo(connectedNeuron.x, connectedNeuron.y);
            ctx.stroke();
          }
        });
      });

      // Draw pulses
      pulses.forEach((pulse) => {
        const fromNeuron = neurons[pulse.fromNeuron];
        const toNeuron = neurons[pulse.toNeuron];
        
        if (fromNeuron && toNeuron) {
          const x = fromNeuron.x + (toNeuron.x - fromNeuron.x) * pulse.progress;
          const y = fromNeuron.y + (toNeuron.y - fromNeuron.y) * pulse.progress;
          
          // Pulse glow
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)'); // Bright indigo
          gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.4)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Pulse core
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw neurons
      neurons.forEach((neuron) => {
        const pulseIntensity = Math.sin(neuron.pulsePhase) * 0.3 + 0.7;
        const size = neuron.size * pulseIntensity;
        
        // Neuron glow
        const gradient = ctx.createRadialGradient(neuron.x, neuron.y, 0, neuron.x, neuron.y, size * 2);
        gradient.addColorStop(0, `rgba(59, 130, 246, ${0.6 * pulseIntensity})`);
        gradient.addColorStop(0.7, `rgba(59, 130, 246, ${0.2 * pulseIntensity})`);
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Neuron core
        ctx.fillStyle = `rgba(147, 197, 253, ${pulseIntensity})`;
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Neuron center
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      {/* Brain outline SVG */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg 
          width="80%" 
          height="80%" 
          viewBox="0 0 200 160" 
          className="opacity-20"
        >
          <path
            d="M50 80 C30 60, 30 40, 50 30 C70 20, 90 25, 100 35 C110 25, 130 20, 150 30 C170 40, 170 60, 150 80 C170 100, 170 120, 150 130 C130 140, 110 135, 100 125 C90 135, 70 140, 50 130 C30 120, 30 100, 50 80 Z"
            fill="none"
            stroke="rgba(99, 102, 241, 0.3)"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
          {/* Cerebellum */}
          <circle
            cx="160"
            cy="110"
            r="15"
            fill="none"
            stroke="rgba(99, 102, 241, 0.2)"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        </svg>
      </div>
      
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/10 to-purple-500/5 rounded-2xl pointer-events-none" />
    </div>
  );
};

export default BrainAnimation;