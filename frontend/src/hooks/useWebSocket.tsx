import { useCallback, useEffect, useRef, useState } from 'react';

export const useWebSocket = (path: string, query: Record<string, string>) => {
	const [lastMessage, setLastMessage] = useState<string | null>(null);
	const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
	const wsRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		const params = new URLSearchParams(query).toString();
		const url = `${import.meta.env.VITE_LIVETOUR_WS_URL}${path}?${params}`;
		console.log('Connecting to WebSocket:', url);
		const ws = new WebSocket(url);
		wsRef.current = ws;

		ws.onopen = () => {
			console.log('WebSocket opened');
			setReadyState(WebSocket.OPEN);
		};
		ws.onclose = (event) => {
			console.log('WebSocket closed', { code: event.code, reason: event.reason, wasClean: event.wasClean });
			setReadyState(WebSocket.CLOSED);
		};
		ws.onerror = (e) => {
			console.error('WebSocket error', e);
			setReadyState(WebSocket.CLOSED);
		};
		ws.onmessage = (event) => {
			setLastMessage(event.data);
		};

		return () => {
			if (wsRef.current === ws && ws.readyState === WebSocket.OPEN) {
				ws.close();
			}
		};
	}, [path, JSON.stringify(query)]);

	const sendMessage = useCallback((msg: any) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(msg));
		}
	}, []);

	return { sendMessage, lastMessage, readyState, ws: wsRef.current };
};
