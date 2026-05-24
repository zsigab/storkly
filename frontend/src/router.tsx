import { createBrowserRouter, Outlet } from "react-router";
import { Layout } from "@/components/common/Layout";
import { RequireAuth } from "@/components/common/RequireAuth";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RouteErrorPage } from "@/pages/RouteErrorPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { CreateRegistryPage } from "@/pages/registry/CreateRegistryPage";
import { EditRegistryPage } from "@/pages/registry/EditRegistryPage";
import { RegistryPage } from "@/pages/registry/RegistryPage";
import { AddItemPage } from "@/pages/registry/AddItemPage";
import { EditItemPage } from "@/pages/registry/EditItemPage";
import { ClaimsDashboardPage } from "@/pages/registry/ClaimsDashboardPage";
import { OAuthCallbackPage } from "@/pages/auth/OAuthCallbackPage";
import { UnclaimPage } from "@/pages/UnclaimPage";
import { ConfirmClaimPage } from "@/pages/ConfirmClaimPage";
import { MyClaimsPage } from "@/pages/MyClaimsPage";
import { PublicEventPage } from "@/pages/PublicEventPage";
import { CreateEventPage } from "@/pages/event/CreateEventPage";
import { EditEventPage } from "@/pages/event/EditEventPage";
import { RsvpPage } from "@/pages/RsvpPage";
import { RsvpConfirmPage } from "@/pages/RsvpConfirmPage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { DataDeletionPage } from "@/pages/DataDeletionPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "login", element: <LoginPage /> },
          { path: "oauth/callback", element: <OAuthCallbackPage /> },
          { path: "un-claim", element: <UnclaimPage /> },
          { path: "claim/confirm", element: <ConfirmClaimPage /> },
          { path: "register", element: <RegisterPage /> },
          { path: "verify-email", element: <VerifyEmailPage /> },
          { path: "forgot-password", element: <ForgotPasswordPage /> },
          { path: "reset-password", element: <ResetPasswordPage /> },
          { path: "r/:slug", element: <RegistryPage /> },
          { path: "e/:id", element: <PublicEventPage /> },
          { path: "rsvp/confirm", element: <RsvpConfirmPage /> },
          { path: "rsvp/:token", element: <RsvpPage /> },
          { path: "privacy", element: <PrivacyPolicyPage /> },
          { path: "data-deletion", element: <DataDeletionPage /> },
          {
            element: (
              <RequireAuth>
                <Outlet />
              </RequireAuth>
            ),
            children: [
              { path: "profile", element: <ProfilePage /> },
              { path: "my-claims", element: <MyClaimsPage /> },
              { path: "dashboard", element: <DashboardPage /> },
              { path: "registry/new", element: <CreateRegistryPage /> },
              { path: "r/:slug/edit", element: <EditRegistryPage /> },
              { path: "r/:slug/items/new", element: <AddItemPage /> },
              { path: "r/:slug/items/:id/edit", element: <EditItemPage /> },
              { path: "r/:slug/claims", element: <ClaimsDashboardPage /> },
              { path: "event/new", element: <CreateEventPage /> },
              { path: "e/:id/edit", element: <EditEventPage /> },
            ],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
