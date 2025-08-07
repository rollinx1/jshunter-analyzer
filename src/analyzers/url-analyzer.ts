import { AnalyzerConfig, UrlMatch, UrlType } from "../types.js";
import { isValidPath } from "../utils/path-validator.js";
import { classifyUrl } from "../utils/url-classifier.js";
import {
    extractStringFromNode,
    isStringLikeNode,
    normalizeUrl,
    calculateStringComplexity
} from "../utils/string-processor.js";

export class UrlAnalyzer {
    private config: Required<AnalyzerConfig>;
    private variableMap: Map<string, string> = new Map();

    constructor(config: AnalyzerConfig = {}) {
        this.config = {
            minPathLength: config.minPathLength ?? 3,
            maxPathLength: config.maxPathLength ?? 2000,
            includeRelativePaths: config.includeRelativePaths ?? true,
            includeFileExtensions: config.includeFileExtensions ?? true,
            excludeCommonWords: config.excludeCommonWords ?? true,
            confidenceThreshold: config.confidenceThreshold ?? 0.5,
            enableVariableTracking: config.enableVariableTracking ?? true,
            enableObjectPropertyAnalysis: config.enableObjectPropertyAnalysis ?? false,
            enableDeepTraversal: config.enableDeepTraversal ?? false,
            maxTraversalDepth: config.maxTraversalDepth ?? 10,
        };
    }

    // Main method for unified traversal
    public analyzeNode(node: any, source: string, results: UrlMatch[]): void {
        if (!node || typeof node !== 'object') {
            return;
        }

        switch (node.type) {
            case 'Literal':
                this.handleLiteralNode(node, source, results);
                break;
            case 'TemplateLiteral':
                this.handleTemplateLiteralNode(node, source, results);
                break;
            case 'BinaryExpression':
                this.handleBinaryExpressionNode(node, source, results);
                break;
            case 'CallExpression':
                this.handleCallExpressionNode(node, source, results);
                break;
            case 'VariableDeclarator':
                if (this.config.enableVariableTracking) {
                    this.handleVariableDeclaratorNode(node, source, results);
                }
                break;
            case 'ObjectExpression':
                if (this.config.enableObjectPropertyAnalysis) {
                    this.handleObjectExpressionNode(node, source, results);
                }
                break;
            case 'Property':
                if (this.config.enableObjectPropertyAnalysis) {
                    this.handlePropertyNode(node, source, results);
                }
                break;
            case 'AssignmentExpression':
                this.handleAssignmentExpressionNode(node, source, results);
                break;
        }
    }

    private handleAssignmentExpressionNode(node: any, source: string, results: UrlMatch[]): void {
        if (node.left?.type === 'MemberExpression') {
            const propertyName = node.left.property?.name;

            const urlProperties = [
                'href', 'src', 'location'
            ];

            if (urlProperties.includes(propertyName)) {
                const value = extractStringFromNode(node.right, this.variableMap);
                if (value && isValidPath(value)) {
                    const type = classifyUrl(value, 'assignment-url');
                    results.push(this.createUrlMatch(node.right, source, value, value, type, {}));
                }
            }
        }
    }

    private handleLiteralNode(node: any, source: string, results: UrlMatch[]): void {
        if (typeof node.value !== 'string' || typeof node.start !== 'number') {
            return;
        }

        const value = normalizeUrl(node.value);

        if (!isValidPath(value)) {
            return;
        }

        const type = classifyUrl(value, 'literal-url');
        results.push(this.createUrlMatch(node, source, value, value, type, {}));
    }

