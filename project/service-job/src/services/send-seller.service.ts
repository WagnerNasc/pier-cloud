import { SellersProvider } from "@/providers/api/pier-cloud/sellers";
import { KafkaSender } from "@/providers/broker/producer";

class SendSellerService {
  private BATCH_SIZE = 10;
  constructor(private readonly kafkaSender: KafkaSender) {}

  async execute() {
    const startTime = Date.now();
    let successCount = 0;

    try {
      const sellers = await new SellersProvider().get();
      
      if (!sellers || sellers.length === 0) {
        console.log('Nenhum vendedor encontrado');
        return { 
          message: 'Nenhum vendedor encontrado',
          totalProcessed: 0,
          successCount: 0,
          duration: Date.now() - startTime
        };
      }

      await this.kafkaSender.connect();

      const batches = this.chunkArray(sellers, this.BATCH_SIZE);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        for (const seller of batch) {
          try {
            await this.kafkaSender.sendMessage('SELLER_MESSAGE', seller);
            successCount++;
          } catch (individualError) {
            console.error(`❌ Erro ao enviar vendedor individual ${seller.id}:`, individualError);
          }
        } 
      }

      const duration = Date.now() - startTime;

      return {
        message: 'Exportação concluída',
        totalProcessed: sellers.length,
        successCount,
        duration
      };

    } catch (error) {
      return { 
        message: 'Erro na exportação de vendedores',
        totalProcessed: successCount,
        successCount,
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