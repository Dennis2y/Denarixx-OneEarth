import { Router, type IRouter } from "express";
import {
  registerLiveClient,
  unregisterLiveClient,
  sendLiveEvent,
  broadcastLiveEvent,
  getLiveClientCount,
  makeLivePayload,
} from "../lib/live.js";

const router: IRouter = Router();

router.get("/live/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const clientId = registerLiveClient(res);

  sendLiveEvent(
    res,
    "connected",
    makeLivePayload("live:connected", "Live stream connected", {
      clientId,
      connectedClients: getLiveClientCount(),
    }),
  );

  const heartbeat = setInterval(() => {
    sendLiveEvent(
      res,
      "heartbeat",
      makeLivePayload("live:heartbeat", "Heartbeat", {
        connectedClients: getLiveClientCount(),
      }),
    );
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unregisterLiveClient(clientId);
    res.end();
  });
});

router.post("/live/broadcast", (_req, res) => {
  const payload = makeLivePayload(
    "map:update",
    "Critical live command update",
    {
      connectedClients: getLiveClientCount(),
    },
  );

  broadcastLiveEvent("map-update", payload);

  return res.json({
    ok: true,
    sentTo: getLiveClientCount(),
    payload,
  });
});

export default router;
