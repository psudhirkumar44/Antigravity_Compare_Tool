/**
 * Beyond Compare Web Clone - Main Application Controller
 * Manages UI interactions, file ingestion, synchronized scroll listeners, navigation, and state.
 */

document.addEventListener("DOMContentLoaded", () => {
    // -------------------------------------------------------------
    // STATE VARIABLES
    // -------------------------------------------------------------
    let currentTheme = localStorage.getItem("bc-theme") || "dark";
    let activeView = "home";

    // Text Compare State
    let leftTextLines = [];
    let rightTextLines = [];
    let textEdits = [];
    let textLeftFilename = "left_file.txt";
    let textRightFilename = "right_file.txt";
    let textFilterMode = "all"; // 'all', 'diff', 'same'
    let ignoreWhitespace = true;
    let caseInsensitive = false;

    // Table Compare State
    let leftTableData = [];
    let rightTableData = [];
    let leftTableCols = [];
    let rightTableCols = [];
    let alignedTableRows = [];
    let tableLeftFilename = "left_table.csv";
    let tableRightFilename = "right_table.csv";
    let tableFilterMode = "all"; // 'all', 'diff', 'same'
    let selectedKeyColumn = "";
    let tableColumnSettings = {}; // maps colName -> 'key' | 'standard' | 'unimportant' | 'ignored'

    // Gutter alignment line height
    const LINE_HEIGHT = 20;

    // -------------------------------------------------------------
    // UI ELEMENTS SELECTORS
    // -------------------------------------------------------------
    const elements = {
        // Theme & Navigation
        html: document.documentElement,
        themeToggle: document.getElementById("theme-toggle"),
        themeDarkBtn: document.getElementById("theme-dark-btn"),
        themeLightBtn: document.getElementById("theme-light-btn"),
        navHome: document.getElementById("nav-home"),
        navText: document.getElementById("nav-text"),
        navTable: document.getElementById("nav-table"),
        viewHome: document.getElementById("view-home"),
        viewText: document.getElementById("view-text"),
        viewTable: document.getElementById("view-table"),

        // Home cards
        cardNewText: document.getElementById("card-new-text"),
        cardNewTable: document.getElementById("card-new-table"),
        demoAuthCode: document.getElementById("demo-auth-code"),
        demoEnvJson: document.getElementById("demo-env-json"),
        demoEmployeeCsv: document.getElementById("demo-employee-csv"),

        // Text Compare Controls
        textFilterAll: document.getElementById("text-filter-all"),
        textFilterDiff: document.getElementById("text-filter-diff"),
        textFilterSame: document.getElementById("text-filter-same"),
        textNavPrev: document.getElementById("text-nav-prev"),
        textNavNext: document.getElementById("text-nav-next"),
        textActionSwap: document.getElementById("text-action-swap"),
        textActionRules: document.getElementById("text-action-rules"),
        textActionSave: document.getElementById("text-action-save"),
        textActionClear: document.getElementById("text-action-clear"),
        textLeftFilename: document.getElementById("text-left-filename"),
        textRightFilename: document.getElementById("text-right-filename"),
        textLeftInput: document.getElementById("text-left-input"),
        textRightInput: document.getElementById("text-right-input"),
        textLeftPaste: document.getElementById("text-left-paste"),
        textRightPaste: document.getElementById("text-right-paste"),
        textBtnComparePaste: document.getElementById("text-btn-compare-paste"),
        textEmptyOverlay: document.getElementById("text-empty-overlay"),
        scrollLeft: document.getElementById("scroll-left"),
        scrollRight: document.getElementById("scroll-right"),
        gutterLeftLines: document.getElementById("gutter-left-lines"),
        gutterRightLines: document.getElementById("gutter-right-lines"),
        gutterLeftActions: document.getElementById("gutter-left-actions"),
        gutterRightActions: document.getElementById("gutter-right-actions"),
        codeLeftLines: document.getElementById("code-left-lines"),
        codeRightLines: document.getElementById("code-right-lines"),
        diffMapWrapper: document.getElementById("diff-map-wrapper"),
        diffMapCanvas: document.getElementById("diff-map-canvas"),
        diffMapViewport: document.getElementById("diff-map-viewport"),
        textStatusInfo: document.getElementById("text-status-info"),
        textStatDeleted: document.getElementById("text-stat-deleted"),
        textStatInserted: document.getElementById("text-stat-inserted"),
        textStatModified: document.getElementById("text-stat-modified"),
        textCursorPos: document.getElementById("text-cursor-pos"),

        // Table Compare Controls
        tableFilterSelect: document.getElementById("table-filter-select"),
        tableActionCopyLeft: document.getElementById("table-action-copy-left"),
        tableActionCopyRight: document.getElementById("table-action-copy-right"),
        tableKeySelect: document.getElementById("table-key-select"),
        tableActionSwap: document.getElementById("table-action-swap"),
        tableActionRules: document.getElementById("table-action-rules"),
        tableActionExport: document.getElementById("table-action-export"),
        tableActionClear: document.getElementById("table-action-clear"),
        tableLeftFilename: document.getElementById("table-left-filename"),
        tableRightFilename: document.getElementById("table-right-filename"),
        tableLeftInput: document.getElementById("table-left-input"),
        tableRightInput: document.getElementById("table-right-input"),
        tableLeftPaste: document.getElementById("table-left-paste"),
        tableRightPaste: document.getElementById("table-right-paste"),
        tableBtnComparePaste: document.getElementById("table-btn-compare-paste"),
        tableEmptyOverlay: document.getElementById("table-empty-overlay"),
        gridLeftTable: document.getElementById("grid-left-table"),
        gridRightTable: document.getElementById("grid-right-table"),
        tableScrollLeft: document.getElementById("table-scroll-left"),
        tableScrollRight: document.getElementById("table-scroll-right"),
        tableStatusInfo: document.getElementById("table-status-info"),
        tableStatDeleted: document.getElementById("table-stat-deleted"),
        tableStatInserted: document.getElementById("table-stat-inserted"),
        tableStatModified: document.getElementById("table-stat-modified"),
        tableCursorPos: document.getElementById("table-cursor-pos"),

        // Rules Modal
        rulesModal: document.getElementById("rules-modal"),
        rulesModalClose: document.getElementById("rules-modal-close"),
        ruleWhitespace: document.getElementById("rule-whitespace"),
        ruleCase: document.getElementById("rule-case"),
        rulesBtnCancel: document.getElementById("rules-btn-cancel"),
        rulesBtnApply: document.getElementById("rules-btn-apply"),

        // Table Rules Modal
        tableRulesModal: document.getElementById("table-rules-modal"),
        tableRulesModalClose: document.getElementById("table-rules-modal-close"),
        tableRulesBtnCancel: document.getElementById("table-rules-btn-cancel"),
        tableRulesBtnApply: document.getElementById("table-rules-btn-apply"),
        tableRulesTbody: document.getElementById("table-rules-tbody")
    };

    // -------------------------------------------------------------
    // INITIALIZATION & THEME CONTROL
    // -------------------------------------------------------------
    function setAppTheme(theme) {
        currentTheme = theme;
        elements.html.setAttribute("data-theme", theme);
        localStorage.setItem("bc-theme", theme);
        
        if (theme === "dark") {
            elements.themeDarkBtn.classList.add("active");
            elements.themeLightBtn.classList.remove("active");
        } else {
            elements.themeDarkBtn.classList.remove("active");
            elements.themeLightBtn.classList.add("active");
        }
        // Redraw canvas if text comparison is active
        if (leftTextLines.length > 0 || rightTextLines.length > 0) {
            drawDiffMap();
        }
    }
    setAppTheme(currentTheme);

    elements.themeToggle.addEventListener("click", () => {
        setAppTheme(currentTheme === "dark" ? "light" : "dark");
    });

    // -------------------------------------------------------------
    // NAVIGATION ROUTING
    // -------------------------------------------------------------
    function switchView(viewName) {
        activeView = viewName;
        
        const navFolder = document.getElementById("nav-folder");
        const viewFolder = document.getElementById("view-folder");

        // Update navigation classes
        elements.navHome.classList.remove("active");
        elements.navText.classList.remove("active");
        elements.navTable.classList.remove("active");
        if (navFolder) navFolder.classList.remove("active");
        
        elements.viewHome.classList.remove("active");
        elements.viewText.classList.remove("active");
        elements.viewTable.classList.remove("active");
        if (viewFolder) viewFolder.classList.remove("active");

        if (viewName === "home") {
            elements.navHome.classList.add("active");
            elements.viewHome.classList.add("active");
            if (typeof loadSavedSessionsList === "function") {
                loadSavedSessionsList();
            }
        } else if (viewName === "text") {
            elements.navText.classList.add("active");
            elements.viewText.classList.add("active");
            triggerTextResize();
        } else if (viewName === "table") {
            elements.navTable.classList.add("active");
            elements.viewTable.classList.add("active");
        } else if (viewName === "folder") {
            if (navFolder) navFolder.classList.add("active");
            if (viewFolder) viewFolder.classList.add("active");
        }
    }

    elements.navHome.addEventListener("click", () => switchView("home"));
    elements.navText.addEventListener("click", () => switchView("text"));
    elements.navTable.addEventListener("click", () => switchView("table"));
    elements.cardNewText.addEventListener("click", () => switchView("text"));
    elements.cardNewTable.addEventListener("click", () => switchView("table"));

    const navFolder = document.getElementById("nav-folder");
    const cardNewFolder = document.getElementById("card-new-folder");
    if (navFolder) navFolder.addEventListener("click", () => switchView("folder"));
    if (cardNewFolder) cardNewFolder.addEventListener("click", () => switchView("folder"));

    // -------------------------------------------------------------
    // TEXT COMPARE ENGINE DRIVER
    // -------------------------------------------------------------

    // Synchronized scroll lock for text view
    let isSyncingTextScroll = false;

    function syncTextScroll(source, target) {
        if (isSyncingTextScroll) return;
        isSyncingTextScroll = true;
        target.scrollTop = source.scrollTop;
        target.scrollLeft = source.scrollLeft;
        updateViewportIndicator(source);
        isSyncingTextScroll = false;
    }

    elements.scrollLeft.addEventListener("scroll", () => {
        syncTextScroll(elements.scrollLeft, elements.scrollRight);
    });

    elements.scrollRight.addEventListener("scroll", () => {
        syncTextScroll(elements.scrollRight, elements.scrollLeft);
    });

    function compareTextSession() {
        if (leftTextLines.length === 0 && rightTextLines.length === 0) {
            elements.textEmptyOverlay.classList.remove("hidden");
            return;
        }
        elements.textEmptyOverlay.classList.add("hidden");

        // Run Diff engine
        textEdits = window.DiffEngine.compareLines(
            leftTextLines,
            rightTextLines,
            ignoreWhitespace,
            caseInsensitive
        );

        renderTextCompare();
        drawDiffMap();
        updateTextStats();
    }

    // Convert text string into lines array
    function textToLines(text) {
        return text.split(/\r?\n/);
    }

    function renderTextCompare() {
        let leftHTML = "";
        let rightHTML = "";
        let gutterLeftHTML = "";
        let gutterRightHTML = "";
        let actionsLeftHTML = "";
        let actionsRightHTML = "";

        let leftLineNum = 1;
        let rightLineNum = 1;

        let diffBlockStartIdx = null;

        // Group edit index mapping for merging actions
        let blockIndex = 0;

        for (let i = 0; i < textEdits.length; i++) {
            const edit = textEdits[i];
            
            // Beyond Compare style filters
            const isDiff = edit.type !== 'equal';
            if (textFilterMode === 'diff' && !isDiff) continue;
            if (textFilterMode === 'same' && isDiff) continue;

            if (edit.type === 'equal') {
                const lineContent = window.DiffEngine.highlightCode(leftTextLines[edit.left], textLeftFilename);
                leftHTML += `<div class="code-line" data-line-left="${edit.left}">${lineContent}</div>`;
                rightHTML += `<div class="code-line" data-line-right="${edit.right}">${lineContent}</div>`;
                gutterLeftHTML += `<div class="gutter-line">${leftLineNum}</div>`;
                gutterRightHTML += `<div class="gutter-line">${rightLineNum}</div>`;
                
                actionsLeftHTML += `<div class="action-line"></div>`;
                actionsRightHTML += `<div class="action-line"></div>`;
                
                leftLineNum++;
                rightLineNum++;
            } 
            else if (edit.type === 'delete') {
                const lineContent = window.DiffEngine.highlightCode(leftTextLines[edit.left], textLeftFilename);
                leftHTML += `<div class="code-line diff-deleted" data-line-left="${edit.left}">${lineContent}</div>`;
                rightHTML += `<div class="code-line line-spacer"></div>`;
                
                gutterLeftHTML += `<div class="gutter-line diff-deleted">${leftLineNum}</div>`;
                gutterRightHTML += `<div class="gutter-line line-spacer"></div>`;
                
                // Copy block to right button
                actionsLeftHTML += `<div class="action-line" onclick="copyBlockToRight(${edit.left}, null)" title="Copy line to right">→</div>`;
                actionsRightHTML += `<div class="action-line"></div>`;
                
                leftLineNum++;
            } 
            else if (edit.type === 'insert') {
                const lineContent = window.DiffEngine.highlightCode(rightTextLines[edit.right], textRightFilename);
                leftHTML += `<div class="code-line line-spacer"></div>`;
                rightHTML += `<div class="code-line diff-inserted" data-line-right="${edit.right}">${lineContent}</div>`;
                
                gutterLeftHTML += `<div class="gutter-line line-spacer"></div>`;
                gutterRightHTML += `<div class="gutter-line diff-inserted">${rightLineNum}</div>`;
                
                actionsLeftHTML += `<div class="action-line"></div>`;
                // Copy block to left button
                actionsRightHTML += `<div class="action-line" onclick="copyBlockToLeft(null, ${edit.right})" title="Copy line to left">←</div>`;
                
                rightLineNum++;
            } 
            else if (edit.type === 'modified') {
                // Modified pairing! Run intra-line character changes
                const leftStr = leftTextLines[edit.left];
                const rightStr = rightTextLines[edit.right];
                const charDiff = window.DiffEngine.compareCharacters(leftStr, rightStr);

                leftHTML += `<div class="code-line diff-modified" data-line-left="${edit.left}">${charDiff.leftHtml}</div>`;
                rightHTML += `<div class="code-line diff-modified" data-line-right="${edit.right}">${charDiff.rightHtml}</div>`;
                
                gutterLeftHTML += `<div class="gutter-line diff-modified">${leftLineNum}</div>`;
                gutterRightHTML += `<div class="gutter-line diff-modified">${rightLineNum}</div>`;
                
                actionsLeftHTML += `<div class="action-line" onclick="copyBlockToRight(${edit.left}, ${edit.right})" title="Merge line to right">→</div>`;
                actionsRightHTML += `<div class="action-line" onclick="copyBlockToLeft(${edit.left}, ${edit.right})" title="Merge line to left">←</div>`;
                
                leftLineNum++;
                rightLineNum++;
            }
        }

        elements.codeLeftLines.innerHTML = leftHTML;
        elements.codeRightLines.innerHTML = rightHTML;
        elements.gutterLeftLines.innerHTML = gutterLeftHTML;
        elements.gutterRightLines.innerHTML = gutterRightHTML;
        elements.gutterLeftActions.innerHTML = actionsLeftHTML;
        elements.gutterRightActions.innerHTML = actionsRightHTML;

        // Synchronize scroll bars and update gutter heights
        elements.scrollRight.scrollTop = elements.scrollLeft.scrollTop;
    }

    // -------------------------------------------------------------
    // MERGING & ACTION UTILITIES
    // -------------------------------------------------------------
    window.copyBlockToRight = function(leftIdx, rightIdx) {
        if (leftIdx !== null) {
            const lineContent = leftTextLines[leftIdx];
            if (rightIdx !== null) {
                // Overwrite right line with left line
                rightTextLines[rightIdx] = lineContent;
            } else {
                // Left was deleted, insert it back on the right side at corresponding index!
                // To estimate where to insert, find matching anchor in rightTextLines
                // For simplicity, find the closest mapped element or insert in matching visual line
                const rightInsertIndex = findInsertionIndexRight(leftIdx);
                rightTextLines.splice(rightInsertIndex, 0, lineContent);
            }
            compareTextSession();
        }
    };

    window.copyBlockToLeft = function(leftIdx, rightIdx) {
        if (rightIdx !== null) {
            const lineContent = rightTextLines[rightIdx];
            if (leftIdx !== null) {
                // Overwrite left line with right
                leftTextLines[leftIdx] = lineContent;
            } else {
                // Insert it back on the left side
                const leftInsertIndex = findInsertionIndexLeft(rightIdx);
                leftTextLines.splice(leftInsertIndex, 0, lineContent);
            }
            compareTextSession();
        }
    };

    function findInsertionIndexRight(leftIdx) {
        // Look backwards from leftIdx to find a line that is paired with a right index
        for (let i = leftIdx - 1; i >= 0; i--) {
            const match = textEdits.find(e => e.left === i && (e.type === 'equal' || e.type === 'modified'));
            if (match) return match.right + 1;
        }
        return 0;
    }

    function findInsertionIndexLeft(rightIdx) {
        for (let i = rightIdx - 1; i >= 0; i--) {
            const match = textEdits.find(e => e.right === i && (e.type === 'equal' || e.type === 'modified'));
            if (match) return match.left + 1;
        }
        return 0;
    }

    // -------------------------------------------------------------
    // DYNAMIC DIFF MAP CANVAS & VIEWPORT
    // -------------------------------------------------------------
    function drawDiffMap() {
        const canvas = elements.diffMapCanvas;
        const ctx = canvas.getContext("2d");
        
        // Reset sizes based on layout height
        canvas.width = elements.diffMapWrapper.clientWidth;
        canvas.height = elements.diffMapWrapper.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (textEdits.length === 0) return;

        const numEdits = textEdits.length;
        const linePixelHeight = Math.max(1, canvas.height / numEdits);

        // Fetch styling variables from theme
        const getStyle = (prop) => getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
        
        const colorDel = getStyle('--diff-del-border') || "#ff7b72";
        const colorIns = getStyle('--diff-ins-border') || "#58a6ff";
        const colorMod = getStyle('--diff-mod-border') || "#e3b341";

        textEdits.forEach((edit, idx) => {
            const y = (idx / numEdits) * canvas.height;
            if (edit.type === 'delete') {
                ctx.fillStyle = colorDel;
                ctx.fillRect(0, y, canvas.width, linePixelHeight + 1);
            } else if (edit.type === 'insert') {
                ctx.fillStyle = colorIns;
                ctx.fillRect(0, y, canvas.width, linePixelHeight + 1);
            } else if (edit.type === 'modified') {
                ctx.fillStyle = colorMod;
                ctx.fillRect(0, y, canvas.width, linePixelHeight + 1);
            }
        });

        updateViewportIndicator(elements.scrollLeft);
    }

    function updateViewportIndicator(scroller) {
        if (textEdits.length === 0) return;
        const totalHeight = scroller.scrollHeight;
        const visibleHeight = scroller.clientHeight;
        const scrollTop = scroller.scrollTop;

        const wrapperHeight = elements.diffMapWrapper.clientHeight;
        const viewportTop = (scrollTop / totalHeight) * wrapperHeight;
        const viewportHeight = Math.max(8, (visibleHeight / totalHeight) * wrapperHeight);

        elements.diffMapViewport.style.top = `${viewportTop}px`;
        elements.diffMapViewport.style.height = `${viewportHeight}px`;
    }

    // Scroll view when difference map is clicked
    elements.diffMapWrapper.addEventListener("click", (e) => {
        if (textEdits.length === 0) return;
        const rect = elements.diffMapWrapper.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const percentage = clickY / rect.height;

        const scroller = elements.scrollLeft;
        const targetScrollTop = percentage * scroller.scrollHeight - (scroller.clientHeight / 2);
        
        scroller.scrollTop = Math.max(0, targetScrollTop);
    });

    // Handle window resizing
    function triggerTextResize() {
        if (activeView === "text" && leftTextLines.length > 0) {
            setTimeout(() => {
                drawDiffMap();
            }, 100);
        }
    }
    window.addEventListener("resize", triggerTextResize);

    // -------------------------------------------------------------
    // TEXT EDITING & DEBOUNCE RECOMPARE
    // -------------------------------------------------------------
    // Beyond Compare lets you modify lines dynamically.
    // When focus leaves the editors, sync the content and re-calculate diff.
    elements.codeLeftLines.addEventListener("blur", () => {
        syncTextLinesFromDOM();
    });

    elements.codeRightLines.addEventListener("blur", () => {
        syncTextLinesFromDOM();
    });

    function syncTextLinesFromDOM() {
        // Collect left lines
        const leftNodes = Array.from(elements.codeLeftLines.children);
        const newLeftLines = [];
        
        // Collect right lines
        const rightNodes = Array.from(elements.codeRightLines.children);
        const newRightLines = [];

        // If filtering is on, editing direct DOM could distort sequences.
        // Alert user or suggest editing in "Show All" mode for safety.
        if (textFilterMode !== "all") {
            // Safe fallback: sync only when Show All is active.
            // Otherwise, simple parse could mix lines. Let's still try.
        }

        leftNodes.forEach(node => {
            if (!node.classList.contains("line-spacer")) {
                newLeftLines.push(node.textContent || "");
            }
        });

        rightNodes.forEach(node => {
            if (!node.classList.contains("line-spacer")) {
                newRightLines.push(node.textContent || "");
            }
        });

        // Only update if lines changed
        if (JSON.stringify(leftTextLines) !== JSON.stringify(newLeftLines) ||
            JSON.stringify(rightTextLines) !== JSON.stringify(newRightLines)) {
            leftTextLines = newLeftLines;
            rightTextLines = newRightLines;
            compareTextSession();
        }
    }

    // -------------------------------------------------------------
    // TEXT DIFF TRAVERSAL (NEXT / PREV)
    // -------------------------------------------------------------
    let currentDiffIndex = -1;

    function getDifferenceLines() {
        // Find indices of edits that are differences
        const diffIndices = [];
        textEdits.forEach((edit, idx) => {
            if (edit.type !== 'equal') {
                diffIndices.push(idx);
            }
        });
        return diffIndices;
    }

    function navigateDiff(direction) {
        const diffIndices = getDifferenceLines();
        if (diffIndices.length === 0) return;

        // Estimate current middle line in view
        const scroller = elements.scrollLeft;
        const currentLineInView = Math.floor(scroller.scrollTop / LINE_HEIGHT);

        // Find matching edit index corresponding to visual lines
        let currentEditIdxInView = 0;
        let visualLineCounter = 0;

        for (let i = 0; i < textEdits.length; i++) {
            const edit = textEdits[i];
            const isDiff = edit.type !== 'equal';
            if (textFilterMode === 'diff' && !isDiff) continue;
            if (textFilterMode === 'same' && isDiff) continue;

            if (visualLineCounter >= currentLineInView) {
                currentEditIdxInView = i;
                break;
            }
            visualLineCounter++;
        }

        // Find matching target diff index
        let targetEditIdx = -1;

        if (direction === "next") {
            // Find next diff
            const nextDiff = diffIndices.find(idx => idx > currentEditIdxInView);
            if (nextDiff !== undefined) {
                targetEditIdx = nextDiff;
            } else {
                // Wrap around to first
                targetEditIdx = diffIndices[0];
            }
        } else {
            // Find previous diff
            const prevDiffs = diffIndices.filter(idx => idx < currentEditIdxInView);
            if (prevDiffs.length > 0) {
                targetEditIdx = prevDiffs[prevDiffs.length - 1];
            } else {
                // Wrap around to last
                targetEditIdx = diffIndices[diffIndices.length - 1];
            }
        }

        if (targetEditIdx !== -1) {
            // Calculate corresponding target scroll top
            let visualLineOffset = 0;
            for (let i = 0; i < targetEditIdx; i++) {
                const edit = textEdits[i];
                const isDiff = edit.type !== 'equal';
                if (textFilterMode === 'diff' && !isDiff) continue;
                if (textFilterMode === 'same' && isDiff) continue;
                visualLineOffset++;
            }

            // Scroll so the diff is placed neatly near the upper half of screen
            const targetScrollTop = visualLineOffset * LINE_HEIGHT - 60;
            elements.scrollLeft.scrollTop = Math.max(0, targetScrollTop);
            
            // Highlight gutter temporarily to alert user (micro-animation)
            const leftGutterChild = elements.gutterLeftLines.children[visualLineOffset];
            const rightGutterChild = elements.gutterRightLines.children[visualLineOffset];
            
            if (leftGutterChild) {
                leftGutterChild.style.fontWeight = "bold";
                leftGutterChild.style.borderLeft = "3px solid var(--accent-color)";
                setTimeout(() => {
                    leftGutterChild.style.fontWeight = "";
                    leftGutterChild.style.borderLeft = "";
                }, 1000);
            }
        }
    }

    elements.textNavNext.addEventListener("click", () => navigateDiff("next"));
    elements.textNavPrev.addEventListener("click", () => navigateDiff("prev"));

    // Keyboard navigation (Ctrl + Up/Down)
    document.addEventListener("keydown", (e) => {
        if (activeView === "text") {
            if (e.ctrlKey && e.key === "ArrowDown") {
                e.preventDefault();
                navigateDiff("next");
            } else if (e.ctrlKey && e.key === "ArrowUp") {
                e.preventDefault();
                navigateDiff("prev");
            }
        }
    });

    // -------------------------------------------------------------
    // TEXT STATS & TOOLBAR HANDLING
    // -------------------------------------------------------------
    function updateTextStats() {
        let deleted = 0;
        let inserted = 0;
        let modified = 0;

        textEdits.forEach(edit => {
            if (edit.type === 'delete') deleted++;
            else if (edit.type === 'insert') inserted++;
            else if (edit.type === 'modified') modified++;
        });

        elements.textStatDeleted.textContent = `${deleted} deleted`;
        elements.textStatInserted.textContent = `${inserted} inserted`;
        elements.textStatModified.textContent = `${modified} modified`;
        
        elements.textStatusInfo.textContent = `Lines compared: ${textEdits.length} | Differences: ${deleted + inserted + modified}`;
    }

    // Set filter mode
    function setTextFilter(mode) {
        textFilterMode = mode;
        elements.textFilterAll.classList.remove("active");
        elements.textFilterDiff.classList.remove("active");
        elements.textFilterSame.classList.remove("active");

        if (mode === "all") elements.textFilterAll.classList.add("active");
        else if (mode === "diff") elements.textFilterDiff.classList.add("active");
        else if (mode === "same") elements.textFilterSame.classList.add("active");

        compareTextSession();
    }

    elements.textFilterAll.addEventListener("click", () => setTextFilter("all"));
    elements.textFilterDiff.addEventListener("click", () => setTextFilter("diff"));
    elements.textFilterSame.addEventListener("click", () => setTextFilter("same"));

    // Clear session
    elements.textActionClear.addEventListener("click", () => {
        leftTextLines = [];
        rightTextLines = [];
        textEdits = [];
        elements.textLeftFilename.textContent = "left_file.txt";
        elements.textRightFilename.textContent = "right_file.txt";
        elements.textLeftPaste.value = "";
        elements.textRightPaste.value = "";
        elements.codeLeftLines.innerHTML = "";
        elements.codeRightLines.innerHTML = "";
        elements.gutterLeftLines.innerHTML = "";
        elements.gutterRightLines.innerHTML = "";
        elements.textStatusInfo.textContent = "No files loaded";
        compareTextSession();
    });

    // Swap panes
    elements.textActionSwap.addEventListener("click", () => {
        const tempLines = [...leftTextLines];
        leftTextLines = [...rightTextLines];
        rightTextLines = tempLines;

        const tempName = textLeftFilename;
        textLeftFilename = textRightFilename;
        textRightFilename = tempName;

        elements.textLeftFilename.textContent = textLeftFilename;
        elements.textRightFilename.textContent = textRightFilename;

        compareTextSession();
    });

    // Save edited file (downloads text)
    elements.textActionSave.addEventListener("click", () => {
        if (leftTextLines.length === 0) return;
        const blob = new Blob([leftTextLines.join("\n")], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bc_edited_${textLeftFilename}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Rules Modal Opening
    elements.textActionRules.addEventListener("click", () => {
        elements.ruleWhitespace.checked = ignoreWhitespace;
        elements.ruleCase.checked = caseInsensitive;
        elements.rulesModal.classList.add("active");
    });

    elements.rulesModalClose.addEventListener("click", () => {
        elements.rulesModal.classList.remove("active");
    });
    elements.rulesBtnCancel.addEventListener("click", () => {
        elements.rulesModal.classList.remove("active");
    });

    elements.rulesBtnApply.addEventListener("click", () => {
        ignoreWhitespace = elements.ruleWhitespace.checked;
        caseInsensitive = elements.ruleCase.checked;
        elements.rulesModal.classList.remove("active");
        compareTextSession();
    });

    function autoDetectType(colName) {
        const name = String(colName || "").toLowerCase().trim();
        if (name.includes('date') || name.includes('time') || name.includes('cov start') || name.includes('cov end')) {
            return 'date';
        }
        if (name.includes('rate') || name.includes('amount') || name.includes('opeb') || name.includes('price') || name.includes('quantity') || name.includes('salary') || name.includes('number')) {
            return 'numeric';
        }
        return 'text';
    }

    // Table Column Rules Modal Event Listeners
    elements.tableActionRules.addEventListener("click", () => {
        const tbody = elements.tableRulesTbody;
        tbody.innerHTML = "";

        const allUniqueCols = Array.from(new Set([...leftTableCols, ...rightTableCols]));
        if (allUniqueCols.length === 0) {
            alert("Please load spreadsheets before configuring column rules.");
            return;
        }

        allUniqueCols.forEach(colName => {
            const setting = tableColumnSettings[colName] || 'standard';
            let colClass = 'standard';
            let colType = 'text';

            if (typeof setting === 'string') {
                colClass = setting;
                colType = autoDetectType(colName);
            } else if (setting) {
                colClass = setting.class || 'standard';
                colType = setting.type || 'text';
            }

            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid var(--border-color)";

            tr.innerHTML = `
                <td style="padding: 10px 4px; font-weight: 500; text-align: left;">${colName}</td>
                <td style="padding: 10px 4px; text-align: center;">
                    <input type="radio" name="rule-class-${colName}" value="key" ${colClass === 'key' ? 'checked' : ''}>
                </td>
                <td style="padding: 10px 4px; text-align: center;">
                    <input type="radio" name="rule-class-${colName}" value="standard" ${colClass === 'standard' ? 'checked' : ''}>
                </td>
                <td style="padding: 10px 4px; text-align: center;">
                    <input type="radio" name="rule-class-${colName}" value="unimportant" ${colClass === 'unimportant' ? 'checked' : ''}>
                </td>
                <td style="padding: 10px 4px; text-align: center;">
                    <input type="radio" name="rule-class-${colName}" value="ignored" ${colClass === 'ignored' ? 'checked' : ''}>
                </td>
                <td style="padding: 10px 4px; text-align: center;">
                    <select name="rule-type-${colName}" style="padding: 3px 6px; font-size: 0.8rem; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main);">
                        <option value="text" ${colType === 'text' ? 'selected' : ''}>🔤 Text</option>
                        <option value="numeric" ${colType === 'numeric' ? 'selected' : ''}>🔢 Numeric</option>
                        <option value="date" ${colType === 'date' ? 'selected' : ''}>📅 Date</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });

        elements.tableRulesModal.classList.add("active");
    });

    elements.tableRulesModalClose.addEventListener("click", () => {
        elements.tableRulesModal.classList.remove("active");
    });
    elements.tableRulesBtnCancel.addEventListener("click", () => {
        elements.tableRulesModal.classList.remove("active");
    });

    elements.tableRulesBtnApply.addEventListener("click", () => {
        const allUniqueCols = Array.from(new Set([...leftTableCols, ...rightTableCols]));
        
        allUniqueCols.forEach(colName => {
            const radios = document.getElementsByName(`rule-class-${colName}`);
            let colClass = 'standard';
            for (const radio of radios) {
                if (radio.checked) {
                    colClass = radio.value;
                    break;
                }
            }
            const typeSelect = document.getElementsByName(`rule-type-${colName}`)[0];
            const colType = typeSelect ? typeSelect.value : 'text';

            tableColumnSettings[colName] = {
                class: colClass,
                type: colType
            };
        });

        elements.tableRulesModal.classList.remove("active");
        
        // Synchronize selected key column and key selection dropdown
        populateKeyDropdown();
        
        // Re-run comparison
        compareTableSession();
    });

    // -------------------------------------------------------------
    // FILE INGESTION (PICK & DRAG-DROP) - TEXT
    // -------------------------------------------------------------
    elements.textLeftInput.addEventListener("change", (e) => {
        handleTextFile(e.target.files[0], "left");
    });

    elements.textRightInput.addEventListener("change", (e) => {
        handleTextFile(e.target.files[0], "right");
    });

    function handleTextFile(file, side) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = textToLines(e.target.result);
            if (side === "left") {
                leftTextLines = lines;
                textLeftFilename = file.name;
                elements.textLeftFilename.textContent = file.name;
            } else {
                rightTextLines = lines;
                textRightFilename = file.name;
                elements.textRightFilename.textContent = file.name;
            }
            compareTextSession();
        };
        reader.readAsText(file);
    }

    // Direct Compare past text
    elements.textBtnComparePaste.addEventListener("click", () => {
        leftTextLines = textToLines(elements.textLeftPaste.value);
        rightTextLines = textToLines(elements.textRightPaste.value);
        textLeftFilename = "PastedLeft.txt";
        textRightFilename = "PastedRight.txt";
        elements.textLeftFilename.textContent = textLeftFilename;
        elements.textRightFilename.textContent = textRightFilename;
        compareTextSession();
    });


    // -------------------------------------------------------------
    // TABLE COMPARE ENGINE DRIVER
    // -------------------------------------------------------------
    let isSyncingTableScroll = false;

    elements.tableScrollLeft.addEventListener("scroll", () => {
        if (isSyncingTableScroll) return;
        isSyncingTableScroll = true;
        elements.tableScrollRight.scrollTop = elements.tableScrollLeft.scrollTop;
        elements.tableScrollRight.scrollLeft = elements.tableScrollLeft.scrollLeft;
        isSyncingTableScroll = false;
    });

    elements.tableScrollRight.addEventListener("scroll", () => {
        if (isSyncingTableScroll) return;
        isSyncingTableScroll = true;
        elements.tableScrollLeft.scrollTop = elements.tableScrollRight.scrollTop;
        elements.tableScrollLeft.scrollLeft = elements.tableScrollRight.scrollLeft;
        isSyncingTableScroll = false;
    });

    // Simple helper to detect column delimiter in uploaded files
    function detectDelimiter(text) {
        const firstLine = text.split(/\r?\n/)[0] || "";
        const commaCount = (firstLine.match(/,/g) || []).length;
        const tabCount = (firstLine.match(/\t/g) || []).length;
        const semiCount = (firstLine.match(/;/g) || []).length;
        const pipeCount = (firstLine.match(/\|/g) || []).length;
        
        if (tabCount > commaCount && tabCount > semiCount && tabCount > pipeCount) return "\t";
        if (semiCount > commaCount && semiCount > tabCount && semiCount > pipeCount) return ";";
        if (pipeCount > commaCount && pipeCount > tabCount && pipeCount > semiCount) return "|";
        return ","; // Default
    }

    // Robust CSV/TSV/DSV string parser with delimiter parameter
    function parseCSVData(csvText, delimChar = ',') {
        const lines = csvText.split(/\r?\n/);
        const rows = [];
        let headers = [];

        lines.forEach((line, idx) => {
            if (!line.trim()) return;
            
            const row = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === delimChar && !inQuotes) {
                    row.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            row.push(current.trim());
            
            if (idx === 0) {
                headers = row;
            } else {
                rows.push(row);
            }
        });

        return { headers, rows };
    }

    function compareTableSession() {
        if (leftTableData.length === 0 && rightTableData.length === 0) {
            elements.tableEmptyOverlay.classList.remove("hidden");
            return;
        }
        elements.tableEmptyOverlay.classList.add("hidden");

        // Align and compare rows using column settings mapping
        alignedTableRows = window.DiffEngine.compareTables(
            leftTableData,
            rightTableData,
            tableColumnSettings,
            leftTableCols,
            rightTableCols
        );

        renderTableCompare();
        updateTableStats();
    }

    function populateKeyDropdown() {
        elements.tableKeySelect.innerHTML = '<option value="">(None - Compare Sequentially)</option>';
        
        // Find intersection of column headers to prevent mismatching key selections
        const commonCols = leftTableCols.filter(col => rightTableCols.includes(col));
        
        commonCols.forEach(col => {
            const opt = document.createElement("option");
            opt.value = col;
            opt.textContent = `🔑 ${col}`;
            
            // Determine if this column is marked as a key in settings
            const setting = tableColumnSettings[col];
            const isKey = (typeof setting === 'string' && setting === 'key') || (setting && setting.class === 'key');
            if (isKey) {
                opt.selected = true;
                selectedKeyColumn = col;
            }
            elements.tableKeySelect.appendChild(opt);
        });
    }

    // Set key dropdown listener
    elements.tableKeySelect.addEventListener("change", (e) => {
        const newKey = e.target.value;
        
        // Update setting mappings for all unique cols
        const allUniqueCols = Array.from(new Set([...leftTableCols, ...rightTableCols]));
        allUniqueCols.forEach(col => {
            const setting = tableColumnSettings[col];
            let currentType = 'text';
            if (setting && typeof setting !== 'string') {
                currentType = setting.type || 'text';
            } else {
                currentType = autoDetectType(col);
            }

            if (col === newKey) {
                tableColumnSettings[col] = { class: 'key', type: currentType };
            } else {
                const currentClass = (setting && typeof setting !== 'string') ? (setting.class === 'key' ? 'standard' : setting.class) : (setting === 'key' ? 'standard' : (setting || 'standard'));
                tableColumnSettings[col] = { class: currentClass, type: currentType };
            }
        });

        selectedKeyColumn = newKey;
        compareTableSession();
    });

    // Dynamically delete columns from the comparison workspace
    window.removeTableColumn = function(colName) {
        const leftIdx = leftTableCols.indexOf(colName);
        if (leftIdx !== -1) {
            leftTableCols.splice(leftIdx, 1);
            leftTableData.forEach(row => {
                row.splice(leftIdx, 1);
            });
        }
        
        const rightIdx = rightTableCols.indexOf(colName);
        if (rightIdx !== -1) {
            rightTableCols.splice(rightIdx, 1);
            rightTableData.forEach(row => {
                row.splice(rightIdx, 1);
            });
        }
        
        if (tableColumnSettings[colName]) {
            delete tableColumnSettings[colName];
        }
        
        if (selectedKeyColumn === colName) {
            selectedKeyColumn = "";
            elements.tableKeySelect.value = "";
        }
        
        populateKeyDropdown();
        compareTableSession();
    };

    function renderTableCompare() {
        // Headers Building
        let leftHeaderHTML = `<tr><th class="table-row-num">#</th>`;
        leftTableCols.forEach(col => {
            const setting = tableColumnSettings[col];
            const colClass = (setting && typeof setting !== 'string') ? (setting.class || 'standard') : (setting || 'standard');
            let headerClass = '';
            if (colClass === 'key') headerClass = 'key-column';
            else if (colClass === 'unimportant') headerClass = 'unimportant-column';
            else if (colClass === 'ignored') headerClass = 'ignored-column';
            
            leftHeaderHTML += `<th class="${headerClass}">
                <span class="col-header-text">${col}</span>
                <span class="delete-col-btn" title="Remove column from comparison" onclick="event.stopPropagation(); window.removeTableColumn('${col}')">×</span>
            </th>`;
        });
        leftHeaderHTML += "</tr>";

        let rightHeaderHTML = `<tr><th class="table-row-num">#</th>`;
        rightTableCols.forEach(col => {
            const setting = tableColumnSettings[col];
            const colClass = (setting && typeof setting !== 'string') ? (setting.class || 'standard') : (setting || 'standard');
            let headerClass = '';
            if (colClass === 'key') headerClass = 'key-column';
            else if (colClass === 'unimportant') headerClass = 'unimportant-column';
            else if (colClass === 'ignored') headerClass = 'ignored-column';
            
            rightHeaderHTML += `<th class="${headerClass}">
                <span class="col-header-text">${col}</span>
                <span class="delete-col-btn" title="Remove column from comparison" onclick="event.stopPropagation(); window.removeTableColumn('${col}')">×</span>
            </th>`;
        });
        rightHeaderHTML += "</tr>";

        let leftRowsHTML = leftHeaderHTML;
        let rightRowsHTML = rightHeaderHTML;

        alignedTableRows.forEach((alignedRow) => {
            // Apply filtering logic
            const isDiff = alignedRow.type !== 'equal';
            if (tableFilterMode === 'diff' && !isDiff) return;
            if (tableFilterMode === 'same' && isDiff) return;
            if (tableFilterMode === 'missing-left' && alignedRow.type !== 'insert') return;
            if (tableFilterMode === 'missing-right' && alignedRow.type !== 'delete') return;

            if (alignedRow.type === 'equal' || alignedRow.type === 'modified' || alignedRow.type === 'unimportant-modified') {
                const lIdx = alignedRow.leftIndex;
                const rIdx = alignedRow.rightIndex;
                const leftRow = alignedRow.leftRow;
                const rightRow = alignedRow.rightRow;

                let rowClass = 'grid-row';
                if (alignedRow.type === 'modified') {
                    rowClass += ' diff-modified';
                } else if (alignedRow.type === 'unimportant-modified') {
                    rowClass += ' diff-unimportant-modified';
                }

                // Left row HTML
                leftRowsHTML += `<tr class="${rowClass}">`;
                leftRowsHTML += `<td class="table-row-num">${lIdx + 1}</td>`;
                leftTableCols.forEach((col, cIdx) => {
                    const setting = tableColumnSettings[col];
                    const colClass = (setting && typeof setting !== 'string') ? (setting.class || 'standard') : (setting || 'standard');
                    const colType = (setting && typeof setting !== 'string') ? (setting.type || 'text') : autoDetectType(col);
                    const isKey = colClass === 'key';
                    const isMismatch = alignedRow.standardMismatches.includes(col);
                    const isUnimportantMismatch = alignedRow.unimportantMismatches.includes(col);

                    let cellClass = '';
                    if (isKey) cellClass += 'grid-cell-key ';
                    if (isMismatch) cellClass += 'grid-cell-mismatch ';
                    else if (isUnimportantMismatch) cellClass += 'grid-cell-unimportant-mismatch ';

                    const cellVal = leftRow[cIdx];
                    const formatted = window.DiffEngine.formatCellValue(cellVal, colType);
                    leftRowsHTML += `<td class="${cellClass}">${window.DiffEngine.escapeHtml(formatted)}</td>`;
                });
                leftRowsHTML += "</tr>";

                // Right row HTML
                rightRowsHTML += `<tr class="${rowClass}">`;
                rightRowsHTML += `<td class="table-row-num">${rIdx + 1}</td>`;
                rightTableCols.forEach((col, cIdx) => {
                    const setting = tableColumnSettings[col];
                    const colClass = (setting && typeof setting !== 'string') ? (setting.class || 'standard') : (setting || 'standard');
                    const colType = (setting && typeof setting !== 'string') ? (setting.type || 'text') : autoDetectType(col);
                    const isKey = colClass === 'key';
                    const isMismatch = alignedRow.standardMismatches.includes(col);
                    const isUnimportantMismatch = alignedRow.unimportantMismatches.includes(col);

                    let cellClass = '';
                    if (isKey) cellClass += 'grid-cell-key ';
                    if (isMismatch) cellClass += 'grid-cell-mismatch ';
                    else if (isUnimportantMismatch) cellClass += 'grid-cell-unimportant-mismatch ';

                    const cellVal = rightRow[cIdx];
                    const formatted = window.DiffEngine.formatCellValue(cellVal, colType);
                    rightRowsHTML += `<td class="${cellClass}">${window.DiffEngine.escapeHtml(formatted)}</td>`;
                });
                rightRowsHTML += "</tr>";
            } 
            else if (alignedRow.type === 'delete') {
                // Row exists only in left
                leftRowsHTML += `<tr class="grid-row diff-deleted">`;
                leftRowsHTML += `<td class="table-row-num">${alignedRow.leftIndex + 1}</td>`;
                leftTableCols.forEach((col, cIdx) => {
                    const setting = tableColumnSettings[col];
                    const colClass = (setting && typeof setting !== 'string') ? (setting.class || 'standard') : (setting || 'standard');
                    const colType = (setting && typeof setting !== 'string') ? (setting.type || 'text') : autoDetectType(col);
                    const cellVal = alignedRow.leftRow[cIdx];
                    const formatted = window.DiffEngine.formatCellValue(cellVal, colType);
                    leftRowsHTML += `<td class="${colClass === 'key' ? 'grid-cell-key' : ''}">${window.DiffEngine.escapeHtml(formatted)}</td>`;
                });
                leftRowsHTML += "</tr>";

                // Empty row spacer on the right
                rightRowsHTML += `<tr class="grid-row-spacer">`;
                rightRowsHTML += `<td class="table-row-num"></td>`;
                rightTableCols.forEach(() => {
                    rightRowsHTML += `<td></td>`;
                });
                rightRowsHTML += "</tr>";
            } 
            else if (alignedRow.type === 'insert') {
                // Empty row spacer on left
                leftRowsHTML += `<tr class="grid-row-spacer">`;
                leftRowsHTML += `<td class="table-row-num"></td>`;
                leftTableCols.forEach(() => {
                    leftRowsHTML += `<td></td>`;
                });
                leftRowsHTML += "</tr>";

                // Row exists only in right
                rightRowsHTML += `<tr class="grid-row diff-inserted">`;
                rightRowsHTML += `<td class="table-row-num">${alignedRow.rightIndex + 1}</td>`;
                rightTableCols.forEach((col, cIdx) => {
                    const setting = tableColumnSettings[col];
                    const colClass = (setting && typeof setting !== 'string') ? (setting.class || 'standard') : (setting || 'standard');
                    const colType = (setting && typeof setting !== 'string') ? (setting.type || 'text') : autoDetectType(col);
                    const cellVal = alignedRow.rightRow[cIdx];
                    const formatted = window.DiffEngine.formatCellValue(cellVal, colType);
                    rightRowsHTML += `<td class="${colClass === 'key' ? 'grid-cell-key' : ''}">${window.DiffEngine.escapeHtml(formatted)}</td>`;
                });
                rightRowsHTML += "</tr>";
            }
        });

        elements.gridLeftTable.innerHTML = leftRowsHTML;
        elements.gridRightTable.innerHTML = rightRowsHTML;
    }

    function updateTableStats() {
        let deleted = 0;
        let inserted = 0;
        let modified = 0;
        let unimportant = 0;

        alignedTableRows.forEach(row => {
            if (row.type === 'delete') deleted++;
            else if (row.type === 'insert') inserted++;
            else if (row.type === 'modified') modified++;
            else if (row.type === 'unimportant-modified') unimportant++;
        });

        elements.tableStatDeleted.textContent = `${deleted} deleted`;
        elements.tableStatInserted.textContent = `${inserted} inserted`;
        elements.tableStatModified.textContent = `${modified} mismatching`;
        
        elements.tableStatusInfo.textContent = `Rows aligned: ${alignedTableRows.length} | Key selected: ${selectedKeyColumn || 'None'}`;

        // Populate Sheet Metrics summary panel
        const lblAlignedRows = document.getElementById("lbl-aligned-rows");
        const lblAlignedDiffs = document.getElementById("lbl-aligned-diffs");
        const lblAlignedUnimportant = document.getElementById("lbl-aligned-unimportant");
        const lblAlignedMissingLeft = document.getElementById("lbl-aligned-missing-left");
        const lblAlignedMissingRight = document.getElementById("lbl-aligned-missing-right");

        if (lblAlignedRows) lblAlignedRows.textContent = alignedTableRows.length;
        if (lblAlignedDiffs) lblAlignedDiffs.textContent = modified + deleted + inserted;
        if (lblAlignedUnimportant) lblAlignedUnimportant.textContent = unimportant;
        if (lblAlignedMissingLeft) lblAlignedMissingLeft.textContent = inserted;
        if (lblAlignedMissingRight) lblAlignedMissingRight.textContent = deleted;
    }

    // Set filter mode - Table
    function setTableFilter(mode) {
        tableFilterMode = mode;
        if (elements.tableFilterSelect) {
            elements.tableFilterSelect.value = mode;
        }
        compareTableSession();
    }

    if (elements.tableFilterSelect) {
        elements.tableFilterSelect.addEventListener("change", (e) => {
            setTableFilter(e.target.value);
        });
    }

    function copyTableToClipboard(side) {
        if (alignedTableRows.length === 0) {
            alert("No spreadsheet data loaded to copy.");
            return;
        }

        // Collect rows matching the current active filter
        const visibleRows = [];
        const cols = side === "left" ? leftTableCols : rightTableCols;

        alignedTableRows.forEach(alignedRow => {
            // Apply exact same filtering criteria as renderTableCompare
            const isDiff = alignedRow.type !== 'equal';
            if (tableFilterMode === 'diff' && !isDiff) return;
            if (tableFilterMode === 'same' && isDiff) return;
            if (tableFilterMode === 'missing-left' && alignedRow.type !== 'insert') return;
            if (tableFilterMode === 'missing-right' && alignedRow.type !== 'delete') return;

            // Extract row values for the respective side
            const row = side === "left" ? alignedRow.leftRow : alignedRow.rightRow;

            if (row) {
                // Row is present (non-spacer). Format cells nicely.
                const formattedRow = row.map((cell, cIdx) => {
                    const colName = cols[cIdx];
                    const setting = tableColumnSettings[colName];
                    const colType = (setting && typeof setting !== 'string') ? (setting.type || 'text') : autoDetectType(colName);
                    return window.DiffEngine.formatCellValue(cell, colType);
                });
                visibleRows.push(formattedRow);
            } else {
                // Row is a spacer (empty row on this side)
                visibleRows.push(Array(cols.length).fill(""));
            }
        });

        if (visibleRows.length === 0) {
            alert("No visible records available to copy under current filter.");
            return;
        }

        // Build tab-separated string (perfect format for pasting directly into Excel cells)
        const csvContent = [
            cols.join("\t"),
            ...visibleRows.map(row => row.map(cell => cell === undefined || cell === null ? "" : cell).join("\t"))
        ].join("\n");

        navigator.clipboard.writeText(csvContent)
            .then(() => {
                alert(`${side === "left" ? "Left" : "Right"} visible table data successfully copied to clipboard (${visibleRows.length} rows aligned)!`);
            })
            .catch(err => {
                alert("Failed to copy table: " + err);
            });
    }

    if (elements.tableActionCopyLeft) {
        elements.tableActionCopyLeft.addEventListener("click", () => {
            copyTableToClipboard("left");
        });
    }

    if (elements.tableActionCopyRight) {
        elements.tableActionCopyRight.addEventListener("click", () => {
            copyTableToClipboard("right");
        });
    }

    // CSV input bindings
    elements.tableLeftInput.addEventListener("change", (e) => {
        handleTableFile(e.target.files[0], "left");
    });
    elements.tableRightInput.addEventListener("change", (e) => {
        handleTableFile(e.target.files[0], "right");
    });

    let leftWorkbook = null;
    let rightWorkbook = null;
    let activeSheetName = "";

    function renderExcelSheetTabs() {
        const tabsContainer = document.getElementById("table-sheet-tabs-container");
        const tabsEl = document.getElementById("table-sheet-tabs");
        if (!tabsContainer || !tabsEl) return;

        const leftSheets = leftWorkbook ? leftWorkbook.SheetNames : [];
        const rightSheets = rightWorkbook ? rightWorkbook.SheetNames : [];
        const allSheets = Array.from(new Set([...leftSheets, ...rightSheets]));

        if (allSheets.length <= 1) {
            tabsContainer.classList.add("hidden");
            return;
        }

        tabsContainer.classList.remove("hidden");
        tabsEl.innerHTML = "";

        allSheets.forEach(sheetName => {
            const tab = document.createElement("div");
            tab.className = "sheet-tab" + (sheetName === activeSheetName ? " active" : "");
            tab.textContent = sheetName;
            tab.addEventListener("click", () => {
                activeSheetName = sheetName;
                loadSheetData(sheetName);
            });
            tabsEl.appendChild(tab);
        });
    }

    function loadSheetData(sheetName) {
        if (leftWorkbook) {
            const sheet = leftWorkbook.Sheets[sheetName] || leftWorkbook.Sheets[leftWorkbook.SheetNames[0]];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
            if (rawData.length > 0) {
                leftTableCols = rawData[0].map(h => String(h || "").trim());
                leftTableData = rawData.slice(1).map(row => row.map(cell => cell === undefined || cell === null ? "" : String(cell).trim()));
            } else {
                leftTableCols = [];
                leftTableData = [];
            }
        }
        if (rightWorkbook) {
            const sheet = rightWorkbook.Sheets[sheetName] || rightWorkbook.Sheets[rightWorkbook.SheetNames[0]];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
            if (rawData.length > 0) {
                rightTableCols = rawData[0].map(h => String(h || "").trim());
                rightTableData = rawData.slice(1).map(row => row.map(cell => cell === undefined || cell === null ? "" : String(cell).trim()));
            } else {
                rightTableCols = [];
                rightTableData = [];
            }
        }

        autoDetectKeyColumn();
        populateKeyDropdown();
        renderExcelSheetTabs();
        compareTableSession();
    }

    function handleTableFile(file, side) {
        if (!file) return;
        const reader = new FileReader();
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

        reader.onload = function(e) {
            if (isExcel) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'mm/dd/yyyy' });
                    
                    if (side === "left") {
                        leftWorkbook = workbook;
                        tableLeftFilename = file.name;
                        elements.tableLeftFilename.textContent = file.name;
                    } else {
                        rightWorkbook = workbook;
                        tableRightFilename = file.name;
                        elements.tableRightFilename.textContent = file.name;
                    }
                    
                    if (!activeSheetName) {
                        activeSheetName = workbook.SheetNames[0];
                    }
                    
                    loadSheetData(activeSheetName);
                } catch (err) {
                    alert("Error parsing Excel file: " + err.message);
                    return;
                }
            } else {
                if (side === "left") leftWorkbook = null;
                else rightWorkbook = null;

                const delim = detectDelimiter(e.target.result);
                const parsed = parseCSVData(e.target.result, delim);
                if (side === "left") {
                    leftTableCols = parsed.headers;
                    leftTableData = parsed.rows;
                    tableLeftFilename = file.name;
                    elements.tableLeftFilename.textContent = file.name;
                } else {
                    rightTableCols = parsed.headers;
                    rightTableData = parsed.rows;
                    tableRightFilename = file.name;
                    elements.tableRightFilename.textContent = file.name;
                }

                autoDetectKeyColumn();
                populateKeyDropdown();
                renderExcelSheetTabs();
                compareTableSession();
            }
        };

        if (isExcel) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    }

    function autoDetectKeyColumn() {
        tableColumnSettings = {};
        const allUniqueCols = Array.from(new Set([...leftTableCols, ...rightTableCols]));
        const commonCols = leftTableCols.filter(col => rightTableCols.includes(col));
        
        let defaultKey = "";
        const primaryKeys = ["id", "key", "sku", "employee_id", "code", "index", "person code", "personcode"];
        
        for (const pk of primaryKeys) {
            const match = commonCols.find(col => col.toLowerCase() === pk);
            if (match) {
                defaultKey = match;
                break;
            }
        }
        
        if (!defaultKey && commonCols.length > 0) {
            defaultKey = commonCols[0];
        }
        
        allUniqueCols.forEach(col => {
            const colType = autoDetectType(col);
            if (col === defaultKey) {
                tableColumnSettings[col] = { class: 'key', type: colType };
            } else {
                tableColumnSettings[col] = { class: 'standard', type: colType };
            }
        });
        
        selectedKeyColumn = defaultKey;
    }

    elements.tableBtnComparePaste.addEventListener("click", () => {
        const delimiterSelect = document.getElementById("table-paste-delimiter");
        let delim = ",";
        if (delimiterSelect) {
            const val = delimiterSelect.value;
            if (val === "tab") delim = "\t";
            else if (val === "semicolon") delim = ";";
            else if (val === "pipe") delim = "|";
        }

        const parsedLeft = parseCSVData(elements.tableLeftPaste.value, delim);
        const parsedRight = parseCSVData(elements.tableRightPaste.value, delim);

        leftTableCols = parsedLeft.headers;
        leftTableData = parsedLeft.rows;
        tableLeftFilename = "PastedLeft.csv";
        elements.tableLeftFilename.textContent = tableLeftFilename;

        rightTableCols = parsedRight.headers;
        rightTableData = parsedRight.rows;
        tableRightFilename = "PastedRight.csv";
        elements.tableRightFilename.textContent = tableRightFilename;

        autoDetectKeyColumn();
        populateKeyDropdown();
        compareTableSession();
    });

    // Table Swapping
    elements.tableActionSwap.addEventListener("click", () => {
        const tempCols = [...leftTableCols];
        leftTableCols = [...rightTableCols];
        rightTableCols = tempCols;

        const tempData = [...leftTableData];
        leftTableData = [...rightTableData];
        rightTableData = tempData;

        const tempName = tableLeftFilename;
        tableLeftFilename = tableRightFilename;
        tableRightFilename = tempName;

        elements.tableLeftFilename.textContent = tableLeftFilename;
        elements.tableRightFilename.textContent = tableRightFilename;

        populateKeyDropdown();
        compareTableSession();
    });

    // Clear spreadsheet session
    elements.tableActionClear.addEventListener("click", () => {
        leftTableData = [];
        rightTableData = [];
        leftTableCols = [];
        rightTableCols = [];
        alignedTableRows = [];
        elements.tableLeftFilename.textContent = "left_table.csv";
        elements.tableRightFilename.textContent = "right_table.csv";
        elements.gridLeftTable.innerHTML = "";
        elements.gridRightTable.innerHTML = "";
        elements.tableKeySelect.innerHTML = '<option value="">(None - Compare Sequentially)</option>';
        elements.tableLeftPaste.value = "";
        elements.tableRightPaste.value = "";
        elements.tableStatusInfo.textContent = "No spreadsheet loaded";
        compareTableSession();
    });

    // Export CSV
    elements.tableActionExport.addEventListener("click", () => {
        if (leftTableData.length === 0) return;
        const csvContent = [
            leftTableCols.join(","),
            ...leftTableData.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bc_exported_${tableLeftFilename}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // -------------------------------------------------------------
    // LIVE DEMO LAUNCHERS
    // -------------------------------------------------------------
    elements.demoAuthCode.addEventListener("click", () => {
        leftTextLines = textToLines(window.DemoSamples.textLeft);
        rightTextLines = textToLines(window.DemoSamples.textRight);
        textLeftFilename = "authMiddleware_v1.js";
        textRightFilename = "authMiddleware_v2.js";
        elements.textLeftFilename.textContent = textLeftFilename;
        elements.textRightFilename.textContent = textRightFilename;
        
        switchView("text");
        compareTextSession();
    });

    elements.demoEnvJson.addEventListener("click", () => {
        leftTextLines = textToLines(window.DemoSamples.jsonLeft);
        rightTextLines = textToLines(window.DemoSamples.jsonRight);
        textLeftFilename = "config.local.json";
        textRightFilename = "config.prod.json";
        elements.textLeftFilename.textContent = textLeftFilename;
        elements.textRightFilename.textContent = textRightFilename;
        
        switchView("text");
        compareTextSession();
    });

    elements.demoEmployeeCsv.addEventListener("click", () => {
        const parsedLeft = parseCSVData(window.DemoSamples.tableLeft);
        const parsedRight = parseCSVData(window.DemoSamples.tableRight);

        leftTableCols = parsedLeft.headers;
        leftTableData = parsedLeft.rows;
        tableLeftFilename = "employees_april.csv";
        elements.tableLeftFilename.textContent = tableLeftFilename;

        rightTableCols = parsedRight.headers;
        rightTableData = parsedRight.rows;
        tableRightFilename = "employees_may.csv";
        elements.tableRightFilename.textContent = tableRightFilename;

        autoDetectKeyColumn();
        populateKeyDropdown();
        
        switchView("table");
        compareTableSession();
    });

    // -------------------------------------------------------------
    // FOLDER COMPARE STATE & CONTROLLER
    // -------------------------------------------------------------
    let leftFolderFiles = {};
    let rightFolderFiles = {};
    let folderLeftName = "Left Folder";
    let folderRightName = "Right Folder";
    let folderFilterMode = "all";
    let folderAlignedResults = [];

    const folderLeftInput = document.getElementById("folder-left-input");
    const folderRightInput = document.getElementById("folder-right-input");
    const folderLeftPath = document.getElementById("folder-left-path");
    const folderRightPath = document.getElementById("folder-right-path");
    const folderTreeLeft = document.getElementById("folder-tree-left");
    const folderTreeRight = document.getElementById("folder-tree-right");
    const folderEmptyOverlay = document.getElementById("folder-empty-overlay");

    if (folderLeftInput) {
        folderLeftInput.addEventListener("change", (e) => handleFolderFiles(e.target.files, "left"));
    }
    if (folderRightInput) {
        folderRightInput.addEventListener("change", (e) => handleFolderFiles(e.target.files, "right"));
    }

    function handleFolderFiles(fileList, side) {
        const filesMap = side === "left" ? leftFolderFiles : rightFolderFiles;
        if (side === "left") leftFolderFiles = {};
        else rightFolderFiles = {};

        Array.from(fileList).forEach(file => {
            const relPath = file.webkitRelativePath || file.name;
            if (relPath.includes('/.git/') || relPath.includes('/node_modules/')) return;
            
            const pathParts = relPath.split('/');
            pathParts.shift();
            const standardPath = pathParts.join('/');

            filesMap[standardPath] = {
                name: file.name,
                path: standardPath,
                size: file.size,
                lastModified: file.lastModified,
                fileObj: file
            };
        });

        const rootFolderName = fileList[0] ? fileList[0].webkitRelativePath.split('/')[0] : "Folder";
        if (side === "left") {
            folderLeftName = rootFolderName;
            if (folderLeftPath) folderLeftPath.textContent = rootFolderName;
        } else {
            folderRightName = rootFolderName;
            if (folderRightPath) folderRightPath.textContent = rootFolderName;
        }

        compareFolderSession();
    }

    function compareFolderSession() {
        if (Object.keys(leftFolderFiles).length === 0 && Object.keys(rightFolderFiles).length === 0) {
            if (folderEmptyOverlay) folderEmptyOverlay.classList.remove("hidden");
            return;
        }
        if (folderEmptyOverlay) folderEmptyOverlay.classList.add("hidden");

        folderAlignedResults = window.DiffEngine.compareDirectories(leftFolderFiles, rightFolderFiles);
        renderFolderTrees();
        updateFolderStats();
    }

    function renderFolderTrees() {
        if (!folderTreeLeft || !folderTreeRight) return;
        folderTreeLeft.innerHTML = "";
        folderTreeRight.innerHTML = "";

        let leftHTML = "";
        let rightHTML = "";

        folderAlignedResults.forEach(res => {
            const isDiff = res.status !== 'same';
            if (folderFilterMode === 'diff' && !isDiff) return;
            if (folderFilterMode === 'orphans' && !res.status.startsWith('orphan')) return;
            if (folderFilterMode === 'same' && isDiff) return;

            const pathParts = res.path.split('/');
            const indent = (pathParts.length - 1) * 16;
            const fileIcon = res.name.includes('.') ? '📄' : '📁';

            if (res.status !== 'orphan-right') {
                leftHTML += `
                    <div class="tree-node status-${res.status}" data-path="${res.path}" style="padding-left: ${indent}px; height: 26px;">
                        <span class="tree-node-icon">${fileIcon}</span>
                        <span class="tree-node-name">${res.name}</span>
                        <span class="tree-node-meta">${formatBytes(res.leftSize)} | ${formatDateStr(res.leftTime)}</span>
                    </div>
                `;
            } else {
                leftHTML += `<div class="tree-node spacer-node" style="height: 26px;"></div>`;
            }

            if (res.status !== 'orphan-left') {
                rightHTML += `
                    <div class="tree-node status-${res.status}" data-path="${res.path}" style="padding-left: ${indent}px; height: 26px;">
                        <span class="tree-node-icon">${fileIcon}</span>
                        <span class="tree-node-name">${res.name}</span>
                        <span class="tree-node-meta">${formatBytes(res.rightSize)} | ${formatDateStr(res.rightTime)}</span>
                    </div>
                `;
            } else {
                rightHTML += `<div class="tree-node spacer-node" style="height: 26px;"></div>`;
            }
        });

        folderTreeLeft.innerHTML = leftHTML;
        folderTreeRight.innerHTML = rightHTML;

        const setupDrillDown = (treeEl) => {
            treeEl.addEventListener("dblclick", (e) => {
                const node = e.target.closest(".tree-node");
                if (!node || node.classList.contains("spacer-node")) return;
                const relPath = node.getAttribute("data-path");
                drillDownFile(relPath);
            });
        };
        setupDrillDown(folderTreeLeft);
        setupDrillDown(folderTreeRight);
    }

    function drillDownFile(relPath) {
        const leftF = leftFolderFiles[relPath];
        const rightF = rightFolderFiles[relPath];

        const name = leftF ? leftF.name : (rightF ? rightF.name : "");
        const ext = name.split('.').pop().toLowerCase();
        const isTable = ['csv', 'tsv', 'xlsx', 'xls'].includes(ext);

        if (isTable) {
            switchView("table");
            if (leftF) {
                tableLeftFilename = leftF.name;
                elements.tableLeftFilename.textContent = leftF.name;
                handleTableFile(leftF.fileObj, "left");
            } else {
                leftTableData = [];
                leftTableCols = [];
                elements.tableLeftFilename.textContent = "(empty)";
            }

            if (rightF) {
                tableRightFilename = rightF.name;
                elements.tableRightFilename.textContent = rightF.name;
                handleTableFile(rightF.fileObj, "right");
            } else {
                rightTableData = [];
                rightTableCols = [];
                elements.tableRightFilename.textContent = "(empty)";
            }
        } else {
            switchView("text");
            if (leftF) {
                textLeftFilename = leftF.name;
                elements.textLeftFilename.textContent = leftF.name;
                readAndCompareText(leftF.fileObj, "left");
            } else {
                leftTextLines = [];
                elements.textLeftFilename.textContent = "(empty)";
            }

            if (rightF) {
                textRightFilename = rightF.name;
                elements.textRightFilename.textContent = rightF.name;
                readAndCompareText(rightF.fileObj, "right");
            } else {
                rightTextLines = [];
                elements.textRightFilename.textContent = "(empty)";
            }
        }
    }

    function readAndCompareText(file, side) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = textToLines(e.target.result);
            if (side === "left") leftTextLines = lines;
            else rightTextLines = lines;
            compareTextSession();
        };
        reader.readAsText(file);
    }

    function updateFolderStats() {
        let diffCount = 0;
        let leftOrphans = 0;
        let rightOrphans = 0;

        folderAlignedResults.forEach(res => {
            if (res.status === 'diff') diffCount++;
            else if (res.status === 'orphan-left') leftOrphans++;
            else if (res.status === 'orphan-right') rightOrphans++;
        });

        const lblDiff = document.getElementById("folder-stat-diff");
        const lblLeft = document.getElementById("folder-stat-left-orphans");
        const lblRight = document.getElementById("folder-stat-right-orphans");
        const folderStatus = document.getElementById("folder-status-info");

        if (lblDiff) lblDiff.textContent = `${diffCount} different files`;
        if (lblLeft) lblLeft.textContent = `${leftOrphans} left orphans`;
        if (lblRight) lblRight.textContent = `${rightOrphans} right orphans`;
        if (folderStatus) folderStatus.textContent = `Directories aligned. Files compared: ${folderAlignedResults.length}`;
    }

    // Gutter sync buttons
    const btnSyncLR = document.getElementById("folder-action-sync-lr");
    const btnSyncRL = document.getElementById("folder-action-sync-rl");

    if (btnSyncLR) {
        btnSyncLR.addEventListener("click", () => {
            folderAlignedResults.forEach(res => {
                if (res.status === 'orphan-left' || res.status === 'diff') {
                    rightFolderFiles[res.path] = JSON.parse(JSON.stringify(leftFolderFiles[res.path]));
                }
            });
            compareFolderSession();
            alert("Directory sync complete: missing and newer files copied from Left to Right!");
        });
    }

    if (btnSyncRL) {
        btnSyncRL.addEventListener("click", () => {
            folderAlignedResults.forEach(res => {
                if (res.status === 'orphan-right' || res.status === 'diff') {
                    leftFolderFiles[res.path] = JSON.parse(JSON.stringify(rightFolderFiles[res.path]));
                }
            });
            compareFolderSession();
            alert("Directory sync complete: missing and newer files copied from Right to Left!");
        });
    }

    // Set filter mode
    function setFolderFilter(mode) {
        folderFilterMode = mode;
        ['folder-filter-all', 'folder-filter-diff', 'folder-filter-orphans', 'folder-filter-same'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.classList.remove("active");
        });
        const activeBtn = document.getElementById(`folder-filter-${mode}`);
        if (activeBtn) activeBtn.classList.add("active");
        compareFolderSession();
    }

    const folderFilterAll = document.getElementById("folder-filter-all");
    const folderFilterDiff = document.getElementById("folder-filter-diff");
    const folderFilterOrphans = document.getElementById("folder-filter-orphans");
    const folderFilterSame = document.getElementById("folder-filter-same");

    if (folderFilterAll) folderFilterAll.addEventListener("click", () => setFolderFilter("all"));
    if (folderFilterDiff) folderFilterDiff.addEventListener("click", () => setFolderFilter("diff"));
    if (folderFilterOrphans) folderFilterOrphans.addEventListener("click", () => setFolderFilter("orphans"));
    if (folderFilterSame) folderFilterSame.addEventListener("click", () => setFolderFilter("same"));

    const folderActionClear = document.getElementById("folder-action-clear");
    if (folderActionClear) {
        folderActionClear.addEventListener("click", () => {
            leftFolderFiles = {};
            rightFolderFiles = {};
            folderLeftName = "Left Folder";
            folderRightName = "Right Folder";
            if (folderLeftPath) folderLeftPath.textContent = "Left Folder (unloaded)";
            if (folderRightPath) folderRightPath.textContent = "Right Folder (unloaded)";
            compareFolderSession();
        });
    }

    const btnLoadMock = document.getElementById("btn-load-mock-folder");
    if (btnLoadMock) {
        btnLoadMock.addEventListener("click", () => {
            leftFolderFiles = {
                "index.html": { name: "index.html", path: "index.html", size: 1204, lastModified: Date.now() - 3600000 },
                "styles.css": { name: "styles.css", path: "styles.css", size: 4503, lastModified: Date.now() - 7200000 },
                "app.js": { name: "app.js", path: "app.js", size: 10432, lastModified: Date.now() },
                "utils.js": { name: "utils.js", path: "utils.js", size: 2314, lastModified: Date.now() - 86400000 }
            };

            rightFolderFiles = {
                "index.html": { name: "index.html", path: "index.html", size: 1204, lastModified: Date.now() - 3600000 },
                "styles.css": { name: "styles.css", path: "styles.css", size: 4890, lastModified: Date.now() },
                "app.js": { name: "app.js", path: "app.js", size: 10432, lastModified: Date.now() },
                "config.json": { name: "config.json", path: "config.json", size: 512, lastModified: Date.now() }
            };

            folderLeftName = "Project_v1";
            folderRightName = "Project_v2";
            if (folderLeftPath) folderLeftPath.textContent = "Project_v1";
            if (folderRightPath) folderRightPath.textContent = "Project_v2";

            compareFolderSession();
        });
    }

    function formatBytes(bytes) {
        if (bytes === null || bytes === undefined) return "";
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function formatDateStr(timestamp) {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }


    // -------------------------------------------------------------
    // CHARACTER-LEVEL & CELL-LEVEL MAGNET DRAWER VIEWERS
    // -------------------------------------------------------------
    function setupTextLineDetails() {
        const updateDetails = (e) => {
            const line = e.target.closest(".code-line");
            if (!line) return;

            const leftIdxAttr = line.getAttribute("data-line-left");
            const rightIdxAttr = line.getAttribute("data-line-right");

            const leftIdx = leftIdxAttr !== null ? parseInt(leftIdxAttr, 10) : null;
            const rightIdx = rightIdxAttr !== null ? parseInt(rightIdxAttr, 10) : null;

            const leftStr = leftIdx !== null ? leftTextLines[leftIdx] : "";
            const rightStr = rightIdx !== null ? rightTextLines[rightIdx] : "";

            const detailLeft = document.getElementById("detail-left-pane");
            const detailRight = document.getElementById("detail-right-pane");
            if (!detailLeft || !detailRight) return;

            if (leftIdx === null && rightIdx !== null) {
                detailLeft.innerHTML = `<span style="color: var(--text-muted); font-style: italic;">(Line inserted in right file)</span>`;
                detailRight.innerHTML = `<span class="char-diff-ins">${window.DiffEngine.escapeHtml(rightStr)}</span>`;
            } else if (leftIdx !== null && rightIdx === null) {
                detailLeft.innerHTML = `<span class="char-diff-del">${window.DiffEngine.escapeHtml(leftStr)}</span>`;
                detailRight.innerHTML = `<span style="color: var(--text-muted); font-style: italic;">(Line deleted from right)</span>`;
            } else if (leftIdx !== null && rightIdx !== null) {
                const charDiff = window.DiffEngine.compareCharacters(leftStr, rightStr);
                detailLeft.innerHTML = charDiff.leftHtml || `<span style="color: var(--text-muted); font-style: italic;">(Empty line)</span>`;
                detailRight.innerHTML = charDiff.rightHtml || `<span style="color: var(--text-muted); font-style: italic;">(Empty line)</span>`;
            }
        };

        elements.codeLeftLines.addEventListener("click", updateDetails);
        elements.codeRightLines.addEventListener("click", updateDetails);
    }

    function setupTableCellDetails() {
        const gridLeft = document.getElementById("grid-left-table");
        const gridRight = document.getElementById("grid-right-table");
        const cellDetail = document.getElementById("table-cell-detail");
        if (!gridLeft || !gridRight || !cellDetail) return;

        const handleCellClick = (e) => {
            const td = e.target.closest("td");
            if (!td) return;

            const tr = td.closest("tr");
            const cells = Array.from(tr.children);
            const cIdx = cells.indexOf(td);
            
            const rowNumCell = cells[0];
            const rowNum = rowNumCell ? rowNumCell.textContent : "";
            
            const tableHeaders = Array.from(tr.closest("table").querySelector("tr").children);
            const headerCell = tableHeaders[cIdx];
            const colName = headerCell ? headerCell.textContent.replace(/[🔑📝🔍🚫]\s*/g, '') : "";

            if (cIdx === 0) {
                cellDetail.innerHTML = `<strong>Selected Row #${rowNum}</strong>`;
                return;
            }

            const alignedIdx = Array.from(tr.parentNode.children).indexOf(tr) - 1;
            const alignedRow = alignedTableRows[alignedIdx];
            if (!alignedRow) return;

            const lVal = alignedRow.leftRow && leftTableCols.indexOf(colName) !== -1 ? alignedRow.leftRow[leftTableCols.indexOf(colName)] : "";
            const rVal = alignedRow.rightRow && rightTableCols.indexOf(colName) !== -1 ? alignedRow.rightRow[rightTableCols.indexOf(colName)] : "";

            const setting = tableColumnSettings[colName];
            const colType = (setting && typeof setting !== 'string') ? (setting.type || 'text') : autoDetectType(colName);
            const lFormatted = window.DiffEngine.formatCellValue(lVal, colType);
            const rFormatted = window.DiffEngine.formatCellValue(rVal, colType);

            let comparisonHTML = `
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div><strong>Column:</strong> <span style="color: var(--accent-color); font-weight: bold;">${colName}</span> | <strong>Row Index:</strong> ${rowNum}</div>
                    <div style="display: flex; gap: 16px; margin-top: 4px;">
                        <div style="flex: 1;">
                            <strong>Left Value:</strong> 
                            <span style="font-family: var(--font-mono); display: block; padding: 4px; background: var(--bg-app); border-radius: 4px; margin-top: 2px;">
                                ${window.DiffEngine.escapeHtml(lFormatted === "" ? "(empty)" : lFormatted)}
                            </span>
                        </div>
                        <div style="flex: 1;">
                            <strong>Right Value:</strong>
                            <span style="font-family: var(--font-mono); display: block; padding: 4px; background: var(--bg-app); border-radius: 4px; margin-top: 2px;">
                                ${window.DiffEngine.escapeHtml(rFormatted === "" ? "(empty)" : rFormatted)}
                            </span>
                        </div>
                    </div>
                </div>
            `;
            cellDetail.innerHTML = comparisonHTML;
        };

        gridLeft.addEventListener("click", handleCellClick);
        gridRight.addEventListener("click", handleCellClick);
    }


    // -------------------------------------------------------------
    // TEXT FIND & REPLACE COLLAPSIBLE PANEL
    // -------------------------------------------------------------
    function setupTextFindReplace() {
        const btnFind = document.getElementById("text-action-find");
        const ribbon = document.getElementById("text-find-ribbon");
        const btnClose = document.getElementById("btn-close-find");
        const findInput = document.getElementById("find-input");
        const findCase = document.getElementById("find-case");
        const findRegex = document.getElementById("find-regex");
        const btnNext = document.getElementById("btn-find-next");
        const btnPrev = document.getElementById("btn-find-prev");

        if (!btnFind || !ribbon) return;

        btnFind.addEventListener("click", () => {
            ribbon.classList.toggle("hidden");
            if (!ribbon.classList.contains("hidden")) {
                findInput.focus();
            }
        });

        if (btnClose) btnClose.addEventListener("click", () => ribbon.classList.add("hidden"));

        document.addEventListener("keydown", (e) => {
            if (activeView === "text" && e.ctrlKey && e.key.toLowerCase() === "f") {
                e.preventDefault();
                ribbon.classList.remove("hidden");
                findInput.focus();
            }
        });

        let matchIndices = [];
        let currentMatchIdx = -1;

        const performSearch = () => {
            const query = findInput.value;
            if (!query) return;

            const isCase = findCase.checked;
            const isReg = findRegex.checked;

            matchIndices = [];
            const nodes = Array.from(elements.codeLeftLines.children);
            nodes.forEach((node, idx) => {
                if (node.classList.contains("line-spacer")) return;
                const text = node.textContent;
                
                let match = false;
                if (isReg) {
                    try {
                        const regex = new RegExp(query, isCase ? 'g' : 'gi');
                        match = regex.test(text);
                    } catch (err) {}
                } else {
                    const cleanText = isCase ? text : text.toLowerCase();
                    const cleanQuery = isCase ? query : query.toLowerCase();
                    match = cleanText.includes(cleanQuery);
                }

                if (match) {
                    matchIndices.push(idx);
                }
            });

            currentMatchIdx = -1;
            highlightNextMatch();
        };

        const highlightNextMatch = () => {
            if (matchIndices.length === 0) return;
            currentMatchIdx = (currentMatchIdx + 1) % matchIndices.length;
            const targetLineIdx = matchIndices[currentMatchIdx];

            const targetScrollTop = targetLineIdx * LINE_HEIGHT - 60;
            elements.scrollLeft.scrollTop = Math.max(0, targetScrollTop);

            const leftNode = elements.codeLeftLines.children[targetLineIdx];
            if (leftNode) {
                leftNode.style.backgroundColor = "var(--border-focus)";
                setTimeout(() => {
                    leftNode.style.backgroundColor = "";
                }, 1500);
            }
        };

        const highlightPrevMatch = () => {
            if (matchIndices.length === 0) return;
            currentMatchIdx = (currentMatchIdx - 1 + matchIndices.length) % matchIndices.length;
            const targetLineIdx = matchIndices[currentMatchIdx];

            const targetScrollTop = targetLineIdx * LINE_HEIGHT - 60;
            elements.scrollLeft.scrollTop = Math.max(0, targetScrollTop);

            const leftNode = elements.codeLeftLines.children[targetLineIdx];
            if (leftNode) {
                leftNode.style.backgroundColor = "var(--border-focus)";
                setTimeout(() => {
                    leftNode.style.backgroundColor = "";
                }, 1500);
            }
        };

        if (btnNext) btnNext.addEventListener("click", performSearch);
        if (btnPrev) btnPrev.addEventListener("click", highlightPrevMatch);

        findInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                performSearch();
            }
        });
    }

    const btnOrientation = document.getElementById("text-action-orientation");
    const workspaceText = document.getElementById("text-workspace");
    if (btnOrientation && workspaceText) {
        btnOrientation.addEventListener("click", () => {
            if (workspaceText.classList.contains("side-by-side")) {
                workspaceText.classList.remove("side-by-side");
                workspaceText.classList.add("over-under");
                btnOrientation.textContent = "↔️ Split View";
            } else {
                workspaceText.classList.remove("over-under");
                workspaceText.classList.add("side-by-side");
                btnOrientation.textContent = "↕️ Stack View";
            }
            triggerTextResize();
        });
    }


    // -------------------------------------------------------------
    // SAVED SESSIONS MANAGER VIA LOCALSTORAGE
    // -------------------------------------------------------------
    function loadSavedSessionsList() {
        const listEl = document.getElementById("saved-sessions-list");
        if (!listEl) return;

        const sessions = getSavedSessions();
        if (sessions.length === 0) {
            listEl.innerHTML = `
                <div class="no-sessions-msg" style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem; background: var(--bg-panel); border-radius: 8px; border: 1px dashed var(--border-color);">
                    No saved sessions yet. Configure any comparison and click "💾 Save Session" in the toolbar!
                </div>
            `;
            return;
        }

        let html = "";
        sessions.forEach((sess, idx) => {
            const dateStr = new Date(sess.timestamp).toLocaleString();
            html += `
                <div class="recent-item" style="cursor: default;">
                    <div class="recent-item-info" style="cursor: pointer; flex-grow: 1;" onclick="loadSessionByIndex(${idx})">
                        <span class="recent-item-type" data-type="${sess.type}">${sess.type}</span>
                        <strong class="recent-item-name" style="color: var(--text-main);">${sess.name}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 10px;">${sess.leftPath} ⇄ ${sess.rightPath}</span>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-muted); margin-right: 15px;">${dateStr}</span>
                    <span class="saved-session-delete" onclick="deleteSessionByIndex(${idx})" title="Delete Saved Session">🗑️</span>
                </div>
            `;
        });
        listEl.innerHTML = html;
    }

    function getSavedSessions() {
        try {
            return JSON.parse(localStorage.getItem("bc-saved-sessions") || "[]");
        } catch (e) {
            return [];
        }
    }

    function saveActiveSession(sessionName) {
        if (!sessionName) return;
        const sessions = getSavedSessions();

        let newSession = {
            name: sessionName,
            type: activeView,
            timestamp: Date.now()
        };

        if (activeView === "text") {
            newSession.leftPath = textLeftFilename;
            newSession.rightPath = textRightFilename;
            newSession.leftText = leftTextLines.join("\n");
            newSession.rightText = rightTextLines.join("\n");
        } else if (activeView === "table") {
            newSession.leftPath = tableLeftFilename;
            newSession.rightPath = tableRightFilename;
            newSession.leftCols = leftTableCols;
            newSession.leftData = leftTableData;
            newSession.rightCols = rightTableCols;
            newSession.rightData = rightTableData;
            newSession.columnSettings = tableColumnSettings;
            newSession.keyColumn = selectedKeyColumn;
        } else if (activeView === "folder") {
            newSession.leftPath = folderLeftName;
            newSession.rightPath = folderRightName;
            const stripFiles = (fMap) => {
                const res = {};
                for (const [k, v] of Object.entries(fMap)) {
                    res[k] = { name: v.name, path: v.path, size: v.size, lastModified: v.lastModified };
                }
                return res;
            };
            newSession.leftFiles = stripFiles(leftFolderFiles);
            newSession.rightFiles = stripFiles(rightFolderFiles);
        } else {
            return;
        }

        sessions.unshift(newSession);
        localStorage.setItem("bc-saved-sessions", JSON.stringify(sessions));
        loadSavedSessionsList();
    }

    window.loadSessionByIndex = function(idx) {
        const sessions = getSavedSessions();
        const sess = sessions[idx];
        if (!sess) return;

        if (sess.type === "text") {
            leftTextLines = sess.leftText.split("\n");
            rightTextLines = sess.rightText.split("\n");
            textLeftFilename = sess.leftPath;
            textRightFilename = sess.rightPath;
            elements.textLeftFilename.textContent = sess.leftPath;
            elements.textRightFilename.textContent = sess.rightPath;
            switchView("text");
            compareTextSession();
        } else if (sess.type === "table") {
            leftTableCols = sess.leftCols;
            leftTableData = sess.leftData;
            rightTableCols = sess.rightCols;
            rightTableData = sess.rightData;
            tableLeftFilename = sess.leftPath;
            tableRightFilename = sess.rightPath;
            elements.tableLeftFilename.textContent = sess.leftPath;
            elements.tableRightFilename.textContent = sess.rightPath;
            tableColumnSettings = sess.columnSettings;
            selectedKeyColumn = sess.keyColumn;
            switchView("table");
            populateKeyDropdown();
            compareTableSession();
        } else if (sess.type === "folder") {
            leftFolderFiles = sess.leftFiles;
            rightFolderFiles = sess.rightFiles;
            folderLeftName = sess.leftPath;
            folderRightName = sess.rightPath;
            if (folderLeftPath) folderLeftPath.textContent = sess.leftPath;
            if (folderRightPath) folderRightPath.textContent = sess.rightPath;
            switchView("folder");
            compareFolderSession();
        }
    };

    window.deleteSessionByIndex = function(idx) {
        const sessions = getSavedSessions();
        sessions.splice(idx, 1);
        localStorage.setItem("bc-saved-sessions", JSON.stringify(sessions));
        loadSavedSessionsList();
    };

    const btnClearSaved = document.getElementById("btn-clear-saved");
    if (btnClearSaved) {
        btnClearSaved.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear all saved comparison sessions?")) {
                localStorage.removeItem("bc-saved-sessions");
                loadSavedSessionsList();
            }
        });
    }

    const folderActionSave = document.getElementById("folder-action-save");
    if (folderActionSave) {
        folderActionSave.addEventListener("click", () => {
            const name = prompt("Enter a name for this Folder comparison session:", `${folderLeftName} ⇄ ${folderRightName}`);
            saveActiveSession(name);
        });
    }

    const textActionSave = document.getElementById("text-action-save");
    if (textActionSave) {
        textActionSave.addEventListener("click", () => {
            const name = prompt("Enter a name for this Text comparison session:", `${textLeftFilename} ⇄ ${textRightFilename}`);
            saveActiveSession(name);
        });
    }

    const tableActionSave = document.getElementById("table-action-save");
    if (tableActionSave) {
        tableActionSave.addEventListener("click", () => {
            const name = prompt("Enter a name for this Table comparison session:", `${tableLeftFilename} ⇄ ${tableRightFilename}`);
            saveActiveSession(name);
        });
    }


    // -------------------------------------------------------------
    // DRAG AND DROP SETUP
    // -------------------------------------------------------------
    const setupDragAndDrop = (overlayId, fileInputLeft, fileInputRight, fileHandler) => {
        const overlay = document.getElementById(overlayId);
        if (!overlay) return;

        ['dragenter', 'dragover'].forEach(eventName => {
            overlay.addEventListener(eventName, (e) => {
                e.preventDefault();
                overlay.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            overlay.addEventListener(eventName, (e) => {
                e.preventDefault();
                overlay.classList.remove('dragover');
            }, false);
        });

        overlay.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                if (files.length === 1) {
                    fileHandler(files[0], "left");
                } else if (files.length >= 2) {
                    fileHandler(files[0], "left");
                    fileHandler(files[1], "right");
                }
            }
        }, false);
    };

    setupDragAndDrop("text-empty-overlay", elements.textLeftInput, elements.textRightInput, handleTextFile);
    setupDragAndDrop("table-empty-overlay", elements.tableLeftInput, elements.tableRightInput, handleTableFile);
    
    // Drag and drop for folders overlay
    const folderOverlay = document.getElementById("folder-empty-overlay");
    if (folderOverlay) {
        ['dragenter', 'dragover'].forEach(eventName => {
            folderOverlay.addEventListener(eventName, (e) => {
                e.preventDefault();
                folderOverlay.classList.add('dragover');
            }, false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            folderOverlay.addEventListener(eventName, (e) => {
                e.preventDefault();
                folderOverlay.classList.remove('dragover');
            }, false);
        });
        folderOverlay.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const items = dt.items;
            // Webkitdirectory drag drop parser
            const files = dt.files;
            if (files.length > 0) {
                // If dropped multiple files, treat them as directory contents
                handleFolderFiles(files, "left");
            }
        }, false);
    }

    // Initialize premium magnification drawers and features
    setupTextLineDetails();
    setupTableCellDetails();
    setupTextFindReplace();
    loadSavedSessionsList();

});
