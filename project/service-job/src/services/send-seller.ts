import { SellersProvider } from "@/providers/api/pier-cloud/sellers";
import { KafkaSender } from "@/providers/broker/producer";

class SendSellerService {
  constructor(private readonly kafkaSender: KafkaSender) {}

  async execute() {
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    try {
      const sellers = await new SellersProvider().get();
      
      if (!sellers || sellers.length === 0) {
        console.log('Nenhum vendedor encontrado');
        return { 
          message: 'Nenhum vendedor encontrado',
          totalProcessed: 0,
          successCount: 0,
          errorCount: 0,
          duration: Date.now() - startTime
        };
      }

      await this.kafkaSender.connect();

      const BATCH_SIZE = 10;
      const batches = this.chunkArray(sellers, BATCH_SIZE);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processando lote ${i + 1}/${batches.length} (${batch.length} vendedores)`);

        try {
          await this.kafkaSender.sendBatch('seller', batch);
          successCount += batch.length;
        } catch (error) {
          console.error(`❌ Erro no lote ${i + 1}:`, error);
          errorCount += batch.length;
          
          for (const seller of batch) {
            try {
              await this.kafkaSender.sendMessage('SELLER_MESSAGE', seller);
              successCount++;
              errorCount--;
            } catch (individualError) {
              console.error(`❌ Erro ao enviar vendedor individual ${seller.id}:`, individualError);
            }
          }
        }
      }

      const duration = Date.now() - startTime;
      const status = await this.kafkaSender.getStatus();

      console.log('✅ Exportação concluída:', {
        totalProcessed: sellers.length,
        successCount,
        errorCount,
        duration: `${duration}ms`,
        kafkaStatus: status
      });

      return {
        message: 'Exportação concluída',
        totalProcessed: sellers.length,
        successCount,
        errorCount,
        duration
      };

    } catch (error) {
      console.error('❌ Erro geral na exportação:', error);
      return { 
        message: 'Erro na exportação de vendedores',
        totalProcessed: successCount + errorCount,
        successCount,
        errorCount,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    } finally {
      try {
        await this.kafkaSender.disconnect();
      } catch (disconnectError) {
        console.error('❌ Erro ao desconectar do Kafka:', disconnectError);
      }
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export { SendSellerService };