import { env } from "@/env";
import { AxiosResponse } from "axios";
import api from "@/config/axios";
import { SaleResponse } from "./types/responses/sale.type";

export class SalesProvider {
  async get() {
    const response: AxiosResponse<SaleResponse[]> = 
      await api.get(env.EXTERNAL_API_URL + '/vendas');

    return response.data;
  }
}
