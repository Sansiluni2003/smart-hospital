/**
 * useWebSocket – connects to ws://host/ws/{userId}?token=<JWT>
 * Fires onMessage(event) whenever the server pushes a payload.
 * Auto-reconnects with exponential backoff on unexpected disconnect.
 */
"use client";

import { useEffect, useRef, useCallback } from "react";

export interface WsEvent {
  event: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export function useWebSocket(onMessage: (evt: WsEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryDelay = useRef(1000);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const wsUrl = apiUrl.replace(/^http/, "ws");

    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const tokenStr = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!userStr || !tokenStr) return;

    let userId: number;
    try {
      const user = JSON.parse(userStr) as { UserID?: number; user_id?: number };
      userId = user.UserID ?? user.user_id ?? 0;
      if (!userId) return;
    } catch {
      return;
    }

    const url = `${wsUrl}/ws/${userId}?token=${encodeURIComponent(tokenStr)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryDelay.current = 1000; // reset backoff on successful connect
      // Send a heartbeat ping every 25 s to keep the connection alive
      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
        else clearInterval(ping);
      }, 25_000);
    };

    ws.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data as string) as WsEvent;
        onMessageRef.current(payload);
      } catch {
        // ignore non-JSON (ping/pong)
      }
    };

    ws.onclose = (e) => {
      if (e.code === 4001) return; // auth failure — don't retry
      // Reconnect with backoff
      setTimeout(() => {
        retryDelay.current = Math.min(retryDelay.current * 2, 30_000);
        connect();
      }, retryDelay.current);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);
}
