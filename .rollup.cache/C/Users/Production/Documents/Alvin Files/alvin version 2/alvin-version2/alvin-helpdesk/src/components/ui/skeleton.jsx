import { __rest } from "tslib";
import { cn } from "@/lib/utils";
function Skeleton(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<div className={cn("animate-pulse rounded-md bg-muted", className)} {...props}/>);
}
export { Skeleton };
//# sourceMappingURL=skeleton.jsx.map