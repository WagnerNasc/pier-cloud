import { env } from './env';
import express from 'express';
import { createReportsRouter } from './routes/reports.route';
import { sellerConsumer } from './providers/broker/consumers/seller.consumer';

const app = express();
app.use(express.json());
app.use(createReportsRouter());

sellerConsumer();

const PORT = env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { app };
