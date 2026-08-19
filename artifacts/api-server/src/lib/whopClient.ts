import Whop from "@whop/sdk";

let clientPromise: Promise<Whop> | null = null;

async function initWhopClient(): Promise<Whop> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const token = process.env.REPL_IDENTITY
    ? `repl ${process.env.REPL_IDENTITY}`
    : process.env.WEB_REPL_RENEWAL
      ? `depl ${process.env.WEB_REPL_RENEWAL}`
      : null;
  if (!hostname || !token) throw new Error("Conexão Whop indisponível");
  const response = await fetch(`https://${hostname}/api/v2/connection?include_secrets=true&connector_names=whop`, {
    headers: { Accept: "application/json", X_REPLIT_TOKEN: token },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Falha ao carregar a conexão Whop: ${response.status}`);
  const data = await response.json() as { items?: Array<{ settings?: { api_key?: string } }> };
  const apiKey = data.items?.[0]?.settings?.api_key;
  if (!apiKey) throw new Error("Whop não está conectado");
  return new Whop({ apiKey });
}

export function getWhopClient(): Promise<Whop> {
  if (!clientPromise) {
    clientPromise = initWhopClient().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
}