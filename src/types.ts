export interface Position {
    line: number;
    column: number;
}

export interface UrlMatch {
    value: string;
    line: number;
    column: number;
    type: UrlType;
    metadata: UrlMetadata;
}

export type UrlType =
    | 'full-url'      // https://api.example.com/v1/users
    | 'path-only'     // /api/v1/users
    | 'relative-path' // ./assets/image.png
    | 'api-endpoint'  // api/users or /api/users
    | 'file-path'     // /static/js/main.js
    | 'template-url'  // `https://api.${domain}/users`
    | 'dynamic-url';  // baseUrl + "/users"

export interface UrlMetadata {
    hostname?: string;
    port?: string;
    pathname?: string;
    queryParams?: string;
    hash?: string;
    extension?: string;
    isApi?: boolean;
    isSecure?: boolean;
    hasParams?: boolean;
    hasFragment?: boolean;
    confidence: number; // 0-1 score of how confident we are this is a URL
}

export interface GraphQLMatch {
    value: string;
    line: number;
    column: number;
    type: 'gql-query' | 'gql-mutation' | 'gql-subscription' | 'gql-schema' | 'gql-other';
}

export interface DOMXSSMatch {
    value: string;
    line: number;
    column: number;
    type: 'dom-eval' | 'dom-innerHTML' | 'dom-write' | 'dom-dangerous-html' | 'dom-postmessage' | 'dom-domain';
}

export interface EventHandlerMatch {
    value: string;
    line: number;
    column: number;
    type: 'event-listener' | 'event-onmessage' | 'event-onhashchange' | 'event-window-open' | 'event-location';
}

export interface HTTPAPIMatch {
    value: string;
    line: number;
    column: number;
    type: 'http-fetch' | 'http-xhr' | 'http-axios' | 'http-jquery' | 'http-method' | 'http-options';
    method?: string;
    url?: string;
    options?: string[];
}

export interface AnalyzerConfig {
    minPathLength?: number;
    maxPathLength?: number;
    includeRelativePaths?: boolean;
    includeFileExtensions?: boolean;
    excludeCommonWords?: boolean;
    confidenceThreshold?: number;

    // Nuevas opciones para análisis AST mejorado
    enableVariableTracking?: boolean;
    enableObjectPropertyAnalysis?: boolean;
    enableDeepTraversal?: boolean;
    maxTraversalDepth?: number;
}

export interface AnalyzerResult {
    urls: UrlMatch[];
    graphql: GraphQLMatch[];
    domxss: DOMXSSMatch[];
    events: EventHandlerMatch[];
    httpapi: HTTPAPIMatch[];
} 