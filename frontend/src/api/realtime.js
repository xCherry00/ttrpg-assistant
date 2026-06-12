import { API_URL } from "./http";

export function createRealtimeEventSource(token) {
  const listeners = new Map();
  const controller = new AbortController();

  const dispatch = (eventName, data) => {
    const event = { type: eventName, data };
    listeners.get(eventName)?.forEach((listener) => listener(event));
    if (eventName === "message" && typeof source.onmessage === "function") {
      source.onmessage(event);
    }
  };

  const source = {
    onmessage: null,
    onerror: null,
    addEventListener(eventName, listener) {
      const current = listeners.get(eventName) || new Set();
      current.add(listener);
      listeners.set(eventName, current);
    },
    removeEventListener(eventName, listener) {
      listeners.get(eventName)?.delete(listener);
    },
    close() {
      controller.abort();
    },
  };

  void readRealtimeStream(token, controller.signal, dispatch, (error) => {
    if (!controller.signal.aborted && typeof source.onerror === "function") {
      source.onerror(error);
    }
  });

  return source;
}

async function readRealtimeStream(token, signal, dispatch, onError) {
  try {
    const response = await fetch(`${API_URL}/api/realtime/events`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal,
    });
    if (!response.ok || !response.body) {
      throw new Error("Realtime connection failed");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split(/\r?\n\r?\n/);
      buffer = chunks.pop() || "";
      chunks.forEach((chunk) => dispatchSseChunk(chunk, dispatch));
    }
  } catch (error) {
    if (!signal.aborted) onError(error);
  }
}

function dispatchSseChunk(chunk, dispatch) {
  let eventName = "message";
  const data = [];

  chunk.split(/\r?\n/).forEach((line) => {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim() || "message";
    } else if (line.startsWith("data:")) {
      data.push(line.slice("data:".length).trimStart());
    }
  });

  dispatch(eventName, data.join("\n"));
}
