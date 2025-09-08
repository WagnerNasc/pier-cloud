import { env } from './env';
import express from 'express';
import { SendSellerService } from './services/send-seller';
import { KafkaSender } from './providers/broker/producer';

const app = express();
app.use(express.json());

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`📡 Kafka Broker: ${env.KAFKA_BROKER}`);
});

const runSendSellerJob = async () => {
  try {
    const kafkaSender = new KafkaSender();
    const sendSellerService = new SendSellerService(kafkaSender);
    
    const result = await sendSellerService.execute();
    console.log('Retorno da job:', result);
  } catch (error) {
    console.error('Erro no job de exportação:', error);
  }
};

runSendSellerJob();

export { app };
