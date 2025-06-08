import { Plugin } from "obsidian";
import { BibleLinkerSettings, DEFAULT_SETTINGS } from "./src/settings";
import { BibleLinkerSettingTab } from "./src/settingTab";
import { BibleLinkerModal } from "./src/modal";

export default class BibleLinkerPlugin extends Plugin {
	settings: BibleLinkerSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new BibleLinkerSettingTab(this.app, this));

		this.addCommand({
			id: "open-bible-linker",
			name: "성경 절 찾기",
			editorCallback: (editor) => {
				new BibleLinkerModal(this.app, editor, this.settings).open();
			},
			hotkeys: [
				{
					modifiers: ["Mod", "Shift"],
					key: "b",
				},
			],
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
