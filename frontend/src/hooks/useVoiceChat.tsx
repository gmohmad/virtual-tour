import { useCallback, useEffect, useRef, useState } from "react";
import type { ConnectionStatus } from "./useWebSocket";
import {
	mapLiveTourParticipant,
	type LiveTourParticipant,
	type LiveTourParticipantWire,
} from "../types/livetour";

const iceServers: RTCIceServer[] = [{ urls: import.meta.env.VITE_STUN_SERVER }];

export type VoiceChatOptions = {
	selfId: string;
	sendMessage: (msg: Record<string, unknown>) => void;
	connectionStatus: ConnectionStatus;
};

export function useVoiceChat({ selfId, sendMessage, connectionStatus }: VoiceChatOptions) {
	const [participants, setParticipants] = useState<LiveTourParticipant[]>([]);
	const [localMicMuted, setLocalMicMuted] = useState(true);
	const [serverMuted, setServerMuted] = useState(false);

	const localMicMutedRef = useRef(true);
	const serverMutedRef = useRef(false);
	localMicMutedRef.current = localMicMuted;
	serverMutedRef.current = serverMuted;

	const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
	const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
	const localStreamRef = useRef<MediaStream | null>(null);
	const remoteAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());
	const sendMessageRef = useRef(sendMessage);
	sendMessageRef.current = sendMessage;

	const applyTrackState = (stream: MediaStream) => {
		const off = localMicMutedRef.current || serverMutedRef.current;
		stream.getAudioTracks().forEach((t) => {
			t.enabled = !off;
		});
	};

	const ensureLocalStream = useCallback(async () => {
		if (localStreamRef.current) {
			applyTrackState(localStreamRef.current);
			return localStreamRef.current;
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
			localStreamRef.current = stream;
			applyTrackState(stream);
			return stream;
		} catch (e) {
			console.error("getUserMedia failed", e);
			return null;
		}
	}, []);

	const flushIce = async (remoteId: string, pc: RTCPeerConnection) => {
		const pending = pendingIceRef.current.get(remoteId);
		if (!pending?.length) return;
		pendingIceRef.current.delete(remoteId);
		for (const c of pending) {
			try {
				await pc.addIceCandidate(c);
			} catch {
			}
		}
	};

	const setupPc = useCallback((remoteId: string, pc: RTCPeerConnection) => {
		pc.onicecandidate = (e) => {
			if (e.candidate) {
				sendMessageRef.current({
					type: "webrtc_ice",
					to: remoteId,
					candidate: e.candidate.toJSON(),
				});
			}
		};
		pc.ontrack = (e) => {
			const [stream] = e.streams;
			let audio = remoteAudioRef.current.get(remoteId);
			if (!audio) {
				audio = document.createElement("audio");
				audio.autoplay = true;
				document.body.appendChild(audio);
				remoteAudioRef.current.set(remoteId, audio);
			}
			audio.srcObject = stream;
		};
	}, []);

	const closePeer = useCallback((remoteId: string) => {
		const pc = peersRef.current.get(remoteId);
		if (pc) {
			pc.close();
			peersRef.current.delete(remoteId);
		}
		pendingIceRef.current.delete(remoteId);
		const audio = remoteAudioRef.current.get(remoteId);
		if (audio) {
			audio.srcObject = null;
			audio.remove();
			remoteAudioRef.current.delete(remoteId);
		}
	}, []);

	const createOfferToPeer = useCallback(
		async (remoteId: string) => {
			if (!remoteId || remoteId === selfId) return;
			if (peersRef.current.has(remoteId)) return;
			const stream = await ensureLocalStream();
			if (!stream) return;

			const pc = new RTCPeerConnection({ iceServers });
			peersRef.current.set(remoteId, pc);
			setupPc(remoteId, pc);
			stream.getTracks().forEach((t) => pc.addTrack(t, stream));

			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);
			sendMessageRef.current({ type: "webrtc_offer", to: remoteId, sdp: offer.sdp });
		},
		[selfId, ensureLocalStream, setupPc],
	);

	const handleOffer = useCallback(
		async (from: string, sdp: string) => {
			if (!from || from === selfId) return;
			const stream = await ensureLocalStream();
			if (!stream) return;

			let pc = peersRef.current.get(from);
			if (!pc) {
				pc = new RTCPeerConnection({ iceServers });
				peersRef.current.set(from, pc);
				setupPc(from, pc);
				stream.getTracks().forEach((t) => pc!.addTrack(t, stream));
			}

			await pc.setRemoteDescription({ type: "offer", sdp });
			await flushIce(from, pc);
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);
			sendMessageRef.current({ type: "webrtc_answer", to: from, sdp: answer.sdp });
		},
		[selfId, ensureLocalStream, setupPc],
	);

	const handleAnswer = useCallback(async (from: string, sdp: string) => {
		const pc = peersRef.current.get(from);
		if (!pc) return;
		await pc.setRemoteDescription({ type: "answer", sdp });
		await flushIce(from, pc);
	}, []);

	const handleRemoteIce = useCallback(
		async (from: string, candidate: RTCIceCandidateInit | null) => {
			if (!candidate?.candidate) return;
			const pc = peersRef.current.get(from);
			if (!pc?.remoteDescription) {
				const list = pendingIceRef.current.get(from) ?? [];
				list.push(candidate);
				pendingIceRef.current.set(from, list);
				return;
			}
			try {
				await pc.addIceCandidate(candidate);
			} catch {
			}
		},
		[],
	);

	const handleSocketMessage = useCallback(
		async (raw: string) => {
			let msg: Record<string, unknown>;
			try {
				msg = JSON.parse(raw);
			} catch {
				return;
			}
			const type = msg.type as string;

			switch (type) {
				case "session_sync": {
					const rawParts = msg.participants as LiveTourParticipantWire[] | undefined;
					const parts = (rawParts ?? []).map((p) => mapLiveTourParticipant(p));
					setParticipants(parts);
					for (const p of parts) {
						if (p.id !== selfId) await createOfferToPeer(p.id);
					}
					break;
				}
				case "participant_joined": {
					const p = mapLiveTourParticipant(msg.participant as LiveTourParticipantWire);
					setParticipants((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]));
					break;
				}
				case "participant_left": {
					const id = msg.client_id as string;
					closePeer(id);
					setParticipants((prev) => prev.filter((p) => p.id !== id));
					break;
				}
				case "participant_updated": {
					const p = mapLiveTourParticipant(msg.participant as LiveTourParticipantWire);
					if (p.id === selfId) {
						setServerMuted(p.serverMuted);
						serverMutedRef.current = p.serverMuted;
						if (p.serverMuted) {
							setLocalMicMuted(true);
							localMicMutedRef.current = true;
						}
						if (localStreamRef.current) applyTrackState(localStreamRef.current);
					}
					setParticipants((prev) => {
						const i = prev.findIndex((x) => x.id === p.id);
						if (i < 0) return [...prev, p];
						const next = [...prev];
						next[i] = p;
						return next;
					});
					break;
				}
				case "you_are_server_muted": {
					const m = !!msg.muted;
					setServerMuted(m);
					serverMutedRef.current = m;
					if (m) {
						setLocalMicMuted(true);
						localMicMutedRef.current = true;
					}
					if (localStreamRef.current) applyTrackState(localStreamRef.current);
					break;
				}
				case "webrtc_offer": {
					const from = msg.from as string;
					const sdp = msg.sdp as string;
					await handleOffer(from, sdp);
					break;
				}
				case "webrtc_answer": {
					const from = msg.from as string;
					const sdp = msg.sdp as string;
					await handleAnswer(from, sdp);
					break;
				}
				case "webrtc_ice": {
					const from = msg.from as string;
					const candidate = msg.candidate as RTCIceCandidateInit | null;
					await handleRemoteIce(from, candidate);
					break;
				}
				default:
					break;
			}
		},
		[selfId, createOfferToPeer, closePeer, handleOffer, handleAnswer, handleRemoteIce],
	);

	const toggleLocalMic = useCallback(() => {
		if (serverMutedRef.current) return;
		const next = !localMicMutedRef.current;
		localMicMutedRef.current = next;
		setLocalMicMuted(next);
		if (localStreamRef.current) applyTrackState(localStreamRef.current);
		sendMessageRef.current({ type: "mic_state", muted: next });
	}, []);

	const kickParticipant = useCallback((targetId: string) => {
		sendMessageRef.current({ type: "moderation_kick", target_id: targetId });
	}, []);

	const setParticipantRemoteMute = useCallback((targetId: string, muted: boolean) => {
		sendMessageRef.current({ type: "moderation_mute", target_id: targetId, muted });
	}, []);

	useEffect(() => {
		if (connectionStatus !== "disconnected") return;
		peersRef.current.forEach((pc) => pc.close());
		peersRef.current.clear();
		pendingIceRef.current.clear();
		remoteAudioRef.current.forEach((a) => {
			a.srcObject = null;
			a.remove();
		});
		remoteAudioRef.current.clear();
	}, [connectionStatus]);

	useEffect(() => {
		return () => {
			peersRef.current.forEach((pc) => pc.close());
			peersRef.current.clear();
			pendingIceRef.current.clear();
			remoteAudioRef.current.forEach((a) => {
				a.srcObject = null;
				a.remove();
			});
			remoteAudioRef.current.clear();
			localStreamRef.current?.getTracks().forEach((t) => t.stop());
			localStreamRef.current = null;
		};
	}, []);

	return {
		participants,
		localMicMuted,
		serverMuted,
		toggleLocalMic,
		handleSocketMessage,
		kickParticipant,
		setParticipantRemoteMute,
	};
}
