import { env } from "@/env";
import { AxiosResponse } from "axios";
import api from "@/config/axios";
import { ProductResponse } from "./types/responses/product.type";

export class ProductsProvider {
  async get() {
    const response: AxiosResponse<ProductResponse[]> = 
      await api.get(env.EXTERNAL_API_URL + '/produtos');

    return response.data;
  }

  async getById(id: string) {
    const response: AxiosResponse<ProductResponse> = 
      await api.get(env.EXTERNAL_API_URL + `/produtos/${id}`);
    return response.data;
  }
}
