import type { Server as IOServer } from 'socket.io';
import {
  BLOG_CREATED_EVENT,
  type RealtimeBlogPost,
} from '@/lib/realtime/events';

const globalForIo = globalThis as typeof globalThis & {
  __apIo?: IOServer;
};

export function setIO(io: IOServer) {
  globalForIo.__apIo = io;
}

export function getIO(): IOServer | undefined {
  return globalForIo.__apIo;
}

export function emitBlogCreated(post: RealtimeBlogPost) {
  getIO()?.emit(BLOG_CREATED_EVENT, post);
}
