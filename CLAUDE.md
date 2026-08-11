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
- JS é vanilla, inline no final do `<body>` — só implementa a nav sticky com
  scroll-spy (destaca a categoria visível) e o scroll suave ao clicar numa aba.
  Não adicione React, build tools, ou qualquer runtime.
- O arquivo fica grande (~8-9 MB) por causa do base64. Isso é esperado e é a
  troca consciente feita para não depender de hospedagem de imagem nenhuma.

## Estrutura da página

1. **Hero** (`.hero`): logo, título, descrição curta, botão "Pedir pelo
   WhatsApp".
2. **Nav sticky** (`<nav class="nav" id="nav">`): um `<button class="nav-tab"
   data-target="ID-DA-SECTION">` por categoria. O `data-target` tem que bater
   com o `id` da `<section>` correspondente — o JS usa isso pra tudo (scroll,
   scroll-spy, destaque da aba ativa). Não precisa registrar nada em lugar
   nenhum além disso.
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
