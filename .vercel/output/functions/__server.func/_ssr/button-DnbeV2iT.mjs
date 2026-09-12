import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { l as cn } from "./types-DLRYosVU.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { i as Slot } from "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/button-DnbeV2iT.js
var import_jsx_runtime = require_jsx_runtime();
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,box-shadow,transform,color] duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-ink text-paper hover:bg-ink-2",
			inverse: "bg-paper text-ink hover:bg-paper-2",
			outline: "border border-border bg-paper text-ink hover:bg-paper-2",
			ghost: "text-ink hover:bg-paper-2",
			steel: "bg-steel-2 text-paper hover:bg-steel",
			danger: "bg-danger text-paper hover:opacity-90",
			link: "text-steel-2 underline-offset-4 hover:underline"
		},
		size: {
			default: "h-10 px-4",
			sm: "h-8 px-3 text-xs",
			lg: "h-11 px-5",
			icon: "size-10"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
//#endregion
export { Button as t };
