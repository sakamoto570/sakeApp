import { defineStore } from "pinia";
export const useAuthStore = defineStore("auth", {
    state: () => ({
        accessToken: null,
    }),
    getters: {
        isAuthenticated: (state) => state.accessToken !== null,
    },
});
