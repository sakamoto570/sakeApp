import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { getMySakes } from "../api/sakeApi";
const mySakes = ref([]);
const isLoading = ref(false);
const errorMessage = ref(null);
async function loadMySakes() {
    isLoading.value = true;
    errorMessage.value = null;
    try {
        mySakes.value = await getMySakes();
    }
    catch (error) {
        console.error(error);
        errorMessage.value = "今まで飲んだお酒を取得できませんでした。";
    }
    finally {
        isLoading.value = false;
    }
}
onMounted(() => {
    void loadMySakes();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['status']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['sake-card']} */ ;
/** @type {__VLS_StyleScopedClasses['favorite-mark']} */ ;
/** @type {__VLS_StyleScopedClasses['new-record-button']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "home" },
});
/** @type {__VLS_StyleScopedClasses['home']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "actions" },
});
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
RouterLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ class: "action-button action-button-primary" },
    to: "/drinks/new",
}));
const __VLS_2 = __VLS_1({
    ...{ class: "action-button action-button-primary" },
    to: "/drinks/new",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button-primary']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
var __VLS_3;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ class: "action-button" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "drunk-section" },
});
/** @type {__VLS_StyleScopedClasses['drunk-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "status" },
    });
    /** @type {__VLS_StyleScopedClasses['status']} */ ;
}
else if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.errorMessage);
}
else if (__VLS_ctx.mySakes.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "status" },
    });
    /** @type {__VLS_StyleScopedClasses['status']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sake-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['sake-grid']} */ ;
    for (const [sake] of __VLS_vFor((__VLS_ctx.mySakes))) {
        let __VLS_6;
        /** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            key: (sake.sakeId),
            ...{ class: "sake-card" },
            to: (`/sakes/${sake.sakeId}`),
        }));
        const __VLS_8 = __VLS_7({
            key: (sake.sakeId),
            ...{ class: "sake-card" },
            to: (`/sakes/${sake.sakeId}`),
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        /** @type {__VLS_StyleScopedClasses['sake-card']} */ ;
        const { default: __VLS_11 } = __VLS_9.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "favorite-mark" },
            ...{ class: ({ active: sake.isFavorite }) },
        });
        /** @type {__VLS_StyleScopedClasses['favorite-mark']} */ ;
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        (sake.isFavorite ? "★" : "☆");
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (sake.sakeName);
        if (sake.breweryName) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "brewery-name" },
            });
            /** @type {__VLS_StyleScopedClasses['brewery-name']} */ ;
            (sake.breweryName);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "radar-placeholder" },
            'aria-hidden': "true",
        });
        /** @type {__VLS_StyleScopedClasses['radar-placeholder']} */ ;
        // @ts-ignore
        [isLoading, errorMessage, errorMessage, mySakes, mySakes,];
        var __VLS_9;
        // @ts-ignore
        [];
    }
}
let __VLS_12;
/** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
RouterLink;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    ...{ class: "new-record-button" },
    to: "/drinks/new",
}));
const __VLS_14 = __VLS_13({
    ...{ class: "new-record-button" },
    to: "/drinks/new",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
/** @type {__VLS_StyleScopedClasses['new-record-button']} */ ;
const { default: __VLS_17 } = __VLS_15.slots;
// @ts-ignore
[];
var __VLS_15;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
