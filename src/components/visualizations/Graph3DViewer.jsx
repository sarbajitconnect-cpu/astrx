import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Rotate3d, Play, Pause, Grid, Layers, RotateCcw } from "lucide-react";

/**
 * Compiles a mathematical formula z = f(x, y) into a JS function
 */
function createSurfaceFunction(rawStr) {
  if (!rawStr || typeof rawStr !== "string") {
    return (x, y) => Math.sin(Math.sqrt(x*x + y*y));
  }

  let clean = rawStr.trim();
  clean = clean.replace(/^(?:z\s*=\s*|f\(x,\s*y\)\s*=\s*)/i, "");
  clean = clean.replace(/\^/g, "**");
  clean = clean.replace(/(\d+)\s*([a-zA-Z\(])/g, "$1 * $2");
  clean = clean.replace(/(\))\s*([a-zA-Z\d\(])/g, "$1 * $2");
  clean = clean.replace(/([xyXY])\s*([a-zA-Z\d\(])/g, "$1 * $2");

  clean = clean.replace(/\bsin\b/gi, "Math.sin");
  clean = clean.replace(/\bcos\b/gi, "Math.cos");
  clean = clean.replace(/\btan\b/gi, "Math.tan");
  clean = clean.replace(/\bsqrt\b/gi, "Math.sqrt");
  clean = clean.replace(/\babs\b/gi, "Math.abs");
  clean = clean.replace(/\bexp\b/gi, "Math.exp");
  clean = clean.replace(/\b(?:ln|log)\b/gi, "Math.log");
  clean = clean.replace(/\bpi\b/gi, "Math.PI");

  try {
    const fn = new Function("x", "y", `
      try {
        const val = ${clean};
        if (typeof val !== "number" || isNaN(val) || !isFinite(val)) return 0;
        return Math.max(-10, Math.min(10, val));
      } catch (e) {
        return 0;
      }
    `);
    fn(0, 0);
    return fn;
  } catch (err) {
    return (x, y) => Math.sin(x) * Math.cos(y);
  }
}

export default function Graph3DViewer({
  formula = "sin(sqrt(x^2 + y^2))",
  title = "3D Interactive Surface",
  type = "surface", // "surface" | "curve" | "shape"
  curvePoints = null
}) {
  const mountRef = useRef(null);
  const [isRotating, setIsRotating] = useState(true);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [colorScheme, setColorScheme] = useState("cyan-amber"); // "cyan-amber" | "emerald" | "monochrome"

  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    isMouseDown: false,
    prevMouse: { x: 0, y: 0 },
    rotation: { x: 0.6, y: 0.8 },
    zoom: 8,
    isRotating: true
  });

  useEffect(() => {
    stateRef.current.isRotating = isRotating;
  }, [isRotating]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = 340;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e141f);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.5);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // 5. Grid Helper
    const gridHelper = new THREE.GridHelper(6, 12, 0x475569, 0x1e293b);
    gridHelper.position.y = -1.8;
    scene.add(gridHelper);

    // 6. Geometry generation
    const fn = createSurfaceFunction(formula);
    const size = 50;
    const geometry = new THREE.PlaneGeometry(4, 4, size - 1, size - 1);
    geometry.rotateX(-Math.PI / 2);

    const posAttr = geometry.attributes.position;
    const colors = [];

    let minZ = Infinity;
    let maxZ = -Infinity;
    const zValues = [];

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const zCoord = posAttr.getZ(i);
      const y = fn(x, zCoord);
      posAttr.setY(i, y);
      zValues.push(y);
      if (y < minZ) minZ = y;
      if (y > maxZ) maxZ = y;
    }
    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();

    // Height gradient coloring
    const span = Math.max(0.01, maxZ - minZ);
    for (let i = 0; i < posAttr.count; i++) {
      const normY = (zValues[i] - minZ) / span;
      let col = new THREE.Color();
      if (colorScheme === "emerald") {
        col.setHSL(0.35 + normY * 0.25, 0.8, 0.5);
      } else if (colorScheme === "monochrome") {
        col.setHSL(0.6, 0.1, 0.3 + normY * 0.6);
      } else {
        // Cyan to Amber
        col.setHSL(0.55 - normY * 0.45, 0.85, 0.55);
      }
      colors.push(col.r, col.g, col.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    // Material
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.3,
      metalness: 0.2,
      wireframe: wireframeMode,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    stateRef.current = {
      ...stateRef.current,
      scene,
      camera,
      renderer,
      mesh
    };

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (stateRef.current.isRotating && !stateRef.current.isMouseDown) {
        stateRef.current.rotation.y += 0.006;
      }

      // Apply orbital rotation
      const rot = stateRef.current.rotation;
      const dist = stateRef.current.zoom;
      camera.position.x = dist * Math.sin(rot.y) * Math.cos(rot.x);
      camera.position.y = dist * Math.sin(rot.x);
      camera.position.z = dist * Math.cos(rot.y) * Math.cos(rot.x);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [formula, wireframeMode, colorScheme]);

  // Orbit drag events
  const handleMouseDown = (e) => {
    stateRef.current.isMouseDown = true;
    stateRef.current.prevMouse = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!stateRef.current.isMouseDown) return;
    const dx = e.clientX - stateRef.current.prevMouse.x;
    const dy = e.clientY - stateRef.current.prevMouse.y;
    stateRef.current.prevMouse = { x: e.clientX, y: e.clientY };

    stateRef.current.rotation.y -= dx * 0.01;
    stateRef.current.rotation.x = Math.max(-1.4, Math.min(1.4, stateRef.current.rotation.x + dy * 0.01));
  };

  const handleMouseUp = () => {
    stateRef.current.isMouseDown = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    stateRef.current.zoom = Math.max(3, Math.min(20, stateRef.current.zoom + e.deltaY * 0.01));
  };

  const handleReset = () => {
    stateRef.current.rotation = { x: 0.6, y: 0.8 };
    stateRef.current.zoom = 8;
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0e141f] shadow-2xl select-none">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#161e2c]/70 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Rotate3d size={16} className="text-sky-400 animate-spin" style={{ animationDuration: "10s" }} />
          <span className="text-xs font-medium font-victor text-white/90">
            {title || `z = ${formula}`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60">
          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            title={wireframeMode ? "Solid Mode" : "Wireframe Mode"}
            className={`p-1.5 rounded transition-colors cursor-pointer ${wireframeMode ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/70"}`}
          >
            <Layers size={14} />
          </button>

          <button
            onClick={() => setIsRotating(!isRotating)}
            title={isRotating ? "Pause Auto-Rotation" : "Resume Auto-Rotation"}
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            {isRotating ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <button
            onClick={handleReset}
            title="Reset Camera"
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div 
        ref={mountRef}
        className="relative w-full h-[340px] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-[#161e2c]/40 text-[11px] font-victor text-white/50">
        <span className="font-mono text-white/70">z = {formula}</span>
        <span className="italic text-[10px] text-white/40">Drag to orbit 3D surface • Scroll to zoom</span>
      </div>
    </div>
  );
}
