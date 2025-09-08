import { env } from './env';
import express from 'express';
import { KafkaConsumer } from './providers/broker/consumer';
import { ReportExportService } from './services/report-export.service';
import { createReportsRouter } from './routes/reports.route';

const app = express();
app.use(express.json());

const PORT = env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const kafkaConsumer = new KafkaConsumer();
app.use(createReportsRouter(kafkaConsumer));

const runReportExportJob = async () => {
  try {
    await kafkaConsumer.consume('SELLER_MESSAGE');

  } catch (error) {
    console.error('Erro no job de exportação:', error);
  }
};

runReportExportJob();

export { app };
