import { env } from './env';
import express from 'express';
import { sellerProducer } from './providers/broker/producers/seller.producer';

const app = express();
app.use(express.json());

sellerProducer();

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { app };