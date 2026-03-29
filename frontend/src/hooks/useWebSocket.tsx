import { useCallback, useEffect, useRef, useState } from "react";

export type ConnectionStatus = "connecting" | "connected" | "closing" | "disconnected" | "unknown";

export const useWebSocket = (url: string) => {
	const [lastMessage, setLastMessage] = useState<string | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
	const wsRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		const ws = new WebSocket(url);
		wsRef.current = ws;

		setConnectionStatus("connecting");

		ws.onopen = () => {
			setConnectionStatus("connected");
		};

		ws.onclose = (event) => {
			setConnectionStatus(event.wasClean ? "disconnected" : "disconnected");
		};

		ws.onerror = () => {
			setConnectionStatus("disconnected");
		};

		ws.onmessage = (event) => {
			setLastMessage(event.data);
		};

		return () => {
			if (wsRef.current === ws && ws.readyState === WebSocket.OPEN) {
				ws.close();
			}
		};
	}, [url]);

	const sendMessage = useCallback((msg: any) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(msg));
		}
	}, []);

	return { sendMessage, lastMessage, connectionStatus };
};
