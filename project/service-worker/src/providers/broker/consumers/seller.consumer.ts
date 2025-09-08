import { KafkaConsumer } from "@/providers/broker/kafka.consumer";

export const sellerConsumer = async () => {
  try {
    const kafkaConsumer = new KafkaConsumer();
    await kafkaConsumer.consume('SELLER_MESSAGE');

  } catch (error) {
    console.error('Erro ao consumir mensagem de vendedores:', error);
  }
};
