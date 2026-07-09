import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import App from "./app/App";
import HomePage from "./app/website/pages/HomePage";
import {
  AboutPage,
  BlogPage,
  CareersPage,
  ContactPage,
  FaqsPage,
  ProductsPage,
  SecurityPage,
} from "./app/website/pages";
import "./styles/index.css";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/products", element: <ProductsPage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/faqs", element: <FaqsPage /> },
  { path: "/security-center", element: <SecurityPage /> },
  { path: "/careers", element: <CareersPage /> },
  { path: "/blog", element: <BlogPage /> },
  { path: "/ds", element: <App /> },
  { path: "*", element: <HomePage /> },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
