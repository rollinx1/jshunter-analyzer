import { AnalyzerConfig, UrlMatch, UrlType } from "../types.js";
import { isValidUrl, analyzeUrl, shouldExcludeUrl } from "../utils/url-validator.js";
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
        }
    }

    private handleLiteralNode(node: any, source: string, results: UrlMatch[]): void {
        if (typeof node.value !== 'string' || typeof node.start !== 'number') {
            return;
        }

        const value = normalizeUrl(node.value);

        if (shouldExcludeUrl(value) || !isValidUrl(value)) {
            return;
        }

        const { type, metadata } = analyzeUrl(value);

        if (metadata.confidence >= this.config.confidenceThreshold) {
            results.push(this.createUrlMatch(node, source, value, value, type, metadata));
        }
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

        if (shouldExcludeUrl(processedValue) || !isValidUrl(processedValue)) {
            return;
        }

        const { type, metadata } = analyzeUrl(processedValue);

        // Template literals are likely to be dynamic URLs
        const adjustedType: UrlType = type === 'dynamic-url' ? 'template-url' : type;

        if (metadata.confidence >= this.config.confidenceThreshold) {
            results.push(this.createUrlMatch(node, source, rawValue, processedValue, adjustedType, metadata));
        }
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

        if (shouldExcludeUrl(value) || !isValidUrl(value)) {
            return;
        }

        const { type, metadata } = analyzeUrl(value);

        // String concatenation usually indicates dynamic URLs
        const adjustedType: UrlType = type === 'dynamic-url' ? 'dynamic-url' : type;

        if (metadata.confidence >= this.config.confidenceThreshold) {
            results.push(this.createUrlMatch(node, source, extractedString, value, adjustedType, metadata));
        }
    }

    private handleCallExpressionNode(node: any, source: string, results: UrlMatch[]): void {
        // Handle specific function calls that might contain URLs
        if (node.callee?.type === 'Identifier') {
            const functionName = node.callee.name;

            // Check for common HTTP methods and URL-related functions
            if (['fetch', 'axios', 'request', 'get', 'post', 'put', 'delete', 'patch'].includes(functionName)) {
                this.handleHttpCallNode(node, source, results);
            }
        }

        // Handle method calls like string.concat()
        if (node.callee?.type === 'MemberExpression' &&
            node.callee.property?.name === 'concat') {
            this.handleStringConcatNode(node, source, results);
        }
    }

    private handleHttpCallNode(node: any, source: string, results: UrlMatch[]): void {
        // Extract URL from the first argument of HTTP calls
        if (node.arguments && node.arguments.length > 0) {
            const urlArg = node.arguments[0];

            if (isStringLikeNode(urlArg)) {
                const extractedString = extractStringFromNode(urlArg, this.variableMap);
                if (extractedString) {
                    const value = normalizeUrl(extractedString);

                    if (!shouldExcludeUrl(value) && isValidUrl(value)) {
                        const { type, metadata } = analyzeUrl(value);

                        // HTTP calls are likely to be API endpoints
                        const adjustedMetadata = { ...metadata, isApi: true, confidence: metadata.confidence + 0.1 };

                        if (adjustedMetadata.confidence >= this.config.confidenceThreshold) {
                            results.push(this.createUrlMatch(urlArg, source, extractedString, value, type, adjustedMetadata));
                        }
                    }
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

        if (shouldExcludeUrl(value) || !isValidUrl(value)) {
            return;
        }

        const { type, metadata } = analyzeUrl(value);

        if (metadata.confidence >= this.config.confidenceThreshold) {
            results.push(this.createUrlMatch(node, source, extractedString, value, 'dynamic-url', metadata));
        }
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
                if (isValidUrl(value)) {
                    let { type, metadata } = analyzeUrl(value);

                    // If the URL was constructed dynamically, ensure the type reflects that.
                    if (node.init.type === 'TemplateLiteral' || node.init.type === 'BinaryExpression') {
                        type = 'dynamic-url';
                    }

                    if (metadata.confidence >= this.config.confidenceThreshold) {
                        results.push(this.createUrlMatch(node.init, source, value, value, type, metadata));
                    }
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
                if (value && isValidUrl(value)) {
                    const { type, metadata } = analyzeUrl(value);
                    // Bonus confidence for URL properties
                    metadata.confidence += 0.1;

                    if (metadata.confidence >= this.config.confidenceThreshold) {
                        results.push(this.createUrlMatch(node.value, source, value, value, type, metadata));
                    }
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