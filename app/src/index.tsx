import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { ThreeProvider } from "./contexts/Three";

ReactDOM.render(
  <React.StrictMode>
    <ThreeProvider>
      <App />
    </ThreeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
