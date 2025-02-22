import {
	BrowserWindow,
	dialog,
	shell,
	DownloadItem,
	WebContents,
} from "electron";
import { join, dirname } from "node:path";
import { ICON, DIST, preload, url } from "../main/contract";
import { getHistoryImg, getFilePath } from "../main/api";

const editImageHtml = join(DIST, "./clipScreen.html");
let editImageWin: BrowserWindow | null = null;
let savePath: string = "";
let downloadSet: Set<string> = new Set();

function createEditImageWin(search?: any): BrowserWindow {
	editImageWin = new BrowserWindow({
		title: "pear-rec 图片编辑",
		icon: ICON,
		height: 768,
		width: 1024,
		autoHideMenuBar: true, // 自动隐藏菜单栏
		webPreferences: {
			preload,
		},
	});

	const imgUrl = search?.imgUrl || "";

	if (url) {
		editImageWin.loadURL(url + `editImage.html?imgUrl=${imgUrl}`);
		// Open devTool if the app is not packaged
		editImageWin.webContents.openDevTools();
	} else {
		editImageWin.loadFile(editImageHtml, {
			hash: `?imgUrl=${imgUrl}`,
		});
	}

	editImageWin.once("ready-to-show", async () => {
		editImageWin?.show();
	});

	editImageWin?.webContents.session.on(
		"will-download",
		(e: any, item: DownloadItem, webContents: WebContents) => {
			const url = item.getURL();
			if (downloadSet.has(url)) {
				const fileName = item.getFilename();
				const filePath = getFilePath() as string;
				const imgPath = join(savePath || `${filePath}/ei`, `${fileName}`);
				item.setSavePath(imgPath);
				item.once("done", (event: any, state: any) => {
					if (state === "completed") {
						setTimeout(() => {
							shell.showItemInFolder(imgPath);
						}, 1000 * 0.5);
					}
				});
			}
		},
	);

	return editImageWin;
}

function openEditImageWin(search?: any) {
	if (!editImageWin || editImageWin?.isDestroyed()) {
		editImageWin = createEditImageWin(search);
	}
	editImageWin.show();
}

async function downloadEditImageWin(
	downloadUrl: string,
	isShowDialog?: boolean,
) {
	savePath = "";
	savePath = await showOpenDialogEditImageWin();
	editImageWin?.webContents.downloadURL(downloadUrl);
	downloadSet.add(downloadUrl);
}

async function showOpenDialogEditImageWin() {
	let res = await dialog.showOpenDialog({
		properties: ["openDirectory"],
	});

	const savePath = res.filePaths[0] || "";

	return savePath;
}

export { createEditImageWin, openEditImageWin, downloadEditImageWin };
