import { o as __toESM } from "../_runtime.mjs";
import { l as cn, o as SMS_URL, s as VESSEL } from "./types-DLRYosVU.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { d as useRouterState, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DnbeV2iT.mjs";
import { C as Anchor, a as Ship, b as BookOpenCheck, d as Menu, f as LayoutDashboard, g as ClipboardCheck, n as Users, o as ShieldCheck, p as Flame, r as Upload, t as X, v as CalendarClock, y as Briefcase } from "../_libs/lucide-react.mjs";
import "./router-QLPwsRgl.mjs";
import "./client-D2mFrklX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-DfXuB0XH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Stable fallback user, used ONLY when auth is disabled
* (`VITE_AUTH_ENABLED=false`, the shipped default). With auth on, the sandbox
* live preview does real sign-in via the baked preview client. Its id is
* `"dev-user"` — the SAME id `verify.server.ts` returns server-side — so per-user
* rows written in that mode belong to one consistent owner.
*/
var DEV_USER = {
	id: "dev-user",
	displayName: "Dev User",
	primaryEmail: "dev@example.com",
	profileImageUrl: null,
	isDevFallback: true
};
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	return {
		user: DEV_USER,
		isPending: false
	};
}
var NAV = [
	{
		to: "/",
		label: "Crew list",
		icon: LayoutDashboard
	},
	{
		to: "/crew",
		label: "Roster",
		icon: Users
	},
	{
		to: "/permanents",
		label: "Permanents",
		icon: Briefcase
	},
	{
		to: "/training",
		label: "NSE training",
		icon: BookOpenCheck
	},
	{
		to: "/cyber",
		label: "Cyber class",
		icon: ShieldCheck
	},
	{
		to: "/hazmat",
		label: "HAZMAT quiz",
		icon: Flame
	},
	{
		to: "/sign-on",
		label: "Sign on",
		icon: ClipboardCheck
	},
	{
		to: "/ingest",
		label: "Packet inbox",
		icon: Upload
	},
	{
		to: "/expiry",
		label: "Expiry",
		icon: CalendarClock
	},
	{
		to: "/requirements",
		label: "Requirements",
		icon: Anchor
	}
];
function Mark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "28",
		height: "28",
		viewBox: "0 0 32 32",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "32",
				height: "32",
				rx: "6",
				fill: "#0b1014"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#f3efe4",
				d: "M8.5 6.5h11.2L24 11.2V24.5A1.5 1.5 0 0 1 22.5 26h-14A1.5 1.5 0 0 1 7 24.5v-16A2 2 0 0 1 8.5 6.5z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "10",
				y: "14",
				width: "13",
				height: "2.1",
				rx: ".4",
				fill: "#6ea8c9"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "10",
				y: "18.2",
				width: "9",
				height: "1.5",
				rx: ".35",
				fill: "#8a9690"
			})
		]
	});
}
function NavLinks({ onNavigate }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
		className: "flex flex-col gap-1",
		children: [NAV.map((item) => {
			const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
			const Icon = item.icon;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: item.to,
				onClick: onNavigate,
				className: cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150", active ? "bg-ink text-paper" : "text-ink/80 hover:bg-paper-2"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "size-4",
					strokeWidth: 1.75
				}), item.label]
			}, item.to);
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
			href: SMS_URL,
			target: "_blank",
			rel: "noreferrer",
			className: "mt-2 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted hover:bg-paper-2 hover:text-ink",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ship, {
				className: "size-4",
				strokeWidth: 1.75
			}), "SMS manuals"]
		})]
	});
}
function AppShell({ children }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const { user, isPending } = useCurrentUserState();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh max-w-full bg-paper text-ink lg:grid lg:grid-cols-[240px_minmax(0,1fr)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-paper px-4 lg:hidden no-print",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-base leading-tight tracking-tight",
						children: "Crew Ledger"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					"aria-label": "Menu",
					onClick: () => setOpen(true),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
				})]
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-40 lg:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "absolute inset-0 bg-ink/40",
					"aria-label": "Close",
					onClick: () => setOpen(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "absolute inset-y-0 left-0 flex w-72 flex-col bg-paper p-4 shadow-border",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-lg",
							children: "Crew Ledger"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							onClick: () => setOpen(false),
							"aria-label": "Close menu",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLinks, { onNavigate: () => setOpen(false) })]
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "no-print hidden border-r border-border lg:flex lg:flex-col lg:px-4 lg:py-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "mb-8 flex items-center gap-2.5 px-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-display text-lg leading-tight tracking-tight",
							children: "Crew Ledger"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] uppercase tracking-[0.14em] text-sage",
							children: VESSEL
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLinks, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto px-2 pt-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.14em] text-sage",
							children: "Sunrise Vessel Operations"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: null
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-w-0 max-w-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "mx-auto min-w-0 max-w-6xl px-4 py-6 sm:px-6 sm:py-8",
					children
				})
			})
		]
	});
}
function Desk({ children }) {
	const { user, isPending } = useCurrentUserState();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children });
}
var tones = {
	neutral: "bg-paper-2 text-muted",
	ok: "bg-ok/15 text-ok",
	watch: "bg-warn/15 text-warn",
	soon: "bg-warn/20 text-warn",
	expired: "bg-danger/15 text-danger",
	steel: "bg-steel/20 text-steel-2",
	current: "bg-ok/15 text-ok",
	past: "bg-paper-2 text-muted"
};
function Badge({ tone = "neutral", className, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider", tones[tone], className),
		children
	});
}
//#endregion
export { Desk as n, Badge as t };
