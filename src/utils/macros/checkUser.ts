import Elysia, { Context } from "elysia";
import { BadRequest, Unauthorized } from "../responses";

export const checkUsersMacro = new Elysia().macro({
    isSelf(locations: string[]) {
        return {
            beforeHandle(context: Context) {
                if ((context.store as any).user.role in ["admin", "super-admin"]) return;

                for (const location of locations) {
                    const keys = location.split(".");
                    let currContext = context;

                    for (const key of keys) {
                        if (!currContext)
                            return BadRequest(
                                context,
                                `The user id should appear in ${location}`,
                            );
                        currContext = (currContext as any)[key];
                    }

                    if (currContext != (context.store as any).user.id) {
                        console.log("currContext", currContext);
                        return Unauthorized(
                            context,
                            "You do not have permissions to modify others data.",
                        );
                    }
                }
            },
        };
    },
    isAdmin(check: boolean) {
        return {
            beforeHandle(context: Context) {
                if (!check) return;
                if (!((context.store as any).user.role in ["admin", "super-admin"]))
                    return Unauthorized(context, "You must be an admin.");
            },
        };
    },
    isSuperAdmin(check: boolean) {
        return {
            beforeHandle(context: Context) {
                if (!check) return;
                if ((context.store as any).user.role != "super-admin")
                    return Unauthorized(context, "You must be THE super admin.");
            },
        };
    },
});
