#!/usr/bin/env -S node

import {parse} from '../mod.min.mjs';

const blog = async () => {
  const parser = parse('https://dbushell.com/rss.xml');
  for await (const node of parser) {
    if (node.is('channel', 'item')) {
      console.log(node.first('title')?.innerText);
    }
    if (node.type === 'channel') {
      const items = node.all('item');
      console.log(`Total items: ${items.length}`);
    }
  }
};

const podcast = async () => {
  const contoller = new AbortController();
  const parser = parse('https://feed.syntax.fm/rss', {
    signal: contoller.signal
  });
  const items = [];
  for await (const node of parser) {
    if (node.is('channel', 'item')) {
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
