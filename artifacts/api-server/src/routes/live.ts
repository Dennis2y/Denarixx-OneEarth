import { Router, type IRouter } from "express";

const router: IRouter = Router();

type Client = {
  id: number;
  res: any;
};

let clientIdCounter = 1;
const clients = new Map<number, Client>();

function sendEvent(res: any, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

router.get("/live/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const clientId = clientIdCounter++;
  clients.set(clientId, { id: clientId, res });

  sendEvent(res, "connected", {
    ok: true,
    clientId,
    ts: new Date().toISOString(),
  });

  const heartbeat = setInterval(() => {
    sendEvent(res, "heartbeat", {
      ts: new Date().toISOString(),
    });
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(clientId);
    res.end();
  });
});

router.post("/live/broadcast", (req, res) => {
  const payload = {
    type: req.body?.type ?? "map:update",
    message: req.body?.message ?? "Global command update received",
    ts: new Date().toISOString(),
  };

  for (const [, client] of clients) {
    sendEvent(client.res, "map-update", payload);
  }

  return res.json({
    ok: true,
    sentTo: clients.size,
    payload,
  });
});

export default router;
