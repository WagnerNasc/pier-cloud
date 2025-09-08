import { env } from "@/env";
import { AxiosResponse } from "axios";
import api from "@/config/axios";
import { SellerResponse } from "./types/responses/seller.type";

export class SellersProvider {
  async get() {
    const response: AxiosResponse<SellerResponse[]> = 
      await api.get(env.EXTERNAL_API_URL + '/vendedores');

    return response.data;
  }

  async getById(id: string) {
    const response: AxiosResponse<SellerResponse> = 
      await api.get(env.EXTERNAL_API_URL + `/vendedores/${id}`);
    return response.data;
  }
}
