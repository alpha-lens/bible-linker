/**
 * 성경 절 파싱 함수
 * 예: 창1:1,3-5 → [1,3,4,5]
 */
export function parseVerses(
	input: string
): { book: string; chapter: string; verses: number[] } | null {
	const match = input.match(/^([가-힣]+)(\d+):([\d, -]+)$/);
	if (!match) return null;

	const [, book, chapter, versePart] = match;
	const verses: number[] = [];

	versePart.split(",").forEach((part) => {
		if (part.includes("-")) {
			const [start, end] = part.split("-").map((v) => parseInt(v.trim()));
			for (let i = start; i <= end; i++) {
				verses.push(i);
			}
		} else {
			verses.push(parseInt(part.trim()));
		}
	});

	return { book, chapter, verses };
}

/**
 * 파일 내용에서 특정 절 찾기
 */
export function findVerseContent(
	content: string,
	verse: number
): string | null {
	const regex = new RegExp(`#\\s*${verse}\\s*\\n([\\s\\S]*?)(?=\\n#|$)`, "m");
	const match = content.match(regex);
	return match && match[1] ? match[1].trim() : null;
}
