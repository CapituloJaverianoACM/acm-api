import { t } from "elysia";

export const SocketParams = t.Object({
    ownID: t.Numeric(),
    opponentID: t.Numeric(),
});
