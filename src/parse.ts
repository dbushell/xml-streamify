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
 * @param input    URL to fetch and parse (or a ReadableStream)
 * @param options  Parsing options {@link ParseOptions}
 * @returns Yields parsed XML nodes {@link Node}
 */
export async function* parse(
  input: string | URL | ReadableStream,
  options?: ParseOptions
): AsyncGenerator<Node, Node | void, void> {
  const document = new Node('@document');
  try {
    const init = {...options?.fetchOptions};
    if (options?.signal) {
      init.signal = options.signal;
    }

    let source: ReadableStream;

    // Fetch stream if URL is provided as input
    if (typeof input === 'string' || input instanceof URL) {
      input = new URL(input);
      const response = await fetch(input, init);
      if (!response.ok || !response.body) {
        throw new Error(`Bad response`);
      }
      source = response.body;
    } else {
      source = input;
    }

    const stream = source
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new XMLStream(), {
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
