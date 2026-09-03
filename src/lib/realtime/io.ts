import type { Server as IOServer } from 'socket.io';
import {
  BLOG_CREATED_EVENT,
  type RealtimeBlogPost,
} from '@/lib/realtime/events';

const globalForIo = globalThis as typeof globalThis & {
  __atlasIo?: IOServer;
};

export function setIO(io: IOServer) {
  globalForIo.__atlasIo = io;
}

export function getIO(): IOServer | undefined {
  return globalForIo.__atlasIo;
}

export function emitBlogCreated(post: RealtimeBlogPost) {
  getIO()?.emit(BLOG_CREATED_EVENT, post);
}
