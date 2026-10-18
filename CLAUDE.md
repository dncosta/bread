# Cardápio Sarah Pães Artesanais

Site de cardápio da Sarah Pães Artesanais, servido via GitHub Pages no domínio
`sarah.goodie.app.br` (ver `CNAME`).

## Arquitetura

- **`index.html` é o site inteiro.** Uma única página HTML estática, sem build,
  sem framework, sem dependências externas além das Google Fonts (Newsreader +
  Public Sans, carregadas via `<link>`).
- **Nenhuma imagem é hospedada separadamente.** Todas as fotos dos produtos
  ficam embutidas no próprio `index.html` como `data:image/jpeg;base64,...`
  dentro do `src` de cada `<img>`. Isso é intencional — não crie uma pasta
  `images/` nem aponte `src` para um caminho relativo ou URL externa.
- JS é vanilla, em quatro `<script>` inline no final do `<body>`. O primeiro
  implementa a nav sticky com scroll-spy (destaca a categoria visível), o
  scroll suave ao clicar numa aba e o evento GA `nav_tab_click`. O segundo é
  o do banner de Natal (ver seção "Banner de Natal"). O terceiro é o filtro de
  busca (ver seção "Busca"). O quarto gera o botão "Pedir no WhatsApp" de cada
  card dinamicamente (ver seção "WhatsApp nos cards") e trackeia os cliques.
  Não adicione React, build tools, ou qualquer runtime.
- O arquivo fica grande (~8-9 MB) por causa do base64. Isso é esperado e é a
  troca consciente feita para não depender de hospedagem de imagem nenhuma.
- **Google Analytics (GA4)** está instalado via `gtag.js` no `<head>`, logo
  após a meta description (measurement ID `G-60648533DR`). Ele já cobre
  pageviews automaticamente. Eventos customizados disparados: `nav_tab_click`
  (clique numa aba da nav, `event_label` = nome da categoria) e
  `whatsapp_click` (clique em um botão de WhatsApp de card, com `location`
  = `"card"` e `event_label` = nome do produto). Sempre que adicionar um novo
  componente clicável relevante (ex.: um novo CTA), considere adicionar um
  evento `gtag('event', ...)` equivalente, envolto em
  `if (typeof gtag === 'function')`.

## Estrutura da página

1. **Hero** (`.hero`): logo, título, descrição curta, e atualmente o banner
   de Natal (`.natal-banner`) no lugar onde antes ficava o botão "Pedir pelo
   WhatsApp" (removido a pedido do cliente — ver seção "Banner de Natal").
2. **Busca + nav sticky** (`.nav-wrap`, sticky no topo): contém o campo de
   busca (`#search-input`) e, logo abaixo, a `<nav class="nav" id="nav">` com
   um `<button class="nav-tab" data-target="ID-DA-SECTION">` por categoria. O
   `data-target` tem que bater com o `id` da `<section>` correspondente — o JS
   usa isso pra tudo (scroll, scroll-spy, destaque da aba ativa, filtro de
   busca). Não precisa registrar nada em lugar nenhum além disso. Ver seção
   "Busca" para o comportamento do campo.
3. **Uma `<section id="...">` por categoria**, cada uma com:
   - `.section-head` com título da categoria.
   - `.section-body > .grid` com os cards dos produtos (`.card`).
4. **Footer** (`.footer`): hoje é só uma linha divisória vazia (o texto
   "Pedidos" e o telefone foram removidos a pedido do cliente). Não
   reintroduza esse conteúdo a menos que seja pedido explicitamente.

## Anatomia de um card de produto

```html
<article class="card">
  <div class="card-photo"><img src="data:image/jpeg;base64,..." alt="Nome do Produto" loading="lazy"></div>
  <div class="card-body">
    <div class="card-row">
      <div class="card-name">Nome do Produto</div>
      <div class="card-price">R$ 00,00</div>
    </div>
    <div class="card-kit">Kit com N un.</div>   <!-- opcional, deixe vazio "" se não tiver -->
    <div class="card-desc">Descrição do produto.</div>
    <div class="card-note">Observação em itálico.</div>  <!-- opcional, deixe vazio "" se não tiver -->
  </div>
</article>
```

