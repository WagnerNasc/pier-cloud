import { mkdirSync } from 'fs';
import { join } from 'path';
import { delay } from '@/util/delay.util';
import { createObjectCsvWriter } from 'csv-writer';
import { SalesProvider } from "@/providers/api/pier-cloud/sales";
import { ProductsProvider } from "@/providers/api/pier-cloud/products";
import { CustomersProvider } from "@/providers/api/pier-cloud/customers";
import { SaleResponse } from "@/providers/api/pier-cloud/types/responses/sale.type";
import { ProductResponse } from "@/providers/api/pier-cloud/types/responses/product.type";
import { CustomerResponse } from "@/providers/api/pier-cloud/types/responses/customer.type";
import { SellerConsumer } from '@/providers/broker/kafka.consumer';

interface SaleAggregate extends SaleResponse {
  customer?: CustomerResponse;
  product?: ProductResponse;
}

interface ConsolidatedSalesBySellerToCSV {
  seller_id: string;
  seller_name: string;
  seller_phone: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  product_id: string;
  product_name: string;
  price: number;
  sku: string;
}

type DataType = 'customers' | 'products';

class ReportExportService {
  private readonly DELAY_MS = 2000;
  private readonly BATCH_SIZE = 4;

  async exportReport(seller: SellerConsumer): Promise<{ message: string; filePath?: string }> {
    try {
      const now = new Date(Date.now());
      now.setHours(now.getHours() - 3);
      console.log(`✅ Exportando relatório para vendedor ${seller.nome} (ID: ${seller.id})`, now.toISOString());

      if (!seller) {
        return { message: 'Nenhum seller encontrado' };
      }
      
      const allSales = await new SalesProvider().get();
      
      if (!allSales || allSales.length === 0) {
        return { message: 'Nenhuma venda encontrada' };
      }

      const sellerSales = allSales.filter(sale => sale.vendedor_id === seller.id);
      
      if (sellerSales.length === 0) {
        return { message: `Nenhuma venda encontrada para o vendedor ${seller.nome}` };
      }
      
      const salesWithData = await this.fetchRelatedData(sellerSales);
      const consolidatedSales = this.consolidateDataForSeller(salesWithData, seller);
      const filePath = await this.generateCSVForSeller(seller.id, seller.nome, consolidatedSales);

      return {
        message: `Exportação concluída para ${seller.nome}! Arquivo CSV gerado.`,
        filePath
      };

    } catch (error) {
      throw new Error(`Falha na exportação do relatório para ${seller.nome}: ${error.message}`);
    }
  }

  private async fetchRelatedData(sales: SaleAggregate[]): Promise<SaleAggregate[]> {
    if (!sales || sales.length === 0) {
      console.log('Nenhuma venda para buscar dados relacionados');
      return [];
    }

    const uniqueCustomerIds = [...new Set(sales.map(sale => sale.cliente_id))];
    const uniqueProductIds = [...new Set(sales.map(sale => sale.produto_id))];

    try {
      const [customers, products] = await Promise.all([
        this.fetchDataInBatches('customers', uniqueCustomerIds),
        this.fetchDataInBatches('products', uniqueProductIds),
      ]);

      return sales.map(sale => ({
        ...sale,
        customer: customers.find(customer => customer.id === sale.cliente_id),
        product: products.find(product => product.id === sale.produto_id),
      }));

    } catch (error) {
      console.error('Erro ao buscar dados relacionados:', error.message);
      throw new Error(`Falha ao buscar dados relacionados: ${error.message}`);
    }
  }

  private async fetchDataInBatches(
    dataType: DataType, 
    ids: string[]
  ): Promise<any[]> {
    if (!ids || ids.length === 0) {
      console.log(`Nenhum ID fornecido para ${dataType}`);
      return [];
    }

    const results: any[] = [];
    
    const getProviderInstance = () => {
      switch (dataType) {
        case 'customers':
          return new CustomersProvider();
        case 'products':
          return new ProductsProvider();
        default:
          throw new Error(`Tipo de dados incorreto: ${dataType}`);
      }
    };
    
    const totalBatches = Math.ceil(ids.length / this.BATCH_SIZE);
    
    for (let i = 0; i < ids.length; i += this.BATCH_SIZE) {
      const batch = ids.slice(i, i + this.BATCH_SIZE);
      const currentBatch = Math.floor(i / this.BATCH_SIZE) + 1;

      try {
        const batchPromises = batch.map(async id => {
          const provider = getProviderInstance();
          return await provider.getById(id);
        });
        
        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(result => result != null);
        results.push(...validResults);
        
        if (currentBatch < totalBatches) {
          await delay(this.DELAY_MS);
        }
      } catch (error) {
        console.error(`Erro no lote ${currentBatch} de ${dataType}:`, error.message);
      }
    }

    return results;
  }

  private consolidateDataForSeller(sales: SaleAggregate[], seller: SellerConsumer): ConsolidatedSalesBySellerToCSV[] {
    return sales.map(sale => ({
      seller_id: seller.id,
      seller_name: seller.nome,
      seller_phone: seller.telefone,
      customer_id: sale.customer?.id || 'N/A',
      customer_name: sale.customer?.nome || 'N/A',
      customer_phone: sale.customer?.telefone || 'N/A',
      customer_email: sale.customer?.email || 'N/A',
      product_id: sale.product?.id || 'N/A',
      product_name: sale.product?.nome || 'N/A',
      price: sale.product?.preco || 0,
      sku: sale.product?.sku || 'N/A'
    }));
  }

  private async generateCSVForSeller(
    sellerId: string,
    sellerName: string,
    sales: ConsolidatedSalesBySellerToCSV[]
  ): Promise<string> {
    const outputDir = join(process.cwd(), 'reports');

    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (error) {
      throw new Error(`Erro na criação do diretório: ${error.message}`);
    }


    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const sellerNameInSnakeCase = sellerName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
      
    const fileName = `vendas_${sellerNameInSnakeCase}_${sellerId}_${timestamp}.csv`;
    const filePath = join(outputDir, fileName);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'seller_id', title: 'ID do Vendedor' },
        { id: 'seller_name', title: 'Nome do Vendedor' },
        { id: 'seller_phone', title: 'Telefone do Vendedor' },
        { id: 'customer_id', title: 'ID do Cliente' },
        { id: 'customer_name', title: 'Cliente' },
        { id: 'customer_phone', title: 'Telefone do Cliente' },
        { id: 'customer_email', title: 'Email do Cliente' },
        { id: 'product_id', title: 'ID do Produto' },
        { id: 'product_name', title: 'Nome do Produto' },
        { id: 'price', title: 'Preço do Produto' },
        { id: 'sku', title: 'SKU do Produto' },
      ]
    });

    try {
      await csvWriter.writeRecords(sales);
      return filePath;
    } catch (error) {
      throw new Error(`Erro ao escrever arquivo CSV: ${error.message}`);
    }
  }
}

export { ReportExportService };