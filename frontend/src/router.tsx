import { createBrowserRouter } from "react-router";
import { Layout } from "@/components/common/Layout";
import { RequireAuth } from "@/components/common/RequireAuth";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { CreateRegistryPage } from "@/pages/registry/CreateRegistryPage";
import { EditRegistryPage } from "@/pages/registry/EditRegistryPage";
import { RegistryPage } from "@/pages/registry/RegistryPage";
import { AddItemPage } from "@/pages/registry/AddItemPage";
import { EditItemPage } from "@/pages/registry/EditItemPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "verify-email", element: <VerifyEmailPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      {
        path: "dashboard",
        element: (
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: "registry/new",
        element: (
          <RequireAuth>
            <CreateRegistryPage />
          </RequireAuth>
        ),
      },
      { path: "r/:slug", element: <RegistryPage /> },
      {
        path: "r/:slug/edit",
        element: (
          <RequireAuth>
            <EditRegistryPage />
          </RequireAuth>
        ),
      },
      {
        path: "r/:slug/items/new",
        element: (
          <RequireAuth>
            <AddItemPage />
          </RequireAuth>
        ),
      },
      {
        path: "r/:slug/items/:id/edit",
        element: (
          <RequireAuth>
            <EditItemPage />
          </RequireAuth>
        ),
      },
    ],
  },
]);
