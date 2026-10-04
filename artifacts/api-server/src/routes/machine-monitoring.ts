import { Router } from "express";
import { handleApiRequest } from "../machine-monitoring/api";

const router = Router();

router.use(async (req, res) => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }
  const hasBody = !["GET", "HEAD"].includes(req.method);
  const request = new Request(new URL(req.originalUrl, "http://api.internal"), {
    method: req.method,
    headers,
    ...(hasBody ? { body: JSON.stringify(req.body ?? {}) } : {}),
  });
  const response = await handleApiRequest(request);
  res.status(response.status);
  response.headers.forEach((value, name) => {
    if (name !== "set-cookie") res.setHeader(name, value);
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) res.setHeader("set-cookie", cookies);
  res.setHeader("Cache-Control", "no-store");
  res.send(await response.text());
});

export default router;