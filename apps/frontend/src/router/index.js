import { createRouter, createWebHistory } from "vue-router";
import DrinkHistoryView from "../views/DrinkHistoryView.vue";
import FavoritesView from "../views/FavoritesView.vue";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import NewDrinkView from "../views/NewDrinkView.vue";
import SakeDetailView from "../views/SakeDetailView.vue";
import SignupView from "../views/SignupView.vue";
import { useAuthStore } from "../stores/auth";
export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/login", name: "login", component: LoginView },
        { path: "/signup", name: "signup", component: SignupView },
        {
            path: "/",
            name: "home",
            component: HomeView,
            meta: { requiresAuth: true },
        },
        {
            path: "/drinks/new",
            name: "drink-new",
            component: NewDrinkView,
            meta: { requiresAuth: true },
        },
        {
            path: "/sakes/:sakeId",
            name: "sake-detail",
            component: SakeDetailView,
            meta: { requiresAuth: true },
        },
        {
            path: "/favorites",
            name: "favorites",
            component: FavoritesView,
            meta: { requiresAuth: true },
        },
        {
            path: "/drinks",
            name: "drinks",
            component: DrinkHistoryView,
            meta: { requiresAuth: true },
        },
    ],
});
router.beforeEach(async (to) => {
    const authStore = useAuthStore();
    await authStore.restoreSession();
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return {
            path: "/login",
            query: { redirect: to.fullPath },
        };
    }
    if ((to.path === "/login" || to.path === "/signup") &&
        authStore.isAuthenticated) {
        return "/";
    }
    return true;
});
