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
      
<<<<<<< HEAD
      await this.producer.send({
=======
      const result = await this.producer.send({
>>>>>>> de654ff6c73672cae5d2583f5c4c73b310f58448
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

<<<<<<< HEAD
=======
      console.log(`✅ Mensagem enviada para o tópico '${topic}':`, {
        partition: result[0].partition,
        offset: result[0].baseOffset,
        timestamp: result[0].timestamp
      });

>>>>>>> de654ff6c73672cae5d2583f5c4c73b310f58448
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem para o tópico '${topic}':`, error);
      throw error;
    }
  }

<<<<<<< HEAD
=======
  async sendBatch(topic: string, messages: SellerResponse[]): Promise<void> {
    try {
      await this.connect();
      
      const kafkaMessages = messages.map(message => ({
        key: message.id?.toString() || '',
        value: JSON.stringify(message),
        timestamp: Date.now().toString(),
        headers: {
          'content-type': 'application/json',
          'source': 'pier-service-job'
        }
      }));

      const results = await this.producer.send({
        topic,
        messages: kafkaMessages
      });

      console.log(`✅ Lote de ${messages.length} mensagens enviado para o tópico '${topic}':`, {
        totalMessages: messages.length,
        partitions: results.map((result: { partition: any; }) => result.partition),
        offsets: results.map((result: { baseOffset: any; }) => result.baseOffset)
      });

    } catch (error) {
      console.error(`❌ Erro ao enviar lote de mensagens para o tópico '${topic}':`, error);
      throw error;
    }
  }

>>>>>>> de654ff6c73672cae5d2583f5c4c73b310f58448
  async getStatus(): Promise<{ connected: boolean; producerId: string }> {
    return {
      connected: this.isConnected,
      producerId: this.producer.producerId || ''
    };
  }
}