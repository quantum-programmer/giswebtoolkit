/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Класс работы с CSV файлами                       *
 *                                                                  *
 *******************************************************************/

import { BrowserService } from '~/services/BrowserService';

export enum ColumnSeparator {
    Space,
    Comma,
    Slash,
    Semicolon,
    Backslash,
    Pipe,
    Underscore,
    Tab
}

export type Cell = {
    col: number;
    row: number;
    value: string;
} & ({
    type: 'String';

} | {
    type: 'Number';
})

type StatisticItem = {
    separator: ColumnSeparator;
    count: number;
}

interface CellItem {

    readonly col: number;
    readonly row: number;

    toJson(): Cell;

    toCsvString(): string;
}

class StringCellItem implements CellItem {

    private value: string;

    constructor(readonly row = 0, readonly col = 0, value = '') {
        this.value = value;
    }

    toJson(): Cell {
        const col = this.col, row = this.row, type = 'String', value = `${this.value}`;

        return {
            col,
            row,
            type,
            value
        };
    }

    toCsvString(): string {
        if (this.value.length > 0) {
            this.value = this.value.replaceAll('"', '""');
            if (/[;,"]/.test(this.value)) {
                this.value = `"${this.value}"`;
            }
        }
        return this.value;
    }
}

class NumericCellItem implements CellItem {

    readonly value: number;

    constructor(readonly row = 0, readonly col = 0, value: string) {
        this.value = parseFloat(value.replace(',', '.')) || 0;
    }

    toJson(): Cell {
        const col = this.col, row = this.row, type = 'Number', value = '' + this.value;

        return {
            col,
            row,
            type,
            value
        };
    }

    toCsvString(): string {
        return '' + this.value;
    }
}

type LineSeparator = '\r' | '\n' | '\r\n';

/**
 * Класс работы с CSV файлами
 * @class CsvEditor
 */
export default class CsvEditor {

    private lineSeparator: LineSeparator = '\n';

    private titleLine?: (CellItem | undefined)[];

    private readonly rows: (CellItem | undefined)[][];

    private columnSeparator = ColumnSeparator.Semicolon;
    private maxCols = 0;

    private readonly columnSeparatorCollection = [
        { id: ColumnSeparator.Space, regValue: '\\s' },
        { id: ColumnSeparator.Comma, regValue: ',' },
        { id: ColumnSeparator.Slash, regValue: '\\/' },
        { id: ColumnSeparator.Semicolon, regValue: ';' },
        { id: ColumnSeparator.Backslash, regValue: '\\\\' },
        { id: ColumnSeparator.Pipe, regValue: '\\|' },
        { id: ColumnSeparator.Underscore, regValue: '_' },
        { id: ColumnSeparator.Tab, regValue: '\\t' }
    ];

    get separator() {
        return this.columnSeparator;
    }

    set separator(value: ColumnSeparator) {
        this.columnSeparator = value;
        this.reread();
    }

    set lineBreak(value: LineSeparator) {
        this.lineSeparator = value;
        this.reread();
    }

    set columnCount(value: number) {
        this.maxCols = value;
        this.rebuild();
    }

    get columnCount() {
        return this.maxCols;
    }

    get rowCount() {
        return this.rows.length;
    }

    get title(): (Cell | undefined)[] {
        return this.titleLine ? this.titleLine.map(cell => (cell !== undefined ? cell.toJson() : undefined)) : this.readLine(0);
    }

    private get csvStringLines(): string[] {
        return this.rows.map(cells => cells.map(cell => cell !== undefined ? cell.toCsvString() : '').join(this.getDelimiter(this.separator)));
    }

    getColumnType(col: number): Cell['type'] | undefined {
        return this.readLine(0)[col]?.type;
    }

