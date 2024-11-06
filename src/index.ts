import { Hono } from "hono";

const app = new Hono();

app.get("/download/:id", async (c) => {
  const id = c.req.param("id");
  const res = await fetch(`https://haxel.herbievine.com/${id}`);

  if (!res.ok) {
    return c.json({ message: await res.text(), status: res.status }, 500);
  }

  return c.json(await res.json());
});

export default app;
