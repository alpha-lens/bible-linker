export interface BibleLinkerSettings {
	bibleRoot: string;
	defaultVersion: string;
	multiVersion: boolean;
	versions: string[];
}

export const DEFAULT_SETTINGS: BibleLinkerSettings = {
	bibleRoot: "bible",
	defaultVersion: "개역개정",
	multiVersion: false,
	versions: [],
	outputFormat: "inline",
};

export type OutputFormat = "inline" | "verseBlock" | "callout";

export interface BibleLinkerSettings {
	bibleRoot: string;
	defaultVersion: string;
	multiVersion: boolean;
	versions: string[];
	outputFormat: OutputFormat;
}
