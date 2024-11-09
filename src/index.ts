import { Hono } from "hono";
import archiver from "archiver";
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

  const { album, artist, songs } = await res.json();

  // c.header("Content-Type", "application/zip");
  // c.header("Content-Disposition", `attachment; filename="${artist.name} - ${album.name}.zip"`);

  const archive = archiver("zip", { zlib: { level: 9 } });

  for (const song of songs) {
    console.log(`Preparing ${song.name} (${song.trackNumber}/${album.trackCount})`);

    const arrayBuffer = await getArrayBuffer(`https://audio.herbievine.com/${song.bucketId}`, {
      headers: {
        "content-type": "audio/mpeg",
      },
    });

    archive.append(Buffer.from(arrayBuffer), {
      name: `${artist.name} - ${song.name}.mp3`,
    });

    console.log(`Zipped ${song.name} (${song.trackNumber}/${album.trackCount})`);

    continue;
  }

  archive.finalize();

  return c.body(Readable.toWeb(archive) as unknown as ReadableStream);
});

export default app;
