/**
 * XML node with helper methods to read data and traverse the tree
 */
export class Node {
  #type: string;
  #children: Node[];
  #parent?: Node;
  #attr?: {[key: string]: string};
  #raw?: string;

  constructor(type: string, parent?: Node, raw?: string) {
    this.#type = type;
    this.#parent = parent;
    this.#raw = raw;
    this.#children = [];
  }

  get type() {
    return this.#type;
  }

  get raw(): string {
    return this.#raw ?? '';
  }

  get parent() {
    return this.#parent;
  }

  get children() {
    return this.#children;
  }

  get attributes() {
    if (this.#attr) {
      return this.#attr;
    }
    // Setup and parse attributes on first access
    this.#attr = {};
    if (this.raw) {
      const regex = /([\w:.-]+)\s*=\s*["'](.*?)["']/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(this.raw)) !== null) {
        this.#attr[match[1]] = match[2];
      }
    }
    return this.#attr;
  }

  get innerText() {
    if (this.children.length) {
      let text = '';
      for (const child of this.children) {
        text += child.innerText;
      }
      return text;
    }
    return (this.raw.match(/<!\[CDATA\[(.*?)]]>/s) ?? [, this.raw])[1];
  }

  addChild(child: Node) {
    this.#children.push(child);
  }

  /**
   * Returns true if node and parents match the key hierarchy
   * @param keys - XML tag names
   */
  is(...keys: string[]) {
    if (!keys.length) return false;
    let parent: Node | undefined;
    for (const key of keys.toReversed()) {
      parent = parent ? parent.parent : this;
      if (parent?.type !== key) {
        return false;
      }
    }
    return true;
  }

  /**
   * Return the first child matching the key
   * @param key - XML tag name
   */
  first(key: string) {
    return this.children.find((n) => n.type === key);
  }

  /**
   * Return all children matching the key hierarchy
   * @param keys - XML tag names
   */
  all(...keys: string[]) {
    let nodes: Node[] | undefined = this.children;
    let found: Node[] = [];
    for (const [i, k] of Object.entries(keys)) {
      if (Number.parseInt(i) === keys.length - 1) {
        found = nodes.filter((n) => n.type === k);
        break;
      }
      nodes = nodes?.find((n) => n.type === k)?.children;
      if (!nodes) return [];
    }
    return found;
  }
}
