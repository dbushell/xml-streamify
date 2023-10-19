#!/usr/bin/env -S bun run

import {parse, Node} from '../mod';

const blog = async () => {
  const parser = parse('https://dbushell.com/rss.xml');
  for await (const node of parser) {
    if (node.is(['channel', 'item'])) {
      console.log(node.first('title')?.innerText);
    }
    if (node.type === 'channel') {
      const items = node.all(['item']);
      console.log(`Total items: ${items.length}`);
    }
  }
};

// Bun currently has issues with aborting a stream
// https://github.com/oven-sh/bun/issues/2489

const podcast = async () => {
  const contoller = new AbortController();
  const parser = parse('https://feed.syntax.fm/rss', {
    signal: contoller.signal
  });
  const items: Node[] = [];
  for await (const node of parser) {
    if (node.is(['channel', 'item'])) {
      items.push(node);
      if (items.length === 10) {
        contoller.abort();
      }
    }
  }
  console.log(items.map((item) => item.first('title')?.innerText));
};

await blog();
await podcast();
