import { Server as SocketServer } from "socket.io";

let io: SocketServer | null = null;

export function initSocket(socketServer: SocketServer) {
  io = socketServer;

  io.on("connection", (socket) => {
    socket.on("join-enquiry", ({ enquiryId }: { enquiryId: number }) => {
      socket.join(`enquiry:${enquiryId}`);
    });

    socket.on("leave-enquiry", ({ enquiryId }: { enquiryId: number }) => {
      socket.leave(`enquiry:${enquiryId}`);
    });

    socket.on("join-agent", () => {
      socket.join("agent-inbox");
    });
  });
}

export function getIO(): SocketServer | null {
  return io;
}

export function emitNewMessage(enquiryId: number, message: unknown) {
  io?.to(`enquiry:${enquiryId}`).emit("new-message", message);
}

export function emitInboxUpdate(enquiry: unknown) {
  io?.to("agent-inbox").emit("inbox-update", enquiry);
}
