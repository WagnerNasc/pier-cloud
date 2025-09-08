import { kafka, Partitioners } from "./kafka";
import { SellerResponse } from "../api/pier-cloud/types/responses/seller.type";

export class KafkaSender {
  private producer: any;
  private isConnected = false;

  constructor() {
    this.producer = kafka.producer({
      allowAutoTopicCreation: true,
      createPartitioner: Partitioners.LegacyPartitioner,
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.producer.connect();
        this.isConnected = true;
        console.log('✅ Kafka producer conectado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao conectar com Kafka:', error);
        throw error;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.producer.disconnect();
        this.isConnected = false;
        console.log('✅ Kafka producer desconectado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao desconectar do Kafka:', error);
        throw error;
      }
    }
  }

  async sendMessage(topic: string, message: SellerResponse): Promise<void> {
    try {
      await this.connect();
      
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.id?.toString() || '',
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
            headers: {
              'content-type': 'application/json',
              'source': 'pier-service-job'
            }
          }
        ]
      });

    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem para o tópico '${topic}':`, error);
      throw error;
    }
  }


  async getStatus(): Promise<{ connected: boolean; producerId: string }> {
    return {
      connected: this.isConnected,
      producerId: this.producer.producerId || ''
    };
  }
}