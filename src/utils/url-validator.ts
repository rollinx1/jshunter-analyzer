import { UrlType, UrlMetadata } from '../types.js';

// Common file extensions that we want to detect
const FILE_EXTENSIONS = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.scss', '.less',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif',
    '.mp3', '.mp4', '.wav', '.ogg', '.webm', '.pdf', '.doc', '.docx',
    '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.tar', '.gz', '.rar',
    '.md', '.txt', '.csv', '.xml', '.yaml', '.yml', '.env', '.log'
]);

// Common MIME types to detect (from jxscout)
const MIME_TYPES = new Set([
    'application/json', 'application/xml', 'application/javascript',
    'text/html', 'text/css', 'text/javascript', 'text/plain',
    'image/png', 'image/jpeg', 'image/svg+xml', 'image/webp',
    'audio/mpeg', 'video/mp4', 'video/webm', 'application/pdf',
    'application/zip', 'application/octet-stream'
]);

// Hostnames to exclude (common false positives)
const EXCLUDED_HOSTNAMES = new Set([
    'www.w3.org', 'reactjs.org', 'example.com', 'localhost'
]);

// Common API path patterns
const API_PATTERNS = [
    /\/api\//i,
    /^api\//i,
    /\/v\d+\//i,
    /\/rest\//i,
    /\/graphql/i,
    /\/webhook/i
];

