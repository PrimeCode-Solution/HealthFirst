import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Função para obter o token (será definida dinamicamente)
let getTokenFunction: (() => Promise<string | null>) | null = null;

// Função para configurar o token getter
export const setTokenGetter = (tokenGetter: () => Promise<string | null>) => {
  getTokenFunction = tokenGetter;
};

// Interceptor de request para adicionar token automaticamente
api.interceptors.request.use(
  async (config) => {
    if (getTokenFunction) {
      try {
        const token = await getTokenFunction();
        console.log(token);
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Erro ao obter token:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.data) {
      const apiError = error.response.data;
      const status = error.response.status;

      // Apenas alguns erros mostram toast automaticamente
      if (status >= 500) {
        // Erros de servidor sempre mostram toast
        toast.error("Erro interno do servidor. Tente novamente.");
      } else if (status === 401) {
        // Não autorizado
        toast.error("Sessão expirada. Faça login novamente.");
        // Redirecionar para login se necessário
      }
      // 400, 422, etc. deixa para o componente decidir

      return Promise.reject(new Error(apiError.message || apiError.error));
    } else if (error.request) {
      toast.error("Erro de conexão. Verifique sua internet.");
      return Promise.reject(new Error("Erro de conexão"));
    }

    return Promise.reject(error);
  },
);

export default api;