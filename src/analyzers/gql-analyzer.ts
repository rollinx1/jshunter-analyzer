import { GraphQLMatch } from '../types';

// This regex matches the start of GraphQL queries, mutations, subscriptions and schema definitions
const GRAPHQL_REGEX = /^\s*(query|mutation|subscription|type|fragment|directive|input|enum|interface|union|scalar)\s+/i;

/**
 * Checks if a string contains a valid GraphQL operation or schema definition
 */
function isValidGraphQLOperation(str: string): boolean {
    const trimmed = str.trim();

    if (trimmed.length < 15) return false; // Increased minimum length

    // Check for GraphQL keywords at the start
    const hasGraphQLKeyword = /^\s*(query|mutation|subscription|type|fragment|directive|input|enum|interface|union|scalar)/i.test(trimmed);
    if (!hasGraphQLKeyword) return false;

    // For operations (query, mutation, subscription), ensure proper structure
    if (/^\s*(query|mutation|subscription)/i.test(trimmed)) {
        // Must contain field selections with braces
        if (!trimmed.includes('{') || !trimmed.includes('}')) return false;

        // Must have a proper GraphQL operation structure
        // Should have operation name or immediate opening brace after keyword
        if (!/^\s*(query|mutation|subscription)\s*(\w+\s*(\([^)]*\))?\s*)?\{/i.test(trimmed)) return false;

        // Check for balanced braces
        let braceCount = 0;
        for (const char of trimmed) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            if (braceCount < 0) return false;
        }

        if (braceCount !== 0) return false;

        // Must contain field selections (not just empty braces)
        const contentBetweenBraces = trimmed.substring(
            trimmed.indexOf('{') + 1,
            trimmed.lastIndexOf('}')
        ).trim();

        // Allow reconstructed operations with comments
        if (!contentBetweenBraces || (contentBetweenBraces.length < 3 && !contentBetweenBraces.includes('#'))) return false;

        return true;
    }

    // For fragments
    if (/^\s*fragment/i.test(trimmed)) {
        // fragment name on Type { ... }
        if (!/^\s*fragment\s+\w+\s+on\s+\w+\s*\{/i.test(trimmed)) return false;

        // Check for balanced braces
        let braceCount = 0;
        for (const char of trimmed) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            if (braceCount < 0) return false;
        }

        return braceCount === 0;
    }

    // For schema definitions - MUCH more strict validation
    if (/^\s*(type|input|enum|interface|union|scalar|directive)/i.test(trimmed)) {
        // Reject if it contains multiple keywords in sequence (like "enum class struct union")
        const keywordCount = (trimmed.match(/\b(type|input|enum|interface|union|scalar|directive|class|struct|extends|implements|namespace|var|let|const|function|if|for|while|switch|case|break|continue|return|public|private|protected|static|final|abstract|override|virtual|async|await|import|export|default|from|as|new|this|super|null|undefined|true|false|boolean|string|number|object|array|void)\b/gi) || []).length;

        if (keywordCount > 2) return false; // Allow only type + name, not multiple keywords

        // Must follow exact GraphQL schema syntax patterns
        if (/^\s*type\s/i.test(trimmed)) {
            // type Name { field: Type }
            if (!/^\s*type\s+[A-Z]\w*\s*(\{[\s\S]*\}|\s*$)/i.test(trimmed)) return false;
            if (!trimmed.includes('{') || !trimmed.includes('}')) return false;
        } else if (/^\s*input\s/i.test(trimmed)) {
            // input Name { field: Type }
            if (!/^\s*input\s+[A-Z]\w*\s*(\{[\s\S]*\}|\s*$)/i.test(trimmed)) return false;
            if (!trimmed.includes('{') || !trimmed.includes('}')) return false;
        } else if (/^\s*enum\s/i.test(trimmed)) {
            // enum Name { VALUE1 VALUE2 }
            if (!/^\s*enum\s+[A-Z]\w*\s*(\{[\s\S]*\}|\s*$)/i.test(trimmed)) return false;
            if (!trimmed.includes('{') || !trimmed.includes('}')) return false;
            // Must not contain other programming language keywords
            if (/\b(class|struct|extends|implements|public|private|protected|static|final|abstract|override|virtual|function|var|let|const|if|for|while|switch|case|break|continue|return)\b/i.test(trimmed)) return false;
        } else if (/^\s*interface\s/i.test(trimmed)) {
            // interface Name { field: Type }
            if (!/^\s*interface\s+[A-Z]\w*\s*(\{[\s\S]*\}|\s*$)/i.test(trimmed)) return false;
            if (!trimmed.includes('{') || !trimmed.includes('}')) return false;
        } else if (/^\s*union\s/i.test(trimmed)) {
            // union Name = TypeA | TypeB
            if (!/^\s*union\s+[A-Z]\w*\s*=\s*[\w\s|]+/i.test(trimmed)) return false;
        } else if (/^\s*scalar\s/i.test(trimmed)) {
            // scalar Name
            if (!/^\s*scalar\s+[A-Z]\w*\s*$/i.test(trimmed)) return false;
        } else if (/^\s*directive\s/i.test(trimmed)) {
            // directive @name
            if (!/^\s*directive\s+@\w+/i.test(trimmed)) return false;
        }

        // Check for balanced braces if they exist
        if (trimmed.includes('{')) {
            let braceCount = 0;
            for (const char of trimmed) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
                if (braceCount < 0) return false;
            }

            if (braceCount !== 0) return false;
        }

        // Must start with capital letter name (GraphQL convention)
        const nameMatch = trimmed.match(/^\s*(type|input|enum|interface|union|scalar|directive)\s+([A-Za-z_]\w*)/i);
        if (!nameMatch) return false;

        const typeName = nameMatch[2];
        if (!/^[A-Z]/.test(typeName)) return false; // Must start with capital letter

        // Should have reasonable length for schema definitions
        return trimmed.length > 20;
    }

    return false;
}

