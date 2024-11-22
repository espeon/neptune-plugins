import type { IpcRenderer } from "electron";

declare global {
	interface Window {
		electron: {
			ipcRenderer: IpcRenderer;
		};
	}

	module "file://*" {
		const value: string;
		export default value;
	}
}