import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import App from "./app/App";
import HomePage from "./app/website/pages/HomePage";
import {
  AboutPage,
  AccountsPage,
  BeneficiariesPage,
  BlogPage,
  CareersPage,
  ContactPage,
  DashboardPage,
  FaqsPage,
  ForgotPasswordPage,
  LoginPage,
  MFAPage,
  NotificationsPage,
  ProductsPage,
  ProfilePage,
  RegisterPage,
  ResetPasswordPage,
  SecurityPage,
  StatementsPage,
  TransactionsPage,
  VerifyEmailPage,
  WaitlistPage,
} from "./app/website/pages";
import { AuthProvider } from "./app/context/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "./app/website/components/ProtectedRoute";
import DashboardLayout from "./app/website/components/DashboardLayout";
import "./styles/index.css";

const router = createBrowserRouter([
  // Public website
  { path: "/", element: <HomePage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/products", element: <ProductsPage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/faqs", element: <FaqsPage /> },
  { path: "/security-center", element: <SecurityPage /> },
  { path: "/careers", element: <CareersPage /> },
  { path: "/blog", element: <BlogPage /> },
  { path: "/waitlist", element: <WaitlistPage /> },
  // Auth flows — signed-in users are bounced straight to the dashboard
  { path: "/login", element: <PublicOnlyRoute><LoginPage /></PublicOnlyRoute> },
  { path: "/register", element: <PublicOnlyRoute><RegisterPage /></PublicOnlyRoute> },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/mfa", element: <MFAPage /> },
  // Customer dashboard — requires an authenticated session
  {
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/dashboard/accounts", element: <AccountsPage /> },
      { path: "/dashboard/transactions", element: <TransactionsPage /> },
      { path: "/dashboard/statements", element: <StatementsPage /> },
      { path: "/dashboard/beneficiaries", element: <BeneficiariesPage /> },
      { path: "/dashboard/profile", element: <ProfilePage /> },
      { path: "/dashboard/notifications", element: <NotificationsPage /> },
    ],
  },
  // Design system demo
  { path: "/ds", element: <App /> },
  { path: "*", element: <HomePage /> },
]);

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);
