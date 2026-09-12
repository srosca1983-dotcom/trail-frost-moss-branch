//#region node_modules/.nitro/vite/services/ssr/assets/desk-query-IlzSwsjD.js
var KEYS = [
	"crew",
	"ship-roster",
	"dashboard",
	"expiring",
	"nse-board",
	"inbox-log",
	"vessel-run",
	"permanents",
	"requirements",
	"sms-sync"
];
/** Refresh desk lists without refetching every query in the app. */
function invalidateDesk(qc) {
	for (const key of KEYS) qc.invalidateQueries({ queryKey: [key] });
}
//#endregion
export { invalidateDesk as t };
