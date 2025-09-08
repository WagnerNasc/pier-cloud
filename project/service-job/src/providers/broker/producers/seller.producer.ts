import { KafkaSender } from "@/providers/broker/producer";
import { gracefulShutdown } from "@/server";
import { SendSellerService } from "@/services/send-seller";

export const sellerProducer = async () => {  
  const kafkaSender = new KafkaSender();
  try {
    const sendSellerService = new SendSellerService(kafkaSender);
    
    await sendSellerService.execute();
  } catch (error) {
    console.error('Erro no serviço de envio de vendedores:', error);
  } finally {
    await kafkaSender.disconnect();
    await gracefulShutdown();
  }
};