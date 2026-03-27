// import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/virtual-tour-plugin/index.css";
import 'react-modern-drawer/dist/index.css';
import 'sweetalert2/dist/sweetalert2.css';

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
    <App />
  // </StrictMode>,
)
