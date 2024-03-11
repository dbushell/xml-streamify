/**
 * Module exports a `TransformStream` class for decoding binary XML streams into structured data.
 *
 * @module
 */
import {NodeType, StateType} from './types.ts';

type State = NodeType | StateType;

const ENTITIES = {
  cdata: {
    end: ']]>',
    start: /^<!\[CDATA\[/
  },
  comment: {
    end: '-->',
    start: /^<!--/
  },
  declaration: {
    end: '?>',
    start: /^<\?/
  },
  doctype: {
    end: '>',
    start: /^<!DOCTYPE/i
  },
  element: {
    end: '>',
    start: /^<[\w:.-/]/
  }
} as const;

/** Transformer object for `TransformStream` constructed by `XMLStream` */
export const transformer: Transformer<Uint8Array, [NodeType, string]> & {
  buf: string;
  state: State;
  previous: [State, number];
  decoder: TextDecoder;
} = {
  buf: '',
  state: StateType.SKIP,
  previous: [StateType.SKIP, -1],
  decoder: new TextDecoder(),
  flush(controller) {
    // Buffer should be empty if document is well-formed
    if (this.buf.length > 0) {
      controller.enqueue([NodeType.TEXT, this.buf]);
    }
  },
  transform(chunk, controller) {
    this.buf += this.decoder.decode(chunk);
    while (this.buf.length) {
      // Break if no progress is made (entity may straddle chunk boundary)
      if (
        this.state === this.previous[0] &&
        this.buf.length === this.previous[1]
      ) {
        break;
      }
      this.previous = [this.state, this.buf.length];
      // Skip to next entity
      if (this.state === StateType.SKIP) {
        const index = this.buf.indexOf('<');
        if (index < 0) break;
        // Clear buffer up to index of next entity
        controller.enqueue([NodeType.TEXT, this.buf.substring(0, index)]);
        this.buf = this.buf.substring(index);
        this.state = StateType.SEARCH;
      }
      // Search for start of entity
      if (this.state === StateType.SEARCH) {
        if (this.buf.length < 3) break;
        for (const [state, entity] of Object.entries(ENTITIES)) {
          if (this.buf.match(entity.start)) {
            this.state = state as State;
            break;
          }
        }
        continue;
      }
      // Search for end of entity
      if (Object.hasOwn(ENTITIES, this.state)) {
        const {end} = ENTITIES[this.state as keyof typeof ENTITIES];
        const index = this.buf.indexOf(end);
        if (index < 0) break;
        controller.enqueue([
          this.state,
          this.buf.substring(0, index + end.length)
        ]);
        this.buf = this.buf.substring(index + end.length);
        this.state = StateType.SKIP;
        continue;
      }
      // We should never be here something is very wrong!
      throw new Error();
    }
  }
};

/** Transform a binary XML stream into a stream of structured XML data */
export class XMLStream extends TransformStream<Uint8Array, [NodeType, string]> {
  constructor() {
    super({...transformer});
  }
}
