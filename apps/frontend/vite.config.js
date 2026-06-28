import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
    define: {
        global: "globalThis",
    },
    plugins: [vue()],
});
