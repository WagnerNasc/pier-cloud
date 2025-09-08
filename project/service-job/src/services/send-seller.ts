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

      for (let i = 0; i < sellers.length; i++) {
        const seller = sellers[i];
        try {
          await this.kafkaSender.sendMessage('SELLER_MESSAGE', seller);
          successCount++;
        } catch (individualError) {
          console.error(`❌ Erro ao enviar vendedor ${seller.id}:`, individualError);
          errorCount++;
        }
      }

      const duration = Date.now() - startTime;

      console.log('✅ Exportação concluída:', {
        totalProcessed: sellers.length,
        successCount,
        errorCount,
        duration: `${duration}ms`
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
}

export { SendSellerService };