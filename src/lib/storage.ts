import fs from "node:fs/promises";
import path from "node:path";

/**
 * Blob storage behind a driver so the app doesn't care whether it's running on
 * a laptop or on GCE. Swap STORAGE_DRIVER=gcs once the bucket exists; nothing
 * else changes.
 */

export interface Stored {
  /** Publicly fetchable URL for the saved object. */
  url: string;
}

interface Driver {
  put(key: string, body: Buffer, contentType: string): Promise<Stored>;
  get(key: string): Promise<Buffer | null>;
}

/* ─────────────────────────────── Local disk ────────────────────────────── */

const LOCAL_ROOT = path.join(process.cwd(), "storage");

const localDriver: Driver = {
  async put(key, body) {
    const file = path.join(LOCAL_ROOT, key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body);
    // Served back through /api/media/[...key] — the storage dir is outside public/
    // on purpose, so try-on results of real people are never statically listable.
    return { url: `/api/media/${key}` };
  },
  async get(key) {
    try {
      return await fs.readFile(path.join(LOCAL_ROOT, key));
    } catch {
      return null;
    }
  },
};

/* ────────────────────────────── Google Cloud ───────────────────────────── */

function gcsDriver(): Driver {
  // Imported lazily so a local dev run never has to load the GCS SDK or find
  // credentials it doesn't need.
  const load = async () => {
    const { Storage } = await import("@google-cloud/storage");
    const bucketName = process.env.GCS_BUCKET;
    if (!bucketName) throw new Error("STORAGE_DRIVER=gcs but GCS_BUCKET is not set");
    return new Storage().bucket(bucketName);
  };

  return {
    async put(key, body, contentType) {
      const bucket = await load();
      await bucket.file(key).save(body, { contentType });
      return { url: `https://storage.googleapis.com/${bucket.name}/${key}` };
    },
    async get(key) {
      const bucket = await load();
      const [exists] = await bucket.file(key).exists();
      if (!exists) return null;
      const [buf] = await bucket.file(key).download();
      return buf;
    },
  };
}

const driver: Driver =
  process.env.STORAGE_DRIVER === "gcs" ? gcsDriver() : localDriver;

export const putObject = (key: string, body: Buffer, contentType = "image/png") =>
  driver.put(key, body, contentType);

export const getObject = (key: string) => driver.get(key);
