import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Runs the Netlify functions in netlify/functions/ inside the Vite dev server,
 * so `npm run dev:ui` works without the Netlify CLI. Production uses Netlify.
 */
function netlifyFunctionsDev() {
  const routes = {
    "/api/medlineplus": "/netlify/functions/medlineplus.mjs",
    "/api/ai": "/netlify/functions/ai.mjs",
    "/api/translate": "/netlify/functions/translate.mjs",
  };
  return {
    name: "carebridge-functions-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url.split("?")[0];
        const file = routes[path];
        if (!file) return next();
        try {
          const mod = await server.ssrLoadModule(file);
          const chunks = [];
          for await (const c of req) chunks.push(c);
          const body = chunks.length ? Buffer.concat(chunks) : undefined;
          const request = new Request(`http://${req.headers.host}${req.url}`, {
            method: req.method,
            headers: req.headers,
            body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
          });
          const response = await mod.default(request, { ip: req.socket.remoteAddress });
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.config.logger.error(err.stack || String(err));
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "dev_function_error" }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Server-side env vars (.env) for the dev functions. Never exposed to the browser:
  // only VITE_-prefixed variables reach client code.
  Object.assign(process.env, { ...loadEnv(mode, process.cwd(), ""), ...process.env });
  return {
  plugins: [react(), netlifyFunctionsDev()],
  test: {
    environment: "node",
  },
  };
});
