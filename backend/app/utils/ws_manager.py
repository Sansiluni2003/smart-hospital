"""
WebSocket Connection Manager
Keeps one (or more) live WebSocket connections per user_id.
Thread-safe for single-process uvicorn; for multi-worker use Redis pub/sub instead.
"""
from __future__ import annotations
import asyncio
import json
from typing import DefaultDict
from collections import defaultdict
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # user_id (int) → list of active WebSocket connections
        self._connections: DefaultDict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self._connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        conns = self._connections.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)

    async def send(self, user_id: int, payload: dict):
        """Send a JSON payload to every connection owned by user_id."""
        dead: list[WebSocket] = []
        for ws in list(self._connections.get(user_id, [])):
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(user_id, ws)

    async def broadcast_role(self, user_ids: list[int], payload: dict):
        """Broadcast to a list of user_ids (e.g. all staff)."""
        await asyncio.gather(*[self.send(uid, payload) for uid in user_ids])


# Single global instance shared across all modules
manager = ConnectionManager()
