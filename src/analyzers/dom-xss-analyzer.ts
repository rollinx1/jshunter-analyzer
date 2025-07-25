import { DOMXSSMatch } from '../types';

export class DOMXSSAnalyzer {
    private processedNodes: Set<string> = new Set();

    // Main method for unified traversal
    public analyzeNode(node: any, source: string, results: DOMXSSMatch[]): void {
        if (!node || typeof node !== 'object') return;

        // Handle different node types
        switch (node.type) {
            case 'CallExpression':
                this.analyzeCallExpressionNode(node, source, results);
                break;
            case 'AssignmentExpression':
                this.analyzeAssignmentExpressionNode(node, source, results);
                break;
            case 'MemberExpression':
                this.analyzeMemberExpressionNode(node, source, results);
                break;
        }
    }

    private analyzeCallExpressionNode(node: any, source: string, results: DOMXSSMatch[]): void {
        if (!node.start || !node.end) return;

        const nodeKey = `${node.start}-${node.end}`;
        if (this.processedNodes.has(nodeKey)) return;
        this.processedNodes.add(nodeKey);

        const value = source.slice(node.start, node.end);

        // Check for eval() calls
        if (node.callee?.type === 'Identifier' && node.callee.name === 'eval') {
            if (!this.isFalsePositive(value, 'eval')) {
                const position = this.getPosition(source, node.start);
                results.push({
                    value,
                    line: position.line,
                    column: position.column,
                    type: 'dom-eval'
                });
            }
            return;
        }

        // Check for document.write() calls
        if (node.callee?.type === 'MemberExpression') {
            const callee = node.callee;
            if (callee.object?.type === 'Identifier' && callee.object.name === 'document' &&
                callee.property?.type === 'Identifier' &&
                ['write', 'writeln'].includes(callee.property.name)) {

                if (!this.isFalsePositive(value, 'write')) {
                    const position = this.getPosition(source, node.start);
                    results.push({
                        value,
                        line: position.line,
                        column: position.column,
                        type: 'dom-write'
                    });
                }
                return;
            }

            // Check for postMessage calls
            if (callee.property?.type === 'Identifier' && callee.property.name === 'postMessage') {
                if (!this.isFalsePositive(value, 'postMessage')) {
                    const position = this.getPosition(source, node.start);
                    results.push({
                        value,
                        line: position.line,
                        column: position.column,
                        type: 'dom-postmessage'
                    });
                }
                return;
            }
        }

        // Check for React dangerouslySetInnerHTML
        if (node.callee?.type === 'MemberExpression' ||
            (node.arguments && node.arguments.some((arg: any) =>
                arg.type === 'ObjectExpression' &&
                arg.properties &&
                arg.properties.some((prop: any) =>
                    prop.key?.name === 'dangerouslySetInnerHTML' ||
                    (prop.key?.type === 'Literal' && prop.key.value === 'dangerouslySetInnerHTML')
                )
            ))) {

            if (value.includes('dangerouslySetInnerHTML') && !this.isFalsePositive(value, 'dangerouslySetInnerHTML')) {
                const position = this.getPosition(source, node.start);
                results.push({
                    value,
                    line: position.line,
                    column: position.column,
                    type: 'dom-dangerous-html'
                });
            }
        }
    }

    private analyzeAssignmentExpressionNode(node: any, source: string, results: DOMXSSMatch[]): void {
        if (!node.start || !node.end) return;

        const nodeKey = `${node.start}-${node.end}`;
        if (this.processedNodes.has(nodeKey)) return;
        this.processedNodes.add(nodeKey);

        const value = source.slice(node.start, node.end);

        // Check for innerHTML assignments
        if (node.left?.type === 'MemberExpression' &&
            node.left.property?.type === 'Identifier' &&
            node.left.property.name === 'innerHTML') {

            if (!this.isFalsePositive(value, 'innerHTML')) {
                const position = this.getPosition(source, node.start);
                results.push({
                    value,
                    line: position.line,
                    column: position.column,
                    type: 'dom-innerHTML'
                });
            }
            return;
        }

        // Check for document.domain assignments
        if (node.left?.type === 'MemberExpression' &&
            node.left.object?.type === 'Identifier' && node.left.object.name === 'document' &&
            node.left.property?.type === 'Identifier' && node.left.property.name === 'domain') {

            if (!this.isFalsePositive(value, 'domain')) {
                const position = this.getPosition(source, node.start);
                results.push({
                    value,
                    line: position.line,
                    column: position.column,
                    type: 'dom-domain'
                });
            }
        }
    }

    private analyzeMemberExpressionNode(node: any, source: string, results: DOMXSSMatch[]): void {
        // This method can be used for additional member expression analysis if needed
        // Currently, most DOM XSS patterns are caught in CallExpression and AssignmentExpression
    }

    private isFalsePositive(value: string, patternType: string): boolean {
        // Skip matches that are clearly comments or documentation
        if (value.includes('//') || value.includes('/*') || value.includes('*/')) {
            return true;
        }

        // Skip matches that seem to be in string literals describing the pattern
        if (value.includes('Test ') || value.includes('// Test') || value.includes('Example:')) {
            return true;
        }

        // Pattern-specific false positive checks
        switch (patternType) {
            case 'eval':
                // Skip if it's part of a larger word (evaluation, medieval, etc.)
                if (/\w+eval\w+/i.test(value) && !/\beval\s*\(/.test(value)) {
                    return true;
                }
                break;

            case 'innerHTML':
                // Skip if it's just a string or comment about innerHTML
                if (value.includes('"innerHTML"') || value.includes("'innerHTML'")) {
                    return true;
                }
                break;

            case 'write':
                // Skip if it's about file writing or other non-DOM write operations
                if (value.includes('file.write') || value.includes('stream.write') ||
                    value.includes('fs.write') || value.includes('console.write')) {
                    return true;
                }
                break;
        }

        return false;
    }

    private getPosition(source: string, offset: number): { line: number; column: number } {
        const lines = source.slice(0, offset).split('\n');
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1,
        };
    }
} 