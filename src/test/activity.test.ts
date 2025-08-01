import { describe, expect, it } from "bun:test";
import { app } from "..";

const BASE_URL = "http://localhost";

describe("Activity Schema endpoints", () => {
    it("The POST method have to be compatible with CLI standard", async () => {
        const post = await app.handle(
            new Request(`${BASE_URL}/activity/create`, { method: "POST" }),
        );

        expect(post.status).toSatisfy((code) => code != 404);
    });

    it("The DELETE method have to be compatible with CLI standard", async () => {
        const deleteEnpoint = await app.handle(
            new Request(`${BASE_URL}/activity/1`, { method: "DELETE" }),
        );

        expect(deleteEnpoint.status).toSatisfy((code) => code != 404);
    });
});
