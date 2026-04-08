/**
 * BrainVisualization.jsx
 * 
 * 3D animated brain with glowing neurons, synapse connections,
 * and bloom post-processing. Features a left/right hemisphere color 
 * split (blue/cyan vs red/orange) and a connected brain stem.
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import './BrainVisualization.css';

// ─── Color Palettes ────────────────────────────────────────────────────────

const THEME_COLORS = [
  new THREE.Color('#4F7CFF'), // Glowing electric blue
  new THREE.Color('#6FA8FF'), // Soft blue
  new THREE.Color('#8FB9FF'), // Light soft blue
];

function getPositionColor(x, y, z) {
  return THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)].clone();
}

// ─── Neural Network Data Generation ──────────────────────────────────────────

/**
 * Generates randomised neuron positions within a precise brain volume,
 * matching the shape of hemispheres and brain stem.
 */
function generateNeuralData(nodeCount = 2800, maxConnections = 7000) {
  const nodes = [];
  const nodeColors = [];
  const nodeSizes = [];

  while (nodes.length < nodeCount) {
    const x = (Math.random() - 0.5) * 2.8; 
    const y = (Math.random() - 0.5) * 3.2; // Increase Y range for brain stem
    const z = (Math.random() - 0.5) * 2.8; 

    // Base Ellipsoid (Main Brain Mass)
    const ellipsoid = (x * x) / (1.2 * 1.2) + (y * y) / (1.0 * 1.0) + (z * z) / (1.3 * 1.3);
    
    // Brain Stem (cylinder dropping down from bottom-center back)
    let isStem = false;
    const stemMaxRadius = 0.22;
    // Condition for stem: y is negative, z is slightly back, x is central
    if (y < -0.5 && y > -2.2 && Math.abs(x) < stemMaxRadius && z > -0.6 && z < 0.2) {
        // Taper the stem so it gets thinner as it goes down
        const currentRadius = stemMaxRadius * (1.0 - (Math.abs(y + 0.5) / 2.0));
        if (Math.abs(x) < currentRadius && Math.abs(z+0.2) < currentRadius) {
            isStem = true;
        }
    }

    // Ignore points outside the brain / stem volume
    if (ellipsoid > 1.0 && !isStem) continue;

    // Fissure (separates left and right hemispheres)
    const fissureWidth = 0.12;
    const fissureDepth = 0.6;
    if (!isStem && Math.abs(x) < fissureWidth && y > -fissureDepth) {
        if (Math.abs(x) < fissureWidth * ( (y + fissureDepth) / (1.0 + fissureDepth) )) {
             continue; // inside the gap
        }
    }

    // Temporal Lobes (bulges on bottom sides)
    if (!isStem) {
        if (y < -0.2 && Math.abs(x) < 0.4 && z > -0.2 && z < 0.6) {
           // Empty space between temporal lobes for the brain stem to emerge from
           if (y < -0.5) continue; 
        }
    }

    // Frontal tapering
    if (!isStem && z > 0.4 && Math.abs(x) > (1.2 - (z - 0.4) * 0.8) ) {
        continue;
    }

    // Surface density weighting - sharper outline
    const distToSurface = isStem ? Math.abs(x) / stemMaxRadius : 1.0 - Math.sqrt(ellipsoid);
    if (!isStem && Math.random() > 0.05 && distToSurface > 0.15) {
      continue; // heavily hollow out the inside to create a sharp shell
    }

    const pos = new THREE.Vector3(x, y, z);
    nodes.push(pos);
    
    // Add specific color mapping per node
    nodeColors.push(getPositionColor(x, y, z));
    
    // 3% chance of being a huge bright focal point (like the reference image)
    if (Math.random() > 0.97) {
      nodeSizes.push(Math.random() * 0.045 + 0.03); // Focal nodes
    } else {
      nodeSizes.push(Math.random() * 0.015 + 0.005); // Background nodes
    }
  }

  // Generate Synapses
  const connections = [];
  const CONNECT_DIST = 0.26; // Keeping lines tight

  const gridSize = 0.3;
  const grid = new Map();
  const getCell = (v) => `${Math.floor(v.x/gridSize)},${Math.floor(v.y/gridSize)},${Math.floor(v.z/gridSize)}`;
  
  nodes.forEach((n, i) => {
      const cell = getCell(n);
      if(!grid.has(cell)) grid.set(cell, []);
      grid.get(cell).push(i);
  });

  for (let i = 0; i < nodes.length && connections.length < maxConnections; i++) {
     const n1 = nodes[i];
     const cellKey = getCell(n1);
     const [cx, cy, cz] = cellKey.split(',').map(Number);
     
     for(let dx=-1; dx<=1; dx++){
        for(let dy=-1; dy<=1; dy++){
            for(let dz=-1; dz<=1; dz++){
                const neighborCellKey = `${cx+dx},${cy+dy},${cz+dz}`;
                const neighbors = grid.get(neighborCellKey);
                if(neighbors){
                    for(let j of neighbors){
                        if(j > i && connections.length < maxConnections) {
                            const n2 = nodes[j];
                            const dist = n1.distanceTo(n2);
                            if(dist < CONNECT_DIST) {
                                // Prefer connecting nodes of similar colors for cleaner sections
                                if(Math.random() < (1.0 - (dist/CONNECT_DIST)) * 0.8) {
                                    connections.push({ from: i, to: j });
                                }
                            }
                        }
                    }
                }
            }
        }
     }
  }

  return { nodes, nodeColors, nodeSizes, connections };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NeuralNodes({ nodes, nodeColors, nodeSizes }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    nodes.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.scale.setScalar(nodeSizes[i]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, nodeColors[i]);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [nodes, nodeColors, nodeSizes, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, nodes.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 8]} />
      {/* MeshBasicMaterial uses the instance colors automatically */}
      <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
    </instancedMesh>
  );
}

