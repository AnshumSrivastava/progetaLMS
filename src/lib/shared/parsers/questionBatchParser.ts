/**
 * Universal Batch Question Parser
 *
 * Supports:
 * - Direct Excel / Google Sheets Clipboard Copy (Tab-Separated / TSV)
 * - Comma-Separated Values (CSV)
 * - Pipe-Separated Values (PSV)
 * - Auto header detection and positional column fallback
 */

export interface ParsedOption {
	content: string;
	isCorrect: boolean;
}

export interface ParsedBatchQuestion {
	id?: string;
	content: string;
	options: ParsedOption[];
	correctOptionIndex: number;
	explanation?: string;
	points: number;
	isValid: boolean;
	errors: string[];
}

export interface BatchParseResult {
	questions: ParsedBatchQuestion[];
	totalParsed: number;
	validCount: number;
	invalidCount: number;
	delimiterDetected: 'tab' | 'comma' | 'pipe';
}

/**
 * Parses raw text copied from Excel, Google Sheets, or a CSV file.
 */
export function parseQuestionBatch(rawText: string): BatchParseResult {
	if (!rawText || !rawText.trim()) {
		return {
			questions: [],
			totalParsed: 0,
			validCount: 0,
			invalidCount: 0,
			delimiterDetected: 'tab'
		};
	}

	const lines = splitLinesRespectingQuotes(rawText.trim());
	if (lines.length === 0) {
		return {
			questions: [],
			totalParsed: 0,
			validCount: 0,
			invalidCount: 0,
			delimiterDetected: 'tab'
		};
	}

	// Detect delimiter from the first few non-empty lines
	const sample = lines.slice(0, 5).join('\n');
	const tabCount = (sample.match(/\t/g) || []).length;
	const commaCount = (sample.match(/,/g) || []).length;
	const pipeCount = (sample.match(/\|/g) || []).length;

	let delimiter = '\t';
	let delimiterName: 'tab' | 'comma' | 'pipe' = 'tab';

	if (commaCount > tabCount && commaCount > pipeCount) {
		delimiter = ',';
		delimiterName = 'comma';
	} else if (pipeCount > tabCount && pipeCount > commaCount) {
		delimiter = '|';
		delimiterName = 'pipe';
	}

	// Check if first row is a header row
	const firstRowCols = parseDelimitedRow(lines[0], delimiter);
	const hasHeader = isHeaderRow(firstRowCols);

	const startIdx = hasHeader ? 1 : 0;
	const questions: ParsedBatchQuestion[] = [];

	for (let i = startIdx; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const cols = parseDelimitedRow(line, delimiter);
		if (cols.length < 2) continue; // Skip malformed empty lines

		const parsedQ = parseRowToQuestion(cols);
		questions.push(parsedQ);
	}

	const validCount = questions.filter(q => q.isValid).length;

	return {
		questions,
		totalParsed: questions.length,
		validCount,
		invalidCount: questions.length - validCount,
		delimiterDetected: delimiterName
	};
}

/**
 * Parses a single row array into a structured question object with validation.
 */
export function parseRowToQuestion(cols: string[]): ParsedBatchQuestion {
	const errors: string[] = [];
	const questionText = (cols[0] || '').trim();

	if (!questionText) {
		errors.push('Question text is missing');
	}

	// Options can span from col 1 to 4 (or up to the correct answer column)
	// Positional format:
	// Col 0: Question
	// Col 1: Option A / Option 1
	// Col 2: Option B / Option 2
	// Col 3: Option C / Option 3 (optional)
	// Col 4: Option D / Option 4 (optional)
	// Col 5: Correct Answer (A/B/C/D, 1/2/3/4, or text)
	// Col 6: Explanation (optional)
	// Col 7: Points (optional)

	const rawOptA = (cols[1] || '').trim();
	const rawOptB = (cols[2] || '').trim();
	const rawOptC = (cols[3] || '').trim();
	const rawOptD = (cols[4] || '').trim();
	const rawCorrect = (cols[5] || '').trim();
	const rawExplanation = (cols[6] || '').trim();
	const rawPoints = parseInt((cols[7] || '').trim(), 10);

	const rawOptions = [rawOptA, rawOptB, rawOptC, rawOptD].filter(Boolean);

	if (rawOptions.length < 2) {
		errors.push('At least 2 non-empty options are required');
	}

	let correctIdx = resolveCorrectIndex(rawCorrect, rawOptions);

	if (correctIdx === -1) {
		if (rawOptions.length >= 2) {
			// If missing or unparseable, default to 0 and flag error or warning
			correctIdx = 0;
			if (!rawCorrect) {
				errors.push('No correct option specified (defaulted to Option A)');
			} else {
				errors.push(`Could not resolve correct answer "${rawCorrect}"`);
			}
		} else {
			correctIdx = 0;
		}
	}

	const options: ParsedOption[] = rawOptions.map((content, idx) => ({
		content,
		isCorrect: idx === correctIdx
	}));

	const points = isNaN(rawPoints) || rawPoints < 1 ? 1 : rawPoints;
	const isValid = errors.length === 0;

	return {
		content: questionText,
		options,
		correctOptionIndex: correctIdx,
		explanation: rawExplanation || undefined,
		points,
		isValid,
		errors
	};
}

