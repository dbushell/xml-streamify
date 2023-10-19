// Deno web proxy server that streams a feed slowly in chunks
// Based on: https://github.com/dbushell/deno_turtle/

// Generate feed in chunks
const generate = function* (bytes: string, chunkSize: number) {
  const encoder = new TextEncoder();
  while (bytes.length) {
    const chunk = bytes.slice(0, Math.min(bytes.length, chunkSize));
    bytes = bytes.slice(chunk.length);
    yield encoder.encode(chunk);
  }
};

// ReadableStream response from generator
const stream = async (url: URL | string) => {
  const bytes = await (await fetch(url)).text();
  // 512 byte chunks at 5120 bytes per second
  const delay = (512 / 5120) * 1000;
  const generator = generate(bytes, 512);
  const stream = new ReadableStream({
    async start(controller) {
      while (true) {
        const {value, done} = generator.next();
        if (done) {
          controller.close();
          break;
        }
        controller.enqueue(value);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  });
  const headers = new Headers();
  headers.set('access-control-allow-origin', '*');
  headers.set('content-type', 'application/xml');
  headers.set('cache-control', 'no-store');
  return new Response(stream, {
    headers
  });
};

// default test feed
const FEED = 'https://dbushell.com/rss.xml';

export const serverURL = new URL('http://localhost:3001/');

export const serverController = new AbortController();

Deno.serve(
  {
    port: Number(serverURL.port),
    hostname: serverURL.hostname,
    signal: serverController.signal,
    onListen: () => {
      console.log(`🚀 Proxy server on ${serverURL.href}`);
      console.log('\nExample feeds:');
      console.log(`${serverURL.href}rss`);
      console.log(
        `${serverURL.href}rss?feed=https://shoptalkshow.com/feed/podcast/`
      );
      console.log(`\n⚠️ This server is intentionally slow!\n`);
    },
    onError: (error) => {
      console.error(error);
      return new Response(null, {
        status: 500
      });
    }
  },
  (request: Request) => {
    const url = new URL(request.url);
    if (url.pathname === '/rss') {
      return stream(url.searchParams.get('feed') ?? FEED);
    }
    return new Response(null, {
      status: 302,
      headers: {
        location: '/rss'
      }
    });
  }
);
