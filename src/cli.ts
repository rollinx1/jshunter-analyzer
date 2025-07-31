#!/usr/bin/env node

import { Command } from 'commander';
import { Analyzer } from './analyzer';
import { AnalyzerConfig } from './types';
import chalk from 'chalk';

const program = new Command();

program
    .name('jshunter-analyzer')
    .description('JSHunter Analyzer - High-performance JavaScript security analyzer using AST parsing')
    .version('1.0.0');

program
    .argument('<file>', 'JavaScript file to analyze')
    .option('-c, --confidence <threshold>', 'Confidence threshold (0-1)', '0.3')
    .option('-d, --depth <max>', 'Maximum traversal depth', '10')
    .action((file: string, options) => {
        try {
            const config: AnalyzerConfig = {
                confidenceThreshold: parseFloat(options.confidence),
                maxTraversalDepth: parseInt(options.depth)
            };

            const analyzer = new Analyzer(config);
            const result = analyzer.analyze(file);

            console.log(JSON.stringify(result, null, 2));
        } catch (error) {
            if (error instanceof Error && error.message.startsWith('Failed to parse')) {
                const emptyResult = {
                    urls: [],
                    graphql: [],
                    domxss: [],
                    events: [],
                    httpapi: []
                };
                console.log(JSON.stringify(emptyResult, null, 2));
                process.exit(0);
            } else {
                console.error('Error:', error instanceof Error ? error.message : String(error));
                process.exit(1);
            }
        }
    });

program.parse(); 