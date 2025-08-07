import { URL } from 'url';

const FILE_EXTENSIONS = new Set([
    "js", "css", "html", "htm", "xhtml", "xlsx", "xls", "docx", "doc", "pdf", "rss", "xml", "php", "phtml", "asp", "aspx", "asmx", "ashx", "cgi", "pl", "rb", "py", "do", "jsp", "jspa", "json", "jsonp", "txt", "jsx", "ts", "tsx", "scss", "less", "png", "jpg", "jpeg", "gif", "svg", "ico", "webp", "mp3", "mp4", "wav", "ogg", "webm", "zip", "tar", "gz", "rar", "7z", "md", "csv", "yaml", "yml", "env", "config", "conf", "ini", "sh", "bash", "zsh", "fish", "java", "c", "cpp", "go", "rs", "sql", "db", "sqlite", "sqlite3", "log", "lock", "map", "min", "bundle"
]);

const hostnamesToExclude = new Set(["www.w3.org", "reactjs.org"]);

function containsAny(str: string, chars: string): boolean {
    return chars.split("").some((char) => str.includes(char));
}

export function isValidPath(value: string): boolean {
    const trimmed = value.trim();

    if (trimmed.length < 2 || trimmed.length > 2000) {
        return false;
    }

    if (containsAny(trimmed, " ()<>`{}^$,")) {
        return false;
    }

    if (!containsAny(trimmed, "/?.")) {
        return false;
    }

    if (trimmed.startsWith('/')) {
        return true;
    }

    if (trimmed.includes("://") || trimmed.startsWith("//")) {
        try {
            const url = new URL(trimmed.startsWith("//") ? `http:${trimmed}` : trimmed);
            const scheme = url.protocol.toLowerCase().replace(":", "");
            if (scheme !== "http" && scheme !== "https") {
                return false;
            }
            if (hostnamesToExclude.has(url.hostname)) {
                return false;
            }
            return true;
        } catch {
            // Not a full url
        }
    }

    if (trimmed.startsWith('./') || trimmed.startsWith('../')) {
        return true;
    }

    const parts = trimmed.split('/');
    const lastPart = parts[parts.length - 1];

    if (lastPart.includes('.')) {
        const ext = lastPart.split('.').pop();
        if (ext && FILE_EXTENSIONS.has(ext)) {
            return true;
        }
    }

    if (trimmed.startsWith('.') && FILE_EXTENSIONS.has(trimmed.substring(1))) {
        return true;
    }

    if (!trimmed.includes('/') && trimmed.includes('.')) {
        const ext = trimmed.split('.').pop();
        if (ext && FILE_EXTENSIONS.has(ext)) {
            return true;
        }
    }

    return false;
} 