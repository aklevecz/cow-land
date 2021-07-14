import { useEffect } from "react";
import { createContext, useContext, useReducer } from "react";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from "three";
import { useState } from "react";
import { LOOK_AT_PIZZA, PIZZA_FBX } from "./constants";
import { useCallback } from "react";

type Entity = THREE.Mesh | THREE.Group;

type Action =
  | {
      type: "INIT";
      renderer: THREE.WebGLRenderer;
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      domElement: HTMLElement;
      controls: OrbitControls;
    }
  | { type: "ADD_ENITITIES"; entities: Entity[] };

type Dispatch = (action: Action) => void;

type State = {
  previousRAF: number | undefined;
  renderer: THREE.WebGLRenderer | undefined;
  scene: THREE.Scene | undefined;
  domElement: HTMLElement | undefined;
  camera: THREE.PerspectiveCamera | undefined;
  controls: OrbitControls | undefined;
  player: any;
  entities: Array<Entity>;
  sceneLoaded: boolean;
  something: Array<any> | undefined;
};

const initialState = {
  previousRAF: undefined,
  renderer: undefined,
  scene: undefined,
  camera: undefined,
  controls: undefined,
  domElement: undefined,
  player: undefined,
  entities: [],
  sceneLoaded: false,
  something: [],
};

const ThreeContext = createContext<
  { state: State; dispatch: Dispatch } | undefined
>(undefined);

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case "INIT":
      return {
        ...state,
        renderer: action.renderer,
        scene: action.scene,
        camera: action.camera,
        sceneLoaded: true,
        controls: action.controls,
      };
    case "ADD_ENITITIES":
      return {
        ...state,
        entities: [...state.entities, ...action.entities],
      };
    default:
      return state;
  }
};

const ThreeProvider = ({
  children,
}: {
  children: JSX.Element | JSX.Element[];
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadFBX = (path: string) => {
    const loader = new FBXLoader();
    loader.load(path, (object) => {
      if (state.scene === undefined) {
        return console.log("no scene");
      }
      // This could be removed and they could just be loaded first
      state.scene.add(object);

      dispatch({ type: "ADD_ENITITIES", entities: [object] });
    });
  };

  useEffect(() => {
    if (state.scene) {
      loadFBX(PIZZA_FBX);
    }
    //eslint-disable-next-line
  }, [state.scene]);

  const value = { state, dispatch };
  return (
    <ThreeContext.Provider value={value}>{children}</ThreeContext.Provider>
  );
};

export { ThreeContext, ThreeProvider };

export const useThreeScene = () => {
  const [previousRAF, setPreviousRAF] = useState(0);
  const context = useContext(ThreeContext);

  if (context === undefined) {
    throw new Error("Three Context error in ThreeScene hook");
  }

  const { dispatch, state } = context;

  const initScene = useCallback(() => {
    const renderer = new THREE.WebGLRenderer();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const windowAspect = width / height;
    renderer.setSize(width, height);
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    const domElement = renderer.domElement;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(65, windowAspect, 0.1, 1000);
    const { x, y, z } = LOOK_AT_PIZZA;
    camera.position.set(x, y, z);

    const controls = new OrbitControls(camera, domElement);
    controls.autoRotate = true;
    controls.update();

    const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0xfffff, 1);
    scene.add(ambient);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // const ground = new THREE.Mesh(
    //   new THREE.PlaneGeometry(20000, 20000, 10, 10),
    //   new THREE.MeshLambertMaterial({ color: 0xffffff })
    // );
    // ground.position.y = -1;
    // ground.castShadow = false;
    // ground.receiveShadow = true;
    // ground.rotation.x = -Math.PI / 2;
    // scene.add(ground);

    dispatch({ type: "INIT", renderer, scene, camera, domElement, controls });

    document.body.appendChild(domElement);
  }, [dispatch]);

  const step = (timeElapsed: number) => {
    const timeElapsedS = Math.min(1.0, 30, timeElapsed * 0.001);
    if (state.player) {
      state.player.update(timeElapsedS);
    }
  };

  const RAF = () => {
    requestAnimationFrame((t) => {
      if (state.renderer === undefined) {
        return console.log("no renderer");
      }
      if (state.scene === undefined) {
        return console.log("no scene");
      }
      if (state.camera === undefined) {
        return console.log("no camera");
      }
      if (state.sceneLoaded) {
        const _previousRAF = previousRAF ? previousRAF : t;
        step(t - _previousRAF);
        state.renderer.render(state.scene, state.camera);
        state.controls && state.controls.update();
        setPreviousRAF(_previousRAF);
      }
      setTimeout(() => RAF(), 1);
    });
  };

  useEffect(() => {
    if (state.renderer) {
      RAF();
    }

    return () =>
      cancelAnimationFrame(state.previousRAF ? state.previousRAF : 0);
    //eslint-disable-next-line
  }, [state.renderer]);

  return { initScene, RAF };
};
