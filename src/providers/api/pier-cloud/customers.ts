import { env } from "@/env";
import { AxiosResponse } from "axios";
import api from "../../../config/axios";
import { CustomerResponse } from "./types/responses/customer.type";

export class CustomersProvider {
  async get() {
    const response: AxiosResponse<CustomerResponse[]> = 
      await api.get( env.EXTERNAL_API_URL + '/clientes');

    return response.data;
  }

  async getById(id: string) {
    const response: AxiosResponse<CustomerResponse> = 
      await api.get(env.EXTERNAL_API_URL + `/clientes/${id}`);
    return response.data;
  }
}
