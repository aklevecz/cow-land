import { useEffect } from "react";
import "./App.css";
import { useThreeScene } from "./contexts/Three";

function App() {
  const threeScene = useThreeScene();
  useEffect(() => {
    threeScene.initScene();
    // threeScene.RAF();
  }, []);
  return <div className="App"></div>;
}

export default App;
