import { Kafka, Partitioners } from 'kafkajs';
import { env } from '@/env';

const kafka = new Kafka({
  clientId: 'pier-service-job',
  brokers: [env.KAFKA_BROKER],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

export { kafka, Partitioners };