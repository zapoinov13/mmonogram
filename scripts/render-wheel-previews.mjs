// Authoring-only renderer: open the printed URL, then stop the server after Done.
import { createServer } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const names = new Set(["monoblock", "multispoke", "crossspoke", "turbine", "disc"]);
const finishes = new Set(["graphite", "silver", "gold", "black", "bronze"]);
const server = await createServer({
  server: { host: "127.0.0.1", port: 5176, strictPort: true, hmr: false, watch: { ignored: ["**/public/images/wheels/**"] } },
  plugins: [{
    name: "local-wheel-preview-writer",
    configureServer(vite) {
      vite.middlewares.use("/__wheel-preview", async (req, res) => {
        try {
          const url = new URL(req.url, "http://127.0.0.1:5176");
          const design = url.searchParams.get("design");
          const finish = url.searchParams.get("finish");
          if (req.method !== "POST" || req.headers.origin !== "http://127.0.0.1:5176" || !names.has(design) || !finishes.has(finish)) {
            res.writeHead(400).end();
            return;
          }
          const chunks = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 2 * 1024 * 1024) throw new Error("Image too large");
            chunks.push(chunk);
          }
          const source = sharp(Buffer.concat(chunks));
          const metadata = await source.metadata();
          if (metadata.width !== 384 || metadata.height !== 384) throw new Error("Wrong dimensions");
          const image = await source.webp({ quality: 90 }).toBuffer();
          await mkdir("public/images/wheels", { recursive: true });
          await writeFile(`public/images/wheels/${design}-${finish}.webp`, image);
          console.log(`${design}-${finish}: ${image.length} bytes`);
          res.writeHead(200).end("ok");
        } catch (error) {
          console.error(error);
          res.writeHead(500).end("Preview generation failed");
        }
      });
    },
  }],
});
await server.listen();
console.log("Open http://127.0.0.1:5176/scripts/wheel-previews.html");
