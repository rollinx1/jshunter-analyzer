import { Node } from "oxc-parser";

export function processTemplateLiteral(template: string): string {
    // Replace template expressions with placeholder
    return template.replace(/\$\{[^}]*\}/g, 'EXPR');
}

export function processStringConcatenation(node: Node): string {
    if (node.type === 'BinaryExpression' && node.operator === '+') {
        const left = processStringConcatenation(node.left);
        const right = processStringConcatenation(node.right);
        return left + right;
    }

    if (node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'concat') {

        const base = processStringConcatenation(node.callee.object);
        const args = node.arguments
            .map(arg => arg.type === 'Literal' && typeof arg.value === 'string'
                ? arg.value
                : 'EXPR')
            .join('');
        return base + args;
    }

    if (node.type === 'Literal' && typeof node.value === 'string') {
        return node.value;
    }

    return 'EXPR';
}

export function extractStringFromNode(node: Node): string | null {
    if (node.type === 'Literal' && typeof node.value === 'string') {
        return node.value;
    }

    if (node.type === 'TemplateLiteral') {
        // For template literals, we need to reconstruct the string
        let result = '';
        for (let i = 0; i < node.quasis.length; i++) {
            result += node.quasis[i].value.raw;
            if (i < node.expressions.length) {
                result += 'EXPR'; // Placeholder for expressions
            }
        }
        return result;
    }

    if (node.type === 'BinaryExpression' && node.operator === '+') {
        return processStringConcatenation(node);
    }

    return null;
}

export function isStringLikeNode(node: Node): boolean {
    return node.type === 'Literal' && typeof node.value === 'string' ||
        node.type === 'TemplateLiteral' ||
        (node.type === 'BinaryExpression' && node.operator === '+');
}

export function calculateStringComplexity(value: string): number {
    // Calculate a complexity score based on various factors
    let score = 0;

    // Length factor
    if (value.length > 10) score += 1;
    if (value.length > 50) score += 1;

    // Special characters
    if (/[\/\-\._~:?#\[\]@!$&'()*+,;=]/.test(value)) score += 1;

    // Multiple path segments
    const segments = value.split('/').filter(Boolean);
    if (segments.length > 2) score += 1;
    if (segments.length > 4) score += 1;

    // Query parameters
    if (value.includes('?')) score += 1;
    if (value.includes('&')) score += 1;

    // Domain-like structure
    if (/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(value)) score += 2;

    // API-like patterns
    if (/\/(api|v\d+|rest|graphql)\//i.test(value)) score += 2;

    return score;
}

export function normalizeUrl(url: string): string {
    // Remove common prefixes and suffixes that might be artifacts
    let normalized = url.trim();

    // Remove quotes if they wrap the entire string
    if ((normalized.startsWith('"') && normalized.endsWith('"')) ||
        (normalized.startsWith("'") && normalized.endsWith("'"))) {
        normalized = normalized.slice(1, -1);
    }

    // Remove template literal backticks
    if (normalized.startsWith('`') && normalized.endsWith('`')) {
        normalized = normalized.slice(1, -1);
    }

    return normalized;
} 