/**
 * Determines the GraphQL operation type
 */
function getGraphQLType(value: string): GraphQLMatch['type'] {
    const trimmed = value.trim().toLowerCase();

    if (trimmed.startsWith('query')) return 'gql-query';
    if (trimmed.startsWith('mutation')) return 'gql-mutation';
    if (trimmed.startsWith('subscription')) return 'gql-subscription';
    if (/^(type|input|enum|interface|union|scalar|directive|fragment)/.test(trimmed)) return 'gql-schema';

    return 'gql-other';
}

export class GraphQLAnalyzer {
    private processedNodes: Set<string> = new Set(); // Track processed nodes to avoid duplicates

    // Main method for unified traversal
    public analyzeNode(node: any, source: string, results: GraphQLMatch[]): void {
        if (!node || typeof node !== 'object') {
            return;
        }

        // Handle different node types
        switch (node.type) {
            case 'Literal':
                this.analyzeLiteralNode(node, source, results);
                break;
            case 'TemplateLiteral':
                // Skip if this is part of a TaggedTemplateExpression to avoid duplicates
                if (!this.isChildOfTaggedTemplate(node)) {
                    this.analyzeTemplateLiteralNode(node, source, results);
                }
                break;
            case 'TaggedTemplateLiteral':
            case 'TaggedTemplateExpression':
                this.analyzeTaggedTemplateLiteralNode(node, source, results);
                break;
            case 'CallExpression':
                this.analyzeCallExpressionNode(node, source, results);
                break;
            case 'ObjectExpression':
                this.analyzeObjectExpressionNode(node, source, results);
                break;
        }
    }

    private isChildOfTaggedTemplate(node: any): boolean {
        // This is a simple heuristic - in a full implementation you'd track parent nodes
        // For now, we'll rely on the fact that tagged templates are processed first
        return false; // We'll improve this if needed
    }

    private analyzeLiteralNode(node: any, source: string, results: GraphQLMatch[]): void {
        if (!node.start || !node.end || typeof node.value !== 'string') return;

        const value = node.value;

        if (!isValidGraphQLOperation(value)) return;
        if (!GRAPHQL_REGEX.test(value)) return;

        const type = getGraphQLType(value);

        const position = this.getPosition(source, node.start);
        results.push({
            value,
            line: position.line,
            column: position.column,
            type
        });
    }

