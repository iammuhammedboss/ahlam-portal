"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(
  enquiryId: number,
  onNewMessage: (msg: unknown) => void
) {
  const socketRef = useRef<Socket | null>(null);
  const callbackRef = useRef(onNewMessage);
  callbackRef.current = onNewMessage;

  useEffect(() => {
    const socket = io({
      path: "/api/socketio",
      addTrailingSlash: false,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-enquiry", { enquiryId });
    });

    socket.on("new-message", (msg: unknown) => {
      callbackRef.current(msg);
    });

    return () => {
      socket.emit("leave-enquiry", { enquiryId });
      socket.disconnect();
    };
  }, [enquiryId]);

  return socketRef;
}

export function useAgentSocket(onInboxUpdate: (enquiry: unknown) => void) {
  const socketRef = useRef<Socket | null>(null);
  const callbackRef = useRef(onInboxUpdate);
  callbackRef.current = onInboxUpdate;

  useEffect(() => {
    const socket = io({
      path: "/api/socketio",
      addTrailingSlash: false,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-agent");
    });

    socket.on("inbox-update", (enquiry: unknown) => {
      callbackRef.current(enquiry);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef;
}
