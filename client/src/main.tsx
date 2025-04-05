import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

console.log("Application starting...");

// Get the root element
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Could not find root element!");
} else {
  try {
    console.log("Creating React root...");
    const root = createRoot(rootElement);
    
    console.log("Rendering app...");
    root.render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    console.log("App rendered successfully");
  } catch (error) {
    console.error("Error rendering the app:", error);
  }
}
