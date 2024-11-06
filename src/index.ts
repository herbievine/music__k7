import { Hono } from "hono";
import * as archiver from "archiver";
import { Readable } from "stream";

const app = new Hono();

export async function getArrayBuffer(link: string, init?: RequestInit) {
  const response = await fetch(link, init);

  return response.arrayBuffer();
}

app.get("/", async (c) => c.text(":)"));

app.get("/download/:id", async (c) => {
  const id = c.req.param("id");
  const res = await fetch(`https://haxel.herbievine.com/download/album/${id}`);

  if (!res.ok) {
    return c.json({ message: await res.text(), status: res.status }, 500);
  }

  const { artist, songs } = await res.json();

  const archive = archiver("zip", { zlib: { level: 9 } });

  for (const song of songs) {
    const arrayBuffer = await getArrayBuffer(`https://audio.herbievine.com/${song.bucketId}`, {
      headers: {
        "content-type": "audio/mpeg",
      },
    });

    archive.append(Buffer.from(arrayBuffer), {
      name: `${artist.name} - ${song.name}.mp3`,
    });

    continue;
  }

  archive.finalize();

  return c.body(Readable.toWeb(archive) as unknown as ReadableStream);
});

export default app;
