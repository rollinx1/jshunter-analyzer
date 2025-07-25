#!/usr/bin/env node

import { Command } from 'commander';
import { Analyzer } from './analyzer';
import { AnalyzerConfig } from './types';

const program = new Command();

program
    .name('jshunter-analyzer')
    .description('JSHunter Analyzer - High-performance JavaScript security analyzer using AST parsing')
    .version('1.0.0');

program
    .argument('<file>', 'JavaScript file to analyze')
    .option('-c, --confidence <threshold>', 'Confidence threshold (0-1)', '0.3')
    .option('-d, --depth <max>', 'Maximum traversal depth', '10')
    .action(async (file: string, options) => {
        try {
            const config: AnalyzerConfig = {
                confidenceThreshold: parseFloat(options.confidence),
                maxTraversalDepth: parseInt(options.depth)
            };

            // Use the new optimized analyzer - single read, parse, and traversal
            const analyzer = new Analyzer(config);
            const result = analyzer.analyze(file);

            // Output combined results as JSON
            console.log(JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

program.parse(); 