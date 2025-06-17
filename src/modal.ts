import { App, Modal, Notice, TFile, Editor } from "obsidian";
import { BibleLinkerSettings, OutputFormat } from "./settings";
import { parseVerses, findVerseContent } from "./utils";

const BOOK_NAME_MAP: Record<string, string> = {
	창: "창세기",
	출: "출애굽기",
	레: "레위기",
	민: "민수기",
	신: "신명기",
	수: "여호수아",
	삿: "사사기",
	룻: "룻기",
	삼상: "사무엘상",
	삼하: "사무엘하",
	왕상: "열왕기상",
	왕하: "열왕기하",
	대상: "역대상",
	대하: "역대하",
	스: "에스라",
	느: "느헤미야",
	에: "에스더",
	욥: "욥기",
	시: "시편",
	잠: "잠언",
	전: "전도서",
	아: "아가",
	사: "이사야",
	렘: "예레미야",
	애: "예레미야애가",
	겔: "에스겔",
	단: "다니엘",
	호: "호세아",
	욜: "요엘",
	암: "아모스",
	옵: "오바댜",
	욘: "요나",
	미: "미가",
	나: "나훔",
	합: "하박국",
	습: "스바냐",
	학: "학개",
	슥: "스가랴",
	말: "말라기",
	마: "마태복음",
	막: "마가복음",
	눅: "누가복음",
	요: "요한복음",
	행: "사도행전",
	롬: "로마서",
	고전: "고린도전서",
	고후: "고린도후서",
	갈: "갈라디아서",
	엡: "에베소서",
	빌: "빌립보서",
	골: "골로새서",
	살전: "데살로니가전서",
	살후: "데살로니가후서",
	딤전: "디모데전서",
	딤후: "디모데후서",
	딛: "디도서",
	몬: "빌레몬서",
	히: "히브리서",
	약: "야고보서",
	벧전: "베드로전서",
	벧후: "베드로후서",
	요일: "요한일서",
	요이: "요한이서",
	요삼: "요한삼서",
	유: "유다서",
	계: "요한계시록",
};

export class BibleLinkerModal extends Modal {
	settings: BibleLinkerSettings;
	editor: Editor;
	lastResult = "";

	constructor(app: App, editor: Editor, settings: BibleLinkerSettings) {
		super(app);
		this.editor = editor;
		this.settings = settings;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.addClass("bible-linker-modal");

		contentEl.createEl("h2", { text: "성경 절 찾기" });

		// 다중 역본
		let versionSelect: HTMLSelectElement | null = null;
		if (this.settings.multiVersion && this.settings.versions.length > 0) {
			versionSelect = contentEl.createEl("select");
			this.settings.versions.forEach((v) => {
				const option = document.createElement("option");
				option.text = v;
				versionSelect?.appendChild(option);
			});
		}

		// 출력 형식
		const formatSelect = contentEl.createEl("select");
		["inline", "verseBlock", "callout"].forEach((format) => {
			const option = document.createElement("option");
			option.value = format;
			option.text =
				format === "inline"
					? "인라인"
					: format === "verseBlock"
					? "절별 블록"
					: "콜아웃";
			formatSelect.appendChild(option);
		});
		formatSelect.value = this.settings.outputFormat;

		// 검색 입력창
		const input = contentEl.createEl("input", {
			type: "text",
			placeholder: "예: 창1:1-2",
		});

		const resultDiv = contentEl.createEl("div");
		resultDiv.classList.add("bible-verse-result");
		resultDiv.style.marginTop = "1em";

		const insertButton = contentEl.createEl("button", { text: "삽입" });
		insertButton.style.marginTop = "1em";
		insertButton.disabled = true;

		// 자동 업데이트
		input.addEventListener("input", async () => {
			await this.updateResult(
				input,
				resultDiv,
				formatSelect,
				versionSelect,
				insertButton
			);
		});

		// 엔터 키 삽입
		input.addEventListener("keydown", async (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				if (this.lastResult) {
					this.insertResult(this.lastResult);
				} else {
					await this.updateResult(
						input,
						resultDiv,
						formatSelect,
						versionSelect,
						insertButton
					);
					if (this.lastResult) {
						this.insertResult(this.lastResult);
					}
				}
			}
		});

