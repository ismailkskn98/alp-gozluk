"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { Box3, Group, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MODEL_URL = "/mustang_sunglasses_-_mu_1683.glb";

function prepareModel(sourceScene) {
  const model = sourceScene.clone(true);

  model.getObjectByName("Light")?.removeFromParent();
  model.getObjectByName("Camera")?.removeFromParent();
  model.updateMatrixWorld(true);

  const modelBounds = new Box3().setFromObject(model);
  const modelSize = modelBounds.getSize(new Vector3());
  const modelCenter = modelBounds.getCenter(new Vector3());
  const lensCenter = model.getObjectByName("Plane")
    ? new Box3().setFromObject(model.getObjectByName("Plane")).getCenter(new Vector3())
    : modelCenter;
  const normalizedModel = new Group();

  model.position.set(-modelCenter.x, -modelCenter.y, -lensCenter.z);
  normalizedModel.scale.setScalar(1 / modelSize.x);
  normalizedModel.add(model);
  normalizedModel.traverse((object) => {
    if (object.isMesh) object.frustumCulled = false;
  });

  return normalizedModel;
}

function SunglassesModel({ onReady }) {
  const motionGroupRef = useRef(null);
  const { scene } = useLoader(GLTFLoader, MODEL_URL);
  const invalidate = useThree((state) => state.invalidate);
  const viewport = useThree((state) => state.viewport);
  const model = useMemo(() => prepareModel(scene), [scene]);

  useEffect(() => {
    const group = motionGroupRef.current;
    if (!group) return undefined;

    onReady({
      group,
      invalidate,
      viewport: {
        width: viewport.width,
        height: viewport.height,
      },
    });
    invalidate();

    return () => onReady(null);
  }, [invalidate, onReady, viewport.height, viewport.width]);

  return (
    <group ref={motionGroupRef}>
      <primitive object={model} dispose={null} />
    </group>
  );
}

export default function FooterGlasses3D({ onReady }) {
  return (
    <div data-footer-glasses-image className="h-full w-full">
      <Canvas
        camera={{ fov: 35, near: 0.1, far: 100, position: [0, 0, -6], rotation: [0, Math.PI, 0] }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        fallback={null}
        onCreated={({ gl }) => gl.setClearAlpha(0)}
      >
        <ambientLight intensity={1.7} />
        <directionalLight position={[0, 3, -4]} intensity={3.2} />
        <directionalLight position={[-4, -1, 1]} intensity={1.1} />
        <Suspense fallback={null}>
          <SunglassesModel onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}
