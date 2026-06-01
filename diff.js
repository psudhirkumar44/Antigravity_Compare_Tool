/**
 * Beyond Compare Web Clone - Core Diff & Comparison Engine
 * Implements Myers Diff Algorithm, Character-level LCS, and Primary-Key Table Row Alignment.
 */

const DiffEngine = {
    /**
     * Folder Difference Engine
     * Matches files by relative path, comparing size and timestamp.
     */
    compareDirectories(leftFilesMap, rightFilesMap) {
        const leftPaths = Object.keys(leftFilesMap);
        const rightPaths = Object.keys(rightFilesMap);

        const allPaths = Array.from(new Set([...leftPaths, ...rightPaths]));
        allPaths.sort();

        const results = [];

        allPaths.forEach(relPath => {
            const leftFile = leftFilesMap[relPath];
            const rightFile = rightFilesMap[relPath];

            if (leftFile && rightFile) {
                const sizeMatch = leftFile.size === rightFile.size;
                const timeMatch = leftFile.lastModified === rightFile.lastModified;

                let status = 'same';
                if (!sizeMatch || !timeMatch) {
                    status = 'diff';
                }

                results.push({
                    path: relPath,
                    name: leftFile.name,
                    status: status,
                    leftSize: leftFile.size,
                    rightSize: rightFile.size,
                    leftTime: leftFile.lastModified,
                    rightTime: rightFile.lastModified
                });
            } else if (leftFile) {
                results.push({
                    path: relPath,
                    name: leftFile.name,
                    status: 'orphan-left',
                    leftSize: leftFile.size,
                    rightSize: null,
                    leftTime: leftFile.lastModified,
                    rightTime: null
                });
            } else {
                results.push({
                    path: relPath,
                    name: rightFile.name,
                    status: 'orphan-right',
                    leftSize: null,
                    rightSize: rightFile.size,
                    leftTime: null,
                    rightTime: rightFile.lastModified
                });
            }
        });

        return results;
    },

    /**
     * Syntax highlighting tokenizer for premium codebase matching.
     */
    highlightCode(text, filename) {
        if (!text) return "";
        const esc = this.escapeHtml(text);
        const ext = String(filename || "").split('.').pop().toLowerCase();
        
        if (ext === 'js' || ext === 'ts' || ext === 'jsx') {
            return esc
                .replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="token-string">$1</span>')
                .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>')
                .replace(/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|export|import|from|default|extends|new|this|typeof|instanceof|try|catch|finally|throw|async|await|true|false|null|undefined)\b/g, '<span class="token-keyword">$1</span>')
                .replace(/\b(\d+)\b/g, '<span class="token-number">$1</span>');
        } else if (ext === 'json') {
            return esc
                .replace(/(&quot;.*?&quot;)(?=\s*:)/g, '<span class="token-tag">$1</span>')
                .replace(/:(&quot;.*?&quot;|&#039;.*?&#039;)/g, ':<span class="token-string">$1</span>')
                .replace(/\b(true|false|null)\b/g, '<span class="token-keyword">$1</span>')
                .replace(/\b(\d+)\b/g, '<span class="token-number">$1</span>');
        } else if (ext === 'html' || ext === 'xml') {
            return esc
                .replace(/(&lt;\/?[a-zA-Z0-9:-]+)/g, '<span class="token-tag">$1</span>')
                .replace(/(\s+[a-zA-Z0-9:-]+=)/g, '<span class="token-attribute">$1</span>')
                .replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="token-string">$1</span>')
                .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="token-comment">$1</span>');
        } else if (ext === 'css') {
            return esc
                .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>')
                .replace(/([a-zA-Z-]+)(?=\s*:)/g, '<span class="token-attribute">$1</span>')
                .replace(/(:\s*[^;]+)/g, ':<span class="token-string">$1</span>');
        } else if (ext === 'py') {
            return esc
                .replace(/(&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;|&#039;&#039;&#039;[\s\S]*?&#039;&#039;&#039;)/g, '<span class="token-comment">$1</span>')
                .replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="token-string">$1</span>')
                .replace(/(#.*)/g, '<span class="token-comment">$1</span>')
                .replace(/\b(def|class|return|if|elif|else|for|while|in|import|from|as|try|except|finally|raise|assert|pass|break|continue|and|or|not|is|None|True|False|lambda|global|nonlocal|with|yield)\b/g, '<span class="token-keyword">$1</span>')
                .replace(/\b(\d+)\b/g, '<span class="token-number">$1</span>');
        }
        
        return esc;
    },

    /**
     * Optimized Myers Diff Algorithm
     * Computes the line-by-line differences between A and B arrays.
     * Includes prefix/suffix trimming optimization for lightning-fast performance.
     */
    compareLines(a, b, ignoreWhitespace = false, caseInsensitive = false) {
        // Helper to preprocess lines for comparison if settings require
        const normalize = (line) => {
            if (!line) return "";
            let s = line;
            if (ignoreWhitespace) {
                s = s.replace(/\s+/g, ""); // strip all spaces or normalize to no-space
            }
            if (caseInsensitive) {
                s = s.toLowerCase();
            }
            return s;
        };

        const aNorm = a.map(normalize);
        const bNorm = b.map(normalize);

        const N = a.length;
        const M = b.length;

        // Step 1: Prefix trimming (find common lines at start)
        let prefixCount = 0;
        while (prefixCount < N && prefixCount < M && aNorm[prefixCount] === bNorm[prefixCount]) {
            prefixCount++;
        }

        // Step 2: Suffix trimming (find common lines at end)
        let suffixCount = 0;
        while (suffixCount < N - prefixCount && suffixCount < M - prefixCount && 
               aNorm[N - 1 - suffixCount] === bNorm[M - 1 - suffixCount]) {
            suffixCount++;
        }

        // Mid sections to perform Myers Diff on
        const midA = aNorm.slice(prefixCount, N - suffixCount);
        const midB = bNorm.slice(prefixCount, M - suffixCount);

        let midEdits = [];
        if (midA.length > 0 || midB.length > 0) {
            midEdits = this._myersDiff(midA, midB);
        }

        // Reconstruct the full list of edits
        const edits = [];

        // Add prefix matches
        for (let i = 0; i < prefixCount; i++) {
            edits.push({ type: 'equal', left: i, right: i });
        }

        // Add mid edits adjusted for prefix offset
        for (const edit of midEdits) {
            if (edit.type === 'equal') {
                edits.push({ type: 'equal', left: edit.left + prefixCount, right: edit.right + prefixCount });
            } else if (edit.type === 'delete') {
                edits.push({ type: 'delete', left: edit.left + prefixCount });
            } else if (edit.type === 'insert') {
                edits.push({ type: 'insert', right: edit.right + prefixCount });
            }
        }

        // Add suffix matches
        for (let i = 0; i < suffixCount; i++) {
            const lIdx = N - suffixCount + i;
            const rIdx = M - suffixCount + i;
            edits.push({ type: 'equal', left: lIdx, right: rIdx });
        }

        // Step 3: Identify "modified" lines (consecutive Delete followed by Insert)
        return this._pairModifications(edits, a, b);
    },

    /**
     * Core Myers Diff Implementation (greedy, O(ND))
     */
    _myersDiff(a, b) {
        const N = a.length;
        const M = b.length;
        if (N === 0) {
            return Array.from({ length: M }, (_, i) => ({ type: 'insert', right: i }));
        }
        if (M === 0) {
            return Array.from({ length: N }, (_, i) => ({ type: 'delete', left: i }));
        }

        const MAX = N + M;
        const V = { 1: 0 };
        const trace = [];

        for (let d = 0; d <= MAX; d++) {
            trace.push({ ...V });
            for (let k = -d; k <= d; k += 2) {
                let x;
                if (k === -d || (k !== d && (V[k - 1] || 0) < (V[k + 1] || 0))) {
                    x = V[k + 1] || 0; // move down (insert)
                } else {
                    x = (V[k - 1] || 0) + 1; // move right (delete)
                }
                let y = x - k;

                while (x < N && y < M && a[x] === b[y]) {
                    x++;
                    y++;
                }

                V[k] = x;
                if (x >= N && y >= M) {
                    return this._backtrack(trace, a, b, N, M);
                }
            }
            // Performance fallback for extremely large differences
            if (d > 1000) {
                // Return simple sequence if diff limit exceeded (rare for standard files)
                return this._fallbackLCS(a, b);
            }
        }
        return this._fallbackLCS(a, b);
    },

    /**
     * Backtrack Myers trace to reconstruct Shortest Edit Script (SES)
     */
    _backtrack(trace, a, b, N, M) {
        const edits = [];
        let x = N;
        let y = M;

        for (let d = trace.length - 1; d >= 0; d--) {
            const V = trace[d];
            const k = x - y;
            let prevK;

            if (k === -d || (k !== d && (V[k - 1] || 0) < (V[k + 1] || 0))) {
                prevK = k + 1;
            } else {
                prevK = k - 1;
            }

            const prevX = V[prevK] || 0;
            const prevY = prevX - prevK;

            while (x > prevX && y > prevY) {
                edits.unshift({ type: 'equal', left: x - 1, right: y - 1 });
                x--;
                y--;
            }

            if (d > 0) {
                if (x === prevX) {
                    edits.unshift({ type: 'insert', right: y - 1 });
                    y--;
                } else {
                    edits.unshift({ type: 'delete', left: x - 1 });
                    x--;
                }
            }
        }
        return edits;
    },

    /**
     * Fast LCS fallback for extremely large/unstructured differences
     */
    _fallbackLCS(a, b) {
        const edits = [];
        let i = 0;
        let j = 0;
        while (i < a.length && j < b.length) {
            if (a[i] === b[j]) {
                edits.push({ type: 'equal', left: i, right: j });
                i++;
                j++;
            } else {
                edits.push({ type: 'delete', left: i });
                i++;
            }
        }
        while (i < a.length) {
            edits.push({ type: 'delete', left: i });
            i++;
        }
        while (j < b.length) {
            edits.push({ type: 'insert', right: j });
            j++;
        }
        return edits;
    },

    /**
     * Post-processes Myers edits to pair consecutive deletes and inserts as modifications.
     * Beyond Compare displays aligned deletions/insertions as modified pairs.
     */
    _pairModifications(edits, a, b) {
        const result = [];
        let i = 0;

        while (i < edits.length) {
            if (edits[i].type === 'delete') {
                // Scan forward to collect a block of deletes
                const dels = [];
                while (i < edits.length && edits[i].type === 'delete') {
                    dels.push(edits[i]);
                    i++;
                }

                // Scan forward to see if there is an immediate block of inserts
                const ins = [];
                while (i < edits.length && edits[i].type === 'insert') {
                    ins.push(edits[i]);
                    i++;
                }

                if (ins.length > 0) {
                    // Pair them up as modifications
                    const commonCount = Math.min(dels.length, ins.length);
                    for (let j = 0; j < commonCount; j++) {
                        result.push({
                            type: 'modified',
                            left: dels[j].left,
                            right: ins[j].right
                        });
                    }

                    // Push leftovers
                    if (dels.length > commonCount) {
                        for (let j = commonCount; j < dels.length; j++) {
                            result.push(dels[j]);
                        }
                    } else if (ins.length > commonCount) {
                        for (let j = commonCount; j < ins.length; j++) {
                            result.push(ins[j]);
                        }
                    }
                } else {
                    // No inserts follow, push deletes
                    result.push(...dels);
                }
            } else {
                result.push(edits[i]);
                i++;
            }
        }
        return result;
    },

    /**
     * Character-level Difference Highlight Calculator
     * Runs Myers Diff on the characters of two strings to find detailed edits.
     * Returns HTML representation with diff spans.
     */
    compareCharacters(leftStr, rightStr) {
        if (leftStr === rightStr) {
            return { leftHtml: this.escapeHtml(leftStr), rightHtml: this.escapeHtml(rightStr) };
        }

        const aChars = Array.from(leftStr);
        const bChars = Array.from(rightStr);

        // Run Myers on characters
        const charEdits = this._myersDiff(aChars, bChars);

        let leftHtml = "";
        let rightHtml = "";

        charEdits.forEach(edit => {
            if (edit.type === 'equal') {
                const charEscaped = this.escapeHtml(aChars[edit.left]);
                leftHtml += charEscaped;
                rightHtml += charEscaped;
            } else if (edit.type === 'delete') {
                leftHtml += `<span class="char-diff-del">${this.escapeHtml(aChars[edit.left])}</span>`;
            } else if (edit.type === 'insert') {
                rightHtml += `<span class="char-diff-ins">${this.escapeHtml(bChars[edit.right])}</span>`;
            }
        });

        return { leftHtml, rightHtml };
    },

    /**
     * Escape special HTML characters
     */
    escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    /**
     * Parse date string or object into a JS Date object safely.
     */
    parseDate(s) {
        if (s === undefined || s === null) return null;
        if (s instanceof Date) return s;
        const str = String(s).trim();
        if (!str) return null;

        // 1. Excel numeric serial date format (e.g. 46023)
        if (/^\d+(\.\d+)?$/.test(str)) {
            const num = parseFloat(str);
            const dateEpoch = new Date(1899, 11, 30);
            return new Date(dateEpoch.getTime() + num * 24 * 60 * 60 * 1000);
        }

        // 2. Try standard JS Date constructor
        let d = new Date(str);
        if (!isNaN(d.getTime())) return d;

        // 3. Match manually for formats like MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD
        const parts = str.split(/[-\/]/);
        if (parts.length === 3) {
            let month, day, year;
            if (parts[0].length === 4) {
                // YYYY-MM-DD
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
                day = parseInt(parts[2], 10);
            } else {
                // MM/DD/YYYY or DD/MM/YYYY
                month = parseInt(parts[0], 10) - 1;
                day = parseInt(parts[1], 10);
                year = parseInt(parts[2], 10);
                // If month is invalid (> 11), try DD/MM/YYYY
                if (month < 0 || month > 11) {
                    month = parseInt(parts[1], 10) - 1;
                    day = parseInt(parts[0], 10);
                }
            }
            const dObj = new Date(year, month, day);
            if (!isNaN(dObj.getTime())) return dObj;
        }
        return null;
    },

    /**
     * Formats cell values for direct display inside the visual UI grid.
     */
    formatCellValue(val, colType) {
        if (val === undefined || val === null) return "";
        
        if (colType === 'date') {
            const d = this.parseDate(val);
            if (d && !isNaN(d.getTime())) {
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const yyyy = d.getFullYear();
                return `${mm}/${dd}/${yyyy}`;
            }
        }
        
        return String(val).trim();
    },

    /**
     * Highly advanced cell comparison helper supporting numeric and date-aware parsing and tolerances.
     */
    compareCells(valLeft, valRight, colType, ignoreWhitespace = true, caseInsensitive = false) {
        const sLeft = String(valLeft === undefined || valLeft === null ? "" : valLeft).trim();
        const sRight = String(valRight === undefined || valRight === null ? "" : valRight).trim();

        if (sLeft === sRight) return true;

        if (colType === 'numeric') {
            // Clean up: strip currency symbols, commas (thousand separators), percent signs, and spaces
            const cleanNum = (s) => {
                const cleaned = s.replace(/[\s\$,%]/g, '');
                return parseFloat(cleaned);
            };
            const numLeft = cleanNum(sLeft);
            const numRight = cleanNum(sRight);
            if (!isNaN(numLeft) && !isNaN(numRight)) {
                return Math.abs(numLeft - numRight) < 1e-9;
            }
        } else if (colType === 'date') {
            const dLeft = this.parseDate(valLeft);
            const dRight = this.parseDate(valRight);

            if (dLeft && dRight) {
                return dLeft.getTime() === dRight.getTime();
            }
        }

        // Default: text comparison
        let cleanLeft = sLeft;
        let cleanRight = sRight;
        if (ignoreWhitespace) {
            cleanLeft = cleanLeft.replace(/\s+/g, '');
            cleanRight = cleanRight.replace(/\s+/g, '');
        }
        if (caseInsensitive) {
            cleanLeft = cleanLeft.toLowerCase();
            cleanRight = cleanRight.toLowerCase();
        }
        return cleanLeft === cleanRight;
    },

    /**
     * Table (CSV) Comparison Aligning Engine
     * Pairs records based on one or more "Key Columns".
     * If no Key Column is supplied, maps sequential indices.
     */
    compareTables(leftTable, rightTable, columnSettings = {}, leftCols = [], rightCols = []) {
        // 1. Parse column settings
        const keyColumns = [];
        const unimportantColumns = [];
        const ignoredColumns = [];

        for (const [colName, setting] of Object.entries(columnSettings)) {
            const colClass = (setting && typeof setting !== 'string') ? (setting.class || 'standard') : (setting || 'standard');
            if (colClass === 'key') {
                keyColumns.push(colName);
            } else if (colClass === 'unimportant') {
                unimportantColumns.push(colName);
            } else if (colClass === 'ignored') {
                ignoredColumns.push(colName);
            }
        }

        // If keys are empty, fallback to basic row-by-row comparison
        if (keyColumns.length === 0) {
            return this._compareTablesSequentially(leftTable, rightTable, columnSettings, leftCols, rightCols);
        }

        // Helper to generate composite keys
        const getRowKey = (rowObj, cols) => {
            const row = rowObj.data;
            return keyColumns.map(keyName => {
                const colIdx = cols.indexOf(keyName);
                if (colIdx === -1) return "";
                const val = row[colIdx];
                return val === undefined || val === null ? "" : String(val).trim();
            }).join("::");
        };

        // 2. Wrap rows with original 0-indexed row numbers
        const sortedLeft = leftTable.map((row, idx) => ({ originalIndex: idx, data: row }));
        const sortedRight = rightTable.map((row, idx) => ({ originalIndex: idx, data: row }));

        // 3. Sort both left and right naturally by key values before Myers alignment
        const naturalSort = (a, b, cols) => {
            const keyA = getRowKey(a, cols);
            const keyB = getRowKey(b, cols);
            return keyA.localeCompare(keyB, undefined, { numeric: true, sensitivity: 'base' });
        };

        sortedLeft.sort((a, b) => naturalSort(a, b, leftCols));
        sortedRight.sort((a, b) => naturalSort(a, b, rightCols));

        const leftKeys = sortedLeft.map(rowObj => getRowKey(rowObj, leftCols));
        const rightKeys = sortedRight.map(rowObj => getRowKey(rowObj, rightCols));

        // 4. Perform Myers Diff on the sorted keys
        const alignmentEdits = this._myersDiff(leftKeys, rightKeys);

        const alignedRows = [];

        alignmentEdits.forEach(edit => {
            if (edit.type === 'equal') {
                // Key matches in both!
                const leftWrapped = sortedLeft[edit.left];
                const rightWrapped = sortedRight[edit.right];
                const leftRow = leftWrapped.data;
                const rightRow = rightWrapped.data;

                // Compare cells and separate mismatches into standard vs unimportant by column name
                const standardMismatches = [];
                const unimportantMismatches = [];
                
                // Get unique columns
                const allCols = Array.from(new Set([...leftCols, ...rightCols]));

                allCols.forEach(colName => {
                    const colSetting = columnSettings[colName] || 'standard';
                    let colClass = 'standard';
                    let colType = 'text';

                    if (typeof colSetting === 'string') {
                        colClass = colSetting;
                        const nameLower = colName.toLowerCase();
                        if (nameLower.includes('date') || nameLower.includes('time') || nameLower.includes('cov start') || nameLower.includes('cov end')) {
                            colType = 'date';
                        } else if (nameLower.includes('rate') || nameLower.includes('amount') || nameLower.includes('opeb') || nameLower.includes('price') || nameLower.includes('salary') || nameLower.includes('number')) {
                            colType = 'numeric';
                        }
                    } else {
                        colClass = colSetting.class || 'standard';
                        colType = colSetting.type || 'text';
                    }

                    if (colClass === 'ignored') return;

                    const leftColIdx = leftCols.indexOf(colName);
                    const rightColIdx = rightCols.indexOf(colName);

                    const valLeft = leftColIdx !== -1 ? leftRow[leftColIdx] : "";
                    const valRight = rightColIdx !== -1 ? rightRow[rightColIdx] : "";

                    const cellsEqual = this.compareCells(valLeft, valRight, colType, true, false);

                    if (!cellsEqual) {
                        if (colClass === 'unimportant') {
                            unimportantMismatches.push(colName);
                        } else if (colClass === 'key') {
                            // Key columns are already aligned by key
                        } else {
                            standardMismatches.push(colName);
                        }
                    }
                });

                let rowType = 'equal';
                if (standardMismatches.length > 0) {
                    rowType = 'modified'; // Critical standard change
                } else if (unimportantMismatches.length > 0) {
                    rowType = 'unimportant-modified'; // Muted changes only
                }

                alignedRows.push({
                    type: rowType,
                    leftIndex: leftWrapped.originalIndex,
                    rightIndex: rightWrapped.originalIndex,
                    leftRow: leftRow,
                    rightRow: rightRow,
                    standardMismatches: standardMismatches,
                    unimportantMismatches: unimportantMismatches
                });
            } else if (edit.type === 'delete') {
                // Row exists only in left table
                const leftWrapped = sortedLeft[edit.left];
                alignedRows.push({
                    type: 'delete',
                    leftIndex: leftWrapped.originalIndex,
                    rightIndex: null,
                    leftRow: leftWrapped.data,
                    rightRow: null,
                    standardMismatches: [],
                    unimportantMismatches: []
                });
            } else if (edit.type === 'insert') {
                // Row exists only in right table
                const rightWrapped = sortedRight[edit.right];
                alignedRows.push({
                    type: 'insert',
                    leftIndex: null,
                    rightIndex: rightWrapped.originalIndex,
                    leftRow: null,
                    rightRow: rightWrapped.data,
                    standardMismatches: [],
                    unimportantMismatches: []
                });
            }
        });

        return alignedRows;
    },

    /**
     * Sequential Fallback - Row-by-Row Comparison with Unimportant Column Support
     */
    _compareTablesSequentially(leftTable, rightTable, columnSettings, leftCols, rightCols) {
        const alignedRows = [];
        const maxLen = Math.max(leftTable.length, rightTable.length);

        for (let i = 0; i < maxLen; i++) {
            const leftRow = leftTable[i] || null;
            const rightRow = rightTable[i] || null;

            if (leftRow && rightRow) {
                const standardMismatches = [];
                const unimportantMismatches = [];
                
                const allCols = Array.from(new Set([...leftCols, ...rightCols]));

                allCols.forEach(colName => {
                    const colSetting = columnSettings[colName] || 'standard';
                    let colClass = 'standard';
                    let colType = 'text';

                    if (typeof colSetting === 'string') {
                        colClass = colSetting;
                        const nameLower = colName.toLowerCase();
                        if (nameLower.includes('date') || nameLower.includes('time') || nameLower.includes('cov start') || nameLower.includes('cov end')) {
                            colType = 'date';
                        } else if (nameLower.includes('rate') || nameLower.includes('amount') || nameLower.includes('opeb') || nameLower.includes('price') || nameLower.includes('salary') || nameLower.includes('number')) {
                            colType = 'numeric';
                        }
                    } else {
                        colClass = colSetting.class || 'standard';
                        colType = colSetting.type || 'text';
                    }

                    if (colClass === 'ignored') return;

                    const leftColIdx = leftCols.indexOf(colName);
                    const rightColIdx = rightCols.indexOf(colName);

                    const valLeft = leftColIdx !== -1 ? leftRow[leftColIdx] : "";
                    const valRight = rightColIdx !== -1 ? rightRow[rightColIdx] : "";

                    const cellsEqual = this.compareCells(valLeft, valRight, colType, true, false);

                    if (!cellsEqual) {
                        if (colClass === 'unimportant') {
                            unimportantMismatches.push(colName);
                        } else {
                            standardMismatches.push(colName);
                        }
                    }
                });

                let rowType = 'equal';
                if (standardMismatches.length > 0) {
                    rowType = 'modified';
                } else if (unimportantMismatches.length > 0) {
                    rowType = 'unimportant-modified';
                }

                alignedRows.push({
                    type: rowType,
                    leftIndex: i,
                    rightIndex: i,
                    leftRow: leftRow,
                    rightRow: rightRow,
                    standardMismatches: standardMismatches,
                    unimportantMismatches: unimportantMismatches
                });
            } else if (leftRow) {
                alignedRows.push({
                    type: 'delete',
                    leftIndex: i,
                    rightIndex: null,
                    leftRow: leftRow,
                    rightRow: null,
                    standardMismatches: [],
                    unimportantMismatches: []
                });
            } else {
                alignedRows.push({
                    type: 'insert',
                    leftIndex: null,
                    rightIndex: i,
                    leftRow: null,
                    rightRow: rightRow,
                    standardMismatches: [],
                    unimportantMismatches: []
                });
            }
        }

        return alignedRows;
    }
};

// Export to window scope
window.DiffEngine = DiffEngine;

