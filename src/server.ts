import cors from 'cors';
import { env } from './env';
import express from 'express';
import { router } from './routes/reports.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { app };
