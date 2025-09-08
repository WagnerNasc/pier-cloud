import { env } from './env';
import express from 'express';
import { KafkaSender } from './providers/broker/producer';
import { SendSellerService } from './services/send-seller';

const app = express();
app.use(express.json());

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const runSendSellerJob = async () => {
  try {
    const kafkaSender = new KafkaSender();
    const sendSellerService = new SendSellerService(kafkaSender);
    
    await sendSellerService.execute();
  } catch (error) {
    console.error('Erro no serviço de envio de vendedores:', error);
    throw error;
  }
};

runSendSellerJob();

export { app };