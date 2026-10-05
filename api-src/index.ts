import type { IncomingMessage, ServerResponse } from "node:http";
import { handleApiRequest } from "../artifacts/api-server/src/machine-monitoring/api";

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
) {
  // Build Web API Headers from IncomingMessage
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers.set(name, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  // CORS
  const origin = req.headers.origin ?? "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,Cookie");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Build raw body string
  const rawBody = await new Promise<string>((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => { data += chunk.toString(); });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

  const hasBody = !["GET", "HEAD"].includes(req.method ?? "GET");

  const url = new URL(req.url ?? "/", "http://api.internal");

  const request = new Request(url, {
    method: req.method ?? "GET",
    headers,
    ...(hasBody && rawBody ? { body: rawBody } : {}),
  });

  const response = await handleApiRequest(request);

  res.statusCode = response.status;
  response.headers.forEach((value: string, name: string) => {
    if (name !== "set-cookie") res.setHeader(name, value);
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) res.setHeader("set-cookie", cookies);
  res.setHeader("Cache-Control", "no-store");

  const body = await response.text();
  res.end(body);
}