    private analyzeTemplateLiteralNode(node: any, source: string, results: GraphQLMatch[]): void {
        if (!node.start || !node.end) return;

        // Create a unique key for this node to avoid duplicates
        const nodeKey = `${node.start}-${node.end}`;
        if (this.processedNodes.has(nodeKey)) {
            return; // Already processed as part of a tagged template
        }

        // Extract the raw value from the template literal
        const rawValue = source.slice(node.start, node.end)
            .replace(/^`/, '')
            .replace(/`$/, '')
            .replace(/\$\{[^}]*\}/g, ''); // Remove template expressions for validation

        if (!isValidGraphQLOperation(rawValue)) return;
        if (!GRAPHQL_REGEX.test(rawValue)) return;

        const type = getGraphQLType(rawValue);

        // For template literals, keep the original value with template expressions
        const originalValue = source.slice(node.start, node.end)
            .replace(/^`/, '')
            .replace(/`$/, '');

        const position = this.getPosition(source, node.start);
        results.push({
            value: originalValue,
            line: position.line,
            column: position.column,
            type
        });

        // Mark as processed
        this.processedNodes.add(nodeKey);
    }

    private analyzeTaggedTemplateLiteralNode(node: any, source: string, results: GraphQLMatch[]): void {
        if (!node.start || !node.end) return;

        // Handle both TaggedTemplateExpression and TaggedTemplateLiteral
        let tag, quasi;

        if (node.type === 'TaggedTemplateExpression') {
            tag = node.tag;
            quasi = node.quasi;
        } else if (node.type === 'TaggedTemplateLiteral') {
            tag = node.tag;
            quasi = node.quasi;
        } else {
            return;
        }

        if (!tag || !quasi) return;

        // Mark the quasi (template literal) as processed to avoid duplicates
        if (quasi.start !== undefined && quasi.end !== undefined) {
            const quasiKey = `${quasi.start}-${quasi.end}`;
            this.processedNodes.add(quasiKey);
        }

        // Check if the tag is 'gql' or similar GraphQL tags
        let tagName;
        if (tag.type === 'Identifier') {
            tagName = tag.name;
        } else {
            // Extract tag name from source
            tagName = source.slice(tag.start, tag.end);
        }

        const isGraphQLTag = /^(gql|graphql|GraphQL)$/.test(tagName);
        if (!isGraphQLTag) return;

        // Extract the template literal content
        let templateStart, templateEnd;
        if (quasi.start !== undefined && quasi.end !== undefined) {
            templateStart = quasi.start;
            templateEnd = quasi.end;
        } else if (quasi.quasis && quasi.quasis.length > 0) {
            // Handle TemplateLiteral with quasis - use the raw content
            const firstQuasi = quasi.quasis[0];

            // Get the raw GraphQL content from the first quasi
            const templateContent = firstQuasi.value.raw;

            if (!isValidGraphQLOperation(templateContent)) return;

            const type = getGraphQLType(templateContent);

            const position = this.getPosition(source, node.start);
            results.push({
                value: templateContent,
                line: position.line,
                column: position.column,
                type
            });
            return;
        } else {
            return;
        }

        const templateContent = source.slice(templateStart, templateEnd)
            .replace(/^`/, '')
            .replace(/`$/, '')
            .replace(/\$\{[^}]*\}/g, ''); // Remove template expressions

        if (!isValidGraphQLOperation(templateContent)) return;

        const type = getGraphQLType(templateContent);

        // Keep original content with template expressions
        const originalValue = source.slice(templateStart, templateEnd)
            .replace(/^`/, '')
            .replace(/`$/, '');

        const position = this.getPosition(source, node.start);
        results.push({
            value: originalValue,
            line: position.line,
            column: position.column,
            type
        });
    }

    private analyzeCallExpressionNode(node: any, source: string, results: GraphQLMatch[]): void {
        if (!node.callee || !node.arguments || node.arguments.length === 0) return;

        // Check for JSON.parse() calls
        if (node.callee.type === 'MemberExpression' &&
            node.callee.object && node.callee.object.name === 'JSON' &&
            node.callee.property && node.callee.property.name === 'parse') {

            const firstArg = node.arguments[0];
            if (firstArg && firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
                try {
                    const parsed = JSON.parse(firstArg.value);
                    this.analyzeGraphQLDocument(parsed, firstArg, source, results);
                } catch (e) {
                    // Not valid JSON, ignore
                }
            }
        }
    }

    private analyzeObjectExpressionNode(node: any, source: string, results: GraphQLMatch[]): void {
        if (!node.properties) return;

        // Check if this looks like a GraphQL document object
        const hasKind = node.properties.some((prop: any) =>
            prop.key && prop.key.name === 'kind' &&
            prop.value && prop.value.value === 'Document'
        );

        const hasDefinitions = node.properties.some((prop: any) =>
            prop.key && prop.key.name === 'definitions'
        );

        if (hasKind && hasDefinitions) {
            try {
                // Try to reconstruct the GraphQL operation
                const reconstructed = this.reconstructGraphQLFromAST(node, source);
                if (reconstructed && isValidGraphQLOperation(reconstructed)) {
                    const type = getGraphQLType(reconstructed);

                    const position = this.getPosition(source, node.start || 0);
                    results.push({
                        value: reconstructed,
                        line: position.line,
                        column: position.column,
                        type
                    });
                }
            } catch (e) {
                // Failed to reconstruct, ignore
            }
        }
    }

    private analyzeGraphQLDocument(doc: any, node: any, source: string, results: GraphQLMatch[]): void {
        if (!doc || typeof doc !== 'object' || doc.kind !== 'Document' || !doc.definitions) return;

        try {
            const reconstructed = this.reconstructGraphQLFromDocument(doc);
            if (reconstructed && isValidGraphQLOperation(reconstructed)) {
                const type = getGraphQLType(reconstructed);

                const position = this.getPosition(source, node.start || 0);
                results.push({
                    value: reconstructed,
                    line: position.line,
                    column: position.column,
                    type
                });
            }
        } catch (e) {
            // Failed to reconstruct, ignore
        }
    }

    private reconstructGraphQLFromDocument(doc: any): string | null {
        if (!doc.definitions || !Array.isArray(doc.definitions)) return null;

        const operations: string[] = [];

        for (const def of doc.definitions) {
            if (def.kind === 'OperationDefinition') {
                const operation = this.reconstructOperation(def);
                if (operation) operations.push(operation);
            } else if (def.kind === 'FragmentDefinition') {
                const fragment = this.reconstructFragment(def);
                if (fragment) operations.push(fragment);
            }
        }

        return operations.length > 0 ? operations.join('\n\n') : null;
    }

    private reconstructOperation(def: any): string | null {
        if (!def.operation || !def.selectionSet) return null;

        let operation = def.operation;

        if (def.name && def.name.value) {
            operation += ` ${def.name.value}`;
        }

        if (def.variableDefinitions && def.variableDefinitions.length > 0) {
            const vars = def.variableDefinitions.map((v: any) => {
                if (v.variable && v.variable.name && v.type) {
                    return `$${v.variable.name.value}: ${this.reconstructType(v.type)}`;
                }
                return null;
            }).filter(Boolean);

            if (vars.length > 0) {
                operation += `(${vars.join(', ')})`;
            }
        }

        operation += ' {\n  # [Reconstructed from AST]\n}';

        return operation;
    }

    private reconstructFragment(def: any): string | null {
        if (!def.name || !def.typeCondition) return null;

        return `fragment ${def.name.value} on ${def.typeCondition.name.value} {\n  # [Reconstructed from AST]\n}`;
    }

    private reconstructType(type: any): string {
        if (!type) return 'Unknown';

        if (type.kind === 'NonNullType') {
            return this.reconstructType(type.type) + '!';
        }

        if (type.kind === 'ListType') {
            return `[${this.reconstructType(type.type)}]`;
        }

        if (type.kind === 'NamedType' && type.name) {
            return type.name.value;
        }

        return 'Unknown';
    }

    private reconstructGraphQLFromAST(node: any, source: string): string | null {
        // This is a simplified reconstruction - in a real implementation
        // you'd need to fully parse the JavaScript object structure
        // For now, we'll just return a placeholder indicating we found a GraphQL AST
        return 'query {\n  # [Reconstructed from JavaScript AST object]\n}';
    }

    private getPosition(source: string, offset: number): { line: number; column: number } {
        const lines = source.slice(0, offset).split('\n');
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1,
        };
    }
} 