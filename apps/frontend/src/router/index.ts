import { createRouter, createWebHistory } from "vue-router";

import DrinkHistoryView from "../views/DrinkHistoryView.vue";
import FavoritesView from "../views/FavoritesView.vue";
import HomeView from "../views/HomeView.vue";
import SakeDetailView from "../views/SakeDetailView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/sakes/:sakeId", name: "sake-detail", component: SakeDetailView },
    { path: "/favorites", name: "favorites", component: FavoritesView },
    { path: "/drinks", name: "drinks", component: DrinkHistoryView },
  ],
});