		insertButton.addEventListener("click", () => {
			if (this.lastResult) {
				this.insertResult(this.lastResult);
			}
		});

		// input 기본 포커스
		setTimeout(() => input.focus(), 0);
	}

	async updateResult(
		input: HTMLInputElement,
		resultDiv: HTMLElement,
		formatSelect: HTMLSelectElement,
		versionSelect: HTMLSelectElement | null,
		insertButton: HTMLButtonElement
	) {
		const verseInput = input.value.trim();
		const parsed = parseVerses(verseInput);

		if (!parsed) {
			resultDiv.innerText = "올바른 형식이 아닙니다. 예: 창1:1-2";
			insertButton.disabled = true;
			this.lastResult = "";
			return;
		}

		const { book, chapter, verses } = parsed;
		const bookName = BOOK_NAME_MAP[book] || book;
		const selectedVersion = versionSelect
			? versionSelect.value
			: this.settings.defaultVersion;
		const filePath = this.settings.multiVersion
			? `${this.settings.bibleRoot}/${selectedVersion}/${book}/${book}${chapter}.md`
			: `${this.settings.bibleRoot}/${book}/${book}${chapter}.md`;

		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) {
			resultDiv.innerText = `파일을 찾을 수 없습니다: ${filePath}`;
			insertButton.disabled = true;
			this.lastResult = "";
			return;
		}

		try {
			const content = await this.app.vault.read(file);
			const results = verses.map((verse) => {
				const verseContent = findVerseContent(content, verse);
				return verseContent
					? `${book}${chapter}:${verse} ${verseContent}`
					: ``;
			});

			const outputFormat = formatSelect.value as OutputFormat;
			switch (outputFormat) {
				case "inline":
					this.lastResult =
						`${bookName} ${chapter}장\n` +
						results
							.map((r) => {
								const colonIdx = r.indexOf(":");
								return colonIdx !== -1
									? r.slice(colonIdx + 1).trim()
									: r;
							})
							.join(" ");
					break;
				case "verseBlock":
					this.lastResult =
						`${bookName} ${chapter}장\n` +
						results
							.map((r) => {
								const colonIdx = r.indexOf(":");
								return colonIdx !== -1
									? r.slice(colonIdx + 1).trim()
									: r;
							})
							.join("\n");
					break;
				case "callout":
					this.lastResult =
						`>[!note]+ ${bookName} ${chapter}장\n` +
						results
							.map((r) => {
								const colonIdx = r.indexOf(":");
								return colonIdx !== -1
									? `> ${r.slice(colonIdx + 1).trim()}`
									: `> ${r}`;
							})
							.join("\n");
					break;
			}

			resultDiv.innerText = this.lastResult;
			insertButton.disabled = false;
		} catch (err) {
			console.error(err);
			resultDiv.innerText = "파일을 읽는 도중 오류가 발생했습니다.";
			insertButton.disabled = true;
			this.lastResult = "";
		}
	}

	insertResult(result: string) {
		const cursor = this.editor.getCursor();
		// 1. 현재 커서 위치에 result 삽입
		this.editor.replaceRange(result, cursor);

		// 2. 삽입된 내용의 마지막 라인 번호 계산
		const insertedLines = result.split("\n").length;
		const newCursorLine = cursor.line + insertedLines - 1;
		const newCursorCh = this.editor.getLine(newCursorLine).length;

		// 3. 마지막 줄 끝에 두 줄 개행 추가
		this.editor.replaceRange("\n\n", {
			line: newCursorLine,
			ch: newCursorCh,
		});

		// 4. 커서를 개행 아래로 이동
		this.editor.setCursor({ line: newCursorLine + 2, ch: 0 });

		new Notice("본문이 삽입되었습니다.");
		this.close();
	}

	onClose() {
		this.contentEl.empty();
	}
}
