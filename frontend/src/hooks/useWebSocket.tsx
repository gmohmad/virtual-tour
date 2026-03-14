import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (url: string) => {
	const [lastMessage, setLastMessage] = useState<string | null>(null);
	const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
	const wsRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		const ws = new WebSocket(url);
		wsRef.current = ws;

		ws.onopen = () => setReadyState(WebSocket.OPEN);
		ws.onclose = () => setReadyState(WebSocket.CLOSED);
		ws.onerror = () => setReadyState(WebSocket.CLOSED);
		ws.onmessage = (event) => setLastMessage(event.data);

		return () => ws.close();
	}, [url]);

	const sendMessage = (msg: any) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(msg));
		}
	};

	return { sendMessage, lastMessage, readyState };
};
