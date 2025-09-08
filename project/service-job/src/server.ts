import { env } from './env';
import express from 'express';
<<<<<<< HEAD
import { SendSellerService } from './services/send-seller.service';
=======
import { SendSellerService } from './services/send-seller';
>>>>>>> de654ff6c73672cae5d2583f5c4c73b310f58448
import { KafkaSender } from './providers/broker/producer';

const app = express();
app.use(express.json());

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
<<<<<<< HEAD
  console.log(`Server is running on port ${PORT}`);
=======
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`📡 Kafka Broker: ${env.KAFKA_BROKER}`);
>>>>>>> de654ff6c73672cae5d2583f5c4c73b310f58448
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
