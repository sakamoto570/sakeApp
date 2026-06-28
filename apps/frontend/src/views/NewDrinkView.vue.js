import { computed, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { createDrink } from "../api/drinkApi";
import { getSakeDetail, searchSakes } from "../api/sakeApi";
const flavorLabels = [
    { key: "fruity", label: "華やか" },
    { key: "mellow", label: "芳醇" },
    { key: "rich", label: "重厚" },
    { key: "calm", label: "穏やか" },
    { key: "dry", label: "ドライ" },
    { key: "light", label: "軽快" },
];
const router = useRouter();
const searchQuery = ref("");
const searchResults = ref([]);
const selectedDetail = ref(null);
const rating = ref("");
const memo = ref("");
const drankAt = ref(new Date().toISOString().slice(0, 10));
const isSearching = ref(false);
const isLoadingDetail = ref(false);
const isSaving = ref(false);
const searchError = ref(null);
const detailError = ref(null);
const saveError = ref(null);
const canSave = computed(() => {
    const hasValidRating = rating.value === "" || (rating.value >= 1 && rating.value <= 5);
    return Boolean(selectedDetail.value && drankAt.value && hasValidRating);
});
async function submitSearch() {
    const q = searchQuery.value.trim();
    searchError.value = null;
    detailError.value = null;
    saveError.value = null;
    if (!q) {
        searchError.value = "銘柄名を入力してください。";
        searchResults.value = [];
        return;
    }
    isSearching.value = true;
    selectedDetail.value = null;
    searchResults.value = [];
    try {
        searchResults.value = await searchSakes(q);
        if (searchResults.value.length === 0) {
            searchError.value = "該当する銘柄が見つかりませんでした。";
        }
    }
    catch (error) {
        console.error(error);
        searchError.value = "銘柄検索に失敗しました。";
    }
    finally {
        isSearching.value = false;
    }
}
async function selectSake(result) {
    detailError.value = null;
    saveError.value = null;
    selectedDetail.value = null;
    isLoadingDetail.value = true;
    try {
        selectedDetail.value = await getSakeDetail(result.sakeId);
    }
    catch (error) {
        console.error(error);
        detailError.value = "日本酒の詳細取得に失敗しました。";
    }
    finally {
        isLoadingDetail.value = false;
    }
}
async function submitDrink() {
    saveError.value = null;
    if (!selectedDetail.value) {
        saveError.value = "銘柄を選択してください。";
        return;
    }
    if (!drankAt.value) {
        saveError.value = "飲酒日を入力してください。";
        return;
    }
    if (rating.value !== "" && (rating.value < 1 || rating.value > 5)) {
        saveError.value = "評価は1〜5で入力してください。";
        return;
    }
    isSaving.value = true;
    try {
        await createDrink({
            sakeId: selectedDetail.value.sakeId,
            sakeNameSnapshot: selectedDetail.value.name,
            breweryNameSnapshot: selectedDetail.value.breweryName,
            flavorSnapshot: selectedDetail.value.flavor,
            rating: rating.value === "" ? undefined : rating.value,
            memo: memo.value.trim() || undefined,
            drankAt: drankAt.value,
        });
        await router.push("/");
    }
    catch (error) {
        console.error(error);
        saveError.value = "飲酒記録の保存に失敗しました。";
    }
    finally {
        isSaving.value = false;
    }
}
function formatFlavorValue(flavor, key) {
    return Math.round(Math.max(0, Math.min(1, flavor[key])) * 100);
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['page-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['field']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['back-link']} */ ;
/** @type {__VLS_StyleScopedClasses['result-button']} */ ;
/** @type {__VLS_StyleScopedClasses['result-button']} */ ;
/** @type {__VLS_StyleScopedClasses['result-button']} */ ;
/** @type {__VLS_StyleScopedClasses['flavor-item']} */ ;
/** @type {__VLS_StyleScopedClasses['flavor-item']} */ ;
/** @type {__VLS_StyleScopedClasses['page-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "page" },
});
/** @type {__VLS_StyleScopedClasses['page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-heading" },
});
/** @type {__VLS_StyleScopedClasses['page-heading']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
RouterLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ class: "back-link" },
    to: "/",
}));
const __VLS_2 = __VLS_1({
    ...{ class: "back-link" },
    to: "/",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['back-link']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
var __VLS_3;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "panel" },
});
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.submitSearch) },
    ...{ class: "search-form" },
});
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "field search-field" },
});
/** @type {__VLS_StyleScopedClasses['field']} */ ;
/** @type {__VLS_StyleScopedClasses['search-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "search",
    placeholder: "例: 獺祭",
    autocomplete: "off",
});
(__VLS_ctx.searchQuery);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    type: "submit",
    disabled: (__VLS_ctx.isSearching),
});
(__VLS_ctx.isSearching ? "検索中..." : "検索");
if (__VLS_ctx.searchError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "error-message" },
    });
    /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
    (__VLS_ctx.searchError);
}
if (__VLS_ctx.searchResults.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "search-results" },
    });
    /** @type {__VLS_StyleScopedClasses['search-results']} */ ;
    for (const [result] of __VLS_vFor((__VLS_ctx.searchResults))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.searchResults.length > 0))
                        return;
                    __VLS_ctx.selectSake(result);
                    // @ts-ignore
                    [submitSearch, searchQuery, isSearching, isSearching, searchError, searchError, searchResults, searchResults, selectSake,];
                } },
            key: (result.sakeId),
            type: "button",
            ...{ class: "result-button" },
            ...{ class: ({ selected: __VLS_ctx.selectedDetail?.sakeId === result.sakeId }) },
            disabled: (__VLS_ctx.isLoadingDetail),
        });
        /** @type {__VLS_StyleScopedClasses['result-button']} */ ;
        /** @type {__VLS_StyleScopedClasses['selected']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (result.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
        (result.sakeId);
        // @ts-ignore
        [selectedDetail, isLoadingDetail,];
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "panel" },
});
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-heading" },
});
/** @type {__VLS_StyleScopedClasses['section-heading']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
if (__VLS_ctx.isLoadingDetail) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "status" },
    });
    /** @type {__VLS_StyleScopedClasses['status']} */ ;
}
if (__VLS_ctx.detailError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "error-message" },
    });
    /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
    (__VLS_ctx.detailError);
}
if (__VLS_ctx.selectedDetail) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "selected-card" },
    });
    /** @type {__VLS_StyleScopedClasses['selected-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.selectedDetail.name);
    if (__VLS_ctx.selectedDetail.breweryName) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "sub-text" },
        });
        /** @type {__VLS_StyleScopedClasses['sub-text']} */ ;
        (__VLS_ctx.selectedDetail.breweryName);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "sub-text" },
        });
        /** @type {__VLS_StyleScopedClasses['sub-text']} */ ;
    }
    if (__VLS_ctx.selectedDetail.flavor) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flavor-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['flavor-grid']} */ ;
        for (const [flavor] of __VLS_vFor((__VLS_ctx.flavorLabels))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                key: (flavor.key),
                ...{ class: "flavor-item" },
            });
            /** @type {__VLS_StyleScopedClasses['flavor-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (flavor.label);
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.formatFlavorValue(__VLS_ctx.selectedDetail.flavor, flavor.key));
            // @ts-ignore
            [selectedDetail, selectedDetail, selectedDetail, selectedDetail, selectedDetail, selectedDetail, isLoadingDetail, detailError, detailError, flavorLabels, formatFlavorValue,];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "status" },
        });
        /** @type {__VLS_StyleScopedClasses['status']} */ ;
    }
}
else if (!__VLS_ctx.isLoadingDetail) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "status" },
    });
    /** @type {__VLS_StyleScopedClasses['status']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.submitDrink) },
    ...{ class: "panel form-panel" },
});
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['form-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "field" },
});
/** @type {__VLS_StyleScopedClasses['field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.rating),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (1),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (2),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (3),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (4),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (5),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "field" },
});
/** @type {__VLS_StyleScopedClasses['field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
    value: (__VLS_ctx.memo),
    rows: "4",
    placeholder: "味の印象、飲んだ場所、合わせた料理など",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "field" },
});
/** @type {__VLS_StyleScopedClasses['field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "date",
    required: true,
});
(__VLS_ctx.drankAt);
if (__VLS_ctx.saveError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "error-message" },
    });
    /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
    (__VLS_ctx.saveError);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "actions" },
});
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
let __VLS_6;
/** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
RouterLink;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    ...{ class: "secondary-button" },
    to: "/",
}));
const __VLS_8 = __VLS_7({
    ...{ class: "secondary-button" },
    to: "/",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
const { default: __VLS_11 } = __VLS_9.slots;
// @ts-ignore
[isLoadingDetail, submitDrink, rating, memo, drankAt, saveError, saveError,];
var __VLS_9;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ class: "primary-button" },
    type: "submit",
    disabled: (__VLS_ctx.isSaving || !__VLS_ctx.canSave),
});
/** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
(__VLS_ctx.isSaving ? "保存中..." : "保存する");
// @ts-ignore
[isSaving, isSaving, canSave,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
