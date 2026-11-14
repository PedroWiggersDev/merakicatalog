# Meráki Catalog

Aplicativo mobile em Expo/React Native e TypeScript para consultar o catálogo de refrigeração automotiva Meráki. O projeto é dividido em dois aplicativos independentes:

- **MerakiCatalog**: interface mobile com início, categorias, busca, catálogo em lista, detalhes do produto, contato e menu.
- **meraki-data**: painel web autenticado e API para gerenciar categorias, produtos, especificações e telefone de atendimento, além de receber mensagens enviadas pelo app.

O mobile usa navegação por rotas do Expo Router, listas com `FlatList`, animações, atualização por gesto, busca e estados de carregamento/erro. O cabeçalho e a navegação inferior permanecem fixos enquanto apenas o conteúdo das telas transiciona; o menu do ícone hambúrguer abre como um painel lateral sobreposto. O app exige conexão com a API para navegar e exibe uma tela de reconexão quando a API fica indisponível. O painel permite enviar imagens PNG, JPEG e WebP para categorias e produtos; elas são salvas em um volume persistente do Docker e exibidas no app e painel. Os ícones locais dos menus ficam em `MerakiCatalog/assets/icons/` e `meraki-data/public/icons/`. Os dados e o telefone vêm da API do `meraki-data`, não de credenciais embutidas no aplicativo. A API pública usa uma role PostgreSQL somente de leitura; o painel web usa uma role de escrita.

## Requisitos

- Node.js 22 ou superior
- npm
- Docker e Docker Compose para executar PostgreSQL e o painel
- Expo Go ou simulador/emulador para testar o aplicativo mobile

## Executar uma instância de teste

### 1. Iniciar API e banco

```sh
cd meraki-data
cp .env.example .env
```

Edite `.env` e substitua as senhas de exemplo. Inicie os serviços:

```sh
docker compose up --build
```

O painel fica em `http://localhost:3001`. Use o `ADMIN_EMAIL` e `ADMIN_PASSWORD` definidos no `.env`. O PostgreSQL cria tabelas de categorias, produtos, configurações e mensagens e insere registros de exemplo ao inicializar um volume novo. Mensagens enviadas pelo aplicativo ficam na aba **Mensagens** do painel; nenhum e-mail é enviado.

### 2. Iniciar o aplicativo

Em outro terminal:

```sh
cd MerakiCatalog
npm install
cp .env.example .env
```

Atualize `EXPO_PUBLIC_API_URL` no `.env` antes de iniciar/buildar:

```sh
# iOS Simulator ou Expo Web na mesma máquina
npm run start
```

No dispositivo físico ou emulador Android, use o endereço IP acessível da máquina na rede em vez de `localhost`, por exemplo `EXPO_PUBLIC_API_URL=http://192.168.1.20:3001`. No Android Emulator padrão, o host costuma ser acessado por `http://10.0.2.2:3001`. O endereço é incorporado ao bundle durante o build; não coloque senhas do PostgreSQL no app.

## Deploy para produção

1. Faça deploy do `meraki-data` via Docker Compose ou plataforma compatível. Configure secrets fortes e únicos no ambiente de produção; as credenciais locais de `.env.example` são apenas para desenvolvimento.
2. Use PostgreSQL gerenciado ou armazenamento persistente, mantenha o banco sem acesso público e habilite backups. Execute os scripts SQL em `meraki-data/database/init/` na ordem numérica e aplique grants `SELECT` à role `meraki_catalog_reader`. Faça backup também do volume `meraki_uploads` que armazena as imagens de produtos e categorias.
3. Coloque o painel/API atrás de HTTPS, configure firewall, secrets para as contas writer/reader, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `SESSION_SECRET` (ao menos 32 caracteres). Não use os valores de desenvolvimento.
4. Defina `EXPO_PUBLIC_API_URL` com a URL HTTPS pública da API e gere o aplicativo. Exemplo: `EXPO_PUBLIC_API_URL=https://catalogo-api.exemplo.com npx expo run:ios` ou `npx expo run:android`. Para publicação em lojas, use EAS Build/Submit e credenciais de assinatura próprias.
5. Valide login do painel, cadastro de categorias/produtos, atualização do telefone e consulta pelo aplicativo antes de publicar a versão final.

Consulte [meraki-data/README.md](./meraki-data/README.md) para detalhes de configuração, API e deploy do serviço web.
