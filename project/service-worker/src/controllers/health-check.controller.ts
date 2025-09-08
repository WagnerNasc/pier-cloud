import { Request, Response } from "express";
import { KafkaConsumer } from "@/providers/broker/kafka.consumer";

export class HealthCheckController {
  private kafkaConsumer: KafkaConsumer;

  constructor(kafkaConsumer: KafkaConsumer) {
    this.kafkaConsumer = kafkaConsumer;
  }

  async execute(_req: Request, res: Response) {
    try {
      const status = await this.kafkaConsumer.getStatus();

      res.status(200).json(status);
    } catch (error) {
      res.status(500).json({ error: 'Health check failed.' });
    }
  }
}

