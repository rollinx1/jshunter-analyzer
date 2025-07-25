import { HTTPAPIMatch } from '../types';

export class HTTPAPIAnalyzer {
    private processedNodes: Set<string> = new Set();

    // Main method for unified traversal
    public analyzeNode(node: any, source: string, results: HTTPAPIMatch[]): void {
        if (!node || typeof node !== 'object') return;

        // Handle different node types with all the existing complex logic
        switch (node.type) {
            case 'CallExpression':
                this.analyzeCallExpressionNode(node, source, results);
                break;
            case 'NewExpression':
                this.analyzeNewExpressionNode(node, source, results);
                break;
            case 'MemberExpression':
                this.analyzeMemberExpressionNode(node, source, results);
                break;
        }
    }

    private analyzeCallExpressionNode(node: any, source: string, results: HTTPAPIMatch[]): void {
        if (!node.start || !node.end) return;

        const nodeKey = `${node.start}-${node.end}`;
        if (this.processedNodes.has(nodeKey)) return;
        this.processedNodes.add(nodeKey);

        const value = source.slice(node.start, node.end);

        // Check for fetch() calls
        if (node.callee?.type === 'Identifier' && node.callee.name === 'fetch') {
            const position = this.getPosition(source, node.start);
            const match: HTTPAPIMatch = {
                value,
                line: position.line,
                column: position.column,
                type: 'http-fetch'
            };

            // Extract URL if available
            if (node.arguments?.[0]) {
                const urlArg = node.arguments[0];
                if (urlArg.type === 'Literal' && typeof urlArg.value === 'string') {
                    match.url = urlArg.value;
                }
            }

            // Extract options if available
            if (node.arguments?.[1]) {
                const optionsArg = node.arguments[1];
                if (optionsArg.type === 'ObjectExpression') {
                    const options = this.extractFetchOptions(optionsArg);
                    if (options.method) match.method = options.method;
                    if (options.options) match.options = options.options;
                }
            }

            results.push(match);
        }

        // Check for axios calls
        if (node.callee?.type === 'MemberExpression') {
            const callee = node.callee;
            if (callee.object?.type === 'Identifier' && callee.object.name === 'axios' &&
                callee.property?.type === 'Identifier') {

                const position = this.getPosition(source, node.start);
                const match: HTTPAPIMatch = {
                    value,
                    line: position.line,
                    column: position.column,
                    type: 'http-axios',
                    method: callee.property.name.toUpperCase()
                };

                // Extract URL for axios method calls
                if (node.arguments?.[0]) {
                    const urlArg = node.arguments[0];
                    if (urlArg.type === 'Literal' && typeof urlArg.value === 'string') {
                        match.url = urlArg.value;
                    }
                }

                results.push(match);
            }

            // Check for jQuery AJAX calls
            if (callee.object?.type === 'Identifier' && callee.object.name === '$' &&
                callee.property?.type === 'Identifier') {

                const methodName = callee.property.name;
                if (['ajax', 'get', 'post', 'put', 'delete'].includes(methodName)) {
                    const position = this.getPosition(source, node.start);
                    const match: HTTPAPIMatch = {
                        value,
                        line: position.line,
                        column: position.column,
                        type: 'http-jquery',
                        method: methodName.toUpperCase()
                    };

                    // Extract URL for jQuery methods
                    if (node.arguments?.[0]) {
                        const urlArg = node.arguments[0];
                        if (urlArg.type === 'Literal' && typeof urlArg.value === 'string') {
                            match.url = urlArg.value;
                        }
                    }

                    results.push(match);
                }
            }

            // Check for jQuery .load() calls
            if (callee.property?.type === 'Identifier' && callee.property.name === 'load') {
                const position = this.getPosition(source, node.start);
                const match: HTTPAPIMatch = {
                    value,
                    line: position.line,
                    column: position.column,
                    type: 'http-jquery',
                    method: 'GET'
                };

                if (node.arguments?.[0]) {
                    const urlArg = node.arguments[0];
                    if (urlArg.type === 'Literal' && typeof urlArg.value === 'string') {
                        match.url = urlArg.value;
                    }
                }

                results.push(match);
            }
        }

        // Check for direct axios() calls
        if (node.callee?.type === 'Identifier' && node.callee.name === 'axios') {
            const position = this.getPosition(source, node.start);
            const match: HTTPAPIMatch = {
                value,
                line: position.line,
                column: position.column,
                type: 'http-axios'
            };

            // Extract URL and options from axios config
            if (node.arguments?.[0]) {
                const configArg = node.arguments[0];
                if (configArg.type === 'Literal' && typeof configArg.value === 'string') {
                    match.url = configArg.value;
                } else if (configArg.type === 'ObjectExpression') {
                    const config = this.extractAxiosConfig(configArg);
                    if (config.url) match.url = config.url;
                    if (config.method) match.method = config.method;
                    if (config.options) match.options = config.options;
                }
            }

            results.push(match);
        }
    }

    private analyzeNewExpressionNode(node: any, source: string, results: HTTPAPIMatch[]): void {
        if (!node.start || !node.end) return;

        const nodeKey = `${node.start}-${node.end}`;
        if (this.processedNodes.has(nodeKey)) return;
        this.processedNodes.add(nodeKey);

        // Check for new XMLHttpRequest()
        if (node.callee?.type === 'Identifier' && node.callee.name === 'XMLHttpRequest') {
            const position = this.getPosition(source, node.start);
            const value = source.slice(node.start, node.end);

            const match: HTTPAPIMatch = {
                value,
                line: position.line,
                column: position.column,
                type: 'http-xhr'
            };

            results.push(match);
        }
    }

    private analyzeMemberExpressionNode(node: any, source: string, results: HTTPAPIMatch[]): void {
        // This method handles member expressions that might be part of HTTP API calls
        // The actual analysis is often done in context of CallExpression
        // But we can check for patterns like xhr.open, xhr.send, etc.

        if (node.property?.type === 'Identifier' &&
            ['open', 'send', 'setRequestHeader'].includes(node.property.name)) {

            // This will be caught by CallExpression analysis when it's actually called
            // We don't add matches here to avoid duplicates
        }
    }

    // Helper methods
    private getPosition(source: string, offset: number): { line: number; column: number } {
        const lines = source.slice(0, offset).split('\n');
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }

    private extractFetchOptions(optionsNode: any): { method?: string; options?: string[] } {
        const result: { method?: string; options?: string[] } = {};

        if (optionsNode.type === 'ObjectExpression' && optionsNode.properties) {
            for (const prop of optionsNode.properties) {
                if (prop.type === 'Property' && prop.key?.type === 'Identifier') {
                    if (prop.key.name === 'method' && prop.value?.type === 'Literal') {
                        result.method = prop.value.value as string;
                    }
                }
            }
        }

        return result;
    }

    private extractAxiosConfig(configNode: any): { url?: string; method?: string; options?: string[] } {
        const result: { url?: string; method?: string; options?: string[] } = {};

        if (configNode.type === 'ObjectExpression' && configNode.properties) {
            for (const prop of configNode.properties) {
                if (prop.type === 'Property' &&
                    prop.key?.type === 'Identifier' &&
                    prop.value?.type === 'Literal' &&
                    typeof prop.value.value === 'string') {

                    if (prop.key.name === 'url') {
                        result.url = prop.value.value;
                    } else if (prop.key.name === 'method') {
                        result.method = prop.value.value;
                    }
                }
            }
        }

        return result;
    }
} 