    /**
     * @constructor CsvEditor
     * @param [content] {string} Текстовое содержимое файла
     * @param [fileName] {string} Имя файла
     * @param [hasTitleLine] {boolean} Флаг наличия заголовочной строки
     */
    constructor(readonly content = '', readonly fileName: string = 'Unknown.csv', readonly hasTitleLine = false) {

        const position = content.indexOf(this.lineSeparator);
        if (position !== -1) {
            if (content[position - 1] === '\r') {
                this.lineSeparator = '\r\n';
            }
        }

        const initLines = content ? content.split(this.lineSeparator) : [];
        if (initLines.length > 0 && hasTitleLine) {
            this.titleLine = this.parseLine(initLines.shift()!, 0, this.columnSeparator).map(cell => CsvEditor.createCellItem(cell.col, cell.row, cell.value));
        }

        this.rows = initLines.map((line, index) => this.parseLine(line, index, this.columnSeparator).map(cell => CsvEditor.createCellItem(cell.col, cell.row, cell.value)));

        if (this.rows.length !== 0) {
            this.columnCount = this.readLine(0).length;
        }
    }

    private reread() {
        const initLines = this.content.split(this.lineSeparator);
        if (initLines.length > 0 && this.hasTitleLine) {
            this.titleLine = this.parseLine(initLines.shift()!, 0, this.columnSeparator).map(cell => CsvEditor.createCellItem(cell.col, cell.row, cell.value));
        }

        this.rows.splice(0);
        initLines.forEach((line, index) => this.rows.push(this.parseLine(line, index, this.columnSeparator).map(cell => CsvEditor.createCellItem(cell.col, cell.row, cell.value))));

        if (this.rows.length !== 0) {
            this.columnCount = this.readLine(0).length;
        }
    }

    addTitleCells(cells: Cell[]): void {
        cells.forEach(cell => {
            if (!this.titleLine) {
                this.titleLine = [];
            }
            this.titleLine.push(CsvEditor.createCellItem(cell.col, cell.row, cell.value, cell.type));
        });
    }

    addCells(cells: Cell[]): void {
        for (let index = 0; index < cells.length; index++) {
            const cell = cells[index];
            if (cell.col >= this.columnCount) {
                continue;
            }

            while (cell.row > this.rows.length - 1) {
                this.addEmptyRow();
            }

            this.updateCell(cell);
        }
    }

    addEmptyRow(): void {
        const row = this.rows.length;
        const emptyRow: (CellItem | undefined)[] = [];
        for (let col = 0; col < this.columnCount; col++) {
            emptyRow.push(CsvEditor.createCellItem(col, row));
        }
        this.rows.push(emptyRow);
    }

    deleteRow(row: number): boolean {
        if (this.rows.length > row) {
            this.rows.splice(row, 1);
            return true;
        }
        return false;
    }

    clear(): void {
        this.rows.splice(0);
        this.titleLine?.splice(0);
        this.columnCount = 0;
        this.separator = ColumnSeparator.Semicolon;
    }

    clearTitle(): void {
        this.titleLine?.splice(0);
    }

    getStatistic(): StatisticItem[] {
        const initLines = this.content.split(this.lineSeparator);
        if (initLines.length) {
            const startIndex = initLines.length > 1 ? 1 : 0;
            return this.columnSeparatorCollection.map(item => ({
                separator: item.id,
                count: this.parseLine(initLines[startIndex], startIndex, item.id).length
            }));
        } else {
            return [];
        }
    }

    readLine(row: number): (Cell | undefined)[] {
        if (row >= this.rows.length) {
            return [];
        }
        return this.rows[row].map(cell => (cell !== undefined ? cell.toJson() : undefined));
    }

    readColumn(col: number): (Cell | undefined)[] {
        const result: (Cell | undefined)[] = [];
        this.rows.forEach((line, index) => {
            const lineCells = this.readLine(index);
            if (col < lineCells.length) {
                result.push(lineCells[col]);
            }
        });
        return result;
    }

