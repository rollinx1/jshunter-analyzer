import { parseSync } from "oxc-parser";
import { readFileSync } from 'fs';
import {
    AnalyzerConfig,
    UrlMatch,
    UrlType,
    GraphQLMatch,
    DOMXSSMatch,
    EventHandlerMatch,
    HTTPAPIMatch,
    AnalyzerResult
} from './types';
import { HTTPAPIAnalyzer } from './analyzers/http-api-analyzer';
import { GraphQLAnalyzer } from './analyzers/gql-analyzer';
import { DOMXSSAnalyzer } from './analyzers/dom-xss-analyzer';
import { UrlAnalyzer } from './analyzers/url-analyzer';
import { EventHandlersAnalyzer } from './analyzers/event-handlers-analyzer';

export class Analyzer {
    private config: AnalyzerConfig;
    private httpApiAnalyzer: HTTPAPIAnalyzer;
    private graphqlAnalyzer: GraphQLAnalyzer;
    private domxssAnalyzer: DOMXSSAnalyzer;
    private urlAnalyzer: UrlAnalyzer;
    private eventHandlersAnalyzer: EventHandlersAnalyzer;

    constructor(config: AnalyzerConfig = { confidenceThreshold: 0.3, maxTraversalDepth: 200 }) {
        this.config = config;
        this.httpApiAnalyzer = new HTTPAPIAnalyzer();
        this.graphqlAnalyzer = new GraphQLAnalyzer();
        this.domxssAnalyzer = new DOMXSSAnalyzer();
        this.urlAnalyzer = new UrlAnalyzer(config);
        this.eventHandlersAnalyzer = new EventHandlersAnalyzer();
    }

    public analyze(filePath: string): AnalyzerResult {
        // 1. Read file ONCE
        const source = readFileSync(filePath, 'utf-8');

        // 2. Parse AST ONCE
        const parseResult = parseSync(filePath, source);

        if (parseResult.errors.length > 0) {
            // Try as script if module parsing fails
            const scriptResult = parseSync(filePath, source, { sourceType: 'script' });
            if (scriptResult.errors.length > 0) {
                throw new Error(`Failed to parse ${filePath}: ${parseResult.errors[0].message}`);
            }
            return this.traverseAndAnalyze(scriptResult.program, filePath, source);
        }

        // 3. Single traversal with all analyzers
        return this.traverseAndAnalyze(parseResult.program, filePath, source);
    }

    private traverseAndAnalyze(ast: any, filePath: string, source: string): AnalyzerResult {
        const results: AnalyzerResult = {
            urls: [],
            graphql: [],
            domxss: [],
            events: [],
            httpapi: []
        };

        // Single traversal with all analyzers running together
        if (ast) {
            this.traverseNode(ast, source, filePath, results, 0);
        }

        return results;
    }

    private traverseNode(node: any, source: string, filePath: string, results: AnalyzerResult, depth: number): void {
        if (!node || depth > (this.config.maxTraversalDepth || 200)) {
            return;
        }

        // Run ALL analyzers on current node
        this.httpApiAnalyzer.analyzeNode(node, source, results.httpapi);
        this.graphqlAnalyzer.analyzeNode(node, source, results.graphql);
        this.domxssAnalyzer.analyzeNode(node, source, results.domxss);
        this.urlAnalyzer.analyzeNode(node, source, results.urls);
        this.eventHandlersAnalyzer.analyzeNode(node, source, results.events);

        // Continue traversal
        if (Array.isArray(node)) {
            node.forEach(child => this.traverseNode(child, source, filePath, results, depth + 1));
        } else if (typeof node === 'object') {
            const childKeys = Object.keys(node).filter(key =>
                key !== 'parent' &&
                key !== 'leadingComments' &&
                key !== 'trailingComments' &&
                key !== 'type' &&
                key !== 'start' &&
                key !== 'end'
            );
            childKeys.forEach(key => {
                const child = node[key];
                if (Array.isArray(child)) {
                    child.forEach(item => {
                        if (item && typeof item === 'object') {
                            this.traverseNode(item, source, filePath, results, depth + 1);
                        }
                    });
                } else if (child && typeof child === 'object') {
                    this.traverseNode(child, source, filePath, results, depth + 1);
                }
            });
        }
    }
} 