`.card-kit` também é usado pra peso quando faz mais sentido que "Kit com N un."
(ex.: "250g", "500g" nos Panetones) — é só um rótulo pequeno em destaque acima
da descrição, não precisa ser literalmente sobre kit/unidades.

Para produtos com **mais de um preço** (ex.: Broa de Fubá, que vende em kits de
15 ou 25 un.), não use `.card-price` — use `.card-price-lines` no lugar, e
omita `.card-price` do `.card-row`:

```html
<div class="card-row"><div class="card-name">Nome do Produto</div></div>
...
<div class="card-price-lines">
  <div class="card-price-line"><span>Kit com 15 un.</span><span>R$ 18,00</span></div>
  <div class="card-price-line"><span>Kit com 25 un.</span><span>R$ 28,00</span></div>
</div>
```

## Ordenação dos produtos

**Dentro de cada categoria, os cards devem estar ordenados do mais barato para
o mais caro.** Use o menor preço do produto como critério (para produtos com
`.card-price-lines`, use o primeiro/menor preço do kit). Produtos com o mesmo
preço podem ficar em qualquer ordem entre si. Sempre que adicionar, remover ou
mudar o preço de um produto, reconfira a ordem da categoria inteira — mudar um
preço pode exigir mover o card de posição.

## Como adicionar uma foto de produto

As fotos não devem ser referenciadas por caminho — elas precisam ser
convertidas para base64 e coladas direto no `src`. **Não cole o base64 à mão**
(é uma string enorme); use um script para isso, editando o `index.html` em
memória. Exemplo (rodar da raiz do repo, com a foto em algum lugar do disco):

```python
import base64
with open('/caminho/para/foto.jpeg', 'rb') as f:
    data = base64.b64encode(f.read()).decode('ascii')
img_tag = f'<img src="data:image/jpeg;base64,{data}" alt="Nome do Produto" loading="lazy">'
```

Depois insira `img_tag` dentro do `<div class="card-photo">` do produto certo.
Para trocar/adicionar várias fotos de uma vez, prefira um script Python que
leia o `index.html`, localize o bloco `<article class="card">` do produto pelo
`card-name`, e substitua só o `<img src="...">` daquele bloco — evita colar
strings base64 gigantes manualmente e evita erro de trocar a foto do produto
errado.

Fotos são sempre quadradas na exibição (`aspect-ratio:1/1` com
`object-fit:cover`), então não precisam ser pré-recortadas — qualquer proporção
funciona, mas fica mais bonito se o assunto principal estiver centralizado.

## Banner de Natal

No lugar do antigo botão "Pedir pelo WhatsApp" do hero, hoje fica o
`.natal-banner`: seção decorativa com luzes piscando, neve animada em
`<canvas>` e texto com efeito shimmer, implementada em CSS/SVG/Canvas puro
(sem dependências externas além das fontes Libre Baskerville e Inter,
carregadas junto com as demais Google Fonts). O CSS dele vive num `<style>`
próprio (separado do principal), o HTML fica dentro de `.hero` logo após o
`.hero-desc`, e o JS é o segundo `<script>` do `<body>`. É sazonal — quando
não fizer mais sentido mostrá-lo, troque por outra coisa ou remova os três
blocos (`<style>`, HTML, `<script>`) juntos; não deixe um órfão.

O banner é clicável: leva até a seção `#panetones` (mesmo cálculo de scroll
que os `.nav-tab` usam, descontando a altura do `.nav-wrap`), tem
`role="button"`, `tabindex="0"` e responde a Enter/Espaço também — isso está
no mesmo `<script>` do banner, logo após o `if (!banner) return;`. Se a
seção de destino do banner mudar (ex.: deixar de ser produtos de Natal), opte
por atualizar o `getElementById('panetones')` para o novo alvo em vez de só
remover o link.

## Busca

