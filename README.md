# Manual do Gestor Público — CAGE RS

Site oficial do Manual do Gestor Público da Contadoria e Auditoria-Geral do Estado do Rio Grande do Sul (CAGE RS), em substituição ao antigo documento PDF.

🔗 **Site:** https://manualdogestorpublicors.pages.dev  
🔧 **Painel de edição:** https://manualdogestorpublicors.pages.dev/admin.html

---

## Estrutura do repositório

```
├── index.html        — Estrutura HTML do site público
├── style.css         — Visual e design (22 seções comentadas)
├── app.js            — Lógica do site (12 seções comentadas)
├── conteudo.json     — Todo o conteúdo dos temas do manual
├── admin.html        — Painel de edição interno (acesso restrito)
└── netlify.toml      — Configuração de headers CORS para o Supabase
```

---

## Como o site funciona

O site é uma **Single Page Application (SPA)** — uma única página HTML que carrega todo o conteúdo dinamicamente. Não há backend nem banco de dados para o site público: tudo vem do `conteudo.json`.

**Fluxo de carregamento:**
1. O navegador carrega o `index.html`
2. O `app.js` faz um `fetch` do `conteudo.json`
3. O JavaScript preenche todas as seções da página com os dados do JSON
4. A navegação entre "páginas" é feita mostrando/escondendo `<div>` s com a classe `.page`

---

## Estrutura do conteudo.json

O arquivo `conteudo.json` é a fonte de verdade de todo o conteúdo do manual. Sua estrutura é:

```json
{
  "site": {
    "titulo": "Manual do Gestor Público",
    "subtitulo": "Contadoria e Auditoria Geral do Estado — RS",
    "edicao": "6ª Edição · 2026",
    "orgao": "CAGE RS",
    "ultima_atualizacao": "Maio 2026"
  },
  "atualizacoes": [ ... ],
  "faq_home": [ ... ],
  "temas": [ ... ]
}
```

### Estrutura de um tema

```json
{
  "id": "diarias",              // identificador único (sem acentos, sem espaços)
  "icone": "✈️",               // emoji exibido no card
  "num": 35,                    // número de referência
  "nome": "Diárias",            // nome exibido no site
  "desc": "...",                // descrição curta (card da home)
  "tags": ["indenização"],      // categorias para filtro
  "destaque": true,             // aparece na grade de destaques da home
  "atualizacao": "Abr 2026",    // data da última atualização
  "responsavel": "CAGE RS — ...", // divisão responsável
  "resumo": "...",              // texto introdutório na página do tema
  "secoes": [ ... ],            // seções de conteúdo (ver abaixo)
  "faq": [ ... ],               // perguntas frequentes do tema
  "legislacao": [ ... ],        // normas relacionadas
  "checklist": [ ... ],         // itens do checklist operacional
  "relacionados": ["id1", "id2"] // ids de temas relacionados
}
```

### Tipos de bloco de conteúdo

Cada seção (`secoes`) contém um array de blocos (`conteudo`). Os tipos disponíveis são:

| Tipo | Campos | Descrição |
|---|---|---|
| `texto` | `valor` | Parágrafo de texto simples |
| `subtitulo` | `valor` | Subtítulo dentro da seção |
| `lista` | `itens[]` | Lista com marcadores |
| `lista_numerada` | `itens[]` | Lista numerada |
| `info` | `titulo`, `texto` | Box azul informativo |
| `atencao` | `titulo`, `texto` | Box verde de atenção |
| `sucesso` | `titulo`, `texto` | Box verde de confirmação |
| `aviso` | `titulo`, `texto` | Box amarelo de aviso |
| `tabela` | `cabecalho[]`, `linhas[][]` | Tabela com cabeçalho |
| `toggle_group` | `label`, `itens[]` | Lista expansível |
| `checklist_estatico` | `itens[]` | Lista com ícones de check |

---

## Como editar o conteúdo

### Opção 1 — Painel de edição (recomendado)

Acesse o painel em `/admin.html`, faça login, edite o tema desejado e clique em **Exportar JSON**. Depois suba o arquivo `conteudo.json` gerado neste repositório.

**Usuários do painel:**

| Usuário | Perfil | Pode exportar JSON? |
|---|---|---|
| `cage` | Editor | Não |
| `admin` | Admin | Sim |
| `admin-cage` | Admin | Sim |

### Opção 2 — Edição direta no GitHub

Para correções pequenas, edite o `conteudo.json` diretamente pelo editor do GitHub. O Cloudflare Pages detecta o commit e publica automaticamente em 1-2 minutos.

---

## Infraestrutura

| Componente | Serviço | Observação |
|---|---|---|
| Hospedagem | Cloudflare Pages (gratuito) | Deploy automático a cada commit |
| Banco de dados do painel | Supabase (gratuito) | Status, notas, histórico e usuários |
| Repositório | GitHub | Fonte oficial do código e conteúdo |
| Domínio | pages.dev (provisório) | Migrar para sefaz.rs.gov.br quando possível |

---

## Painel de edição (admin.html)

O painel é um arquivo HTML estático com autenticação própria. Os dados de colaboração da equipe (status editorial, notas internas, histórico de edições e usuários) são armazenados no **Supabase**.

### Tabelas no Supabase

| Tabela | Finalidade |
|---|---|
| `usuarios_painel` | Usuários e senhas do painel |
| `status_temas` | Status editorial de cada tema |
| `notas_internas` | Notas da equipe por tema |
| `historico_edicoes` | Log de ações com usuário e horário |
| `temas_conteudo` | Rascunho colaborativo do conteúdo |
| `temas_versoes` | Últimas 3 versões exportadas por tema |

### Fluxo editorial

```
Editor edita → Salva (vai para Supabase)
     ↓
Admin revisa → Aprova → Exporta JSON
     ↓
Sobe no GitHub → Cloudflare publica → Site atualizado
```

---

## Desenvolvimento

Este projeto não requer ferramentas de build — é HTML/CSS/JS puro. Para testar localmente:

```bash
# Usando Python (já instalado na maioria dos sistemas)
python3 -m http.server 8000

# Ou usando Node.js
npx serve .
```

Acesse `http://localhost:8000` no navegador.

> **Importante:** o site não funciona abrindo o `index.html` diretamente no navegador (sem servidor), pois o `fetch('conteudo.json')` é bloqueado por política de segurança do navegador (CORS).

---

## Melhorias planejadas

- [ ] Migrar para domínio institucional (`sefaz.rs.gov.br`)
- [ ] Integração com SharePoint via Microsoft Graph API (documento técnico disponível)
- [ ] Separar `admin.html` em `admin.html` + `admin.css` + `admin.js`
- [ ] Integração direta com API do GitHub para publicação sem upload manual
- [ ] Redefinição de senha por e-mail

---

*CAGE RS · Contadoria e Auditoria-Geral do Estado do Rio Grande do Sul*  
*Manual do Gestor Público — 6ª Edição · 2026*
