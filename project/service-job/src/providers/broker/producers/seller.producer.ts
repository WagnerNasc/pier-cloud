import { KafkaSender } from "@/providers/broker/producer";
import { SendSellerService } from "@/services/send-seller";

export const sellerProducer = async () => {
  try {
    const kafkaSender = new KafkaSender();
    const sendSellerService = new SendSellerService(kafkaSender);
    
    await sendSellerService.execute();
  } catch (error) {
    console.error('Erro no serviço de envio de vendedores:', error);
    throw error;
  }
};