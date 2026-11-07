import { NextResponse } from "next/server";

// Served unauthenticated on purpose — it's just a schema document, not
// data, and the Gem-building UI needs to fetch it before any API key is
// configured. The deployed origin is read from the request so this works
// the same on the preview URL and (after cutover) the custom domain.
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Sarah Pães Artesanais — Produtos",
      description:
        "API para publicar, editar, pausar e remover produtos do cardápio. Usada pelo Gem da Sarah no Gemini.",
      version: "1.0.0",
    },
    servers: [{ url: origin }],
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/v1/categories": {
        get: {
          operationId: "listCategories",
          summary: "Lista as categorias do cardápio",
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/products": {
        get: {
          operationId: "listProducts",
          summary: "Lista produtos, com filtros opcionais",
          parameters: [
            { name: "category", in: "query", schema: { type: "string" }, description: "Slug da categoria" },
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["active", "paused", "all"] },
              description: "Filtra por ativo/pausado (padrão: all)",
            },
            { name: "search", in: "query", schema: { type: "string" }, description: "Busca por nome do produto" },
          ],
          responses: { "200": { description: "OK" } },
        },
        post: {
          operationId: "createProduct",
          summary: "Cria um novo produto",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["category", "name"],
                  properties: {
                    category: { type: "string", description: "Slug ou id da categoria" },
                    name: { type: "string" },
                    description: { type: "string" },
                    note: { type: "string", description: "Observação em itálico, opcional" },
                    kitLabel: { type: "string", description: "Ex.: '250g' ou 'Kit com 4 un.'" },
                    pricingMode: { type: "string", enum: ["single", "lines"] },
                    price: { type: "string", description: "Ex.: '25,00' — obrigatório se pricingMode=single" },
                    priceLines: {
                      type: "array",
                      description: "Obrigatório se pricingMode=lines",
                      items: {
                        type: "object",
                        properties: { label: { type: "string" }, price: { type: "string" } },
                      },
                    },
                    photos: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          base64: { type: "string", description: "Foto anexada, em base64 (com ou sem o prefixo data:image/...)" },
                          alt: { type: "string" },
                        },
                      },
                    },
                    isActive: { type: "boolean", description: "Padrão: true" },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Criado" } },
        },
      },
      "/api/v1/products/{id}": {
        get: {
          operationId: "getProduct",
          summary: "Busca um produto pelo id",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Não encontrado" } },
        },
        patch: {
          operationId: "updateProduct",
          summary: "Edita, pausa/reativa, ou troca fotos de um produto existente",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "Todos os campos são opcionais — manda só o que quer mudar.",
                  properties: {
                    category: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string" },
                    note: { type: "string", nullable: true },
                    kitLabel: { type: "string", nullable: true },
                    pricingMode: { type: "string", enum: ["single", "lines"] },
                    price: { type: "string" },
                    priceLines: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: { label: { type: "string" }, price: { type: "string" } },
                      },
                    },
                    isActive: { type: "boolean", description: "false = pausa o produto, true = reativa" },
                    photos: {
                      type: "array",
                      description: "Substitui TODAS as fotos pela lista enviada",
                      items: {
                        type: "object",
                        properties: {
                          base64: { type: "string" },
                          path: { type: "string", description: "Path de uma foto já existente, para mantê-la" },
                          alt: { type: "string" },
                        },
                      },
                    },
                    addPhotos: {
                      type: "array",
                      description: "Adiciona fotos novas sem mexer nas existentes",
                      items: {
                        type: "object",
                        properties: { base64: { type: "string" }, alt: { type: "string" } },
                      },
                    },
                    removePhotoPaths: {
                      type: "array",
                      description: "Remove fotos existentes específicas (usar o 'path' retornado por getProduct)",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "OK" }, "404": { description: "Não encontrado" } },
        },
        delete: {
          operationId: "deleteProduct",
          summary: "Remove um produto permanentemente",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Não encontrado" } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
      },
    },
  };

  return NextResponse.json(spec);
}