    private handleTemplateLiteralNode(node: any, source: string, results: UrlMatch[]): void {
        if (typeof node.start !== 'number' || typeof node.end !== 'number') {
            return;
        }

        // Extract the raw template string
        const rawValue = source.slice(node.start, node.end);
        const cleanValue = rawValue.replace(/`/g, '');

        // Process template expressions
        const processedValue = cleanValue.replace(/\$\{[^}]*\}/g, 'EXPR');

        if (!isValidPath(processedValue)) {
            return;
        }

        const type = classifyUrl(processedValue, 'template-url');
        results.push(this.createUrlMatch(node, source, rawValue, processedValue, type, {}));
    }

    private handleBinaryExpressionNode(node: any, source: string, results: UrlMatch[]): void {
        if (node.operator !== '+' || typeof node.start !== 'number') {
            return;
        }

        // Try to extract string from concatenation
        const extractedString = extractStringFromNode(node, this.variableMap);
        if (!extractedString) {
            return;
        }

        const value = normalizeUrl(extractedString);

        if (!isValidPath(value)) {
            return;
        }

        const type = classifyUrl(value, 'dynamic-url');
        results.push(this.createUrlMatch(node, source, extractedString, value, type, {}));
    }

    private handleCallExpressionNode(node: any, source: string, results: UrlMatch[]): void {
        // Handle specific function calls that might contain URLs
        if (node.callee?.type === 'Identifier') {
            const functionName = node.callee.name;

            // Check for common HTTP methods and URL-related functions
            if (['fetch', 'axios', 'request', 'get', 'post', 'put', 'delete', 'patch', 'open'].includes(functionName)) {
                this.handleHttpCallNode(node, source, results);
            }
        }

        // Handle method calls like string.concat()
        if (node.callee?.type === 'MemberExpression') {
            const propertyName = node.callee.property?.name;
            if (propertyName === 'concat') {
                this.handleStringConcatNode(node, source, results);
            }
            if (propertyName === 'replace' && node.callee.object?.property?.name === 'location') {
                this.handleHttpCallNode(node, source, results);
            }
        }

        this.handleGenericCallNode(node, source, results);
    }

    private handleGenericCallNode(node: any, source: string, results: UrlMatch[]): void {
        if (node.arguments) {
            for (const arg of node.arguments) {
                const value = extractStringFromNode(arg, this.variableMap);
                if (value && isValidPath(value)) {
                    const type = classifyUrl(value, 'generic-call-url');
                    results.push(this.createUrlMatch(arg, source, value, value, type, {}));
                }
            }
        }
    }

    private handleHttpCallNode(node: any, source: string, results: UrlMatch[]): void {
        // Extract URL from the first argument of HTTP calls
        if (node.arguments && node.arguments.length > 0) {
            const urlArg = node.arguments[0];

            const extractedString = extractStringFromNode(urlArg, this.variableMap);
            if (extractedString) {
                const value = normalizeUrl(extractedString);

                if (isValidPath(value)) {
                    const type = classifyUrl(value, 'api-url');
                    results.push(this.createUrlMatch(urlArg, source, extractedString, value, type, { isApi: true }));
                }
            }
        }
    }

    private handleStringConcatNode(node: any, source: string, results: UrlMatch[]): void {
        const extractedString = extractStringFromNode(node, this.variableMap);
        if (!extractedString) {
            return;
        }

        const value = normalizeUrl(extractedString);

        if (!isValidPath(value)) {
            return;
        }

        const type = classifyUrl(value, 'dynamic-url');
        results.push(this.createUrlMatch(node, source, extractedString, value, type, {}));
    }

    private handleVariableDeclaratorNode(node: any, source: string, results: UrlMatch[]): void {
        if (node.id?.type === 'Identifier' && node.init) {
            const variableName = node.id.name;
            const value = extractStringFromNode(node.init, this.variableMap);

            if (value) {
                // Store variable assignment for later reference
                this.variableMap.set(variableName, value);

                // If the value is dynamic, try to remove previous partial matches
                if (node.init.type === 'TemplateLiteral' || node.init.type === 'BinaryExpression') {
                    for (let i = results.length - 1; i >= 0; i--) {
                        if (value.includes(results[i].value)) {
                            results.splice(i, 1);
                        }
                    }
                }

                // Check if the assigned value is a URL
                if (isValidPath(value)) {
                    const type = classifyUrl(value, 'variable-url');
                    results.push(this.createUrlMatch(node.init, source, value, value, type, {}));
                }
            }
        }
    }

    private handleObjectExpressionNode(node: any, source: string, results: UrlMatch[]): void {
        if (node.properties) {
            node.properties.forEach((prop: any) => {
                if (prop.type === 'Property') {
                    this.handlePropertyNode(prop, source, results);
                }
            });
        }
    }

    private handlePropertyNode(node: any, source: string, results: UrlMatch[]): void {
        if (node.key?.type === 'Identifier' && node.value) {
            const propertyName = node.key.name;

            // Common property names that might contain URLs
            const urlProperties = [
                'url', 'endpoint', 'baseURL', 'href', 'src', 'action', 'target',
                'api', 'path', 'route', 'link', 'uri', 'host', 'domain'
            ];

            if (urlProperties.includes(propertyName)) {
                const value = extractStringFromNode(node.value, this.variableMap);
                if (value && isValidPath(value)) {
                    const type = classifyUrl(value, 'property-url');
                    results.push(this.createUrlMatch(node.value, source, value, value, type, {}));
                }
            }
        }
    }

    private createUrlMatch(
        node: any,
        source: string,
        originalValue: string,
        processedValue: string,
        type: UrlType,
        metadata: any
    ): UrlMatch {
        // Calculate position from start
        const position = this.getPosition(source, node.start || 0);

        return {
            value: processedValue,
            line: position.line,
            column: position.column,
            type,
            metadata,
        };
    }

    private getPosition(source: string, offset: number): { line: number; column: number } {
        const lines = source.slice(0, offset).split('\n');
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1,
        };
    }
} 