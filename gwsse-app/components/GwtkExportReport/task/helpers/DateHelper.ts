export function getDateWithFormat(format: string): string {
    return format.replace('d', getDate()).replace('m', getMonth()).replace('Y', getYear()) + ', ' + getHours() + ':' + getMinutes() + ':' + getSeconds();
}

export function getDate(): string {
    return (new Date).getDate().toString().padStart(2, '0');
}

export function getMonth(): string {
    return ((new Date).getMonth() + 1).toString().padStart(2, '0');
}

export function getYear(): string {
    return (new Date).getFullYear().toString();
}

export function getHours(): string {
    return (new Date).getHours().toString().padStart(2, '0');
}

export function getMinutes(): string {
    return (new Date).getMinutes().toString().padStart(2, '0');
}

export function getSeconds(): string {
    return (new Date).getSeconds().toString().padStart(2, '0');
}
