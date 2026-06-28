<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

import { useAuthStore } from "../stores/auth";

type SignupStep = "input" | "confirm" | "done";

const authStore = useAuthStore();
const router = useRouter();

const step = ref<SignupStep>("input");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const confirmationCode = ref("");
const message = ref<string | null>(null);

const canSubmitSignup = computed(
  () =>
    email.value.trim().length > 0 &&
    password.value.length > 0 &&
    password.value === confirmPassword.value,
);

async function submitSignup() {
  if (password.value !== confirmPassword.value) {
    authStore.error = "パスワードが一致していません。";
    return;
  }

  try {
    await authStore.signUp(email.value.trim(), password.value);
    message.value = "確認コードをメールに送信しました。";
    step.value = "confirm";
  } catch {
    // Error text is held in the auth store for the template.
  }
}

async function submitConfirmation() {
  try {
    await authStore.confirmSignUp(
      email.value.trim(),
      confirmationCode.value.trim(),
    );
    message.value = "登録が完了しました。ログインしてください。";
    step.value = "done";
  } catch {
    // Error text is held in the auth store for the template.
  }
}

async function resendCode() {
  try {
    await authStore.resendSignUpCode(email.value.trim());
    message.value = "確認コードを再送しました。";
  } catch {
    // Error text is held in the auth store for the template.
  }
}

async function goToLogin() {
  await router.push("/login");
}
</script>

<template>
  <section class="auth-page">
    <form
      v-if="step === 'input'"
      class="auth-card"
      @submit.prevent="submitSignup"
    >
      <div class="heading">
        <h1>新規登録</h1>
        <p>メールアドレスでアカウントを作成します。</p>
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
          autocomplete="new-password"
          required
        />
      </label>

      <label class="field">
        <span>パスワード確認</span>
        <input
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          required
        />
      </label>

      <p v-if="authStore.error" class="error-message">
        {{ authStore.error }}
      </p>

      <button
        class="primary-button"
        type="submit"
        :disabled="authStore.loading || !canSubmitSignup"
      >
        {{ authStore.loading ? "登録中..." : "確認コードを送信" }}
      </button>

      <p class="switch-text">
        すでにアカウントを持っている方は
        <RouterLink to="/login">ログイン</RouterLink>
      </p>
    </form>

    <form
      v-else-if="step === 'confirm'"
      class="auth-card"
      @submit.prevent="submitConfirmation"
    >
      <div class="heading">
        <h1>メール確認</h1>
        <p>{{ email }} に届いた確認コードを入力してください。</p>
      </div>

      <label class="field">
        <span>確認コード</span>
        <input
          v-model="confirmationCode"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          required
        />
      </label>

      <p v-if="message" class="success-message">{{ message }}</p>
      <p v-if="authStore.error" class="error-message">
        {{ authStore.error }}
      </p>

      <button
        class="primary-button"
        type="submit"
        :disabled="authStore.loading || !confirmationCode.trim()"
      >
        {{ authStore.loading ? "確認中..." : "登録を完了する" }}
      </button>

      <button
        class="secondary-button"
        type="button"
        :disabled="authStore.loading"
        @click="resendCode"
      >
        確認コードを再送
      </button>
    </form>

    <div v-else class="auth-card">
      <div class="heading">
        <h1>登録完了</h1>
        <p>ログインして、飲んだお酒を記録できます。</p>
      </div>

      <p v-if="message" class="success-message">{{ message }}</p>

      <button class="primary-button" type="button" @click="goToLogin">
        ログインへ
      </button>
    </div>
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
  max-width: 440px;
  padding: 28px;
  width: min(100%, 440px);
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

.success-message {
  color: #2d6a46;
  line-height: 1.6;
}

.primary-button,
.secondary-button {
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  min-height: 48px;
  padding: 0 22px;
}

.primary-button {
  background: #173f2b;
  border: 1px solid #173f2b;
  color: #fff;
}

.secondary-button {
  background: #fff;
  border: 1px solid #aebbac;
  color: #173f2b;
}

.primary-button:disabled,
.secondary-button:disabled {
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
