# 📰 XML Streamify

Fetch and parse XML documents using the power of JavaScript web streams and async iterators ✨

* Small, fast, zero dependencies †
* Work with data before the fetch is complete
* Cross-runtime support (Bun ‡, Deno, Node, and web browsers)

**This is experimental work in progress.** But it does seem to work. It was designed to parse RSS feeds.

## Usage

Add dependency from JSR: [@dbushell/xml-streamify](https://jsr.io/@dbushell/xml-streamify). See the `examples` directory for platform specific examples.

```javascript
import {parse} from "jsr:@dbushell/xml-streamify@0.2";
```

The `parse` generator function is the main export. Below is a basic example that logs RSS item titles as they're found:

```javascript
for await (const node of parse('https://dbushell.com/rss.xml')) {
  if (node.is('channel', 'item')) {
    console.log(node.first('title').innerText);
  }
}
```

See [`src/types.ts`](/src/types.ts) for `parse` options.

`parse` uses a lower level `XMLStream` that can be used alone:

```javascript
const response = await fetch('https://dbushell.com/rss.xml');
const stream = response.body.pipeThrough(new XMLStream());
for await (const [type, value] of stream) {
  // e.g. declaration: <?xml version="1.0" encoding="UTF-8"?>
  console.log(`${type}: ${value}`);
}
```

See [`examples/advanced/stream.ts`](/examples/advanced/stream.ts) for a full example.

## Advanced

In the `examples/advanced` directory there is a Deno web server. It will proxy RSS feeds, add CORS headers, and throttle streaming speed for testing. Run `deno run -A examples/advanced/mod.ts` for the full example script.

## Notes

This project may not be fully XML compliant. It can handle XHTML in some cases. It will not parse HTML where elements like `<meta charset="utf-8">` are not self-closing and `<li>` do not require a closing `</li>` for example.

Browsers may need a [polyfill](https://bugs.chromium.org/p/chromium/issues/detail?id=929585#c10) until they support async iterator on `ReadableStream`.

† bring your own HTML entities decoder

‡ Bun has issues ([#2489](https://github.com/oven-sh/bun/issues/2489))

## NPM

Add the [JavaScript Registry](https://jsr.io/) to `.npmrc`:

```
@jsr:registry=https://npm.jsr.io
```

Install the package:

```sh
npm install @jsr/dbushell__xml-streamify
```

* * *

[MIT License](/LICENSE) | Copyright © 2024 [David Bushell](https://dbushell.com)
