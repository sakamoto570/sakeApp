import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import { setAuthTokenProvider } from "./api/client";
import { router } from "./router";
import { useAuthStore } from "./stores/auth";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);

const authStore = useAuthStore();
setAuthTokenProvider(() => authStore.getAuthToken() ?? null);

app.use(router).mount("#app");
