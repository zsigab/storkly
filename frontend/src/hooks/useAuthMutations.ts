import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { flushSync } from "react-dom";
import { api } from "@/api";
import { useAuth } from "./useAuth";
import { useTheme } from "./useTheme";

type DocWithVT = typeof document & { startViewTransition?: (cb: () => void) => void };

// Wraps a DOM-mutation callback in document.startViewTransition (if available).
// flushSync inside ensures React commits synchronously so the browser captures
// the correct before/after snapshots for the animation.
function startWithTransition(callback: () => void): void {
  const doc = document as DocWithVT;
  if (doc.startViewTransition !== undefined) {
    doc.startViewTransition(() => {
      flushSync(callback);
    });
  } else {
    callback();
  }
}

export function useLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: {
      email: string;
      password: string;
      rememberMe?: boolean;
      from?: string;
    }) => {
      const { data, error } = await api.POST("/api/auth/login", {
        body: {
          email: values.email,
          password: values.password,
          ...(values.rememberMe !== undefined && { rememberMe: values.rememberMe }),
        },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return { user: data, from: values.from };
    },
    onSuccess: ({ user, from }) => {
      void queryClient.invalidateQueries();
      startWithTransition(() => {
        login(user);
        navigate(from ?? "/dashboard");
      });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (values: {
      email: string;
      password: string;
      displayName: string;
      captchaToken: string;
    }) => {
      const { error } = await api.POST("/api/auth/register", { body: values });
      if (error !== undefined) throw error;
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { error } = await api.POST("/api/auth/verify-email", { body: { token } });
      if (error !== undefined) throw error;
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (values: { email: string; captchaToken: string }) => {
      const { error } = await api.POST("/api/auth/forgot-password", { body: values });
      if (error !== undefined) throw error;
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await api.POST("/api/auth/request-password-reset", {});
      if (error !== undefined) throw error;
    },
  });
}

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (values: { token: string; newPassword: string }) => {
      const { error } = await api.POST("/api/auth/reset-password", { body: values });
      if (error !== undefined) throw error;
    },
    onSuccess: () => {
      void navigate("/login");
    },
  });
}

export function useLogout() {
  const { logout } = useAuth();
  const { resetTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await api.POST("/api/auth/logout", {});
      if (error !== undefined) throw error;
    },
    onSettled: () => {
      startWithTransition(() => {
        logout();
        resetTheme();
        navigate("/");
      });
      queryClient.clear();
    },
  });
}

export function useUpdateDisplayName() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (displayName: string) => {
      const { data, error } = await api.PATCH("/api/users/me/display-name", {
        body: { displayName },
      });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    onSuccess: (user) => {
      login(user);
    },
  });
}
