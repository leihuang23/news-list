class TrieNode {
  constructor(char) {
    this.char = char;
    this.validWord = false;
    this.parent = null;
    this.children = [];
  }
}

export default class Trie {
  static addAll(list) {
    const trie = new Trie();
    list.forEach(trie.add.bind(trie));
    return trie;
  }

  constructor() {
    this.root = new TrieNode('');
  }

  add(word) {
    let current = this.root;

    for (let i = 0, len = word.length; i < len; i += 1) {
      const ch = word[i];
      let found = false;

      for (let j = current.children.length; j--; ) {
        const child = current.children[j];
        if (child.char === ch) {
          found = true;
          current = child;
          break;
        }
      }

      if (!found) {
        current.children.push(new TrieNode(ch));

        const newNode = current.children[current.children.length - 1];

        newNode.parent = current;

        current = newNode;
      }
    }

    current.validWord = true;
  }

  contains(word) {
    let current = this.root;

    for (let i = 0, len = word.length; i < len; i += 1) {
      const ch = word[i];
      let found = false;

      for (let j = current.children.length; j >= 0; j--) {
        const child = current.children[j];

        if (child.char.toLowerCase() === ch.toLowerCase()) {
          found = true;
          current = child;
          break;
        }
      }

      if (!found) {
        return false;
      }
    }

    return current.validWord;
  }

  delete(word) {
    let current = this.root;

    for (let i = 0, len = word.length; i < len; i += 1) {
      const ch = word[i];
      let found = false;

      for (let j = current.children.length; j--; ) {
        const child = current.children[j];

        if (child.char === ch) {
          found = true;
          current = child;
          break;
        }
      }

      if (!found) {
        return;
      }
    }

    current.validWord = false;

    let stop = false;
    while (!stop) {
      if (
        current.children.length === 0 &&
        !current.validWord &&
        current.parent
      ) {
        const { parent } = current;
        const childIndex = parent.children.indexOf(current);
        const end = parent.children.length - 1;

        [parent.children[childIndex], parent.children[end]] = [
          parent.children[end],
          parent.children[childIndex]
        ];

        parent.children.pop();

        current = parent;
      } else {
        stop = true;
      }
    }
  }

  search(input) {
    const inputMirror = [];
    let current = this.root;

    for (let i = 0; i < input.length; i += 1) {
      const ch = input.charAt(i);
      let found = false;

      for (let j = current.children.length - 1; j >= 0; j--) {
        const child = current.children[j];

        if (child.char.toLowerCase() === ch.toLowerCase()) {
          found = true;
          current = child;
          inputMirror.push(child.char);
          break;
        }
      }

      if (!found) {
        return [];
      }
    }

    const match = [];
    const tracker = [];

    function traverse(node) {
      tracker.push(node.char);

      if (node.validWord) {
        const temp = inputMirror.slice(0, input.length - 1);
        temp.push(...tracker);
        match.push(temp.join(''));
      }

      node.children.forEach(traverse);

      tracker.pop();
    }

    traverse(current);

    return match;
  }
}
