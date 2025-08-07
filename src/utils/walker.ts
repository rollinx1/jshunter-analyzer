export interface Visitor {
    enter?: (node: any, parent: any, prop: any, index: any) => void;
    leave?: (node: any, parent: any, prop: any, index: any) => void;
}

export function traverse(ast: any, visitor: Visitor) {
    function walk(node: any, parent: any, prop: any, index: any) {
        if (!node || typeof node !== 'object') {
            return;
        }

        if (visitor.enter) {
            visitor.enter(node, parent, prop, index);
        }

        for (const key in node) {
            if (key === 'parent' || key === 'leadingComments' || key === 'trailingComments') {
                continue;
            }

            const child = node[key];

            if (Array.isArray(child)) {
                for (let i = 0; i < child.length; i++) {
                    walk(child[i], node, key, i);
                }
            } else {
                walk(child, node, key, null);
            }
        }

        if (visitor.leave) {
            visitor.leave(node, parent, prop, index);
        }
    }

    walk(ast, null, null, null);
} 