O campo `#search-input` (dentro de `.nav-wrap`, acima da nav) filtra os
produtos em tempo real, sem recarregar a página — JS no terceiro `<script>`
do `<body>`. A cada digitação (com debounce de 120ms), ele compara o texto
normalizado (minúsculo, sem acento) contra três campos de cada `.card`: o
nome da categoria (`.section-title` da `.cat-section` que contém o card), o
`.card-name` e o `alt` da foto (`.card-photo img`). **Não usa `.card-desc`**
— descrições têm palavras demais (ex.: ingredientes) e geravam match com
coisas sem relação (buscar "pa" batia em "parmesão" dentro da descrição do 4
Queijos). O match em si é por palavra: a busca só bate se algum "token" do
texto (separado por espaço/pontuação) **começa com** o termo digitado — não
basta o termo aparecer no meio de uma palavra qualquer. Por isso adicionar um
produto novo com nome genérico demais pode não aparecer em buscas óbvias;
nesse caso prefira um `alt` mais descritivo (ele já deveria ser descritivo
por causa da seção "Como adicionar uma foto de produto").

- Cards sem match ganham a classe `.is-hidden` (`display:none`).
- Uma `.cat-section` sem nenhum card visível também ganha `.is-hidden`, e o
  `.nav-tab` correspondente (por `data-target`) some junto — assim a nav só
  mostra categorias com resultado.
- Se nenhum produto bate com a busca, aparece `#search-empty` ("Nenhum
  produto encontrado.").
- Campo vazio remove todas as classes `.is-hidden` e volta tudo ao normal.

Não precisa tocar nesse script ao adicionar um produto ou categoria nova —
ele itera `.cat-section` e `.card` dinamicamente. Dispara `gtag('event',
'search', ...)` a cada busca ativa (guardado por `typeof gtag === 'function'`).

## WhatsApp nos cards

Todo `.card` ganha automaticamente um botão "Pedir no WhatsApp" no final do
`.card-body`, inserido via JS (quarto `<script>` do `<body>`) — não adicione
esse `<a>` manualmente no HTML de cada card. O número de telefone está
hardcoded nesse script (`var phone = '5511968280273'`) — não há mais um botão
de WhatsApp fixo no hero de onde lê-lo, então ao trocar o número, edite essa
constante. O texto da mensagem é montado como
`Olá! Gostaria de fazer um pedido de um "<nome do .card-name>".` — por isso o
`.card-name` deve continuar sendo um nome claro e específico o bastante para
a Sarah reconhecer o produto na mensagem recebida (ex.: "Tradicional" sozinho
é ambíguo entre categorias, mas isso já era assim pelo design do card). Não é
necessário tocar nesse script ao adicionar um produto novo — o botão aparece
automaticamente para qualquer `.card` presente na página.

## Adicionando uma categoria nova

1. Adicione `<button class="nav-tab" data-target="novo-id">Nome</button>` na
   nav, na posição desejada (a ordem visual da nav segue a ordem dos botões).
2. Adicione a `<section id="novo-id" class="cat-section">` correspondente, na
   mesma posição relativa (a ordem das sections no documento é a ordem em que
   elas aparecem ao rolar a página).
3. Não precisa tocar no `<script>` — ele lê `.nav-tab` e monta a lista de
   seções automaticamente a partir dos `data-target`.

## O que NÃO fazer

- Não reintroduza o botão flutuante de WhatsApp nem o texto "Pedidos"/telefone
  no footer — foram removidos a pedido do cliente.
- Não troque embutir imagem em base64 por uma pasta `images/` ou CDN externo —
  é proposital, o objetivo é o site inteiro caber num único arquivo.
- Não adicione build step, bundler, ou framework (React etc.) — o site é
  propositalmente HTML/CSS/JS puro e estático.
- Não edite `CNAME` sem confirmar com o dono do domínio.

## Deploy

O site é servido via GitHub Pages a partir da branch `main`. Um `git push
origin main` já publica a mudança (leva alguns minutos para propagar).