// Calculate Shannon entropy to detect random strings (from jxscout)
function isHighEntropy(str: string, threshold = 4.9): boolean {
    const freq: Record<string, number> = {};
    for (const char of str) {
        freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const len = str.length;

    for (const char in freq) {
        const p = freq[char] / len;
        entropy -= p * Math.log2(p);
    }

    return entropy >= threshold;
}

// Check if string contains any of the specified characters
function containsAny(str: string, chars: string): boolean {
    return chars.split('').some((char) => str.includes(char));
}

export function isValidUrl(value: string): boolean {
    // Basic length check
    if (value.length < 3 || value.length > 2000) {
        return false;
    }

    // Check if path starts with a letter or forward slash (from jxscout)
    if (!/^[a-zA-Z/]/.test(value)) {
        return false;
    }

    // Check if path contains at least one letter
    if (!/[a-zA-Z]/.test(value)) {
        return false;
    }

    // Exclude strings with special characters (from jxscout)
    if (containsAny(value, ' ()!<>\'"{}^$,')) {
        return false;
    }

    // Filter out high entropy strings (likely hashes/tokens)
    if (isHighEntropy(value)) {
        return false;
    }

    // Basic path-like check
    if (!value.includes('/')) {
        return false;
    }

    // Exclude paths that are just "./" or "../" (from jxscout)
    if (/^\.\.?\/?$/.test(value)) {
        return false;
    }

    // Check if at least one path segment is longer than 3 characters (from jxscout)
    const parts = value.split('/').filter(Boolean);
    if (!parts.some((part) => part.length >= 3)) {
        return false;
    }

    // If all parts are just "EXPR", it's not a valid path (from jxscout)
    if (parts.every((part) => part.startsWith('EXPR') || part === 'EXPR')) {
        return false;
    }

    // Check for various URL patterns
    return (
        isFullUrl(value) ||
        isPathOnly(value) ||
        isRelativePath(value) ||
        isApiEndpoint(value) ||
        isFilePath(value) ||
        isHostnameOnly(value)
    );
}

export function isFullUrl(value: string): boolean {
    try {
        const url = new URL(value.startsWith('//') ? `https:${value}` : value);

        // Check valid schemes
        if (!['http:', 'https:', 'ftp:', 'ftps:'].includes(url.protocol)) {
            return false;
        }

        // Check for excluded hostnames
        if (EXCLUDED_HOSTNAMES.has(url.hostname)) {
            return false;
        }

        // Must have valid hostname
        if (!url.hostname || url.hostname.length < 2) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

export function isPathOnly(value: string): boolean {
    // Must start with /
    if (!value.startsWith('/')) {
        return false;
    }

    // Must have at least one path segment
    const segments = value.split('/').filter(Boolean);
    if (segments.length === 0) {
        return false;
    }

    // At least one segment should be meaningful (length > 2)
    if (!segments.some(segment => segment.length > 2)) {
        return false;
    }

    return true;
}

export function isRelativePath(value: string): boolean {
    // Must start with ./ or ../
    if (!value.startsWith('./') && !value.startsWith('../')) {
        return false;
    }

    // Must have meaningful content after the prefix
    const withoutPrefix = value.replace(/^\.\.?\//g, '');
    if (withoutPrefix.length < 2) {
        return false;
    }

    return true;
}

export function isApiEndpoint(value: string): boolean {
    return API_PATTERNS.some(pattern => pattern.test(value));
}

export function isFilePath(value: string): boolean {
    // Check for file extensions
    const hasExtension = FILE_EXTENSIONS.has(getFileExtension(value));
    if (!hasExtension) {
        return false;
    }

    // Must have a path structure
    return value.includes('/') && value.split('/').length > 1;
}

export function getFileExtension(path: string): string {
    const match = path.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
    return match ? `.${match[1].toLowerCase()}` : '';
}

export function analyzeUrl(value: string): { type: UrlType; metadata: UrlMetadata } {
    let type: UrlType;
    let metadata: UrlMetadata = { confidence: 0 };

    // Check for MIME types first (from jxscout)
    let isMimeType = false;
    for (const mimeType of MIME_TYPES) {
        if (value.includes(mimeType)) {
            isMimeType = true;
            break;
        }
    }

    // Determine URL type
    if (isFullUrl(value)) {
        type = 'full-url';
        metadata.confidence = 0.9;
    } else if (isHostnameOnly(value)) {
        type = 'full-url'; // Treat hostnames as URLs
        metadata.confidence = 0.8;
    } else if (isApiEndpoint(value)) {
        type = 'api-endpoint';
        metadata.confidence = 0.8;
    } else if (isPathOnly(value)) {
        type = 'path-only';
        metadata.confidence = 0.7;
    } else if (isRelativePath(value)) {
        type = 'relative-path';
        metadata.confidence = 0.6;
    } else if (isFilePath(value)) {
        type = 'file-path';
        metadata.confidence = 0.7;
    } else {
        type = 'dynamic-url';
        metadata.confidence = 0.5;
    }

    // Extract metadata
    try {
        let url: URL;
        if (isFullUrl(value)) {
            url = new URL(value.startsWith('//') ? `https:${value}` : value);
        } else if (isHostnameOnly(value)) {
            url = new URL(`https://${value}`);
        } else {
            url = new URL(value, 'https://example.com');
        }

        metadata.hostname = url.hostname !== 'example.com' ? url.hostname : undefined;
        metadata.port = url.port || undefined;
        metadata.pathname = url.pathname !== '/' ? url.pathname : undefined;
        metadata.queryParams = url.search ? url.search.slice(1) : undefined;
        metadata.hash = url.hash ? url.hash.slice(1) : undefined;
        metadata.isSecure = url.protocol === 'https:';
        metadata.hasParams = !!url.search;
        metadata.hasFragment = !!url.hash;
    } catch {
        // Fallback for non-URL paths
        metadata.pathname = value;
    }

    // Check for API indicators
    metadata.isApi = isApiEndpoint(value);

    // Check for file extension
    const extension = getFileExtension(value);
    if (extension) {
        metadata.extension = extension;
    }

    // Adjust confidence based on additional factors (from jxscout)
    if (metadata.isApi) metadata.confidence += 0.1;
    if (metadata.extension) metadata.confidence += 0.1;
    if (metadata.hasParams) metadata.confidence += 0.05;
    if (isMimeType) metadata.confidence += 0.15;

    // Cap confidence at 1.0
    metadata.confidence = Math.min(metadata.confidence, 1.0);

    return { type, metadata };
}

export function shouldExcludeUrl(value: string): boolean {
    // Exclude very short or very long strings
    if (value.length < 3 || value.length > 2000) {
        return true;
    }

    // Exclude strings that are likely not URLs
    const excludePatterns = [
        /^[a-zA-Z]$/, // Single letters
        /^\d+$/, // Just numbers
        /^[\/]+$/, // Just slashes
        /^[\.]+$/, // Just dots
        /^(true|false|null|undefined)$/i, // Common literals
        /^(function|class|const|let|var|if|else|for|while|return)$/i, // JS keywords
    ];

    return excludePatterns.some(pattern => pattern.test(value));
}

export function isHostnameOnly(value: string): boolean {
    // Check if the string looks like a hostname (from jxscout)
    if (!value.includes('.') || value.includes('/')) {
        return false;
    }

    try {
        const url = new URL(`https://${value}`);

        // Must have valid hostname
        if (!url.hostname || url.hostname.length < 4) {
            return false;
        }

        // Check for excluded hostnames
        if (EXCLUDED_HOSTNAMES.has(url.hostname)) {
            return false;
        }

        // Must have at least one dot and valid TLD
        const parts = url.hostname.split('.');
        if (parts.length < 2) {
            return false;
        }

        // Last part should be a valid TLD (2-4 characters)
        const tld = parts[parts.length - 1];
        if (tld.length < 2 || tld.length > 4) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
} 