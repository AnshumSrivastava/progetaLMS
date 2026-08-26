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

	// Positional format:
	// Col 0: Question
	// Col 1: Correct Answer (Option A)
	// Col 2: Option B (Wrong)
	// Col 3: Option C (Wrong, optional)
	// Col 4: Option D (Wrong, optional)
	// Col 5: Explanation (optional)
	// Col 6: Points (optional)

	const rawOptA = (cols[1] || '').trim();
	const rawOptB = (cols[2] || '').trim();
	const rawOptC = (cols[3] || '').trim();
	const rawOptD = (cols[4] || '').trim();
	const rawExplanation = (cols[5] || '').trim();
	const rawPoints = parseInt((cols[6] || '').trim(), 10);

	const rawOptions = [rawOptA, rawOptB, rawOptC, rawOptD].filter(Boolean);

	if (rawOptions.length < 2) {
		errors.push('At least 1 correct answer and 1 wrong answer are required');
	}

	// Always Option A (index 0) is correct
	const options: ParsedOption[] = rawOptions.map((content, idx) => ({
		content,
		isCorrect: idx === 0
	}));

	const points = isNaN(rawPoints) || rawPoints < 1 ? 1 : rawPoints;
	const isValid = errors.length === 0;

	return {
		content: questionText,
		options,
		correctOptionIndex: 0,
		explanation: rawExplanation || undefined,
		points,
		isValid,
		errors
	};
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
		second.includes('answer') ||
		second.includes('correct')
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
	return `Question,Correct Answer,Wrong Answer 1,Wrong Answer 2,Wrong Answer 3,Explanation
"What is the primary function of an API Gateway?","Request routing and security","Database indexing","Frontend state management","CSS styling","API Gateways handle routing rate-limiting and auth"
"Which protocol operates at the Transport Layer?","TCP","HTTP","DNS","SSH","TCP and UDP are Transport Layer protocols"
"What does ACID stand for in databases?","Atomicity Consistency Isolation Durability","Automated Cache Ingestion Directory","Asynchronous Code Integration Daemon","Access Control Identity Domain","ACID guarantees database transaction validity"
"In Kubernetes what is the smallest deployable unit?","Pod","Cluster","Namespace","Ingress","A Pod encapsulates one or more containers"
"Which HTTP status code represents Unauthorized access?","401","403","404","500","401 indicates lack of valid authentication credentials"`;
}

/**
 * Formats structured questions into Tab-Separated format for pasting into Excel.
 */
export function formatQuestionsAsTsv(questions: ParsedBatchQuestion[]): string {
	const header = 'Question\tCorrect Answer\tWrong Answer 1\tWrong Answer 2\tWrong Answer 3\tExplanation';
	const rows = questions.map(q => {
		const optA = q.options[0]?.content || '';
		const optB = q.options[1]?.content || '';
		const optC = q.options[2]?.content || '';
		const optD = q.options[3]?.content || '';
		const explanation = q.explanation || '';

		return `${q.content}\t${optA}\t${optB}\t${optC}\t${optD}\t${explanation}`;
	});

	return [header, ...rows].join('\n');
}
