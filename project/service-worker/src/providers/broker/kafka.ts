import { Kafka, Partitioners } from 'kafkajs';
import { env } from '@/env';

const kafka = new Kafka({
  clientId: 'pier-service-worker',
  brokers: [env.KAFKA_BROKER],
  requestTimeout: 10000,
  connectionTimeout: 3000,
  retry: {
    initialRetryTime: 300,
    retries: 3,
    maxRetryTime: 10000,
    multiplier: 2
  }
});

export { kafka, Partitioners };