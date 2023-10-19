import * as html from 'https://deno.land/std@0.204.0/html/mod.ts';
import {serverURL, serverController} from './server.ts';
import {parse} from '../../mod.ts';

const FEED = new URL('https://shoptalkshow.com/feed/podcast/');
const feedURL = new URL('/rss', serverURL);
feedURL.searchParams.set('feed', FEED.href);

console.log(`Parsing: ${FEED}`);

console.log(`\nTest 1`);

const parseController = new AbortController();
let parser = parse(feedURL, {
  signal: parseController.signal
});

setTimeout(() => {
  console.log(`\n❌ Aborting parser`);
  parseController.abort();
}, 10_000);

for await (const node of parser) {
  if (node.is('channel', 'item')) {
    let title = node.first('title')?.innerText;
    title = html.unescape(title ?? '');
    console.log(`Item found: ${title}`);
  }
}

console.log(`\nTest 2`);

parser = parse(feedURL, {
  silent: false
});

// Kill the server after 10 seconds to test error handling
setTimeout(() => {
  console.log(`\n❌ Aborting server`);
  serverController.abort();
}, 10_000);

try {
  for await (const node of parser) {
    if (node.is('channel', 'item')) {
      let title = node.first('title')?.innerText;
      title = html.unescape(title ?? '');
      console.log(`Item found: ${title}`);
    }
  }
} catch (err) {
  console.log(`Error: ${err.message}`);
}

console.log('\nFeed complete. Closing server.');
// serverController.abort();
