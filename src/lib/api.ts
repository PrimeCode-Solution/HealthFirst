import axios from "axios";
import { toast } from "sonner";
const baseURL = process.env.NEXT_PUBLIC_API_URL || "/api";

const api = axios.create({
  baseURL: baseURL,
  timeout: 20000, 
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
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

      if (status >= 500) {
        toast.error("Erro interno do servidor. Tente novamente.");
      } else if (status === 401) {
      }

      const message = apiError.message || apiError.error || "Erro desconhecido";
      
      const customError: any = new Error(message);
      customError.status = status;
      customError.response = error.response;
      
      return Promise.reject(customError);
      
    } else if (error.request) {
      console.error("Erro de conexão (Request):", error.request);
      toast.error("Erro de conexão. Verifique se o servidor está rodando.");
      return Promise.reject(new Error("Erro de conexão"));
    }

    return Promise.reject(error);
  },
);

export default api;