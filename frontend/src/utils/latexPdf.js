import { jsPDF } from 'jspdf';

/**
 * Generates a LaTeX-styled PDF report using jsPDF.
 *
 * Mimics the look and feel of a LaTeX document:
 *  - Serif fonts (Times = closest built-in to Computer Modern)
 *  - Wide margins, justified-like text, numbered sections
 *  - Title block, abstract, horizontal rules, footer
 */
export function generateLatexPdf({ question, answer, restrictions, timestamp }) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    /* ── Layout constants (LaTeX-like margins) ── */
    const PAGE_W = 210;
    const PAGE_H = 297;
    const MARGIN_LEFT = 30;
    const MARGIN_RIGHT = 30;
    const MARGIN_TOP = 30;
    const MARGIN_BOTTOM = 25;
    const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;
    const LINE_HEIGHT = 5.5;          // body text
    const SECTION_GAP = 10;
    const PARAGRAPH_GAP = 4;

    let y = MARGIN_TOP;
    let sectionCounter = 0;

    /* ── Helper: page break check ── */
    const ensureSpace = (needed) => {
        if (y + needed > PAGE_H - MARGIN_BOTTOM) {
            addFooter();
            doc.addPage();
            y = MARGIN_TOP;
        }
    };

    /* ── Helper: footer on current page ── */
    const addFooter = () => {
        const page = doc.internal.getNumberOfPages();
        doc.setFont('times', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        // center page number
        const pageText = `– ${page} –`;
        const tw = doc.getTextWidth(pageText);
        doc.text(pageText, (PAGE_W - tw) / 2, PAGE_H - 12);
        // left footer
        doc.text('K2 AI Decision Engine', MARGIN_LEFT, PAGE_H - 12);
        doc.setTextColor(0, 0, 0);
    };

    /* ── Helper: horizontal rule ── */
    const rule = (thick = 0.4) => {
        ensureSpace(4);
        doc.setLineWidth(thick);
        doc.setDrawColor(0, 0, 0);
        doc.line(MARGIN_LEFT, y, PAGE_W - MARGIN_RIGHT, y);
        y += 4;
    };

    /* ── Helper: write wrapped body text ── */
    const writeText = (text, { font = 'times', style = 'normal', size = 11, color = [0, 0, 0], indent = 0, lineH = LINE_HEIGHT } = {}) => {
        doc.setFont(font, style);
        doc.setFontSize(size);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, CONTENT_W - indent);
        for (const line of lines) {
            ensureSpace(lineH);
            doc.text(line, MARGIN_LEFT + indent, y);
            y += lineH;
        }
    };

    /* ── Helper: section title (LaTeX \section style) ── */
    const sectionTitle = (title) => {
        sectionCounter++;
        ensureSpace(SECTION_GAP + 8);
        y += SECTION_GAP;
        doc.setFont('times', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text(`${sectionCounter}   ${title}`, MARGIN_LEFT, y);
        y += 7;
    };

    /* ── Helper: subsection title ── */
    const subsectionTitle = (title, subNum) => {
        ensureSpace(8);
        y += 5;
        doc.setFont('times', 'bold');
        doc.setFontSize(11.5);
        doc.setTextColor(0, 0, 0);
        doc.text(`${sectionCounter}.${subNum}   ${title}`, MARGIN_LEFT, y);
        y += 6;
    };

    /* ──────────────────────────────────────────────
     *  TITLE BLOCK (centered, LaTeX article style)
     * ────────────────────────────────────────────── */
    y = MARGIN_TOP + 10;

    // Title
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    const title = 'Data Analysis Report';
    let tw = doc.getTextWidth(title);
    doc.text(title, (PAGE_W - tw) / 2, y);
    y += 10;

    // Subtitle / author line
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    const subtitle = 'K2 AI-Powered Decision Support';
    tw = doc.getTextWidth(subtitle);
    doc.text(subtitle, (PAGE_W - tw) / 2, y);
    y += 7;

    // Date
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    tw = doc.getTextWidth(timestamp);
    doc.text(timestamp, (PAGE_W - tw) / 2, y);
    y += 10;

    rule(0.6);

    /* ──────────────────────────────────────────────
     *  ABSTRACT (the query)
     * ────────────────────────────────────────────── */
    ensureSpace(20);
    // "Abstract" label centered
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const absLabel = 'Abstract';
    tw = doc.getTextWidth(absLabel);
    doc.text(absLabel, (PAGE_W - tw) / 2, y);
    y += 6;

    // abstract text indented on both sides
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    const absIndent = 10;
    const absLines = doc.splitTextToSize(
        question || 'No query provided.',
        CONTENT_W - absIndent * 2
    );
    for (const line of absLines) {
        ensureSpace(LINE_HEIGHT);
        doc.text(line, MARGIN_LEFT + absIndent, y);
        y += LINE_HEIGHT;
    }

    if (restrictions) {
        y += 2;
        doc.setFont('times', 'bolditalic');
        doc.setFontSize(9);
        const rLines = doc.splitTextToSize(
            `Constraints: ${restrictions}`,
            CONTENT_W - absIndent * 2
        );
        for (const line of rLines) {
            ensureSpace(LINE_HEIGHT);
            doc.text(line, MARGIN_LEFT + absIndent, y);
            y += LINE_HEIGHT;
        }
    }

    y += 4;
    rule(0.6);
    y += 2;

    /* ──────────────────────────────────────────────
     *  BODY — Parse the Markdown answer into sections
     * ────────────────────────────────────────────── */
    sectionTitle('Analysis');

    const bodyText = answer || 'No data returned.';
    const mdLines = bodyText.split('\n');

    let subCounter = 0;
    let inTable = false;
    let tableRows = [];
    let inCodeBlock = false;
    let codeLines = [];

    const flushTable = () => {
        if (tableRows.length === 0) return;
        renderTable(tableRows);
        tableRows = [];
        inTable = false;
    };

    const flushCode = () => {
        if (codeLines.length === 0) return;
        ensureSpace(codeLines.length * 4 + 8);
        y += 2;
        // light gray background
        const blockH = codeLines.length * 4 + 4;
        doc.setFillColor(245, 245, 245);
        doc.rect(MARGIN_LEFT, y - 3, CONTENT_W, blockH, 'F');
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.rect(MARGIN_LEFT, y - 3, CONTENT_W, blockH, 'S');

        doc.setFont('courier', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 30, 30);
        for (const cl of codeLines) {
            ensureSpace(4);
            doc.text(cl, MARGIN_LEFT + 3, y);
            y += 4;
        }
        y += 4;
        doc.setTextColor(0, 0, 0);
        codeLines = [];
        inCodeBlock = false;
    };

    const renderTable = (rows) => {
        if (rows.length === 0) return;

        // parse cells
        const data = rows.map(r =>
            r.split('|').map(c => c.trim()).filter(c => c.length > 0)
        );
        // remove separator row (----)
        const filtered = data.filter(row => !row.every(c => /^[-:]+$/.test(c)));
        if (filtered.length === 0) return;

        const colCount = filtered[0].length;
        const colW = CONTENT_W / colCount;
        const rowH = 6;

        ensureSpace(filtered.length * rowH + 6);
        y += 3;

        filtered.forEach((row, ri) => {
            const isHeader = ri === 0;
            ensureSpace(rowH + 2);

            if (isHeader) {
                doc.setFont('times', 'bold');
                doc.setFontSize(9);
            } else {
                doc.setFont('times', 'normal');
                doc.setFontSize(9);
            }

            row.forEach((cell, ci) => {
                const cx = MARGIN_LEFT + ci * colW;
                const truncated = cell.length > 30 ? cell.slice(0, 28) + '…' : cell;
                doc.text(truncated, cx + 2, y);
            });

            // row bottom line
            if (isHeader) {
                doc.setLineWidth(0.5);
            } else {
                doc.setLineWidth(0.15);
            }
            doc.setDrawColor(0, 0, 0);
            doc.line(MARGIN_LEFT, y + 2, PAGE_W - MARGIN_RIGHT, y + 2);
            y += rowH;
        });

        y += 4;
    };

    for (const rawLine of mdLines) {
        const line = rawLine;

        // Code block fences
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                flushCode();
            } else {
                flushTable();
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeLines.push(line);
            continue;
        }

        // Table rows
        if (line.trim().startsWith('|')) {
            inTable = true;
            tableRows.push(line);
            continue;
        } else if (inTable) {
            flushTable();
        }

        // Headings → subsections
        const h2Match = line.match(/^##\s+(.+)/);
        const h3Match = line.match(/^###\s+(.+)/);
        const h1Match = line.match(/^#\s+(.+)/);

        if (h1Match) {
            sectionTitle(cleanMd(h1Match[1]));
            subCounter = 0;
            continue;
        }
        if (h2Match) {
            subCounter++;
            subsectionTitle(cleanMd(h2Match[1]), subCounter);
            continue;
        }
        if (h3Match) {
            // Render as bold paragraph
            ensureSpace(8);
            y += 3;
            writeText(cleanMd(h3Match[1]), { style: 'bolditalic', size: 10.5 });
            y += 1;
            continue;
        }

        // Horizontal rules
        if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
            rule(0.3);
            continue;
        }

        // Bullet lists
        const bulletMatch = line.match(/^(\s*)[-*+]\s+(.+)/);
        if (bulletMatch) {
            const depth = Math.floor((bulletMatch[1] || '').length / 2);
            const indent = 6 + depth * 5;
            ensureSpace(LINE_HEIGHT + 1);
            doc.setFont('times', 'normal');
            doc.setFontSize(11);
            doc.text('•', MARGIN_LEFT + indent - 4, y);
            writeText(cleanMd(bulletMatch[2]), { indent, size: 10.5 });
            continue;
        }

        // Numbered lists
        const numMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
        if (numMatch) {
            const depth = Math.floor((numMatch[1] || '').length / 2);
            const indent = 6 + depth * 5;
            ensureSpace(LINE_HEIGHT + 1);
            writeText(cleanMd(numMatch[2]), { indent, size: 10.5 });
            continue;
        }

        // Empty line = paragraph gap
        if (line.trim() === '') {
            y += PARAGRAPH_GAP;
            continue;
        }

        // Normal text
        writeText(cleanMd(line), { size: 11 });
    }

    // flush remaining
    flushTable();
    flushCode();

    /* ──────────────────────────────────────────────
     *  DISCLAIMER SECTION
     * ────────────────────────────────────────────── */
    y += 6;
    rule(0.3);
    sectionTitle('Disclaimer');
    writeText(
        'This report was automatically generated by the K2 AI Decision Engine. ' +
        'Data sourced via K2 logical data fabric. Results should be validated before critical decision-making.',
        { size: 10, style: 'italic', color: [80, 80, 80] }
    );

    /* ── Add footers to every page ── */
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('times', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        const pageText = `– ${i} / ${totalPages} –`;
        const ptw = doc.getTextWidth(pageText);
        doc.text(pageText, (PAGE_W - ptw) / 2, PAGE_H - 12);
        doc.text('K2 AI Decision Engine', MARGIN_LEFT, PAGE_H - 12);
        doc.text(timestamp, PAGE_W - MARGIN_RIGHT - doc.getTextWidth(timestamp), PAGE_H - 12);
        doc.setTextColor(0, 0, 0);
    }

    /* ── Save ── */
    doc.save('K2_Report.pdf');
}

/**
 * Strip basic markdown formatting for plain text rendering:
 * bold, italic, inline code, links
 */
function cleanMd(text) {
    return text
        .replaceAll(/\*\*(.+?)\*\*/g, '$1')   // bold
        .replaceAll(/__(.+?)__/g, '$1')        // bold alt
        .replaceAll(/\*(.+?)\*/g, '$1')        // italic
        .replaceAll(/_(.+?)_/g, '$1')          // italic alt
        .replaceAll(/`(.+?)`/g, '$1')          // inline code
        .replaceAll(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // links
        .replaceAll(/~~(.+?)~~/g, '$1');       // strikethrough
}
