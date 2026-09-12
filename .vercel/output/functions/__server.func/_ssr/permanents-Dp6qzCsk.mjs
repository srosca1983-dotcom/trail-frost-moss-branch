import { o as __toESM } from "../_runtime.mjs";
import { l as cn, s as VESSEL } from "./types-DLRYosVU.mjs";
import { d as formatShort, y as positionLabel } from "./ratings-WR-IukGV.mjs";
import { l as ratingKey, p as slotDefByKey, s as eventTypeLabel, t as CHANGE_REASONS, u as reasonLabel } from "./permanents-isWOFthL.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DnbeV2iT.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { F as rateUp, f as Route$7, h as changePermanent, w as getPermanentsBoard, y as dropBackToPermanent } from "./router-QLPwsRgl.mjs";
import { n as Desk, t as Badge } from "./badge-DfXuB0XH.mjs";
import { t as invalidateDesk } from "./desk-query-IlzSwsjD.mjs";
import { t as PageHeader } from "./page-header--nmhDNO6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/permanents-Dp6qzCsk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Page() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Board, {}) });
}
function Board() {
	const qc = useQueryClient();
	const navigate = Route$7.useNavigate();
	const ratedOnly = Route$7.useSearch().view === "rated";
	const q = useQuery({
		queryKey: ["permanents"],
		queryFn: () => getPermanentsBoard(),
		initialData: Route$7.useLoaderData()
	});
	const [panel, setPanel] = (0, import_react.useState)(null);
	const invalidate = async () => {
		await invalidateDesk(qc);
		setPanel(null);
	};
	const rateMut = useMutation({
		mutationFn: rateUp,
		onSuccess: async (res) => {
			toast.success(res.question ?? "Rate updated");
			await invalidate();
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not rate up")
	});
	const dropMut = useMutation({
		mutationFn: dropBackToPermanent,
		onSuccess: async () => {
			toast.success("Back on their permanent job");
			await invalidate();
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not drop back")
	});
	const changeMut = useMutation({
		mutationFn: changePermanent,
		onSuccess: async () => {
			toast.success("Permanents list updated");
			await invalidate();
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "Could not change permanent")
	});
	const groups = (0, import_react.useMemo)(() => {
		const slots = (q.data?.slots ?? []).filter((s) => ratedOnly ? s.sailingUp : true);
		const order = [
			{
				key: "deck-off",
				title: "Deck officers",
				match: (r) => /MASTER|CHIEF MATE|C\/M/i.test(r)
			},
			{
				key: "eng-off",
				title: "Engine officers",
				match: (r) => /C\/E|1A|2A|GAS|WATCH 2|CHIEF ENG/i.test(r)
			},
			{
				key: "unlic",
				title: "Unlicensed permanents",
				match: () => true
			}
		];
		const used = /* @__PURE__ */ new Set();
		return order.map((g) => {
			const list = slots.filter((s) => !used.has(s.id) && g.match(s.title + s.rating));
			list.forEach((s) => used.add(s.id));
			return {
				...g,
				slots: list
			};
		}).filter((g) => g.slots.length);
	}, [q.data, ratedOnly]);
	const data = q.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: VESSEL,
			title: "Who owns the job, and who is sailing it.",
			description: "Permanent chief mates, 1st A/Es, and 2nd A/Es can rate up without losing their seat. Change a permanent when they quit, get fired, or are promoted into the job."
		}),
		data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid flex-1 gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Permanent seats",
						value: data.slots.length,
						hint: "Rotation pairs plus Watch 2"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Vacant seats",
						value: data.vacant,
						hint: "Need a new permanent"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Rated up",
						value: data.sailingUp,
						hint: "Perm rank below the rate they are sailing"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-end",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-1 rounded-lg bg-paper-2 p-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void navigate({ search: {} }),
						className: cn("rounded-md px-3 py-1.5 text-sm", !ratedOnly ? "bg-ink text-paper" : "text-muted hover:text-ink"),
						children: "All seats"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void navigate({ search: { view: "rated" } }),
						className: cn("rounded-md px-3 py-1.5 text-sm", ratedOnly ? "bg-ink text-paper" : "text-muted hover:text-ink"),
						children: "Rated up"
					})]
				})
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: q.isError ? "Could not load permanents." : "Loading permanents…"
		}),
		ratedOnly && data && !data.sailingUp ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 rounded-xl bg-paper p-6 shadow-border",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: "Nobody is rated up."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "A permanent sailing above their own job would show here."
			})]
		}) : null,
		groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl tracking-tight",
				children: g.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-3",
				children: g.slots.map((s) => {
					const open = panel?.slotKey === s.key;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-xl bg-paper p-4 shadow-border sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[11px] uppercase tracking-[0.16em] text-sage",
										children: [
											s.title,
											" · seat ",
											s.seat,
											s.onSheet ? "" : " · not on NS5"
										]
									}), s.holder ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/crew/$crewId",
											params: { crewId: s.holder.id },
											className: "mt-1 block font-display text-2xl tracking-tight hover:underline",
											children: s.holder.fullName
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 text-sm text-muted",
											children: [
												"Permanent ",
												positionLabel(s.holder.permanentRating ?? s.rating),
												s.sailingUp ? ` · ${s.covering}` : s.holder.status === "current" ? " · sailing own job" : ""
											]
										}),
										s.holder.status !== "current" && s.returnOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 text-sm",
											children: [
												"Returns ",
												formatShort(s.returnOn),
												s.returnFrom ? ` · when ${s.returnFrom} is due off` : ""
											]
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2 flex flex-wrap gap-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													tone: s.holder.status === "current" ? "current" : s.holder.status === "vacation" ? "steel" : "past",
													children: s.holder.status === "current" ? "aboard" : s.holder.status
												}),
												s.sailingUp ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													tone: "watch",
													children: "rated up"
												}) : null,
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													tone: "neutral",
													children: s.unionHall
												})
											]
										})
									] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 font-display text-2xl tracking-tight text-faint",
										children: "Open seat"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm text-muted",
										children: "No permanent assigned. Pick a replacement."
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [
										s.holder && s.holder.status === "current" && s.upgrades.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											onClick: () => setPanel({
												kind: "rate",
												slotKey: s.key,
												crewId: s.holder.id
											}),
											children: "Rate up"
										}) : null,
										s.holder && s.sailingUp && s.holder.status === "current" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											disabled: dropMut.isPending,
											onClick: () => dropMut.mutate({ data: { crewId: s.holder.id } }),
											children: "Drop back"
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: open && panel?.kind === "change" ? "default" : "outline",
											onClick: () => setPanel(open && panel?.kind === "change" ? null : {
												kind: "change",
												slotKey: s.key
											}),
											children: s.holder ? "Change" : "Assign"
										})
									]
								})]
							}),
							open && panel?.kind === "rate" && s.holder ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RatePanel, {
								options: s.upgrades,
								saving: rateMut.isPending,
								onCancel: () => setPanel(null),
								onPick: (billet) => rateMut.mutate({ data: {
									crewId: s.holder.id,
									toBillet: billet
								} })
							}) : null,
							open && panel?.kind === "change" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChangePanel, {
								slotKey: s.key,
								hasHolder: Boolean(s.holder),
								currentRating: s.rating,
								candidates: data?.candidates ?? [],
								saving: changeMut.isPending,
								onCancel: () => setPanel(null),
								onSubmit: (payload) => changeMut.mutate({ data: payload })
							}) : null
						]
					}, s.id);
				})
			})]
		}, g.key)),
		data?.events.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-lg tracking-tight",
				children: "Recent changes"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-3 space-y-2 text-sm",
				children: data.events.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-lg bg-paper-2 px-3 py-2 text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-ink",
							children: eventTypeLabel(e.eventType)
						}),
						e.reason ? ` · ${reasonLabel(e.reason)}` : "",
						e.fromRating && e.toRating ? ` · ${e.fromRating} → ${e.toRating}` : "",
						e.notes ? ` · ${e.notes}` : "",
						e.occurredOn ? ` · ${e.occurredOn}` : ""
					]
				}, e.id))
			})]
		}) : null
	] });
}
function Stat({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-paper p-4 shadow-border",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.16em] text-sage",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 font-display text-3xl tracking-tight",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: hint
			})
		]
	});
}
function RatePanel({ options, saving, onCancel, onPick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 rounded-lg bg-paper-2 p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium",
				children: "Rate up this tour"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Keeps their permanent seat. Articles show the higher rate until they drop back."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					disabled: saving,
					onClick: () => onPick(o.billet),
					children: o.title
				}, o.billet)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: onCancel,
					children: "Cancel"
				})]
			})
		]
	});
}
function ChangePanel({ slotKey, hasHolder, currentRating, candidates, saving, onCancel, onSubmit }) {
	const def = slotDefByKey(slotKey);
	const [reason, setReason] = (0, import_react.useState)(hasHolder ? "quit" : "assigned");
	const [replacement, setReplacement] = (0, import_react.useState)("");
	const [promoteTo, setPromoteTo] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)("");
	const destOptions = (0, import_react.useMemo)(() => {
		const from = ratingKey(def?.rating ?? currentRating);
		const opts = [];
		if (from === "CM") opts.push({
			key: "perm-master-a",
			label: "Master · seat A"
		}, {
			key: "perm-master-b",
			label: "Master · seat B"
		});
		if (from === "1AE") opts.push({
			key: "perm-ce-a",
			label: "Chief Engineer · seat A"
		}, {
			key: "perm-ce-b",
			label: "Chief Engineer · seat B"
		});
		if (from === "2AE" || from === "GAS2") opts.push({
			key: "perm-1ae-a",
			label: "1st A/E · seat A"
		}, {
			key: "perm-1ae-b",
			label: "1st A/E · seat B"
		}, {
			key: "perm-ce-a",
			label: "Chief Engineer · seat A"
		}, {
			key: "perm-ce-b",
			label: "Chief Engineer · seat B"
		});
		return opts;
	}, [currentRating, def]);
	const needsPerson = reason === "replaced" || reason === "assigned" || !hasHolder;
	const needsDest = reason === "promoted";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 rounded-lg bg-paper-2 p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium",
				children: hasHolder ? "Change this permanent" : "Assign this seat"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Quit or fired takes them off the list. Promoted moves them to a higher seat — that seat must be vacant. Replaced puts someone else in this job."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid gap-3 sm:grid-cols-2",
				children: [
					hasHolder ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Reason"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm",
							value: reason,
							onChange: (e) => setReason(e.target.value),
							children: CHANGE_REASONS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: r,
								children: reasonLabel(r)
							}, r))
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted sm:col-span-2",
						children: "Assigning a new permanent to this open seat."
					}),
					needsPerson ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs sm:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Who takes the seat"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm",
							value: replacement,
							onChange: (e) => setReplacement(e.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Pick a mariner…"
							}), candidates.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: c.id,
								children: [
									c.fullName,
									c.lastPosition ? ` · ${positionLabel(c.lastPosition)}` : "",
									c.status !== "current" ? ` · ${c.status}` : ""
								]
							}, c.id))]
						})]
					}) : null,
					needsDest ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs sm:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Promote into"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm",
							value: promoteTo,
							onChange: (e) => setPromoteTo(e.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Pick the higher seat…"
							}), destOptions.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: o.key,
								children: o.label
							}, o.key))]
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs sm:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Note (optional)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-3 text-sm",
							value: notes,
							onChange: (e) => setNotes(e.target.value),
							placeholder: "Quit notice, promotion date…"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					disabled: saving || needsPerson && !replacement || needsDest && !promoteTo,
					onClick: () => onSubmit({
						slotKey,
						reason: hasHolder ? reason : "assigned",
						replacementCrewId: needsPerson ? replacement || null : null,
						promoteToSlotKey: needsDest ? promoteTo || null : null,
						notes: notes || null
					}),
					children: "Save change"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: onCancel,
					children: "Cancel"
				})]
			})
		]
	});
}
//#endregion
export { Page as component };
