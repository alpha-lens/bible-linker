import { __awaiter } from "tslib";
import { Modal, Notice, TFile } from "obsidian";
import { parseVerses, findVerseContent } from "./utils";
const BOOK_NAME_MAP = {
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
    constructor(app, editor, settings) {
        super(app);
        this.editor = editor;
        this.settings = settings;
    }
    onOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            const { contentEl } = this;
            contentEl.createEl("h2", { text: "성경 절 찾기" });
            // 다중 역본일 때만 드롭다운 생성
            let versionSelect = null;
            if (this.settings.multiVersion && this.settings.versions.length > 0) {
                versionSelect = contentEl.createEl("select");
                this.settings.versions.forEach((v) => {
                    if (versionSelect) {
                        const option = document.createElement("option");
                        option.text = v;
                        versionSelect.appendChild(option);
                    }
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
            resultDiv.style.marginTop = "1em";
            const insertButton = contentEl.createEl("button", { text: "삽입" });
            insertButton.style.marginTop = "1em";
            insertButton.disabled = true;
            let lastResult = "";
            input.addEventListener("keydown", (event) => __awaiter(this, void 0, void 0, function* () {
                if (event.key === "Enter") {
                    const verseInput = input.value.trim();
                    const parsed = parseVerses(verseInput);
                    if (!parsed) {
                        new Notice("올바른 형식이 아닙니다. 예: 창1:1-2");
                        return;
                    }
                    const { book, chapter, verses } = parsed;
                    const bookName = BOOK_NAME_MAP[book] || book;
                    let selectedVersion = versionSelect
                        ? versionSelect.value
                        : this.settings.defaultVersion;
                    const filePath = this.settings.multiVersion
                        ? `${this.settings.bibleRoot}/${selectedVersion}/${book}/${book}${chapter}.md`
                        : `${this.settings.bibleRoot}/${book}/${book}${chapter}.md`;
                    const file = this.app.vault.getAbstractFileByPath(filePath);
                    if (!(file instanceof TFile)) {
                        new Notice(`파일을 찾을 수 없습니다: ${filePath}`);
                        return;
                    }
                    try {
                        const content = yield this.app.vault.read(file);
                        const results = verses.map((verse) => {
                            const verseContent = findVerseContent(content, verse);
                            return verseContent
                                ? `${book}${chapter}:${verse} ${verseContent}`
                                : `${book}${chapter}:${verse} (본문 없음)`;
                        });
                        const outputFormat = formatSelect.value;
                        switch (outputFormat) {
                            case "inline":
                                lastResult =
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
                                lastResult =
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
                                lastResult =
                                    `>[!note]+ ${bookName} ${chapter}장\n` +
                                        results
                                            .map((r) => {
                                            const colonIdx = r.indexOf(":");
                                            return colonIdx !== -1
                                                ? `> ${r
                                                    .slice(colonIdx + 1)
                                                    .trim()}`
                                                : `> ${r}`;
                                        })
                                            .join("\n");
                                break;
                        }
                        resultDiv.innerText = lastResult;
                        insertButton.disabled = false;
                    }
                    catch (err) {
                        console.error(err);
                        new Notice("파일을 읽는 도중 오류가 발생했습니다.");
                    }
                }
            }));
            insertButton.addEventListener("click", () => {
                if (lastResult) {
                    this.editor.replaceRange(lastResult, this.editor.getCursor());
                    new Notice("본문이 삽입되었습니다.");
                    this.close();
                }
            });
            // input 기본 포커스
            setTimeout(() => input.focus(), 0);
        });
    }
    onClose() {
        this.contentEl.empty();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb2RhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFPLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFVLE1BQU0sVUFBVSxDQUFDO0FBRTdELE9BQU8sRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFFeEQsTUFBTSxhQUFhLEdBQTJCO0lBQzdDLENBQUMsRUFBRSxLQUFLO0lBQ1IsQ0FBQyxFQUFFLE1BQU07SUFDVCxDQUFDLEVBQUUsS0FBSztJQUNSLENBQUMsRUFBRSxLQUFLO0lBQ1IsQ0FBQyxFQUFFLEtBQUs7SUFDUixDQUFDLEVBQUUsTUFBTTtJQUNULENBQUMsRUFBRSxLQUFLO0lBQ1IsQ0FBQyxFQUFFLElBQUk7SUFDUCxFQUFFLEVBQUUsTUFBTTtJQUNWLEVBQUUsRUFBRSxNQUFNO0lBQ1YsRUFBRSxFQUFFLE1BQU07SUFDVixFQUFFLEVBQUUsTUFBTTtJQUNWLEVBQUUsRUFBRSxLQUFLO0lBQ1QsRUFBRSxFQUFFLEtBQUs7SUFDVCxDQUFDLEVBQUUsS0FBSztJQUNSLENBQUMsRUFBRSxNQUFNO0lBQ1QsQ0FBQyxFQUFFLEtBQUs7SUFDUixDQUFDLEVBQUUsSUFBSTtJQUNQLENBQUMsRUFBRSxJQUFJO0lBQ1AsQ0FBQyxFQUFFLElBQUk7SUFDUCxDQUFDLEVBQUUsS0FBSztJQUNSLENBQUMsRUFBRSxJQUFJO0lBQ1AsQ0FBQyxFQUFFLEtBQUs7SUFDUixDQUFDLEVBQUUsTUFBTTtJQUNULENBQUMsRUFBRSxRQUFRO0lBQ1gsQ0FBQyxFQUFFLEtBQUs7SUFDUixDQUFDLEVBQUUsS0FBSztJQUNSLENBQUMsRUFBRSxLQUFLO0lBQ1IsQ0FBQyxFQUFFLElBQUk7SUFDUCxDQUFDLEVBQUUsS0FBSztJQUNSLENBQUMsRUFBRSxLQUFLO0lBQ1IsQ0FBQyxFQUFFLElBQUk7SUFDUCxDQUFDLEVBQUUsSUFBSTtJQUNQLENBQUMs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Q0FDRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgVEZpbGUsIEVkaXRvciB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBCaWJsZUxpbmtlclNldHRpbmdzLCBPdXRwdXRGb3JtYXQgfSBmcm9tIFwiLi9zZXR0aW5nc1wiO1xyXG5pbXBvcnQgeyBwYXJzZVZlcnNlcywgZmluZFZlcnNlQ29udGVudCB9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5jb25zdCBCT09LX05BTUVfTUFQOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xyXG5cdOywvTogXCLssL3shLjquLBcIixcclxuXHTstpw6IFwi7Lac7JWg6rW96riwXCIsXHJcblx066CIOiBcIuugiOychOq4sFwiLFxyXG5cdOuvvDogXCLrr7zsiJjquLBcIixcclxuXHTsi6A6IFwi7Iug66qF6riwXCIsXHJcblx07IiYOiBcIuyXrO2YuOyImOyVhFwiLFxyXG5cdOyCvzogXCLsgqzsgqzquLBcIixcclxuXHTro7s6IFwi66O76riwXCIsXHJcblx07IK87IOBOiBcIuyCrOustOyXmOyDgVwiLFxyXG5cdOyCvO2VmDogXCLsgqzrrLTsl5jtlZhcIixcclxuXHTsmZXsg4E6IFwi7Je07JmV6riw7IOBXCIsXHJcblx07JmV7ZWYOiBcIuyXtOyZleq4sO2VmFwiLFxyXG5cdOuMgOyDgTogXCLsl63rjIDsg4FcIixcclxuXHTrjIDtlZg6IFwi7Jet64yA7ZWYXCIsXHJcblx07IqkOiBcIuyXkOyKpOudvFwiLFxyXG5cdOuKkDogXCLripDtl6Trr7jslbxcIixcclxuXHTsl5A6IFwi7JeQ7Iqk642UXCIsXHJcblx07JqlOiBcIuyapeq4sFwiLFxyXG5cdOyLnDogXCLsi5ztjrhcIixcclxuXHTsnqA6IFwi7J6g7Ja4XCIsXHJcblx07KCEOiBcIuyghOuPhOyEnFwiLFxyXG5cdOyVhDogXCLslYTqsIBcIixcclxuXHTsgqw6IFwi7J207IKs7JW8XCIsXHJcblx066CYOiBcIuyYiOugiOuvuOyVvFwiLFxyXG5cdOyVoDogXCLsmIjroIjrr7jslbzslaDqsIBcIixcclxuXHTqspQ6IFwi7JeQ7Iqk6rKUXCIsXHJcblx064uoOiBcIuuLpOuLiOyXmFwiLFxyXG5cdO2YuDogXCLtmLjshLjslYRcIixcclxuXHTsmpw6IFwi7JqU7JeYXCIsXHJcblx07JWUOiBcIuyVhOuqqOyKpFwiLFxyXG5cdOyYtTogXCLsmKTrsJTrjJxcIixcclxuXHTsmpg6IFwi7JqU64KYXCIsXHJcblx066+4OiBcIuuvuOqwgFwiLFxyXG5cdOuCmDogXCLrgpjtm5RcIixcclxuXHTtlak6IFwi7ZWY67CV6rWtXCIsXHJcblx07Iq1OiBcIuyKpOuwlOuDkFwiLFxyXG5cdO2VmTogXCLtlZnqsJxcIixcclxuXHTsiqU6IFwi7Iqk6rCA6560XCIsXHJcblx066eQOiBcIuunkOudvOq4sFwiLFxyXG5cdOuniDogXCLrp4jtg5zrs7XsnYxcIixcclxuXHTrp4k6IFwi66eI6rCA67O17J2MXCIsXHJcblx064iFOiBcIuuIhOqwgOuzteydjFwiLFxyXG5cdOyalDogXCLsmpTtlZzrs7XsnYxcIixcclxuXHTtlok6IFwi7IKs64+E7ZaJ7KCEXCIsXHJcblx066GsOiBcIuuhnOuniOyEnFwiLFxyXG5cdOqzoOyghDogXCLqs6DrprDrj4TsoITshJxcIixcclxuXHTqs6Dtm4Q6IFwi6rOg66aw64+E7ZuE7IScXCIsXHJcblx06rCIOiBcIuqwiOudvOuUlOyVhOyEnFwiLFxyXG5cdOyXoTogXCLsl5DrsqDshozshJxcIixcclxuXHTruYw6IFwi67mM66a967O07IScXCIsXHJcblx06rOoOiBcIuqzqOuhnOyDiOyEnFwiLFxyXG5cdOyCtOyghDogXCLrjbDsgrTroZzri4jqsIDsoITshJxcIixcclxuXHTsgrTtm4Q6IFwi642w7IK066Gc64uI6rCA7ZuE7IScXCIsXHJcblx065Sk7KCEOiBcIuuUlOuqqOuNsOyghOyEnFwiLFxyXG5cdOuUpO2bhDogXCLrlJTrqqjrjbDtm4TshJxcIixcclxuXHTrlJs6IFwi65SU64+E7IScXCIsXHJcblx066qsOiBcIuu5jOugiOuqrOyEnFwiLFxyXG5cdO2eiDogXCLtnojruIzrpqzshJxcIixcclxuXHTslb06IFwi7JW86rOg67O07IScXCIsXHJcblx067Kn7KCEOiBcIuuyoOuTnOuhnOyghOyEnFwiLFxyXG5cdOuyp+2bhDogXCLrsqDrk5zroZztm4TshJxcIixcclxuXHTsmpTsnbw6IFwi7JqU7ZWc7J287IScXCIsXHJcblx07JqU7J20OiBcIuyalO2VnOydtOyEnFwiLFxyXG5cdOyalOyCvDogXCLsmpTtlZzsgrzshJxcIixcclxuXHTsnKA6IFwi7Jyg64uk7IScXCIsXHJcblx06rOEOiBcIuyalO2VnOqzhOyLnOuhnVwiLFxyXG59O1xyXG5cclxuZXhwb3J0IGNsYXNzIEJpYmxlTGlua2VyTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XHJcblx0c2V0dGluZ3M6IEJpYmxlTGlua2VyU2V0dGluZ3M7XHJcblx0ZWRpdG9yOiBFZGl0b3I7XHJcblxyXG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwLCBlZGl0b3I6IEVkaXRvciwgc2V0dGluZ3M6IEJpYmxlTGlua2VyU2V0dGluZ3MpIHtcclxuXHRcdHN1cGVyKGFwcCk7XHJcblx0XHR0aGlzLmVkaXRvciA9IGVkaXRvcjtcclxuXHRcdHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcclxuXHR9XHJcblxyXG5cdGFzeW5jIG9uT3BlbigpIHtcclxuXHRcdGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xyXG5cdFx0Y29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIuyEseqyvSDsoIgg7LC+6riwXCIgfSk7XHJcblxyXG5cdFx0Ly8g64uk7KSRIOyXreuzuOydvCDrlYzrp4wg65Oc66Gt64uk7Jq0IOyDneyEsVxyXG5cdFx0bGV0IHZlcnNpb25TZWxlY3Q6IEhUTUxTZWxlY3RFbGVtZW50IHwgbnVsbCA9IG51bGw7XHJcblx0XHRpZiAodGhpcy5zZXR0aW5ncy5tdWx0aVZlcnNpb24gJiYgdGhpcy5zZXR0aW5ncy52ZXJzaW9ucy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdHZlcnNpb25TZWxlY3QgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJzZWxlY3RcIik7XHJcblx0XHRcdHRoaXMuc2V0dGluZ3MudmVyc2lvbnMuZm9yRWFjaCgodikgPT4ge1xyXG5cdFx0XHRcdGlmICh2ZXJzaW9uU2VsZWN0KSB7XHJcblx0XHRcdFx0XHRjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xyXG5cdFx0XHRcdFx0b3B0aW9uLnRleHQgPSB2O1xyXG5cdFx0XHRcdFx0dmVyc2lvblNlbGVjdC5hcHBlbmRDaGlsZChvcHRpb24pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8g7Lac66ClIO2YleyLnVxyXG5cdFx0Y29uc3QgZm9ybWF0U2VsZWN0ID0gY29udGVudEVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xyXG5cdFx0W1wiaW5saW5lXCIsIFwidmVyc2VCbG9ja1wiLCBcImNhbGxvdXRcIl0uZm9yRWFjaCgoZm9ybWF0KSA9PiB7XHJcblx0XHRcdGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvcHRpb25cIik7XHJcblx0XHRcdG9wdGlvbi52YWx1ZSA9IGZvcm1hdDtcclxuXHRcdFx0b3B0aW9uLnRleHQgPVxyXG5cdFx0XHRcdGZvcm1hdCA9PT0gXCJpbmxpbmVcIlxyXG5cdFx0XHRcdFx0PyBcIuyduOudvOyduFwiXHJcblx0XHRcdFx0XHQ6IGZvcm1hdCA9PT0gXCJ2ZXJzZUJsb2NrXCJcclxuXHRcdFx0XHRcdD8gXCLsoIjrs4Qg67iU66GdXCJcclxuXHRcdFx0XHRcdDogXCLsvZzslYTsm4NcIjtcclxuXHRcdFx0Zm9ybWF0U2VsZWN0LmFwcGVuZENoaWxkKG9wdGlvbik7XHJcblx0XHR9KTtcclxuXHRcdGZvcm1hdFNlbGVjdC52YWx1ZSA9IHRoaXMuc2V0dGluZ3Mub3V0cHV0Rm9ybWF0O1xyXG5cclxuXHRcdC8vIOqygOyDiSDsnoXroKXssL1cclxuXHRcdGNvbnN0IGlucHV0ID0gY29udGVudEVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xyXG5cdFx0XHR0eXBlOiBcInRleHRcIixcclxuXHRcdFx0cGxhY2Vob2xkZXI6IFwi7JiIOiDssL0xOjEtMlwiLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0Y29uc3QgcmVzdWx0RGl2ID0gY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIpO1xyXG5cdFx0cmVzdWx0RGl2LnN0eWxlLm1hcmdpblRvcCA9IFwiMWVtXCI7XHJcblxyXG5cdFx0Y29uc3QgaW5zZXJ0QnV0dG9uID0gY29udGVudEVsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCLsgr3snoVcIiB9KTtcclxuXHRcdGluc2VydEJ1dHRvbi5zdHlsZS5tYXJnaW5Ub3AgPSBcIjFlbVwiO1xyXG5cdFx0aW5zZXJ0QnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuXHJcblx0XHRsZXQgbGFzdFJlc3VsdCA9IFwiXCI7XHJcblxyXG5cdFx0aW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgYXN5bmMgKGV2ZW50KSA9PiB7XHJcblx0XHRcdGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIikge1xyXG5cdFx0XHRcdGNvbnN0IHZlcnNlSW5wdXQgPSBpbnB1dC52YWx1ZS50cmltKCk7XHJcblx0XHRcdFx0Y29uc3QgcGFyc2VkID0gcGFyc2VWZXJzZXModmVyc2VJbnB1dCk7XHJcblx0XHRcdFx0aWYgKCFwYXJzZWQpIHtcclxuXHRcdFx0XHRcdG5ldyBOb3RpY2UoXCLsmKzrsJTrpbgg7ZiV7Iud7J20IOyVhOuLmeuLiOuLpC4g7JiIOiDssL0xOjEtMlwiKTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGNvbnN0IHsgYm9vaywgY2hhcHRlciwgdmVyc2VzIH0gPSBwYXJzZWQ7XHJcblx0XHRcdFx0Y29uc3QgYm9va05hbWUgPSBCT09LX05BTUVfTUFQW2Jvb2tdIHx8IGJvb2s7XHJcblxyXG5cdFx0XHRcdGxldCBzZWxlY3RlZFZlcnNpb24gPSB2ZXJzaW9uU2VsZWN0XHJcblx0XHRcdFx0XHQ/IHZlcnNpb25TZWxlY3QudmFsdWVcclxuXHRcdFx0XHRcdDogdGhpcy5zZXR0aW5ncy5kZWZhdWx0VmVyc2lvbjtcclxuXHJcblx0XHRcdFx0Y29uc3QgZmlsZVBhdGggPSB0aGlzLnNldHRpbmdzLm11bHRpVmVyc2lvblxyXG5cdFx0XHRcdFx0PyBgJHt0aGlzLnNldHRpbmdzLmJpYmxlUm9vdH0vJHtzZWxlY3RlZFZlcnNpb259LyR7Ym9va30vJHtib29rfSR7Y2hhcHRlcn0ubWRgXHJcblx0XHRcdFx0XHQ6IGAke3RoaXMuc2V0dGluZ3MuYmlibGVSb290fS8ke2Jvb2t9LyR7Ym9va30ke2NoYXB0ZXJ9Lm1kYDtcclxuXHJcblx0XHRcdFx0Y29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChmaWxlUGF0aCk7XHJcblx0XHRcdFx0aWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xyXG5cdFx0XHRcdFx0bmV3IE5vdGljZShg7YyM7J287J2EIOywvuydhCDsiJgg7JeG7Iq164uI64ukOiAke2ZpbGVQYXRofWApO1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xyXG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0cyA9IHZlcnNlcy5tYXAoKHZlcnNlKSA9PiB7XHJcblx0XHRcdFx0XHRcdGNvbnN0IHZlcnNlQ29udGVudCA9IGZpbmRWZXJzZUNvbnRlbnQoY29udGVudCwgdmVyc2UpO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gdmVyc2VDb250ZW50XHJcblx0XHRcdFx0XHRcdFx0PyBgJHtib29rfSR7Y2hhcHRlcn06JHt2ZXJzZX0gJHt2ZXJzZUNvbnRlbnR9YFxyXG5cdFx0XHRcdFx0XHRcdDogYCR7Ym9va30ke2NoYXB0ZXJ9OiR7dmVyc2V9ICjrs7jrrLgg7JeG7J2MKWA7XHJcblx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0XHRjb25zdCBvdXRwdXRGb3JtYXQgPSBmb3JtYXRTZWxlY3QudmFsdWUgYXMgT3V0cHV0Rm9ybWF0O1xyXG5cclxuXHRcdFx0XHRcdHN3aXRjaCAob3V0cHV0Rm9ybWF0KSB7XHJcblx0XHRcdFx0XHRcdGNhc2UgXCJpbmxpbmVcIjpcclxuXHRcdFx0XHRcdFx0XHRsYXN0UmVzdWx0ID1cclxuXHRcdFx0XHRcdFx0XHRcdGAke2Jvb2tOYW1lfSAke2NoYXB0ZXJ97J6lXFxuYCArXHJcblx0XHRcdFx0XHRcdFx0XHRyZXN1bHRzXHJcblx0XHRcdFx0XHRcdFx0XHRcdC5tYXAoKHIpID0+IHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBjb2xvbklkeCA9IHIuaW5kZXhPZihcIjpcIik7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGNvbG9uSWR4ICE9PSAtMVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0PyByLnNsaWNlKGNvbG9uSWR4ICsgMSkudHJpbSgpXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQ6IHI7XHJcblx0XHRcdFx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRcdFx0XHRcdC5qb2luKFwiIFwiKTtcclxuXHRcdFx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRcdFx0Y2FzZSBcInZlcnNlQmxvY2tcIjpcclxuXHRcdFx0XHRcdFx0XHRsYXN0UmVzdWx0ID1cclxuXHRcdFx0XHRcdFx0XHRcdGAke2Jvb2tOYW1lfSAke2NoYXB0ZXJ97J6lXFxuYCArXHJcblx0XHRcdFx0XHRcdFx0XHRyZXN1bHRzXHJcblx0XHRcdFx0XHRcdFx0XHRcdC5tYXAoKHIpID0+IHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBjb2xvbklkeCA9IHIuaW5kZXhPZihcIjpcIik7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGNvbG9uSWR4ICE9PSAtMVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0PyByLnNsaWNlKGNvbG9uSWR4ICsgMSkudHJpbSgpXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQ6IHI7XHJcblx0XHRcdFx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRcdFx0XHRcdC5qb2luKFwiXFxuXCIpO1xyXG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdFx0XHRjYXNlIFwiY2FsbG91dFwiOlxyXG5cdFx0XHRcdFx0XHRcdGxhc3RSZXN1bHQgPVxyXG5cdFx0XHRcdFx0XHRcdFx0YD5bIW5vdGVdKyAke2Jvb2tOYW1lfSAke2NoYXB0ZXJ97J6lXFxuYCArXHJcblx0XHRcdFx0XHRcdFx0XHRyZXN1bHRzXHJcblx0XHRcdFx0XHRcdFx0XHRcdC5tYXAoKHIpID0+IHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBjb2xvbklkeCA9IHIuaW5kZXhPZihcIjpcIik7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGNvbG9uSWR4ICE9PSAtMVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0PyBgPiAke3JcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQuc2xpY2UoY29sb25JZHggKyAxKVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC50cmltKCl9YFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0OiBgPiAke3J9YDtcclxuXHRcdFx0XHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdFx0XHRcdFx0LmpvaW4oXCJcXG5cIik7XHJcblx0XHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0cmVzdWx0RGl2LmlubmVyVGV4dCA9IGxhc3RSZXN1bHQ7XHJcblx0XHRcdFx0XHRpbnNlcnRCdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcclxuXHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuXHRcdFx0XHRcdG5ldyBOb3RpY2UoXCLtjIzsnbzsnYQg7J2964qUIOuPhOykkSDsmKTrpZjqsIAg67Cc7IOd7ZaI7Iq164uI64ukLlwiKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cclxuXHRcdGluc2VydEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG5cdFx0XHRpZiAobGFzdFJlc3VsdCkge1xyXG5cdFx0XHRcdHRoaXMuZWRpdG9yLnJlcGxhY2VSYW5nZShsYXN0UmVzdWx0LCB0aGlzLmVkaXRvci5nZXRDdXJzb3IoKSk7XHJcblx0XHRcdFx0bmV3IE5vdGljZShcIuuzuOusuOydtCDsgr3snoXrkJjsl4jsirXri4jri6QuXCIpO1xyXG5cdFx0XHRcdHRoaXMuY2xvc2UoKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gaW5wdXQg6riw67O4IO2PrOy7pOyKpFxyXG5cdFx0c2V0VGltZW91dCgoKSA9PiBpbnB1dC5mb2N1cygpLCAwKTtcclxuXHR9XHJcblxyXG5cdG9uQ2xvc2UoKSB7XHJcblx0XHR0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xyXG5cdH1cclxufVxyXG4iXX0=