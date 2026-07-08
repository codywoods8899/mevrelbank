import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import HomePage from "./app/website/pages/HomePage";
import App from "./app/App";
import "./styles/index.css";

const router = createBrowserRouter([
  // Public website — primary deliverable
  { path: "/", element: <HomePage /> },
  // Design system & product demo — development reference
  { path: "/ds", element: <App /> },
  // Fallback: redirect unknown routes to homepage
  { path: "*", element: <HomePage /> },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
