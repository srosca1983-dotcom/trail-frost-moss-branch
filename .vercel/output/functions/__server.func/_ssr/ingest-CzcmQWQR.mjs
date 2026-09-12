import { o as __toESM } from "../_runtime.mjs";
import { l as cn } from "./types-DLRYosVU.mjs";
import { y as positionLabel } from "./ratings-WR-IukGV.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DnbeV2iT.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as listRecentInbox, N as parsePackets, O as listCrew, _ as commitTickets, g as commitParsed } from "./router-QLPwsRgl.mjs";
import { n as Desk, t as Badge } from "./badge-DfXuB0XH.mjs";
import { t as CrewPicker } from "./crew-picker-Cxok1PNn.mjs";
import { a as ticketFileProblem, i as slimPacket, r as packetsFromFile } from "./pdf-ibO_ah6S.mjs";
import { t as invalidateDesk } from "./desk-query-IlzSwsjD.mjs";
import { t as PageHeader } from "./page-header--nmhDNO6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ingest-CzcmQWQR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LAST_FILED_KEY = "inbox-last-filed";
var LAST_RESULTS_KEY = "inbox-last-results";
function storageGet(key) {
	try {
		return localStorage.getItem(key) ?? sessionStorage.getItem(key);
	} catch {
		return null;
	}
}
function storageSet(key, value) {
	try {
		localStorage.setItem(key, value);
	} catch {
		try {
			sessionStorage.setItem(key, value);
		} catch {}
	}
}
function readLastFiled() {
	try {
		const raw = storageGet(LAST_FILED_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
function writeLastFiled(rows) {
	storageSet(LAST_FILED_KEY, JSON.stringify(rows));
}
function readLastResults() {
	try {
		const raw = storageGet(LAST_RESULTS_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
function writeLastResults(rows) {
	storageSet(LAST_RESULTS_KEY, JSON.stringify(rows));
}
function filedFromResult(r) {
	if (!r.match || !r.person) return null;
	return {
		crewId: r.match.crewId,
		fullName: r.match.fullName || r.person.fullName,
		filename: r.filename,
		tickets: r.person.documents.map((d) => d.label).filter(Boolean).slice(0, 4).join(" · ") || "File opened",
		created: r.warnings.some((w) => w.startsWith("Opened a new file")),
		status: r.match.status
	};
}
function uniqueFiled(rows) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const r of rows) {
		const k = `${r.crewId}|${r.filename}`;
		if (seen.has(k)) continue;
		seen.add(k);
		out.push(r);
	}
	return out;
}
async function readPacket(payload) {
	try {
		return (await parsePackets({ data: {
			packets: [payload],
			fileIfMissing: true,
			skipBust: true
		} }))[0] ?? null;
	} catch {
		const textOnly = {
			filename: payload.filename,
			pageCount: payload.pageCount,
			pages: payload.pages.map((p) => ({
				text: p.text,
				image: void 0
			}))
		};
		const row = (await parsePackets({ data: {
			packets: [textOnly],
			fileIfMissing: true,
			skipBust: true
		} }))[0];
		if (row) {
			row.warnings = [...row.warnings ?? [], "Photos were skipped so this drop would finish. Drop the passport and MMC pages if tickets are blank."];
			return row;
		}
		throw new Error("Could not read that file.");
	}
}
function Page() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InboxGuard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inbox, {}) }) });
}
var InboxGuard = class extends import_react.Component {
	state = { err: null };
	static getDerivedStateFromError(err) {
		return { err: err.message || "Read stopped" };
	}
	render() {
		if (this.state.err) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-xl bg-paper p-6 shadow-border",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: "That batch stopped."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Names already read are still on Ledger → New files. Drop the remaining PDFs again."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-faint",
					children: this.state.err
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-4",
					type: "button",
					onClick: () => this.setState({ err: null }),
					children: "Back to inbox"
				})
			]
		});
		return this.props.children;
	}
};
function Inbox() {
	const qc = useQueryClient();
	const inputRef = (0, import_react.useRef)(null);
	const busyRef = (0, import_react.useRef)(false);
	const [files, setFiles] = (0, import_react.useState)([]);
	const [progress, setProgress] = (0, import_react.useState)(null);
	const [results, setResults] = (0, import_react.useState)([]);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [over, setOver] = (0, import_react.useState)(false);
	const [picked, setPicked] = (0, import_react.useState)({});
	const [lastFiled, setLastFiled] = (0, import_react.useState)([]);
	const crewQ = useQuery({
		queryKey: ["crew"],
		queryFn: () => listCrew(),
		staleTime: 6e4
	});
	const logQ = useQuery({
		queryKey: ["inbox-log"],
		queryFn: () => listRecentInbox(),
		staleTime: 15e3
	});
	(0, import_react.useEffect)(() => {
		const stored = readLastFiled();
		const storedResults = readLastResults();
		if (stored.length) setLastFiled(stored);
		if (storedResults.length) setResults(storedResults);
	}, []);
	const commitMut = useMutation({
		mutationFn: commitParsed,
		onSuccess: () => {
			invalidateDesk(qc);
		}
	});
	function onPick(list) {
		if (busyRef.current) {
			toast.message("Wait until this batch finishes, then drop the rest.");
			return;
		}
		if (!list?.length) return;
		const next = [];
		const rejected = [];
		for (const f of Array.from(list)) {
			const problem = ticketFileProblem(f);
			if (problem) {
				rejected.push(problem);
				continue;
			}
			next.push(f);
		}
		for (const msg of rejected) toast.error(msg);
		if (!next.length) {
			toast.error("No PDF or photo in that drop. Zip and Word files will not read.");
			return;
		}
		if (next.length > 40) toast.error(`Cap is 40 files at a time. Load the rest in the next batch.`);
		const chosen = next.slice(0, 40);
		setFiles(chosen);
		busyRef.current = true;
		setBusy(true);
		setProgress({
			i: 0,
			n: chosen.length,
			name: "Opening…"
		});
		ingestList(chosen);
	}
	function onDrop(e) {
		e.preventDefault();
		e.stopPropagation();
		setOver(false);
		onPick(e.dataTransfer.files);
	}
	(0, import_react.useEffect)(() => {
		function onPaste(e) {
			const list = e.clipboardData?.files;
			if (!list?.length) return;
			e.preventDefault();
			onPick(list);
		}
		window.addEventListener("paste", onPaste);
		return () => window.removeEventListener("paste", onPaste);
	}, []);
	async function ingestList(chosen) {
		if (!chosen.length) return;
		setBusy(true);
		setResults([]);
		const out = [];
		const filed = [];
		try {
			for (let i = 0; i < chosen.length; i += 1) {
				const f = chosen[i];
				setProgress({
					i: i + 1,
					n: chosen.length,
					name: f.name
				});
				await new Promise((r) => setTimeout(r, 0));
				let packets = [];
				try {
					packets = await packetsFromFile(f);
				} catch (e) {
					out.push({
						filename: f.name,
						pageCount: 0,
						person: null,
						match: null,
						warnings: [],
						error: e instanceof Error ? e.message : "Could not open file"
					});
					setResults([...out]);
					writeLastResults(out);
					continue;
				}
				if (!packets.length) {
					out.push({
						filename: f.name,
						pageCount: 0,
						person: null,
						match: null,
						warnings: [],
						error: "Empty file"
					});
					setResults([...out]);
					writeLastResults(out);
					continue;
				}
				for (const pkt of packets) {
					const payload = slimPacket(pkt);
					try {
						const parsed = await readPacket(payload);
						out.push(parsed ?? {
							filename: pkt.filename,
							pageCount: pkt.pageCount,
							person: null,
							match: null,
							warnings: [],
							error: "Empty result"
						});
					} catch (e) {
						out.push({
							filename: pkt.filename,
							pageCount: pkt.pageCount,
							person: null,
							match: null,
							warnings: [],
							error: e instanceof Error ? e.message : "Read failed"
						});
					}
					setResults([...out]);
					writeLastResults(out);
					const row = filedFromResult(out[out.length - 1]);
					if (row) {
						filed.push(row);
						setLastFiled([...filed]);
						writeLastFiled(filed);
					}
				}
			}
			const ok = out.filter((r) => r.person).length;
			const opened = out.filter((r) => r.warnings.some((w) => w.startsWith("Opened a new file"))).length;
			const unmatched = out.filter((r) => r.person && !r.match).length;
			if (!ok) toast.error("Could not read a name on those files. Try a clearer scan, or put the last name in the filename (SASH_Rosca.pdf).");
			else toast.success(`Read ${ok} · ${opened ? `opened ${opened} new file${opened === 1 ? "" : "s"} · ` : ""}${unmatched ? `${unmatched} still need a name pick` : "saved to the ledger"}`);
		} finally {
			busyRef.current = false;
			setBusy(false);
			setProgress(null);
			invalidateDesk(qc);
		}
	}
	async function saveTickets() {
		let n = 0;
		let docs = 0;
		try {
			for (const r of results) {
				if (!r.person) continue;
				const crewId = r.match?.crewId ?? picked[r.filename];
				if (!crewId) continue;
				const res = await commitTickets({ data: {
					crewId,
					person: r.person,
					filename: r.filename
				} });
				docs += res.upserted;
				n += 1;
			}
			invalidateDesk(qc);
			if (!n) {
				toast.error("Need a match on file to update tickets. Pick the mariner on any unmatched row, or Save all to ledger for a new name.");
				return;
			}
			toast.success(`Updated ${n} file${n === 1 ? "" : "s"} · ${docs} ticket${docs === 1 ? "" : "s"}`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save tickets");
		}
	}
	async function saveAll(signOn) {
		let n = 0;
		for (const r of results) {
			if (!r.person) continue;
			await commitMut.mutateAsync({ data: {
				person: r.person,
				matchCrewId: r.match?.crewId ?? picked[r.filename] ?? null,
				signOn,
				filename: r.filename
			} });
			n += 1;
		}
		toast.success(`Saved ${n} mariners`);
		invalidateDesk(qc);
	}
	const currentCrew = crewQ.data ?? [];
	const serverFiled = (logQ.data ?? []).filter((r) => r.crewId && r.fullName && !r.error).map((r) => ({
		crewId: r.crewId,
		fullName: r.fullName,
		filename: r.filename,
		tickets: r.filename,
		created: r.created,
		status: r.created ? "applicant" : ""
	}));
	const shownFiled = uniqueFiled(lastFiled.length ? lastFiled : serverFiled).slice(0, 25);
	const failedReads = (logQ.data ?? []).filter((r) => r.error).slice(0, 20);
	const newestFail = failedReads[0]?.loggedAt;
	const failedWindow = newestFail ? failedReads.filter((r) => {
		const a = Date.parse(r.loggedAt);
		const b = Date.parse(newestFail);
		return Number.isFinite(a) && Number.isFinite(b) && b - a < 27e5;
	}) : failedReads;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Inbox",
			title: "Drop a packet or a batch of tickets.",
			description: `SASH, TWIC, MMC, passport, medical, STCW, HAZMAT — one file each, or one stacked PDF. The name is read off the page. The filename is only a hint. If they are new we open a file; they are not aboard until you sign them on. Up to 40 files.`
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			onDragOver: (e) => {
				e.preventDefault();
				setOver(true);
			},
			onDragLeave: () => setOver(false),
			onDrop,
			className: cn("flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-6 text-center transition-colors duration-150", over ? "border-steel-2 bg-steel/10" : "border-border bg-paper-2/50"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xl",
					children: "SASH batch, packets, or a single ticket"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-md text-sm text-muted",
					children: "PDF or a photo. A stacked SASH scan is split per person. A full packet stays one file. If the name is new we open a file — they are not aboard until you sign them on."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-4 inline-flex cursor-pointer flex-col items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper",
						children: "Choose files from this computer"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: inputRef,
						type: "file",
						accept: ".pdf,image/*",
						multiple: true,
						className: "max-w-xs text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-paper file:px-3 file:py-1.5 file:text-sm file:text-ink",
						onChange: (e) => {
							onPick(e.target.files);
							e.target.value = "";
						}
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-xs text-faint",
					children: [
						files.length,
						" selected · ",
						40,
						" max · 32 MB each"
					]
				})
			]
		}),
		shownFiled.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-4 overflow-hidden rounded-xl shadow-border",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-paper-2 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg tracking-tight",
					children: "Just loaded"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Stays here until you load the next batch so you do not file them twice."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-border bg-paper",
				children: shownFiled.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between gap-3 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/crew/$crewId",
							params: { crewId: row.crewId },
							className: "font-medium hover:underline",
							children: row.fullName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "truncate text-xs text-muted",
							children: [row.tickets, row.status === "applicant" ? " · not aboard yet" : ""]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 items-center gap-2",
						children: [row.created ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "watch",
							children: "New file"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "steel",
							children: "Updated"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/crew/$crewId",
							params: { crewId: row.crewId },
							className: "text-sm text-steel-2 hover:underline",
							children: "Open"
						})]
					})]
				}, `${row.crewId}-${row.filename}-${i}`))
			})]
		}) : null,
		failedWindow.length && !busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-4 overflow-hidden rounded-xl shadow-border",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-paper-2 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg tracking-tight",
					children: "Could not read"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "The name was not on the page. Pick who it belongs to in Extracted, or drop a clearer scan."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-border bg-paper",
				children: failedWindow.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "px-4 py-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: row.filename
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-0.5 block text-xs text-muted",
						children: row.error
					})]
				}, `${row.id}-${i}`))
			})]
		}) : null,
		files.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 divide-y divide-border rounded-xl bg-paper shadow-border",
			children: files.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center justify-between px-4 py-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate",
					children: f.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono text-xs text-muted",
					children: [(f.size / 1024 / 1024).toFixed(1), " MB"]
				})]
			}, `${f.name}-${i}`))
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				disabled: !files.length || busy,
				onClick: () => void ingestList(files),
				children: busy ? `Reading ${progress?.i ?? 0} of ${progress?.n ?? 0}` : "Read files again"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				disabled: busy,
				onClick: () => {
					setFiles([]);
					setResults([]);
					setPicked({});
					writeLastResults([]);
				},
				children: "Clear"
			})]
		}),
		progress ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-sm text-muted",
			children: [
				"Reading ",
				progress.i,
				" / ",
				progress.n,
				" · ",
				progress.name
			]
		}) : null,
		results.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "Extracted"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								onClick: () => void saveTickets(),
								disabled: busy,
								children: "Save tickets only"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => void saveAll(false),
								disabled: busy,
								children: "Save all to ledger"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => void saveAll(true),
								disabled: busy,
								children: "Save and mark aboard"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-w-0 overflow-x-auto rounded-xl shadow-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[640px] text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "bg-paper-2 text-[11px] uppercase tracking-wider text-sage",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3",
									children: "File"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3",
									children: "Mariner"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3",
									children: "Tickets read"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3",
									children: "Match"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3",
									children: "Flags"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "divide-y divide-border",
							children: results.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 font-mono text-xs",
									children: r.filename
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: r.person ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-medium",
										children: r.person.fullName
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-xs text-muted",
										children: [positionLabel(r.person.lastPosition), r.person.tour?.seniorityClass ? ` · SIU ${r.person.tour.seniorityClass}` : ""]
									})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-danger",
										children: r.error ?? "Unreadable"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-xs text-muted",
									children: r.person?.documents.length ? r.person.documents.map((d) => d.label).slice(0, 4).join(" · ") : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: r.match ? r.warnings.some((w) => w.startsWith("Opened a new file")) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "watch",
										children: "New file"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
										tone: "steel",
										children: [
											"Yes · ",
											r.match.fullName.split(" ")[0],
											" (",
											r.match.confidence,
											")"
										]
									}) : r.person ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CrewPicker, {
										compact: true,
										people: currentCrew,
										value: picked[r.filename] ?? "",
										onChange: (id) => setPicked((m) => ({
											...m,
											[r.filename]: id
										})),
										emptyLabel: "Pick mariner…",
										placeholder: "Type a last name…"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "No" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-xs",
									children: r.warnings.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
										className: "space-y-0.5 text-danger",
										children: [r.warnings.slice(0, 3).map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: w }, w)), r.warnings.length > 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
											"+",
											r.warnings.length - 3,
											" more"
										] }) : null]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "—"
									})
								})
							] }, `${r.filename}-${i}`))
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "Unknown names are opened as a file automatically — not signed on. The next certificate for that name lands on the same file. If a row did not match, type a last name in Pick mariner and use Save tickets only."
				})
			]
		}) : null
	] });
}
//#endregion
export { Page as component };
