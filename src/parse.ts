/**
 * Module export an async generator function for parsing a streamed XML document.
 *
 * @module
 */
import type {ParseOptions} from './types.ts';
import {NodeType} from './types.ts';
import {Node} from './node.ts';
import {XMLStream} from './stream.ts';

const ignoreTypes: Partial<Record<NodeType, keyof ParseOptions>> = {
  [NodeType.COMMENT]: 'ignoreComments',
  [NodeType.DECLARATION]: 'ignoreDeclaration',
  [NodeType.DOCTYPE]: 'ignoreDoctype'
} as const;

/**
 * Async generator function for parsing a streamed XML document
 * @param url      URL to fetch and parse
 * @param options  Parsing options {@link ParseOptions}
 * @returns Yields parsed XML nodes {@link Node}
 */
export async function* parse(
  url: string | URL,
  options?: ParseOptions
): AsyncGenerator<Node, Node | void, void> {
  url = new URL(url);

  const document = new Node('@document');

  try {
    const init = {...options?.fetchOptions};
    if (options?.signal) {
      init.signal = options.signal;
    }
    const response = await fetch(url, init);
    if (!response.ok || !response.body) {
      throw new Error(`Bad response`);
    }

    const stream = response.body.pipeThrough(new XMLStream(), {
      signal: options?.signal
    });

    // Set root document as current node
    let node = document;

    for await (const [type, value] of stream) {
      if (options?.signal?.aborted) {
        break;
      }
      // Skip whitespace
      if (type === NodeType.TEXT) {
        if (options?.ignoreWhitespace !== false && value.trim().length === 0) {
          continue;
        }
      }
      // Handle other ignored types
      if (type in ignoreTypes && options?.[ignoreTypes[type]!] === false) {
        const newNode = new Node(type, node, value);
        node.addChild(newNode);
        yield newNode;
        continue;
      }
      // Handle elements
      if (type === NodeType.ELEMENT) {
        const name = value.match(/<\/?([\w:.]+)/)![1];
        // Handle self-closing element
        if (value.endsWith('/>')) {
          const newNode = new Node(name, node, value);
          node.addChild(newNode);
          yield newNode;
          continue;
        }
        // Handle closing element
        if (value.startsWith('</')) {
          yield node;
          node = node.parent!;
          continue;
        }
        // Handle opening element
        const newNode = new Node(name, node, value);
        node.addChild(newNode);
        node = newNode;
        continue;
      }
      // Handle other types
      node.addChild(new Node(type, node, value));
    }
  } catch (err) {
    if (options?.silent === false) {
      throw err;
    }
  }
  return document;
}
