<script setup lang="ts">
import { useRouter } from "vue-router";

import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();
const router = useRouter();

async function logout() {
  authStore.logout();
  await router.push("/login");
}
</script>

<template>
  <header class="app-header">
    <RouterLink class="brand" to="/">日本酒レコメンド</RouterLink>

    <nav v-if="authStore.isAuthenticated">
      <RouterLink to="/drinks/new">新規記録</RouterLink>
      <RouterLink to="/favorites">お気に入り</RouterLink>
      <RouterLink to="/drinks">飲酒記録</RouterLink>
    </nav>

    <div v-if="authStore.isAuthenticated" class="auth-actions">
      <span v-if="authStore.userEmail" class="user-email">
        {{ authStore.userEmail }}
      </span>
      <button type="button" class="logout-button" @click="logout">
        ログアウト
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  align-items: center;
  border-bottom: 1px solid #d8ddd7;
  display: flex;
  flex-wrap: wrap;
  gap: 16px 20px;
  justify-content: space-between;
  padding: 16px 24px;
}

.brand {
  color: #173f2b;
  font-weight: 700;
  text-decoration: none;
}

nav,
.auth-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

nav a {
  color: #385140;
  text-decoration: none;
}

nav a.router-link-active {
  color: #173f2b;
  font-weight: 700;
}

.user-email {
  color: #657064;
  font-size: 0.86rem;
}

.logout-button {
  background: #fff;
  border: 1px solid #aebbac;
  border-radius: 999px;
  color: #173f2b;
  cursor: pointer;
  font: inherit;
  min-height: 34px;
  padding: 0 14px;
}
</style>
