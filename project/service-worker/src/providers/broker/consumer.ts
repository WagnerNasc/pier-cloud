import { kafka } from "./kafka";

type SellerConsumer = {
  id: string;
  nome: string;
  telefone: string;
}

export class KafkaConsumer {
  private consumer: any;
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

  async consume(topic: string): Promise<any> {
    try {
      await this.connect();
      
      console.log(`🔗 Fazendo subscribe no tópico: ${topic}`);
      await this.consumer.subscribe({ topic, fromBeginning: false });
      
      console.log(`🎯 Começando a consumir tópico: ${topic}`);
      
      await this.consumer.run({
        partitionsConsumedConcurrently: 1,
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const messageValue = message.value!.toString();
            const messageParsed = JSON.parse(messageValue) as SellerConsumer;
            
            console.log(`✅ Mensagem recebida:`, {
              topic,
              partition,
              offset: message.offset,
              key: message.key?.toString(),
              value: messageParsed
            });
            
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