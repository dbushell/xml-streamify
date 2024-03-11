/**
 * Types for `jsr:@dbushell/xml-streamify`.
 *
 * @module
 */
/** Options for `parse` async generator function */
export interface ParseOptions {
  /** Abort signal for fetch and parser */
  signal?: AbortSignal;
  /** Suppress fetch and parse errors (default: true) */
  silent?: boolean;
  /** Do not yield empty text nodes (default: true) */
  ignoreWhitespace?: boolean;
  /** Do not yield comment nodes (default: true) */
  ignoreComments?: boolean;
  /** Do not yield declaration nodes (default: true) */
  ignoreDeclaration?: boolean;
  /** Do not yield doctype nodes (default: true) */
  ignoreDoctype?: boolean;
  /** Addition fetch options */
  fetchOptions?: RequestInit;
}

/** Node type that is yielded by the parse generator function */
export enum NodeType {
  CDATA = 'cdata',
  COMMENT = 'comment',
  DECLARATION = 'declaration',
  DOCTYPE = 'doctype',
  ELEMENT = 'element',
  TEXT = 'text'
}

/** Current state of the internal stream transformer */
export enum StateType {
  SEARCH = 'search',
  SKIP = 'skip'
}