function SynapseLines({ nodes, nodeColors, connections }) {
  const geometry = useMemo(() => {
    const positions = [];
    const colors = [];

    connections.forEach(({ from, to }) => {
      const a = nodes[from];
      const b = nodes[to];
      const cA = nodeColors[from];
      const cB = nodeColors[to];
      
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      // Gradients between connected node colors
      colors.push(cA.r, cA.g, cA.b);
      colors.push(cB.r, cB.g, cB.b);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [nodes, nodeColors, connections]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.12}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

function SynapsePulses({ nodes, nodeColors, connections }) {
  const pulseData = useMemo(
    () =>
      connections.slice(0, 400).map(({ from, to }) => ({
        from,
        to,
        speed:  Math.random() * 0.8 + 0.2,
        offset: Math.random(),
        color: nodeColors[to], // Inherit destination color
      })),
    [connections, nodeColors]
  );

  const meshRef = useRef();
  const dummy   = useMemo(() => new THREE.Object3D(), []);
  const va      = useMemo(() => new THREE.Vector3(), []);
  const vb      = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    pulseData.forEach((p, i) => {
        meshRef.current.setColorAt(i, p.color);
    });
    if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [pulseData]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() * 0.4; // Slightly slower pulsing
    
    pulseData.forEach((p, i) => {
      const progress = ((t * p.speed + p.offset) % 1);
      va.copy(nodes[p.from]);
      vb.copy(nodes[p.to]);
      dummy.position.lerpVectors(va, vb, progress);
      // Pulses swell in the middle of the synapse
      const scale = Math.sin(progress * Math.PI) * 0.025;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, pulseData.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

function BrainAssembly() {
  const rotationRef = useRef();
  const { nodes, nodeColors, nodeSizes, connections } = useMemo(() => generateNeuralData(2800, 7000), []);

  useFrame(({ clock }) => {
    if (!rotationRef.current) return;
    // Gentle yaw rotation
    rotationRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    // Slight pitch toggle
    rotationRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.5) * 0.05;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.02} floatIntensity={0.3}>
      <group ref={rotationRef} scale={1.05}>
        <NeuralNodes    nodes={nodes} nodeColors={nodeColors} nodeSizes={nodeSizes} />
        <SynapseLines   nodes={nodes} nodeColors={nodeColors} connections={connections} />
        <SynapsePulses  nodes={nodes} nodeColors={nodeColors} connections={connections} />
      </group>
    </Float>
  );
}

/** Full Three.js scene */
function Scene() {
  return (
    <>
      <BrainAssembly />

      <EffectComposer>
        <Bloom
          intensity={2.2}
          luminanceThreshold={0.05}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.85}
        />
      </EffectComposer>
    </>
  );
}

// ─── Exported Component ────────────────────────────────────────────────────────

export default function BrainVisualization() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 48 }}
        gl={{
          antialias:  true,
          alpha:      true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        dpr={[1, 2]} 
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
