import { kafka } from "./kafka";

export class KafkaConsumer {
  private consumer: any;
  private isConnected = false;

  constructor() {
    this.consumer = kafka.consumer({ 
      groupId: 'pier-service-worker',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxWaitTimeInMs: 1000,
      rebalanceTimeout: 60000,
      maxBytesPerPartition: 1048576,
      minBytes: 1,
      maxBytes: 10485760
    });

  }

  private async waitForKafka(): Promise<void> {
    const admin = kafka.admin();
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`🔍 Verificando se Kafka está pronto... (tentativa ${attempts + 1}/${maxAttempts})`);
        await admin.connect();
        const topics = await admin.listTopics();
        console.log('📋 Tópicos disponíveis:', topics);
        await admin.disconnect();
        console.log('✅ Kafka está pronto!');
        return;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error('❌ Kafka não ficou disponível após várias tentativas');
          throw new Error('Kafka não está disponível');
        }
        console.log(`⏳ Aguardando Kafka ficar disponível... (${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  private async ensureTopicExists(topic: string): Promise<void> {
    const admin = kafka.admin();
    try {
      await admin.connect();
      const topics = await admin.listTopics();
      
      if (!topics.includes(topic)) {
        console.log(`🔧 Criando tópico: ${topic}`);
        await admin.createTopics({
          topics: [{
            topic: topic,
            numPartitions: 1,
            replicationFactor: 1
          }]
        });
        console.log(`✅ Tópico '${topic}' criado com sucesso`);
      } else {
        console.log(`✅ Tópico '${topic}' já existe`);
      }
    } finally {
      await admin.disconnect();
    }
  }

  async connect() {
    if (!this.isConnected) {
      try {
        await this.waitForKafka();
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
      
      // Garante que o tópico existe antes de tentar consumi-lo
      await this.ensureTopicExists(topic);
      
      // Aguarda um pouco mais para garantir que o consumer está estável
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`🔗 Fazendo subscribe no tópico: ${topic}`);
      await this.consumer.subscribe({ topic, fromBeginning: false });
      
      console.log(`🎯 Começando a consumir tópico: ${topic}`);
      
      await this.consumer.run({
        partitionsConsumedConcurrently: 1,
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const messageValue = message.value?.toString();
            
            console.log(`✅ Mensagem recebida:`, {
              topic,
              partition,
              offset: message.offset,
              key: message.key?.toString(),
              value: messageValue
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