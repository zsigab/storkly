import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "@/api";
import { useAuth } from "./useAuth";

export function useLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      const { data, error } = await api.POST("/api/auth/login", { body: values });
      if (error !== undefined) throw error;
      if (data === undefined || data === null) throw new Error("No response from server");
      return data;
    },
    onSuccess: (data) => {
      login(data);
      void queryClient.invalidateQueries();
      void navigate("/");
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await api.POST("/api/auth/logout", {});
      if (error !== undefined) throw error;
    },
    onSettled: () => {
      logout();
      queryClient.clear();
      void navigate("/");
    },
  });
}
