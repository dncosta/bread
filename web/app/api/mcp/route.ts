import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  listApiProducts,
  fetchApiProduct,
  createApiProduct,
  updateApiProduct,
  deleteApiProduct,
} from "@/lib/apiProducts";

const photoSchema = z.object({
  base64: z.string().optional().describe("Foto nova, em base64 (anexo do chat)"),
  path: z.string().optional().describe("Path de uma foto já existente, para mantê-la"),
  alt: z.string().optional().describe("Texto alternativo da foto"),
});

function toolText(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}
function toolError(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

const handler = createMcpHandler((server) => {
  server.registerTool(
    "list_categories",
    {
      title: "Listar categorias",
      description: "Lista as categorias do cardápio (id, slug, nome) — use o slug para criar/filtrar produtos.",
      inputSchema: z.object({}),
    },
    async () => {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase.from("categories").select("id, slug, name, position").order("position");
      if (error) return toolError(error.message);
      return toolText(data);
    }
  );

  server.registerTool(
    "list_products",
    {
      title: "Listar produtos",
      description:
        "Lista produtos do cardápio. Use para encontrar o id de um produto antes de editar/pausar/apagar, ou para conferir o que já existe antes de criar um novo.",
      inputSchema: z.object({
        category: z.string().optional().describe("Slug da categoria (de list_categories)"),
        status: z.enum(["active", "paused", "all"]).optional().describe("Padrão: all"),
        search: z.string().optional().describe("Busca por nome do produto"),
      }),
    },
    async ({ category, status, search }) => {
      const products = await listApiProducts({ categorySlug: category, status: status ?? "all", search });
      return toolText(products);
    }
  );

  server.registerTool(
    "get_product",
    {
      title: "Ver detalhes de um produto",
      description: "Retorna todos os dados de um produto pelo id, incluindo fotos (com path, para usar em removePhotoPaths).",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      const product = await fetchApiProduct(id);
      if (!product) return toolError("Produto não encontrado.");
      return toolText(product);
    }
  );

  server.registerTool(
    "create_product",
    {
      title: "Publicar um novo produto",
      description:
        "Cria e publica um novo produto no cardápio. Preço único OU preço por kits (priceLines), nunca os dois. Fotos anexadas no chat vão em 'photos' como base64.",
      inputSchema: z.object({
        category: z.string().describe("Slug ou id da categoria (veja list_categories)"),
        name: z.string(),
        description: z.string().optional(),
        note: z.string().optional().describe("Observação em itálico, ex.: 'Sem cobertura de açúcar'"),
        kitLabel: z.string().optional().describe("Ex.: '250g' ou 'Kit com 4 un.'"),
        pricingMode: z.enum(["single", "lines"]).optional(),
        price: z.string().optional().describe("Ex.: '25,00' — obrigatório se pricingMode=single"),
        priceLines: z
          .array(z.object({ label: z.string(), price: z.string() }))
          .optional()
          .describe("Obrigatório se pricingMode=lines, ex.: [{label:'Kit com 15 un.', price:'18,00'}]"),
        photos: z.array(photoSchema).optional(),
        isActive: z.boolean().optional().describe("Padrão: true"),
      }),
    },
    async (input) => {
      const result = await createApiProduct(input);
      if (!result.ok) return toolError(result.error);
      return toolText(result.data);
    }
  );

  server.registerTool(
    "update_product",
    {
      title: "Editar, pausar/reativar ou trocar fotos de um produto",
      description:
        "Edita um produto existente. Manda só os campos que quer mudar. Para pausar: isActive=false. Para reativar: isActive=true. Para adicionar fotos sem mexer nas atuais, use addPhotos. Para remover fotos específicas, use removePhotoPaths com o 'path' que get_product retorna. 'photos' substitui TODAS as fotos.",
      inputSchema: z.object({
        id: z.string(),
        category: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        note: z.string().nullable().optional(),
        kitLabel: z.string().nullable().optional(),
        pricingMode: z.enum(["single", "lines"]).optional(),
        price: z.string().optional(),
        priceLines: z.array(z.object({ label: z.string(), price: z.string() })).optional(),
        isActive: z.boolean().optional(),
        photos: z.array(photoSchema).optional().describe("Substitui todas as fotos"),
        addPhotos: z.array(photoSchema).optional().describe("Adiciona sem remover as existentes"),
        removePhotoPaths: z.array(z.string()).optional(),
      }),
    },
    async ({ id, ...rest }) => {
      const result = await updateApiProduct(id, rest);
      if (!result.ok) return toolError(result.error);
      return toolText(result.data);
    }
  );

  server.registerTool(
    "delete_product",
    {
      title: "Apagar um produto",
      description: "Remove um produto permanentemente do cardápio (irreversível). Para só escondê-lo temporariamente, use update_product com isActive=false.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      const result = await deleteApiProduct(id);
      if (!result.ok) return toolError(result.error);
      return toolText({ ok: true });
    }
  );
});

const authHandler = withMcpAuth(
  handler,
  (_req, bearerToken) => {
    const expected = process.env.PRODUCTS_API_KEY;
    if (!expected || !bearerToken || bearerToken !== expected) return undefined;
    return { token: bearerToken, clientId: "sarah-admin", scopes: [] };
  },
  { required: true }
);

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
