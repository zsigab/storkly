import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { flushSync } from "react-dom";
import { api } from "@/api";
import { useAuth } from "./useAuth";
import { useTheme } from "./useTheme";

type DocWithVT = typeof document & { startViewTransition?: (cb: () => void) => void };

function navigateWithTransition(navigate: (path: string) => void, path: string): void {
  const vt = (document as DocWithVT).startViewTransition;
  if (vt !== undefined) {
    vt(() => {
      flushSync(() => {
        navigate(path);
      });
    });
  } else {
    navigate(path);
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
      login(user);
      void queryClient.invalidateQueries();
      navigateWithTransition(navigate, from ?? "/dashboard");
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
    mutationFn: async (email: string) => {
      const { error } = await api.POST("/api/auth/forgot-password", { body: { email } });
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
      logout();
      resetTheme();
      queryClient.clear();
      navigateWithTransition(navigate, "/");
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
