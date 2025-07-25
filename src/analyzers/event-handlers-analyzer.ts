import { EventHandlerMatch } from '../types';

export class EventHandlersAnalyzer {
    private processedNodes: Set<string> = new Set();

    // Main method for unified traversal
    public analyzeNode(node: any, source: string, results: EventHandlerMatch[]): void {
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

    private analyzeCallExpressionNode(node: any, source: string, results: EventHandlerMatch[]): void {
        if (!node.start || !node.end) return;

        const nodeKey = `${node.start}-${node.end}`;
        if (this.processedNodes.has(nodeKey)) return;
        this.processedNodes.add(nodeKey);

        const value = source.slice(node.start, node.end);

        // Check for addEventListener calls
        if (node.callee?.type === 'MemberExpression') {
            const callee = node.callee;

            if (callee.property?.type === 'Identifier' && callee.property.name === 'addEventListener') {
                const position = this.getPosition(source, node.start);
                results.push({
                    value,
                    line: position.line,
                    column: position.column,
                    type: 'event-listener'
                });
                return;
            }

            // Check for window.open calls
            if (callee.property?.type === 'Identifier' && callee.property.name === 'open' &&
                callee.object?.type === 'Identifier' && callee.object.name === 'window') {
                const position = this.getPosition(source, node.start);
                results.push({
                    value,
                    line: position.line,
                    column: position.column,
                    type: 'event-window-open'
                });
                return;
            }
        }

        // Check for direct open() calls (shorthand for window.open)
        if (node.callee?.type === 'Identifier' && node.callee.name === 'open') {
            const position = this.getPosition(source, node.start);
            results.push({
                value,
                line: position.line,
                column: position.column,
                type: 'event-window-open'
            });
        }
    }

    private analyzeAssignmentExpressionNode(node: any, source: string, results: EventHandlerMatch[]): void {
        if (!node.start || !node.end || !node.left) return;

        const nodeKey = `${node.start}-${node.end}`;
        if (this.processedNodes.has(nodeKey)) return;
        this.processedNodes.add(nodeKey);

        const value = source.slice(node.start, node.end);

        // Check for onmessage handler assignments
        if (node.left.type === 'MemberExpression' &&
            node.left.property?.type === 'Identifier' &&
            node.left.property.name === 'onmessage') {
            const position = this.getPosition(source, node.start);
            results.push({
                value,
                line: position.line,
                column: position.column,
                type: 'event-onmessage'
            });
            return;
        }

        // Check for onhashchange handler assignments
        if (node.left.type === 'MemberExpression' &&
            node.left.property?.type === 'Identifier' &&
            node.left.property.name === 'onhashchange') {
            const position = this.getPosition(source, node.start);
            results.push({
                value,
                line: position.line,
                column: position.column,
                type: 'event-onhashchange'
            });
            return;
        }

        // Check for location manipulation
        if (node.left.type === 'MemberExpression' &&
            node.left.object?.type === 'Identifier' &&
            node.left.object.name === 'location') {
            const position = this.getPosition(source, node.start);
            results.push({
                value,
                line: position.line,
                column: position.column,
                type: 'event-location'
            });
            return;
        }

        // Check for window.location manipulation
        if (node.left.type === 'MemberExpression' &&
            node.left.object?.type === 'MemberExpression' &&
            node.left.object.object?.type === 'Identifier' &&
            node.left.object.object.name === 'window' &&
            node.left.object.property?.type === 'Identifier' &&
            node.left.object.property.name === 'location') {
            const position = this.getPosition(source, node.start);
            results.push({
                value,
                line: position.line,
                column: position.column,
                type: 'event-location'
            });
            return;
        }

        // Check for specific location property assignments
        if (node.left.type === 'MemberExpression' &&
            node.left.object?.type === 'MemberExpression' &&
            node.left.object.object?.type === 'Identifier' &&
            node.left.object.object.name === 'location' &&
            node.left.object.property?.type === 'Identifier' &&
            ['href', 'hash', 'pathname', 'search'].includes(node.left.object.property.name)) {
            const position = this.getPosition(source, node.start);
            results.push({
                value,
                line: position.line,
                column: position.column,
                type: 'event-location'
            });
        }
    }

    private analyzeMemberExpressionNode(node: any, source: string, results: EventHandlerMatch[]): void {
        // This handles cases where we access location properties without assignment
        if (!node.start || !node.end) return;

        const nodeKey = `${node.start}-${node.end}`;
        if (this.processedNodes.has(nodeKey)) return;

        // Only check for location access patterns that might be used for navigation
        if (node.object?.type === 'Identifier' && node.object.name === 'location' &&
            node.property?.type === 'Identifier' &&
            ['href', 'hash', 'pathname', 'search', 'replace', 'assign'].includes(node.property.name)) {

            this.processedNodes.add(nodeKey);

            const value = source.slice(node.start, node.end);
            const position = this.getPosition(source, node.start);
            results.push({
                value,
                line: position.line,
                column: position.column,
                type: 'event-location'
            });
        }
    }

    private getPosition(source: string, offset: number): { line: number; column: number } {
        const lines = source.slice(0, offset).split('\n');
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1,
        };
    }
} 