import { mkdirSync } from 'fs';
import { join } from 'path';
import { delay } from '@/util/delay.util';
import { createObjectCsvWriter } from 'csv-writer';
import { SalesProvider } from "@/providers/api/pier-cloud/sales";
import { SellersProvider } from "@/providers/api/pier-cloud/sellers";
import { ProductsProvider } from "@/providers/api/pier-cloud/products";
import { CustomersProvider } from "@/providers/api/pier-cloud/customers";
import { SaleResponse } from "@/providers/api/pier-cloud/types/responses/sale.type";
import { SellerResponse } from "@/providers/api/pier-cloud/types/responses/seller.type";
import { ProductResponse } from "@/providers/api/pier-cloud/types/responses/product.type";
import { CustomerResponse } from "@/providers/api/pier-cloud/types/responses/customer.type";

interface SaleAggregate extends SaleResponse {
  customer?: CustomerResponse;
  product?: ProductResponse;
  seller?: SellerResponse;
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

type DataType = 'customers' | 'products' | 'sellers';

class ReportExportService {
  private readonly DELAY_MS = 2000;
  private readonly BATCH_SIZE = 4;

  async exportReport(): Promise<Map<string, ConsolidatedSalesBySellerToCSV[]> | { message: string }> {
    try {
      const now = new Date(Date.now());
      now.setHours(now.getHours() - 3);
      console.log('Iniciando exportação de relatório', now.toISOString());
      
      const sales = await new SalesProvider().get();
      
      if (!sales || sales.length === 0) {
        return { message: 'Nenhuma venda encontrada' };
      }

      console.log(`Quantidade de vendas encontradas: ${sales.length}`);
      
      const salesWithData = await this.fetchRelatedData(sales);

      const salesBySeller = this.consolidateDataBySeller(salesWithData);
      
      console.log(`Gerando CSVs para ${salesBySeller.size} vendedores`);
      
      const generatedFiles: string[] = [];

      for (const [sellerId, sellerSales] of salesBySeller) {
        const sellerName = sellerSales[0]?.seller_name || 'vendedor_desconhecido';
        
        const filePath = await this.generateCSVForSeller(sellerId, sellerName, sellerSales);
        generatedFiles.push(filePath);
    
        
        console.log(`CSV gerado para ${sellerName}: ${sellerSales.length}`);
      }

      return {
        message: `Exportação concluída! ${generatedFiles.length} arquivos CSV gerados.`,
      };

    } catch (error: any) {
      console.error('Erro na exportação:', error.message);
      throw new Error(`Falha na exportação: ${error.message}`);
    }
  }

  private async fetchRelatedData(sales: SaleAggregate[]): Promise<SaleAggregate[]> {
    
    const uniqueCustomerIds = [...new Set(sales.map(sale => sale.cliente_id))];
    const uniqueProductIds = [...new Set(sales.map(sale => sale.produto_id))];
    const uniqueSellerIds = [...new Set(sales.map(sale => sale.vendedor_id))];

    const [customers, products, sellers] = await Promise.all([
      this.fetchDataInBatches('customers', uniqueCustomerIds),
      this.fetchDataInBatches('products', uniqueProductIds),
      this.fetchDataInBatches('sellers', uniqueSellerIds)
    ]);

    return sales.map(sale => ({
      ...sale,
      customer: customers.find(customer => customer.id === sale.cliente_id),
      product: products.find(product => product.id === sale.produto_id),
      seller: sellers.find(seller => seller.id === sale.vendedor_id)
    }));
  }

  private async fetchDataInBatches(
    dataType: DataType, 
    ids: string[]
  ): Promise<any[]> {
    const results: any[] = [];
    
    const getProviderInstance = () => {
      switch (dataType) {
        case 'customers':
          return new CustomersProvider();
        case 'products':
          return new ProductsProvider();
        case 'sellers':
          return new SellersProvider();
        default:
          throw new Error(`Tipo de dados incorreto: ${dataType}`);
      }
    };
    
    for (let i = 0; i < ids.length; i += this.BATCH_SIZE) {
      const batch = ids.slice(i, i + this.BATCH_SIZE);

      const batchPromises = batch.map(async id => {
        const provider = getProviderInstance();
        return await provider.getById(id);
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      await delay(this.DELAY_MS);
      console.log(`Processado lote ${Math.floor(i / this.BATCH_SIZE) + 1}/${Math.ceil(ids.length / this.BATCH_SIZE)} para ${dataType}`);
    }
    
    return results;
  }

  private consolidateDataBySeller(sales: SaleAggregate[]) {
    const salesBySeller = new Map<string, ConsolidatedSalesBySellerToCSV[]>();

    sales.forEach(sale => {
      if (!sale.seller) return;

      const consolidatedSale: ConsolidatedSalesBySellerToCSV = {
        seller_id: sale.seller?.id,
        seller_name: sale.seller.nome,
        seller_phone: sale.seller.telefone,
        customer_id: sale.customer?.id,
        customer_name: sale.customer?.nome || 'N/A',
        customer_phone: sale.customer?.telefone || 'N/A',
        customer_email: sale.customer?.email || 'N/A',
        product_id: sale.product?.id,
        product_name: sale.product?.nome || 'N/A',
        price: sale.product?.preco,
        sku: sale.product?.sku
      };

      const sellerId = sale.seller?.id;
      if (!salesBySeller.has(sellerId)) {
        salesBySeller.set(sellerId, []);
      }
      salesBySeller.get(sellerId)!.push(consolidatedSale);
    });

    return salesBySeller;
  }

  private async generateCSVForSeller(
    sellerId: string,
    sellerName: string,
    sales: ConsolidatedSalesBySellerToCSV[]
  ): Promise<string> {
    const outputDir = join(process.cwd(), 'exports');

    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (error) {
      console.error('Erro na criação do diretório:', error.message);
      throw new Error(`Erro na criação do diretório: ${error.message}`);
    }

    const sellerNameInSnakeCase = sellerName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '_');
      
    const fileName = `vendas_${sellerNameInSnakeCase}_${sellerId}.csv`;
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

    await csvWriter.writeRecords(sales);
    return filePath;
  }

  private async validationDataExport() {
    const salesProvider = new SalesProvider();
    const sales = await salesProvider.get();

    if (!sales || sales.length === 0) {
      return { message: 'Nenhuma venda encontrada' };
    }
  
    const salesBySeller = sales.reduce<Record<string, number>>((acc, sale) => {
      acc[sale.vendedor_id] = (acc[sale.vendedor_id] || 0) + 1;
      return acc;
    }, {});
    return salesBySeller;
  }
}

export { ReportExportService };