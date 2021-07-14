import { useEffect } from "react";
import { createContext, useContext, useReducer } from "react";
import * as THREE from "three";

type Action =
  | {
      type: "INIT";
      renderer: THREE.WebGLRenderer;
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      domElement: HTMLElement;
    }
  | {
      type: "SET_RAF";
      previousRAF: number;
    };

type Dispatch = (action: Action) => void;

type State = {
  previousRAF: number | undefined;
  renderer: THREE.WebGLRenderer | undefined;
  scene: THREE.Scene | undefined;
  domElement: HTMLElement | undefined;
  camera: THREE.PerspectiveCamera | undefined;
  player: any;
  entities: Array<THREE.Mesh> | undefined;
  sceneLoaded: boolean;
  something: Array<any> | undefined;
};

const initialState = {
  previousRAF: undefined,
  renderer: undefined,
  scene: undefined,
  camera: undefined,
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
      };
    case "SET_RAF":
      return {
        ...state,
        previousRAF: action.previousRAF,
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

  const value = { state, dispatch };
  return (
    <ThreeContext.Provider value={value}>{children}</ThreeContext.Provider>
  );
};

export { ThreeContext, ThreeProvider };

export const useThreeScene = () => {
  const context = useContext(ThreeContext);

  if (context === undefined) {
    throw new Error("Three Context error in ThreeScene hook");
  }

  const initScene = () => {
    const renderer = new THREE.WebGLRenderer();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const windowAspect = width / height;
    renderer.setSize(width, height);
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(65, windowAspect, 0.1, 1000);
    camera.position.z = 5;
    const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    scene.add(light);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20000, 20000, 10, 10),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    ground.position.y = -1;
    ground.castShadow = false;
    ground.receiveShadow = true;
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const domElement = renderer.domElement;

    dispatch({ type: "INIT", renderer, scene, camera, domElement });

    document.body.appendChild(domElement);
  };

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
        const previousRAF = state.previousRAF ? state.previousRAF : t;
        step(t - previousRAF);
        state.renderer.render(state.scene, state.camera);
        dispatch({ type: "SET_RAF", previousRAF });
      }
      setTimeout(() => RAF(), 1);
    });
  };

  const { dispatch, state } = context;

  useEffect(() => {
    if (state.renderer) {
      RAF();
    }

    return () =>
      cancelAnimationFrame(state.previousRAF ? state.previousRAF : 0);
  }, [state.renderer]);

  return { initScene, RAF };
};