/**
 * Resolves the 0-indexed correct option from various user formats (A, B, C, D, 1, 2, 3, 4, text match).
 */
export function resolveCorrectIndex(indicator: string, options: string[]): number {
	if (!indicator) return -1;
	const clean = indicator.trim().toLowerCase();

	// 1. Direct letter matching
	if (clean === 'a' || clean === 'opt a' || clean === 'option a' || clean === '(a)') return 0;
	if (clean === 'b' || clean === 'opt b' || clean === 'option b' || clean === '(b)') return 1;
	if (clean === 'c' || clean === 'opt c' || clean === 'option c' || clean === '(c)') return options.length > 2 ? 2 : -1;
	if (clean === 'd' || clean === 'opt d' || clean === 'option d' || clean === '(d)') return options.length > 3 ? 3 : -1;

	// 2. Numeric 1-based index matching
	if (clean === '1' || clean === 'option 1' || clean === 'opt 1') return 0;
	if (clean === '2' || clean === 'option 2' || clean === 'opt 2') return 1;
	if (clean === '3' || clean === 'option 3' || clean === 'opt 3') return options.length > 2 ? 2 : -1;
	if (clean === '4' || clean === 'option 4' || clean === 'opt 4') return options.length > 3 ? 3 : -1;

	// 3. String content matching
	const matchedIdx = options.findIndex(opt => opt.toLowerCase().trim() === clean);
	if (matchedIdx !== -1) return matchedIdx;

	return -1;
}

/**
 * Checks if the first row is a header row by checking for standard column names.
 */
function isHeaderRow(cols: string[]): boolean {
	if (cols.length === 0) return false;
	const first = cols[0].toLowerCase().trim();
	const second = (cols[1] || '').toLowerCase().trim();

	return (
		first.includes('question') ||
		first.includes('title') ||
		first.includes('prompt') ||
		second.includes('option') ||
		second.includes('opt') ||
		second.includes('answer')
	);
}

/**
 * Parses a single delimited row handling quotes.
 */
function parseDelimitedRow(line: string, delimiter: string): string[] {
	if (delimiter === '\t' || delimiter === '|') {
		return line.split(delimiter).map(s => s.replace(/^["']|["']$/g, '').trim());
	}

	// CSV quote-aware parsing
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === delimiter && !inQuotes) {
			result.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	result.push(current.trim());
	return result;
}

/**
 * Splits text into lines while respecting multiline quoted entries.
 */
function splitLinesRespectingQuotes(text: string): string[] {
	const lines: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (char === '"') {
			inQuotes = !inQuotes;
			current += char;
		} else if ((char === '\n' || char === '\r') && !inQuotes) {
			if (char === '\r' && text[i + 1] === '\n') {
				i++;
			}
			if (current.trim()) {
				lines.push(current);
			}
			current = '';
		} else {
			current += char;
		}
	}
	if (current.trim()) {
		lines.push(current);
	}
	return lines;
}

/**
 * Generates a downloadable CSV sample template.
 */
export function generateSampleCsvTemplate(): string {
	return `Question,Option A,Option B,Option C,Option D,Correct Option,Explanation,Points
"What is the primary function of an API Gateway?","Request routing and security","Database indexing","Frontend state management","CSS styling","A","API Gateways handle routing rate-limiting and auth",1
"Which protocol operates at the Transport Layer?","TCP","HTTP","DNS","SSH","1","TCP and UDP are Transport Layer protocols",1
"What does ACID stand for in databases?","Atomicity Consistency Isolation Durability","Automated Cache Ingestion Directory","Asynchronous Code Integration Daemon","Access Control Identity Domain","A","ACID guarantees database transaction validity",1
"In Kubernetes what is the smallest deployable unit?","Pod","Cluster","Namespace","Ingress","Pod","A Pod encapsulates one or more containers",1
"Which HTTP status code represents Unauthorized access?","401","403","404","500","401","401 indicates lack of valid authentication credentials",1`;
}

/**
 * Formats structured questions into Tab-Separated format for pasting into Excel.
 */
export function formatQuestionsAsTsv(questions: ParsedBatchQuestion[]): string {
	const header = 'Question\tOption A\tOption B\tOption C\tOption D\tCorrect Option\tExplanation\tPoints';
	const rows = questions.map(q => {
		const optA = q.options[0]?.content || '';
		const optB = q.options[1]?.content || '';
		const optC = q.options[2]?.content || '';
		const optD = q.options[3]?.content || '';
		const correctLetter = String.fromCharCode(65 + q.correctOptionIndex);
		const explanation = q.explanation || '';
		const points = q.points || 1;

		return `${q.content}\t${optA}\t${optB}\t${optC}\t${optD}\t${correctLetter}\t${explanation}\t${points}`;
	});

	return [header, ...rows].join('\n');
}
