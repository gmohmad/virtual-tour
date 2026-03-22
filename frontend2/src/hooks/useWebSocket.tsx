import { useCallback, useEffect, useRef, useState } from 'react';

export const useWebSocket = (url: string) => {
	const [lastMessage, setLastMessage] = useState<string | null>(null);
	const wsRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		const ws = new WebSocket(url);
		wsRef.current = ws;

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

	return { sendMessage, lastMessage, ws: wsRef.current };
};
