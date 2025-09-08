import { Consumer } from "kafkajs";
import { kafka } from "./kafka";
import { ReportExportService } from "@/services/report-export.service";

export type SellerConsumer = {
  id: string;
  nome: string;
  telefone: string;
}

export class KafkaConsumer {
  private consumer: Consumer;
  private isConnected = false;

  constructor() {
    this.consumer = kafka.consumer({ 
      groupId: 'pier-service-worker',
    });

  }

  async connect() {
    if (!this.isConnected) {
      try {
      
        await this.consumer.connect();
        this.isConnected = true;
        console.log('✅ Kafka consumer conectado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao conectar consumer:', error);
        throw error;
      }
    }
  }

  async disconnect() {
    if (this.isConnected) {
      try {
        await this.consumer.disconnect();
        this.isConnected = false;
        console.log('✅ Kafka consumer desconectado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao desconectar consumer:', error);
        throw error;
      }
    }
  }

  async consume(topic: string ): Promise<void> {
    try {
      await this.connect();

      await this.consumer.subscribe({ topic, fromBeginning: false });
      
      await this.consumer.run({
        partitionsConsumedConcurrently: 1,
        eachMessage: async ({ topic, message }) => {
          try {
            const messageValue = message.value!.toString();
            const messageParsed = JSON.parse(messageValue) as SellerConsumer;

            if (topic === 'SELLER_MESSAGE') {
              const reportExport = new ReportExportService();
              await reportExport.exportReport(messageParsed);
            }
            
          } catch (error) {
            console.error(`❌ Erro ao processar mensagem do tópico '${topic}':`, error);
          }
        }
      });
      
    } catch (error) {
      console.error(`❌ Erro no consumer do tópico '${topic}':`, error);
      this.isConnected = false;
      throw error;
    }
  }

  async getStatus() {
    await this.connect();
    return {
      connected: this.isConnected
    };
  }
}