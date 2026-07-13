# Manual do Gestor Público — CAGE RS

Site oficial do Manual do Gestor Público da Contadoria e Auditoria-Geral do Estado do Rio Grande do Sul (CAGE RS), em substituição ao antigo documento PDF.

🔗 **Site:** https://manualdogestorpublicors.pages.dev

---

## Escopo atual — MVP 2026

O objetivo desta primeira versão é publicar o Manual do Gestor Público como site público de consulta, acessível a gestores e servidores do Estado do RS.

**O que está no escopo do MVP:**
- Site público com navegação, busca e exportação de PDF
- Conteúdo editável via `conteudo.json`
- Publicação automática via GitHub + Cloudflare Pages

**O que está fora do escopo desta versão (backlog):**
- Painel de edição interno (em desenvolvimento separado)
- Autenticação institucional (SSO/SEFAZ)
- Integração com banco de dados ou APIs
- Domínio institucional (`sefaz.rs.gov.br`)

---

## Estrutura do repositório

```
├── index.html        — Estrutura HTML do site público
├── style.css         — Visual e design (22 seções comentadas)
├── app.js            — Lógica do site (12 seções comentadas)
├── conteudo.json     — Conteúdo dos temas do manual
├── libs/             — Bibliotecas JavaScript (jsPDF, DOMPurify)
└── netlify.toml      — Configuração de headers CORS
```

---

## Como o site funciona

O site é uma **Single Page Application (SPA)** — uma única página HTML que carrega todo o conteúdo dinamicamente. Não há backend nem banco de dados para o site público: tudo vem do `conteudo.json`.

**Fluxo de carregamento:**
1. O navegador carrega o `index.html`
2. O `app.js` faz um `fetch` do `conteudo.json`
3. O JavaScript preenche todas as seções da página com os dados do JSON
4. A navegação entre "páginas" é feita mostrando/escondendo `<div>`s com a classe `.page`

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

Edite o `conteudo.json` diretamente pelo editor do GitHub. O Cloudflare Pages detecta o commit e publica automaticamente em 1-2 minutos.

---

## Infraestrutura

| Componente | Serviço | Observação |
|---|---|---|
| Hospedagem | Cloudflare Pages (gratuito) | Deploy automático a cada commit |
| Repositório | GitHub | Fonte oficial do código e conteúdo |
| Domínio | pages.dev (provisório) | Migrar para sefaz.rs.gov.br quando possível |

---

## Desenvolvimento local

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
- [ ] Melhoria do mecanismo de busca (normalização de termos, busca aproximada)

---

*CAGE RS · Contadoria e Auditoria-Geral do Estado do Rio Grande do Sul*  
*Manual do Gestor Público — 6ª Edição · 2026*
