# Meráki Data

Painel web e API do catálogo Meráki. O painel autenticado permite cadastrar e editar categorias e produtos, adicionar especificações personalizadas em pares propriedade/valor, enviar imagens PNG/JPEG/WebP (até 5 MB), alterar o telefone de atendimento e consultar mensagens enviadas pelo aplicativo. As imagens ficam no volume Docker `meraki_uploads`; as mensagens são armazenadas no PostgreSQL e não são encaminhadas por e-mail. A API pública do catálogo usa uma conta PostgreSQL com acesso somente de leitura.

## Instância de teste

1. Instale Docker e Docker Compose.
2. Crie o arquivo local de configuração:

   ```sh
   cp .env.example .env
   ```

3. Troque as senhas de exemplo, principalmente antes de disponibilizar o serviço fora da máquina local.
4. Inicie o painel e o PostgreSQL:

   ```sh
   docker compose up --build
   ```

5. Abra `http://localhost:3001`. As credenciais de acesso são `ADMIN_EMAIL` e `ADMIN_PASSWORD` definidas no `.env`.

O banco inicializa as tabelas, categorias e um produto de exemplo somente na primeira inicialização do volume. O usuário `meraki_bootstrap` é reservado para a inicialização; o painel usa `meraki_data`, com permissões de leitura e escrita de dados, e o mobile usa `meraki_catalog_reader`, com permissão apenas de leitura no catálogo. Para desenvolvimento sem Docker para o painel, instale PostgreSQL, crie o banco, configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_WRITER_USER`, `DB_WRITER_PASSWORD`, `DB_READER_USER`, `DB_READER_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `SESSION_SECRET` em um `.env` local, e aplique os scripts SQL em `database/init/` em ordem numérica.

Se estiver atualizando um volume de banco já existente, aplique as migrações novas manualmente, uma vez cada:

```sh
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U meraki_bootstrap -d meraki \
  -f /docker-entrypoint-initdb.d/02-contact-inbox-and-specifications.sql
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U meraki_bootstrap -d meraki \
  -f /docker-entrypoint-initdb.d/03-catalog-images.sql
```

Se já existe um volume PostgreSQL criado antes da caixa de mensagens e das especificações personalizadas, aplique a migração uma vez:

```sh
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U meraki_bootstrap -d meraki \
  -f /docker-entrypoint-initdb.d/02-contact-inbox-and-specifications.sql
```

## API do aplicativo

- `GET /api/public/catalog`: categorias, produtos ativos e telefone.
- `GET /api/public/products/:id`: detalhes de um produto.
- `POST /api/public/contact`: registra uma mensagem enviada pelo aplicativo para a caixa de entrada do painel.
- `GET /api/uploads/:filename`: serve uma imagem de produto ou categoria.
- `GET /api/health`: verificação de saúde do serviço e do banco.

As rotas públicas do catálogo acessam o banco com `meraki_catalog_reader`; o recebimento de mensagens usa a role de escrita do serviço. As rotas `/api/admin/*` requerem sessão autenticada e usam a role de escrita do `meraki-data`. A aba **Mensagens** permite marcar solicitações como lidas/não lidas ou removê-las.

## Deploy de produção

1. Publique a imagem Docker deste projeto em um registry ou faça o build no ambiente de deploy.
2. Use PostgreSQL gerenciado ou um volume persistente; não exponha a porta do PostgreSQL publicamente.
3. Defina secrets fortes e únicos no ambiente de produção para `DB_BOOTSTRAP_PASSWORD`, `DB_WRITER_PASSWORD`, `DB_READER_PASSWORD`, `ADMIN_PASSWORD` e `SESSION_SECRET` (mínimo 32 caracteres para sessão). Troque também `ADMIN_EMAIL`. Não reutilize os valores de `.env.example`.
4. Configure o host, o banco e as credenciais de bootstrap/writer/reader. O usuário writer precisa de `CONNECT`, `USAGE` e permissões `SELECT`, `INSERT`, `UPDATE` e `DELETE` nas tabelas gerenciadas. A role `meraki_catalog_reader` precisa apenas de `CONNECT`, `USAGE` no schema e `SELECT` nas tabelas do catálogo.
5. Execute as migrações SQL em `database/init/` uma única vez no banco de produção e aplique os grants de leitura também às novas tabelas.
6. Configure HTTPS em um proxy/load balancer, faça backup do banco e monitore `/api/health`.
7. Publique o aplicativo Expo apontando `EXPO_PUBLIC_API_URL` para a URL HTTPS pública deste serviço. Esse valor é incorporado ao bundle durante o build mobile.

O Compose incluído é apropriado para teste ou para uma implantação pequena com secrets fornecidos pelo ambiente. Para produção, prefira um banco gerenciado, controle de acesso por secrets e TLS.
