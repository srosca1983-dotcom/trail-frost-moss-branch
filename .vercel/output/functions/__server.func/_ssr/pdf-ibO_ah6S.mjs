import { _ as shouldSplitPacket, h as pickPacketTextPages, l as looksLikeSash, m as pickPacketImagePages, v as textHasReadableName, y as textLooksTyped } from "./parse-fields-D8gZUQV3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pdf-ibO_ah6S.js
var TICKET_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/tiff,.pdf,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.tif,.tiff,.bmp";
function ticketFileProblem(file) {
	const n = file.name.toLowerCase();
	if (/\.(docx?|xlsx?|pptx?)$/.test(n)) return `${file.name} is Word/Excel. Save it as a PDF or photograph the page.`;
	if (/\.(zip|rar|7z)$/.test(n)) return `${file.name} is a zip. Open it and drop the PDFs themselves.`;
	const isPdf = n.endsWith(".pdf") || file.type === "application/pdf";
	const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|heic|heif|tiff?)$/.test(n);
	if (!isPdf && !isImage) return `${file.name} is not a PDF or a photo of the ticket`;
	if (file.size > 33554432) return `${file.name} is over 32 MB`;
	return null;
}
var pdfjsCached = null;
async function loadPdfjs() {
	if (pdfjsCached) return pdfjsCached;
	const pdfjs = await import("../_libs/pdfjs-dist.mjs").then((n) => n.t);
	const worker = await import("./pdf.worker.min-CA4SejP6.mjs");
	pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
	pdfjsCached = pdfjs;
	return pdfjs;
}
async function jpegFromBlob(file, maxEdge = 1280, quality = .75) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
	const w = Math.max(1, Math.round(bitmap.width * scale));
	const h = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas unavailable");
	ctx.drawImage(bitmap, 0, 0, w, h);
	bitmap.close();
	const url = canvas.toDataURL("image/jpeg", quality);
	canvas.width = 0;
	canvas.height = 0;
	return url;
}
async function packetFromImage(file) {
	try {
		const image = await jpegFromBlob(file);
		return {
			filename: file.name,
			pageCount: 1,
			pages: [{
				text: "",
				image
			}]
		};
	} catch {
		throw new Error("Could not read that photo. Try a JPEG/PNG, or save the cert as a PDF.");
	}
}
async function pageText(pdf, i) {
	return (await (await pdf.getPage(i)).getTextContent()).items.map((it) => "str" in it ? String(it.str) : "").join(" ").replace(/\s+/g, " ").trim().slice(0, 2200);
}
async function renderPageJpeg(pdf, i) {
	const page = await pdf.getPage(i);
	const base = page.getViewport({ scale: 1 });
	const scale = Math.min(1.55, 1280 / base.width);
	const viewport = page.getViewport({ scale });
	const canvas = document.createElement("canvas");
	canvas.width = Math.floor(viewport.width);
	canvas.height = Math.floor(viewport.height);
	const ctx = canvas.getContext("2d");
	if (!ctx) return void 0;
	await page.render({
		canvasContext: ctx,
		viewport,
		canvas
	}).promise;
	const image = canvas.toDataURL("image/jpeg", .75);
	canvas.width = 0;
	canvas.height = 0;
	return image;
}
async function packetFromPdf(file, maxPages = 32) {
	const pdfjs = await loadPdfjs();
	const data = await file.arrayBuffer();
	let pdf;
	try {
		pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
	} catch (e) {
		const msg = e instanceof Error ? e.message : "";
		if (/password/i.test(msg)) throw new Error(`${file.name} is password locked. Print it to a new PDF and drop that.`);
		throw new Error(`${file.name} is not a readable PDF.`);
	}
	const pageCount = pdf.numPages;
	const toRead = Math.min(pageCount, maxPages);
	const texts = new Array(toRead);
	try {
		const BATCH = 4;
		for (let start = 1; start <= toRead; start += BATCH) {
			const jobs = [];
			for (let i = start; i <= Math.min(start + BATCH - 1, toRead); i += 1) {
				const idx = i;
				jobs.push(pageText(pdf, idx).then((t) => {
					texts[idx - 1] = t;
				}));
			}
			await Promise.all(jobs);
		}
		const sketched = texts.map((text) => ({ text }));
		const imageCap = sketched.every((p) => !textLooksTyped(p.text)) && toRead <= 6 ? Math.min(6, toRead) : 4;
		const imageAt = new Set(pickPacketImagePages(sketched, file.name, imageCap));
		const keepText = new Set(pickPacketTextPages(sketched, file.name, Math.min(toRead, 24)));
		if (!keepText.size) keepText.add(0);
		const pages = texts.map((text, i) => ({
			text: keepText.has(i) || imageAt.has(i) ? text : text.slice(0, 180),
			image: void 0
		}));
		for (const i of [...imageAt].sort((a, b) => a - b)) try {
			pages[i].image = await renderPageJpeg(pdf, i + 1);
		} catch {
			pages[i].image = void 0;
		}
		return {
			filename: file.name,
			pageCount,
			pages
		};
	} finally {
		try {
			pdf.cleanup();
		} catch {}
		try {
			await pdf.destroy?.();
		} catch {}
	}
}
async function packetFromFile(file) {
	const packets = await packetsFromFile(file);
	if (!packets.length) throw new Error("Could not read that file");
	if (packets.length === 1) return packets[0];
	return {
		filename: file.name,
		pageCount: packets.length,
		pages: packets.flatMap((p) => p.pages)
	};
}
async function packetsFromFile(file) {
	const problem = ticketFileProblem(file);
	if (problem) throw new Error(problem);
	if (!(file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf")) return [await packetFromImage(file)];
	const pdf = await packetFromPdf(file, 32);
	const sashPages = pdf.pages.filter((p) => looksLikeSash(p.text ?? "", file.name)).length;
	if (!shouldSplitPacket(file.name, pdf.pages.length, sashPages)) return [pdf];
	return pdf.pages.map((page, i) => ({
		filename: `${file.name} · p${i + 1}`,
		pageCount: 1,
		pages: [page]
	}));
}
/** Keep at most six page images so a batch cannot hang the reader. */
function slimPacket(pkt) {
	let images = 0;
	const pages = pkt.pages.slice(0, 32).map((p) => {
		const text = (p.text ?? "").slice(0, 2200);
		if (!p.image) return {
			text,
			image: void 0
		};
		images += 1;
		if (images > 6) return {
			text,
			image: void 0
		};
		if (textLooksTyped(text) && textHasReadableName(text, pkt.filename) && images > 1) return {
			text,
			image: void 0
		};
		return {
			text,
			image: p.image
		};
	});
	return {
		filename: pkt.filename,
		pageCount: pkt.pageCount,
		pages
	};
}
//#endregion
export { ticketFileProblem as a, slimPacket as i, packetFromFile as n, packetsFromFile as r, TICKET_ACCEPT as t };
