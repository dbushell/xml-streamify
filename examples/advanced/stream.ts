import {XMLStream} from '../../mod.ts';

const response = await fetch('https://dbushell.com/rss.xml');

if (!response.ok || !response.body) {
  throw new Error('Bad response');
}

const stream = response.body.pipeThrough(new XMLStream());

for await (const [type, value] of stream) {
  // e.g. declaration: <?xml version="1.0" encoding="UTF-8"?>
  console.log(`${type}: ${value}`);
}
