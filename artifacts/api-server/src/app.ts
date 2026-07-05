import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Geo check endpoint (exempt from country blocking) ──
// CF-IPCountry is set by Cloudflare on the deployed domain.
// Returns { allowed: true } in dev (header absent) so development is unaffected.
app.get("/api/geo", (req: Request, res: Response) => {
  const country = (req.headers["cf-ipcountry"] as string) || "";
  const allowed = !country || country === "US";
  res.json({ allowed, country: country || "unknown" });
});

// ── US-only country restriction middleware ──
// Only activates when the CF-IPCountry header is present (Cloudflare proxy).
// In dev/without Cloudflare the header is absent so everyone is allowed through.
app.use((req: Request, res: Response, next: NextFunction) => {
  const country = req.headers["cf-ipcountry"] as string | undefined;
  if (country && country !== "US") {
    res.status(403).json({
      error: "VentWall is currently only available in the United States.",
      blocked: true,
    });
    return;
  }
  next();
});

app.use("/api", router);

export default app;
