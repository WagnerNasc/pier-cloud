const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  },
  requestTimeout: 30000,
  connectionTimeout: 10000
});

const producer = kafka.producer({
  allowAutoTopicCreation: true,
  maxInFlightRequests: 1,
  idempotent: true,
  transactionTimeout: 30000,
});

async function testSendSellers() {
  try {
    await producer.connect();
    console.log('✅ Producer conectado');

    const testSellers = [
      {
        id: 1,
        name: 'João Silva',
        email: 'joao@exemplo.com',
        phone: '11999999999'
      },
      {
        id: 2,
        name: 'Maria Santos',
        email: 'maria@exemplo.com',
        phone: '11888888888'
      },
      {
        id: 3,
        name: 'Pedro Costa',
        email: 'pedro@exemplo.com',
        phone: '11777777777'
      }
    ];

    for (const seller of testSellers) {
      const result = await producer.send({
        topic: 'seller',
        messages: [
          {
            key: seller.id.toString(),
            value: JSON.stringify(seller),
            timestamp: Date.now().toString(),
            headers: {
              'content-type': 'application/json',
              'source': 'test-script'
            }
          }
        ]
      });

      console.log(`✅ Mensagem enviada para seller ${seller.name}:`, {
        partition: result[0].partition,
        offset: result[0].baseOffset,
        timestamp: result[0].timestamp
      });

      // Aguardar um pouco entre mensagens
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await producer.disconnect();
    console.log('✅ Producer desconectado');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testSendSellers();
