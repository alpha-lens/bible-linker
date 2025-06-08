import { App, PluginSettingTab, Setting } from "obsidian";
import { BibleLinkerSettings, OutputFormat } from "./settings";
import { parseVerses, findVerseContent } from "./utils";
import BibleLinkerPlugin from "../main";

export class BibleLinkerSettingTab extends PluginSettingTab {
	plugin: BibleLinkerPlugin;

	constructor(app: App, plugin: BibleLinkerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const settings = this.plugin.settings;

		containerEl.empty();
		containerEl.createEl("h2", { text: "Bible Linker Settings" });

		new Setting(containerEl)
			.setName("성경 루트 폴더")
			.setDesc("예: bible")
			.addText((text) =>
				text
					.setPlaceholder("bible")
					.setValue(settings.bibleRoot)
					.onChange(async (value) => {
						settings.bibleRoot = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("다중 역본 사용")
			.setDesc("여러 역본을 지원하려면 체크하세요.")
			.addToggle((toggle) =>
				toggle
					.setValue(settings.multiVersion)
					.onChange(async (value) => {
						settings.multiVersion = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		if (settings.multiVersion) {
			new Setting(containerEl)
				.setName("역본 목록")
				.setDesc("각 줄마다 역본 이름을 입력하세요.")
				.addTextArea((textArea) =>
					textArea
						.setPlaceholder("개역개정\n새번역\n흠정역\nNIV")
						.setValue(settings.versions.join("\n"))
						.onChange(async (value) => {
							settings.versions = value
								.split("\n")
								.map((v) => v.trim())
								.filter((v) => v.length > 0);
							await this.plugin.saveSettings();
						})
				);
		}

		new Setting(containerEl)
			.setName("출력 형식")
			.setDesc("성경 절 출력 형식을 선택하세요.")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("inline", "한 줄로 출력 (기본)")
					.addOption("verseBlock", "절 단위 블록")
					.addOption("callout", "Callout")
					.setValue(this.plugin.settings.outputFormat)
					.onChange(async (value: OutputFormat) => {
						this.plugin.settings.outputFormat = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
