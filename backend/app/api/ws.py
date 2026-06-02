"""
WebSocket endpoint: ws://host/ws/{user_id}?token=<JWT>
Each connected user registers with their user_id so the server can push events to them.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.utils.ws_manager import manager
from app.core.security import decode_access_token

router = APIRouter()


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    token: str = Query(...),
):
    # Validate JWT before accepting the connection
    try:
        payload = decode_access_token(token)
        token_user_id = int(payload.get("sub") or payload.get("user_id") or 0)
        if token_user_id != user_id:
            await websocket.close(code=4001)
            return
    except Exception:
        await websocket.close(code=4001)
        return

    await manager.connect(user_id, websocket)
    try:
        # Keep the connection alive; client can send pings
        while True:
            await websocket.receive_text()   # heartbeat / keep-alive
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
