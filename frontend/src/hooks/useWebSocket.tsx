import { useCallback, useEffect, useRef, useState } from "react";

export type ConnectionStatus = "connecting" | "connected" | "closing" | "disconnected" | "unknown";

export type UseWebSocketOptions = {
	onMessage?: (data: string) => void;
};

export const useWebSocket = (url: string, options?: UseWebSocketOptions) => {
	const [lastMessage, setLastMessage] = useState<string | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
	const wsRef = useRef<WebSocket | null>(null);
	const onMessageRef = useRef(options?.onMessage);
	onMessageRef.current = options?.onMessage;

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
			onMessageRef.current?.(event.data);
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