    updateCell(cell: Cell): boolean {
        if (cell.row < this.rowCount && cell.col < this.columnCount) {
            const oldCellIndex = cell.col;
            const newCellItem = CsvEditor.createCellItem(cell.col, cell.row, cell.value, cell.type);
            this.rows[cell.row].splice(oldCellIndex, 1, newCellItem);
            return true;

        }
        return false;
    }

    getColumnNumbersList() {
        let numbersList = '';
        for (let i = 1; i < this.columnCount; i++) {
            numbersList = numbersList + (i + 1) + ',';
        }
        return numbersList.slice(0, numbersList.length - 1);
    }

    toString(includeTitleLine = false): string {
        let result = '';

        if (includeTitleLine && this.titleLine) {
            result += this.titleLine.map(cell => cell !== undefined ? cell.toCsvString() : '').join(this.getDelimiter(this.separator)) + this.lineSeparator;
        }

        return result + this.csvStringLines.join(this.lineSeparator);
    }

    private getDelimiter(columnSeparator: ColumnSeparator): string {
        const columnSeparatorDescription = this.columnSeparatorCollection.find(item => item.id === columnSeparator) || this.columnSeparatorCollection[1];
        return columnSeparatorDescription.regValue;
    }

    private parseLine(str: string, row: number, columnSeparator: ColumnSeparator): Cell[] {

        const delimiter = this.getDelimiter(columnSeparator);

        const regex = CsvEditor.getRegex(delimiter);

        let result: Cell[] = [];

        if (str[0] === delimiter) {
            result.push({ col: result.length, row, type: 'String', value: '' });
        }

        let m;
        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            let word = m[1] || '';
            // if ((word[0] === '"' || word[0] === '\'') && (word[word.length - 1] === '"' || word[word.length - 1] === '\'')) {
            //     word = word.substr(1, word.length - 2);
            // }

            if (word[0] === '"' && word[word.length - 1] === '"') {
                word = word.slice(1, word.length - 1).replaceAll(/""/g, '"');
            }

            result.push({ col: result.length, row, type: 'String', value: word });
        }

        return result;
    }


    private rebuild(): void {
        for (let row = 0; row < this.rows.length; row++) {
            const cells = this.rows[row];
            if (this.columnCount > cells.length) {
                while (cells.length < this.columnCount) {
                    cells.push(CsvEditor.createCellItem(cells.length, row));
                }
            } else if (this.columnCount < cells.length) {
                cells.length = this.columnCount;
            }
        }
    }

    static async fromFile(file: File, hasTitle: boolean): Promise<CsvEditor> {

        return new Promise<CsvEditor>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = event => {
                if (event.target && event.target.result) {
                    const csvText = event.target.result as string;
                    resolve(new CsvEditor(csvText, file.name, hasTitle));
                }
            };
            reader.onerror = () => {
                reject('Cannot read .csv file');
            };
        });
    }

    static async openFile(hasTitle: boolean = false): Promise<CsvEditor> {
        const fileResult = await BrowserService.openFileDialog(['.txt', '.csv']);

        if (fileResult && fileResult[0]) {
            const file = fileResult[0];
            return CsvEditor.fromFile(file, hasTitle);
        }
        return Promise.reject('Cannot open .csv file');
    }

    private static getRegex(delimiter: string): RegExp {
        const pattern = '(?:' + delimiter + '|^)("(?:(?:"")*[^"]*)*"|[^"' + delimiter + ']*|(?:$))';
        return new RegExp(pattern, 'g');
    }

    private static createCellItem(col: number, row: number, value?: string, type?: 'String' | 'Number'): CellItem | undefined {
        let cell: CellItem | undefined;
        if (value === undefined) {
            cell = undefined;
        } else {
            if (!type) {
                type = value.trim().length > 0 && /^[+-]?\d*[.,]?\d*$/.test(value.trim()) ? 'Number' : 'String';
            }

            if (type === 'String') {
                cell = new StringCellItem(col, row, value);
            } else {
                cell = new NumericCellItem(col, row, value);
            }
        }
        return cell;
    }
}
