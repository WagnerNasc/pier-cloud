# Pier Test - Microserviços de Processamento de Dados

## 🚩 Tecnologias

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Typescript](https://img.shields.io/badge/typescript-2f74c0?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-000?style=for-the-badge&logo=apachekafka)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

## 🔗 Descrição

Sistema distribuído composto por dois microserviços que processam dados de vendas através de comunicação assíncrona via Apache Kafka. O **Service-Job** coleta dados de vendedores da API da Pier Cloud e os envia para processamento, enquanto o **Service-Worker** consome essas mensagens e gera relatórios consolidados em formato CSV.

### Arquitetura dos Serviços

```
                   ┌─────────────────────────────────┐
                   │         Pier Cloud API          │
                   │  ┌─────────────────────────────┐│
                   │  │     Endpoints Disponíveis   ││
                   │  │ • GET /vendedores           ││
                   │  │ • GET /vendas               ││
                   │  │ • GET /clientes             ││
                   │  │ • GET /produtos             ││
                   │  └─────────────────────────────┘│
                   └─────────────────┬───────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
                    ▼                                 ▼
      ┌─────────────────────────┐         ┌─────────────────────────┐
      │      Service-Job        │  Kafka  │     Service-Worker      │
      │      (Producer)         │ ──────→ │      (Consumer)         │
      │                         │ Message │                         │
      │ Consome da Pier Cloud:  │         │ Consome da Pier Cloud:  │
      │  GET /vendedores        │         │  GET /vendas            │
      │                         │         │  GET /clientes          │
      │ Funcionalidades:        │         │  GET /produtos          │
      │ • Busca vendedores      │         │                         │
      │ • Processa em lotes     │         │ Funcionalidades:        │
      │ • Envia para Kafka      │         │ • Consome mensagens     │
      │   (SELLER_MESSAGE)      │         │ • Busca dados de vendas │
      │                         │         │ • Gera relatórios CSV   │
      └─────────────────────────┘         └─────────────────────────┘
                                                      │
                                                      ▼
                                          ┌─────────────────────────┐
                                          │      CSV Reports        │
                                          │ • vendas_{seller}.csv   │
                                          │ • Dados consolidados    │
                                          │ • Um arquivo por seller │
                                          └─────────────────────────┘

```

## 🚦 Rodando o Projeto

### Pré-requisitos

- Docker e Docker Compose
- Node.js v20+
- NPM v11+

### 1. Subindo a infraestrutura (Kafka)

```bash
# Na raiz do projeto
docker-compose up -d

# Verificar se os serviços estão rodando
docker-compose ps
```

### 2. Configurando variáveis de ambiente

Crie arquivos `.env` em cada serviço (substitua o valor de EXTERNAL_API_URL pelo ):

**service-job/.env:**
```env
NODE_ENV=dev
PORT=3000
EXTERNAL_API_URL=pier-cloud-api
KAFKA_BROKER=localhost:9092
```

**service-worker/.env:**
```env
NODE_ENV=dev
PORT=3001
EXTERNAL_API_URL=pier-cloud-api
KAFKA_BROKER=localhost:9092
```

### 3. Instalando dependências

```bash
# Service-Job
cd project/service-job
npm install

# Service-Worker
cd ../service-worker
npm install
```

### 4. Executando os serviços

```bash
# Terminal 1 - Service-Job (Producer)
cd project/service-job
npm run dev

# Terminal 2 - Service-Worker (Consumer)
cd project/service-worker
npm run dev
```

## 🔧 Funcionalidades

### Service-Job (Producer) 🔄
**Responsável por distribuir o trabalho de geração de relatórios**

- **🎯 API Pier Cloud**: Consome apenas `GET /vendedores`
- **📊 Processamento**: Coleta todos os vendedores e processa em lotes de 10
- **🚀 Kafka**: Envia cada vendedor individualmente para `SELLER_MESSAGE`
- **⚡ Resilência**: Retry automático em caso de falhas
- **📈 Performance**: Processamento em batches para otimizar envio

### Service-Worker (Consumer) 📊  
**Responsável por gerar relatórios completos de vendas por vendedor**

- **🎯 API Pier Cloud**: Consome múltiplas rotas:
  - `GET /vendas` - Todas as vendas (filtra por vendedor)
  - `GET /clientes/{id}` - Dados específicos de clientes
  - `GET /produtos/{id}` - Dados específicos de produtos
- **📨 Kafka**: Consome mensagens do tópico `SELLER_MESSAGE`
- **📋 Relatórios**: Gera CSV consolidado por vendedor
- **🔄 Consolidação**: Cruza dados de vendas, clientes e produtos
- **💾 Output**: Arquivos CSV salvos em `/reports`

## 🐳 Docker

O projeto inclui configuração completa do Kafka:

```yaml
# docker-compose.yml inclui:
- Zookeeper (porta 2181)
- Kafka (porta 9092)
```

## 🚀 Requisitos para Deploy

- Docker e Docker Compose
- Node.js v20.18.0+

## 🧗️ Autores

- [Wagner Nascimento](https://github.com/WagnerNasc)
