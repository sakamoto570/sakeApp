<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const email = ref("");
const password = ref("");

async function submitLogin() {
  try {
    await authStore.login(email.value.trim(), password.value);

    const redirectPath =
      typeof route.query.redirect === "string" ? route.query.redirect : "/";

    await router.push(redirectPath);
  } catch {
    // Error text is held in the auth store for the template.
  }
}
</script>

<template>
  <section class="auth-page">
    <form class="auth-card" @submit.prevent="submitLogin">
      <div class="heading">
        <h1>ログイン</h1>
        <p>飲んだお酒やお気に入りを保存します。</p>
      </div>

      <label class="field">
        <span>メールアドレス</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          required
          placeholder="you@example.com"
        />
      </label>

      <label class="field">
        <span>パスワード</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </label>

      <p v-if="authStore.error" class="error-message">
        {{ authStore.error }}
      </p>

      <button class="primary-button" type="submit" :disabled="authStore.loading">
        {{ authStore.loading ? "ログイン中..." : "ログイン" }}
      </button>

      <p class="switch-text">
        アカウントを持っていない方は
        <RouterLink to="/signup">新規登録</RouterLink>
      </p>
    </form>
  </section>
</template>

<style scoped>
.auth-page {
  display: grid;
  min-height: calc(100vh - 140px);
  place-items: center;
}

.auth-card {
  background: #fff;
  border: 1px solid #d8ddd7;
  border-radius: 18px;
  display: grid;
  gap: 18px;
  max-width: 420px;
  padding: 28px;
  width: min(100%, 420px);
}

.heading {
  display: grid;
  gap: 6px;
}

h1,
p {
  margin: 0;
}

h1 {
  color: #173f2b;
  font-size: 1.35rem;
}

.heading p,
.switch-text {
  color: #657064;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #385140;
  font-size: 0.9rem;
  font-weight: 700;
}

.field input {
  border: 1px solid #aebbac;
  border-radius: 10px;
  font: inherit;
  min-height: 46px;
  padding: 0 14px;
}

.error-message {
  color: #b42318;
  line-height: 1.6;
}

.primary-button {
  background: #173f2b;
  border: 1px solid #173f2b;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  min-height: 48px;
  padding: 0 22px;
}

.primary-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.switch-text {
  font-size: 0.9rem;
  text-align: center;
}

.switch-text a {
  color: #173f2b;
  font-weight: 700;
}
</style>
