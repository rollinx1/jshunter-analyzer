import { UrlType } from '../types';

const FILE_EXTENSIONS = new Set([
    "js", "css", "html", "htm", "xhtml", "xlsx", "xls", "docx", "doc", "pdf", "rss", "xml", "php", "phtml", "asp", "aspx", "asmx", "ashx", "cgi", "pl", "rb", "py", "do", "jsp", "jspa", "json", "jsonp", "txt", "jsx", "ts", "tsx", "scss", "less", "png", "jpg", "jpeg", "gif", "svg", "ico", "webp", "mp3", "mp4", "wav", "ogg", "webm", "zip", "tar", "gz", "rar", "7z", "md", "csv", "yaml", "yml", "env", "config", "conf", "ini", "sh", "bash", "zsh", "fish", "java", "c", "cpp", "go", "rs", "sql", "db", "sqlite", "sqlite3", "log", "lock", "map", "min", "bundle"
]);

export function classifyUrl(value: string, context: string): UrlType {
    if (context === 'api-url') {
        return 'api-endpoint';
    }

    if (value.includes('://') || value.startsWith('//')) {
        return 'url';
    }

    const parts = value.split('/');
    const lastPart = parts[parts.length - 1];

    if (lastPart.includes('.')) {
        const ext = lastPart.split('.').pop();
        if (ext && FILE_EXTENSIONS.has(ext)) {
            return 'file';
        }
    }

    if (!value.includes('/') && value.includes('.')) {
        const ext = value.split('.').pop();
        if (ext && FILE_EXTENSIONS.has(ext)) {
            return 'file';
        }
    }

    return 'path';
} 