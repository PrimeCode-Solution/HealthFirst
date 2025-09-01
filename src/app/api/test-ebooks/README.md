#### Categorias
- `GET /api/ebook-categories` - Listar categorias (público)
- `POST /api/ebook-categories` - Criar categoria (admin)
- `PUT /api/ebook-categories/[id]` - Editar categoria (admin)
- `DELETE /api/ebook-categories/[id]` - Deletar categoria (admin)

#### Ebooks
- `GET /api/ebooks` - Listar ebooks com filtros
- `POST /api/ebooks` - Criar ebook (admin)
- `GET /api/ebooks/[id]` - Detalhes do ebook
- `PUT /api/ebooks/[id]` - Editar ebook (admin)
- `DELETE /api/ebooks/[id]` - Deletar ebook (admin)

#### Downloads e Acesso
- `GET /api/ebooks/[id]/download` - Download com verificação premium
- `POST /api/ebooks/[id]/access` - Registrar acesso
- `GET /api/user/ebooks` - Ebooks do usuário

#### Estatísticas
- `GET /api/ebooks/stats` - Estatísticas (admin)

### Autenticação
- Login: `admin@healthfirst.com` / `admin123`
- Middleware de autenticação implementado
- Verificação de roles (ADMIN/USER)

### Teste da API
Execute `GET /api/test-ebooks` para criar dados de teste.
