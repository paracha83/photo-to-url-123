import { Request, Response } from 'express';
import { getStorageProvider } from './storage';

export async function imageResolverHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    // Strip file extension if client requests /i/abc123.jpg or /i/abc123
    const cleanId = id.replace(/\.[a-zA-Z0-9]+$/, '');

    const storage = getStorageProvider();
    const item = await storage.getImage(cleanId);

    if (!item) {
      res.status(404).setHeader('Content-Type', 'text/html').send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Image Not Found | Image To URL</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { background: #09090b; color: #f4f4f5; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #18181b; border: 1px solid #27272a; padding: 2.5rem; border-radius: 1rem; text-align: center; max-width: 420px; }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #f43f5e; }
            p { color: #a1a1aa; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem; }
            a { display: inline-block; background: #6366f1; color: white; padding: 0.6rem 1.25rem; border-radius: 0.5rem; text-decoration: none; font-weight: 500; font-size: 0.9rem; }
            a:hover { background: #4f46e5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>404 — Image Unavailable</h1>
            <p>This image either does not exist, was removed by the uploader, or has reached its retention expiration date.</p>
            <a href="/">Go to Image To URL Home</a>
          </div>
        </body>
        </html>
      `);
      return;
    }

    // Security & Cache Headers
    res.setHeader('Content-Type', item.mimeType);
    res.setHeader('Content-Length', item.buffer.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', `"${item.metadata.id}-${item.metadata.size}"`);

    // Handle If-None-Match conditional GET
    if (req.headers['if-none-match'] === `"${item.metadata.id}-${item.metadata.size}"`) {
      res.status(340).end();
      return;
    }

    res.send(item.buffer);
  } catch (err) {
    console.error('Error resolving image:', err);
    res.status(500).send('Internal Server Error while retrieving image');
  }
}
