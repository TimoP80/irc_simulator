// Client wrapper for the content parsing Web Worker
// Provides a simple async API: processContentInWorker(content)

export type WorkerResult = {
  links: string[];
  images: string[];
  cleanedContent: string;
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (v: WorkerResult) => void; reject: (e: any) => void; timeout: any }>();

function ensureWorker(): Worker {
  if (worker) return worker;
  // Use the Vite-supported pattern for workers
  worker = new Worker(new URL('../workers/contentParser.worker.ts', import.meta.url), { type: 'module' });

  worker.onmessage = (event: MessageEvent<any>) => {
    const data = event.data as { id: number } & WorkerResult;
    if (!data || typeof data.id !== 'number') return;
    const entry = pending.get(data.id);
    if (entry) {
      clearTimeout(entry.timeout);
      entry.resolve({ links: data.links || [], images: data.images || [], cleanedContent: data.cleanedContent || '' });
      pending.delete(data.id);
    }
  };

  worker.onerror = (err) => {
    // Reject all pending promises and reset worker
    for (const [id, entry] of pending.entries()) {
      clearTimeout(entry.timeout);
      entry.reject(err);
      pending.delete(id);
    }
    try { worker?.terminate(); } catch {}
    worker = null;
  };

  return worker;
}

function fallbackProcess(content: string): WorkerResult {
  try {
    const urlRegex = /(https?:\/\/[^\s<>"]+)/gi;
    const all = content.match(urlRegex) || [];
    const unique = Array.from(new Set(all));
    const images = unique.filter(u => /\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s<>"]*)?$/i.test(u));
    const links = unique.filter(u => !images.includes(u));
    let cleaned = content;
    for (const url of unique) {
      const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(`\\s*${escaped}\\s*`, 'gi'), ' ');
    }
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return { links, images, cleanedContent: cleaned };
  } catch {
    return { links: [], images: [], cleanedContent: content };
  }
}

export async function processContentInWorker(content: string): Promise<WorkerResult> {
  try {
    const w = ensureWorker();
    const id = nextId++;
    return await new Promise<WorkerResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id);
        // Timeout -> fallback synchronously
        try { resolve(fallbackProcess(content)); } catch (e) { reject(e); }
      }, 5000);
      pending.set(id, { resolve, reject, timeout });
      w.postMessage({ id, type: 'process', content });
    });
  } catch (e) {
    // Worker unavailable -> fallback synchronously
    return fallbackProcess(content);
  }
}

