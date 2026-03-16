type LiveClient = {
  id: number;
  res: {
    write: (chunk: string) => void;
    end: () => void;
  };
};

const clients = new Map<number, LiveClient>();
let clientIdCounter = 1;

export function registerLiveClient(res: LiveClient["res"]) {
  const id = clientIdCounter++;
  clients.set(id, { id, res });
  return id;
}

export function unregisterLiveClient(id: number) {
  const client = clients.get(id);
  if (client) {
    clients.delete(id);
  }
}

export function sendLiveEvent(
  res: LiveClient["res"],
  event: string,
  data: unknown,
) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function broadcastLiveEvent(event: string, data: unknown) {
  for (const [, client] of clients) {
    try {
      sendLiveEvent(client.res, event, data);
    } catch {
      try {
        client.res.end();
      } catch {}
      clients.delete(client.id);
    }
  }
}

export function getLiveClientCount() {
  return clients.size;
}

export function makeLivePayload(type: string, message: string, extra?: Record<string, unknown>) {
  return {
    type,
    message,
    ts: new Date().toISOString(),
    ...(extra ?? {}),
  };
}
