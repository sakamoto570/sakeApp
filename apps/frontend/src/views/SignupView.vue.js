import { computed, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
const authStore = useAuthStore();
const router = useRouter();
const step = ref("input");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const confirmationCode = ref("");
const message = ref(null);
const canSubmitSignup = computed(() => email.value.trim().length > 0 &&
    password.value.length > 0 &&
    password.value === confirmPassword.value);
async function submitSignup() {
    if (password.value !== confirmPassword.value) {
        authStore.error = "パスワードが一致していません。";
        return;
    }
    try {
        await authStore.signUp(email.value.trim(), password.value);
        message.value = "確認コードをメールに送信しました。";
        step.value = "confirm";
    }
    catch {
        // Error text is held in the auth store for the template.
    }
}
async function submitConfirmation() {
    try {
        await authStore.confirmSignUp(email.value.trim(), confirmationCode.value.trim());
        message.value = "登録が完了しました。ログインしてください。";
        step.value = "done";
    }
    catch {
        // Error text is held in the auth store for the template.
    }
}
async function resendCode() {
    try {
        await authStore.resendSignUpCode(email.value.trim());
        message.value = "確認コードを再送しました。";
    }
    catch {
        // Error text is held in the auth store for the template.
    }
}
async function goToLogin() {
    await router.push("/login");
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['heading']} */ ;
/** @type {__VLS_StyleScopedClasses['field']} */ ;
/** @type {__VLS_StyleScopedClasses['field']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['switch-text']} */ ;
/** @type {__VLS_StyleScopedClasses['switch-text']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "auth-page" },
});
/** @type {__VLS_StyleScopedClasses['auth-page']} */ ;
if (__VLS_ctx.step === 'input') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.submitSignup) },
        ...{ class: "auth-card" },
    });
    /** @type {__VLS_StyleScopedClasses['auth-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "heading" },
    });
    /** @type {__VLS_StyleScopedClasses['heading']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "field" },
    });
    /** @type {__VLS_StyleScopedClasses['field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "email",
        autocomplete: "email",
        required: true,
        placeholder: "you@example.com",
    });
    (__VLS_ctx.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "field" },
    });
    /** @type {__VLS_StyleScopedClasses['field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "password",
        autocomplete: "new-password",
        required: true,
    });
    (__VLS_ctx.password);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "field" },
    });
    /** @type {__VLS_StyleScopedClasses['field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "password",
        autocomplete: "new-password",
        required: true,
    });
    (__VLS_ctx.confirmPassword);
    if (__VLS_ctx.authStore.error) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "error-message" },
        });
        /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
        (__VLS_ctx.authStore.error);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: "primary-button" },
        type: "submit",
        disabled: (__VLS_ctx.authStore.loading || !__VLS_ctx.canSubmitSignup),
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    (__VLS_ctx.authStore.loading ? "登録中..." : "確認コードを送信");
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "switch-text" },
    });
    /** @type {__VLS_StyleScopedClasses['switch-text']} */ ;
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        to: "/login",
    }));
    const __VLS_2 = __VLS_1({
        to: "/login",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_5 } = __VLS_3.slots;
    // @ts-ignore
    [step, submitSignup, email, password, confirmPassword, authStore, authStore, authStore, authStore, canSubmitSignup,];
    var __VLS_3;
}
else if (__VLS_ctx.step === 'confirm') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.submitConfirmation) },
        ...{ class: "auth-card" },
    });
    /** @type {__VLS_StyleScopedClasses['auth-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "heading" },
    });
    /** @type {__VLS_StyleScopedClasses['heading']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "field" },
    });
    /** @type {__VLS_StyleScopedClasses['field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.confirmationCode),
        type: "text",
        inputmode: "numeric",
        autocomplete: "one-time-code",
        required: true,
    });
    if (__VLS_ctx.message) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "success-message" },
        });
        /** @type {__VLS_StyleScopedClasses['success-message']} */ ;
        (__VLS_ctx.message);
    }
    if (__VLS_ctx.authStore.error) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "error-message" },
        });
        /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
        (__VLS_ctx.authStore.error);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: "primary-button" },
        type: "submit",
        disabled: (__VLS_ctx.authStore.loading || !__VLS_ctx.confirmationCode.trim()),
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    (__VLS_ctx.authStore.loading ? "確認中..." : "登録を完了する");
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.resendCode) },
        ...{ class: "secondary-button" },
        type: "button",
        disabled: (__VLS_ctx.authStore.loading),
    });
    /** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "auth-card" },
    });
    /** @type {__VLS_StyleScopedClasses['auth-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "heading" },
    });
    /** @type {__VLS_StyleScopedClasses['heading']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    if (__VLS_ctx.message) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "success-message" },
        });
        /** @type {__VLS_StyleScopedClasses['success-message']} */ ;
        (__VLS_ctx.message);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goToLogin) },
        ...{ class: "primary-button" },
        type: "button",
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
}
// @ts-ignore
[step, email, authStore, authStore, authStore, authStore, authStore, submitConfirmation, confirmationCode, confirmationCode, message, message, message, message, resendCode, goToLogin,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
