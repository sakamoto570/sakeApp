import { apiJson } from "./client";
export async function createDrink(request) {
    await apiJson("/drinks", {
        method: "POST",
        body: request,
    });
}
