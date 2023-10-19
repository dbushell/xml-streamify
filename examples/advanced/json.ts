import {parse, Node} from '../../mod.ts';

const toJSON = (node: Node): Record<string, unknown> => {
  const json: {
    attributes?: {[key: string]: string};
    children?: Record<string, unknown>[];
    text?: string;
    type: string;
  } = {
    type: node.type
  };
  if (Object.keys(node.attributes).length) {
    json.attributes = node.attributes;
  }
  if (node.type === 'text' || node.type === 'cdata') {
    json.text = node.innerText;
  }
  if (node.children.length > 0) {
    json.children = node.children.map(toJSON);
  }
  return json;
};

const parser = parse('https://dbushell.com/rss.xml', {
  ignoreDeclaration: false
});

for await (const node of parser) {
  if (node.type === 'declaration') {
    console.log(toJSON(node));
  }
  if (node.is('channel', 'item')) {
    console.log(toJSON(node));
    break;
  }
}
