import { env } from './env';
import express from 'express';
import { sellerProducer } from './providers/broker/producers/seller.producer';

const app = express();
app.use(express.json());

sellerProducer();

const PORT = env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


export async function gracefulShutdown() {
  server.close(() => {
    process.exit(0)
  });
} 

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export { app };