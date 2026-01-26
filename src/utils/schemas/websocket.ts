import { t } from "elysia";
import { NumericString } from "./lib";

export const SocketParams = t.Object({
    contestID: NumericString,
    ownID: NumericString,
    opponentID: NumericString,
});
