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
import { traverse } from './utils/walker.js';

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

        traverse(ast, {
            enter: (node: any) => {
                this.httpApiAnalyzer.analyzeNode(node, source, results.httpapi);
                this.graphqlAnalyzer.analyzeNode(node, source, results.graphql);
                this.domxssAnalyzer.analyzeNode(node, source, results.domxss);
                this.urlAnalyzer.analyzeNode(node, source, results.urls);
                this.eventHandlersAnalyzer.analyzeNode(node, source, results.events);
            }
        });

        return results;
    }
} 