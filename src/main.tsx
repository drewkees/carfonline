import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import './global';

createRoot(document.getElementById("root")!).render(<App />);
