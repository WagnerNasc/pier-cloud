import axios from "axios";
import { env } from "../env";

const api = axios.create({
  baseURL: env.EXTERNAL_API_URL,
  timeout: 5000,
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error("Erro na chamada da API:", error.message);
    return Promise.reject(error);
  }
);

export default api;