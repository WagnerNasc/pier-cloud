# Pier Test - Microserviços de Processamento de Dados

[![Open in Visual Studio Code](https://img.shields.io/static/v1?logo=visualstudiocode&label=&message=Open%20in%20Visual%20Studio%20Code&labelColor=2c2c32&color=007acc&logoColor=007acc)](https://github.com/wagnernasc/pier-cloud/pier-test)

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
┌─────────────────┐    Kafka Queue      ┌─────────────────┐
│   Service-Job   │ ──────────────────→ │ Service-Worker  │
│                 │  SELLER_MESSAGE     │                 │
│ • Busca dados   │                     │ • Consome msgs  │
│ • Envia para    │                     │ • Gera CSVs     │
│   Kafka         │                     │ • Processa      │
│                 │                     │   relatórios    │
└─────────────────┘                     └─────────────────┘
        │                                        │
        ▼                                        ▼
┌─────────────────┐                     ┌─────────────────┐
│  Pier Cloud API │                     │   CSV Reports   │
│ • Vendedores    │                     │ • Vendas por    │
└─────────────────┘                     │   vendedor      │
                                        │ • Dados         │
                                        │   consolidados  │
                                        └─────────────────┘
```

## 📁 Estrutura do Projeto

```
pier-test/
├── docker-compose.yml          # Kafka + Zookeeper
├── project/
│   ├── service-job/           # Producer - Envia dados para Kafka
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   │   ├── api/       # Integrações com API externa
│   │   │   │   └── broker/    # Kafka Producer
│   │   │   ├── services/      # Lógica de negócio
│   │   │   └── server.ts      # Servidor principal
│   │   └── package.json
│   └── service-worker/        # Consumer - Processa dados do Kafka
│       ├── src/
│       │   ├── providers/
│       │   │   ├── api/       # Integrações com API externa
│       │   │   └── broker/    # Kafka Consumer
│       │   ├── services/      # Geração de relatórios
│       │   ├── routes/        # Endpoints HTTP
│       │   └── server.ts      # Servidor principal
│       └── package.json
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

Crie arquivos `.env` em cada serviço:

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

### Service-Job (Producer)
- 📊 Coleta dados de vendedores da API externa
- 🚀 Envia mensagens em lote para o Kafka
- 📈 Processa dados em batches de 10 registros
- ⚡ Retry automático em caso de falhas

### Service-Worker (Consumer)
- 📨 Consome mensagens do tópico `SELLER_MESSAGE`
- 📋 Gera relatórios consolidados em CSV
- 🔄 Processa vendas, produtos, clientes e vendedores

## 🐳 Docker

O projeto inclui configuração completa do Kafka:

```yaml
# docker-compose.yml inclui:
- Zookeeper (porta 2181)
- Kafka (porta 9092)
- Healthchecks automáticos
- Auto-criação de tópicos
```

## 🚀 Requisitos para Deploy

- Docker e Docker Compose
- Node.js v20.18.0+

## 🧗️ Responsáveis

- [Wagner Nascimento](https://github.com/WagnerNasc)
