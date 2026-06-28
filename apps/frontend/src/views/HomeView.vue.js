import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import SakeCard from "../components/sake/SakeCard.vue";
import { getMySakes, getRecommendations, getSakeDetail, searchSakes, } from "../api/sakeApi";
const demoMySakes = [
    {
        sakeId: "144",
        sakeName: "十四代",
        breweryName: "高木酒造",
        flavor: {
            fruity: 0.88,
            mellow: 0.78,
            rich: 0.42,
            calm: 0.34,
            dry: 0.32,
            light: 0.72,
        },
        imageUrl: "https://images.unsplash.com/photo-1612878010854-1250dfc5000a?auto=format&fit=crop&w=240&q=80",
        rating: 4.5,
        memo: "フルーティーで飲みやすい。バランスが良い。",
        isFavorite: true,
        lastDrankAt: "2026-06-18",
    },
    {
        sakeId: "109",
        sakeName: "新政",
        breweryName: "新政酒造",
        flavor: {
            fruity: 0.76,
            mellow: 0.54,
            rich: 0.36,
            calm: 0.48,
            dry: 0.5,
            light: 0.82,
        },
        rating: 4.2,
        memo: "爽やかで透明感がある。酸味が心地よい。",
        isFavorite: false,
        lastDrankAt: "2026-06-10",
    },
    {
        sakeId: "manual#kuradashi",
        sakeName: "蔵出し直汲み 純米生原酒",
        breweryName: "○○酒造",
        imageUrl: "https://images.unsplash.com/photo-1612878010854-1250dfc5000a?auto=format&fit=crop&w=240&q=80",
        rating: 4,
        memo: "さけのわ未登録。開けたてのガス感がよかった。",
        isFavorite: true,
        lastDrankAt: "2026-05-30",
    },
    {
        sakeId: "manual#noimage",
        sakeName: "旅先で飲んだ地酒",
        breweryName: "小さな酒蔵",
        memo: "画像も風味データも無い手入力記録。",
        isFavorite: false,
        lastDrankAt: "2026-05-12",
    },
];
const demoSearchResults = [
    { sakeId: "144", name: "十四代" },
    { sakeId: "109", name: "新政" },
    { sakeId: "887", name: "獺祭" },
];
const demoRecommendations = [
    {
        sakeId: "58",
        similarity: 0.96,
        flavor: {
            fruity: 0.84,
            mellow: 0.72,
            rich: 0.4,
            calm: 0.38,
            dry: 0.34,
            light: 0.76,
        },
    },
    {
        sakeId: "258",
        similarity: 0.92,
        flavor: {
            fruity: 0.78,
            mellow: 0.7,
            rich: 0.46,
            calm: 0.44,
            dry: 0.38,
            light: 0.7,
        },
    },
];
const recommendationNames = ["伯楽星", "鳳凰美田"];
const mode = ref("record");
const mySakes = ref([]);
const searchQuery = ref("");
const searchResults = ref([]);
const selectedSake = ref(null);
const recommendations = ref([]);
const isLoadingMySakes = ref(false);
const isSearching = ref(false);
const isLoadingRecommendations = ref(false);
const noticeMessage = ref(null);
const searchNoticeMessage = ref(null);
const recommendationCards = computed(() => recommendations.value.map((recommendation, index) => ({
    sakeId: recommendation.sakeId,
    sakeName: recommendationNames[index] ?? `sake #${recommendation.sakeId}`,
    flavor: recommendation.flavor,
    rating: Number(recommendation.similarity.toFixed(2)),
    memo: "味わいが近い候補です。",
    isFavorite: false,
    lastDrankAt: `類似度 ${recommendation.similarity.toFixed(2)}`,
})));
function setMode(nextMode) {
    mode.value = nextMode;
}
async function loadMySakes() {
    isLoadingMySakes.value = true;
    noticeMessage.value = null;
    try {
        mySakes.value = await getMySakes();
    }
    catch (error) {
        console.error(error);
        mySakes.value = demoMySakes;
        noticeMessage.value =
            "APIから取得できないため、カード確認用のサンプルを表示しています。";
    }
    finally {
        isLoadingMySakes.value = false;
    }
}
async function submitSearch() {
    const q = searchQuery.value.trim();
    if (!q) {
        searchNoticeMessage.value = "検索キーワードを入力してください。";
        return;
    }
    isSearching.value = true;
    searchNoticeMessage.value = null;
    selectedSake.value = null;
    recommendations.value = [];
    try {
        searchResults.value = await searchSakes(q);
    }
    catch (error) {
        console.error(error);
        searchResults.value = demoSearchResults;
        searchNoticeMessage.value =
            "APIから検索できないため、サンプル候補を表示しています。";
    }
    finally {
        isSearching.value = false;
    }
}
async function selectSake(result) {
    isLoadingRecommendations.value = true;
    searchNoticeMessage.value = null;
    recommendations.value = [];
    try {
        selectedSake.value = await getSakeDetail(result.sakeId);
        recommendations.value = await getRecommendations(result.sakeId);
    }
    catch (error) {
        console.error(error);
        selectedSake.value = {
            sakeId: result.sakeId,
            name: result.name,
        };
        recommendations.value = demoRecommendations;
        searchNoticeMessage.value =
            "APIから詳細・推薦を取得できないため、サンプルを表示しています。";
    }
    finally {
        isLoadingRecommendations.value = false;
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
/** @type {__VLS_StyleScopedClasses['mode-button']} */ ;
/** @type {__VLS_StyleScopedClasses['mode-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['result-card']} */ ;
/** @type {__VLS_StyleScopedClasses['home']} */ ;
/** @type {__VLS_StyleScopedClasses['mode-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['mode-button']} */ ;
/** @type {__VLS_StyleScopedClasses['card-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['result-strip']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "home" },
});
/** @type {__VLS_StyleScopedClasses['home']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mode-switch" },
    'aria-label': "ホーム表示切り替え",
});
/** @type {__VLS_StyleScopedClasses['mode-switch']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.setMode('record');
            // @ts-ignore
            [setMode,];
        } },
    type: "button",
    ...{ class: "mode-button" },
    ...{ class: ({ active: __VLS_ctx.mode === 'record' }) },
});
/** @type {__VLS_StyleScopedClasses['mode-button']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.setMode('search');
            // @ts-ignore
            [setMode, mode,];
        } },
    type: "button",
    ...{ class: "mode-button" },
    ...{ class: ({ active: __VLS_ctx.mode === 'search' }) },
});
/** @type {__VLS_StyleScopedClasses['mode-button']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
if (__VLS_ctx.mode === 'record') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "panel" },
    });
    /** @type {__VLS_StyleScopedClasses['panel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-heading" },
    });
    /** @type {__VLS_StyleScopedClasses['section-heading']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.loadMySakes) },
        type: "button",
        ...{ class: "text-button" },
        disabled: (__VLS_ctx.isLoadingMySakes),
    });
    /** @type {__VLS_StyleScopedClasses['text-button']} */ ;
    if (__VLS_ctx.isLoadingMySakes) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "status" },
        });
        /** @type {__VLS_StyleScopedClasses['status']} */ ;
    }
    if (__VLS_ctx.noticeMessage) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "notice" },
        });
        /** @type {__VLS_StyleScopedClasses['notice']} */ ;
        (__VLS_ctx.noticeMessage);
    }
    if (!__VLS_ctx.isLoadingMySakes && __VLS_ctx.mySakes.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "status" },
        });
        /** @type {__VLS_StyleScopedClasses['status']} */ ;
    }
    if (__VLS_ctx.mySakes.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['card-grid']} */ ;
        for (const [sake] of __VLS_vFor((__VLS_ctx.mySakes))) {
            const __VLS_0 = SakeCard;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                ...{ 'onFavoriteChanged': {} },
                key: (sake.sakeId),
                item: (sake),
            }));
            const __VLS_2 = __VLS_1({
                ...{ 'onFavoriteChanged': {} },
                key: (sake.sakeId),
                item: (sake),
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
            let __VLS_5;
            const __VLS_6 = {
                /** @type {typeof __VLS_5.favoriteChanged} */
                onFavoriteChanged: (__VLS_ctx.loadMySakes),
            };
            var __VLS_3;
            var __VLS_4;
            // @ts-ignore
            [mode, mode, loadMySakes, loadMySakes, isLoadingMySakes, isLoadingMySakes, isLoadingMySakes, noticeMessage, noticeMessage, mySakes, mySakes, mySakes,];
        }
    }
    let __VLS_7;
    /** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ class: "secondary-action" },
        to: "/drinks/new",
    }));
    const __VLS_9 = __VLS_8({
        ...{ class: "secondary-action" },
        to: "/drinks/new",
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    /** @type {__VLS_StyleScopedClasses['secondary-action']} */ ;
    const { default: __VLS_12 } = __VLS_10.slots;
    // @ts-ignore
    [];
    var __VLS_10;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "panel search-panel" },
    });
    /** @type {__VLS_StyleScopedClasses['panel']} */ ;
    /** @type {__VLS_StyleScopedClasses['search-panel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "search-block" },
    });
    /** @type {__VLS_StyleScopedClasses['search-block']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.submitSearch) },
        ...{ class: "search-form" },
    });
    /** @type {__VLS_StyleScopedClasses['search-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "search",
        placeholder: "銘柄名で検索",
        'aria-label': "銘柄名で検索",
    });
    (__VLS_ctx.searchQuery);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        disabled: (__VLS_ctx.isSearching),
    });
    if (__VLS_ctx.searchNoticeMessage) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "notice" },
        });
        /** @type {__VLS_StyleScopedClasses['notice']} */ ;
        (__VLS_ctx.searchNoticeMessage);
    }
    if (__VLS_ctx.searchResults.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "result-strip" },
        });
        /** @type {__VLS_StyleScopedClasses['result-strip']} */ ;
        for (const [result] of __VLS_vFor((__VLS_ctx.searchResults.slice(0, 6)))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.mode === 'record'))
                            return;
                        if (!(__VLS_ctx.searchResults.length > 0))
                            return;
                        __VLS_ctx.selectSake(result);
                        // @ts-ignore
                        [submitSearch, searchQuery, isSearching, searchNoticeMessage, searchNoticeMessage, searchResults, searchResults, selectSake,];
                    } },
                key: (result.sakeId),
                type: "button",
                ...{ class: "result-card" },
            });
            /** @type {__VLS_StyleScopedClasses['result-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "sake-name" },
            });
            /** @type {__VLS_StyleScopedClasses['sake-name']} */ ;
            (result.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "sub-text" },
            });
            /** @type {__VLS_StyleScopedClasses['sub-text']} */ ;
            (result.sakeId);
            // @ts-ignore
            [];
        }
    }
    else if (__VLS_ctx.isSearching) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "status" },
        });
        /** @type {__VLS_StyleScopedClasses['status']} */ ;
    }
    if (__VLS_ctx.selectedSake) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "recommendation-block" },
        });
        /** @type {__VLS_StyleScopedClasses['recommendation-block']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "status" },
        });
        /** @type {__VLS_StyleScopedClasses['status']} */ ;
        (__VLS_ctx.selectedSake.name);
        if (__VLS_ctx.isLoadingRecommendations) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "status" },
            });
            /** @type {__VLS_StyleScopedClasses['status']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['card-grid']} */ ;
            for (const [sake] of __VLS_vFor((__VLS_ctx.recommendationCards))) {
                const __VLS_13 = SakeCard;
                // @ts-ignore
                const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
                    ...{ 'onFavoriteChanged': {} },
                    key: (sake.sakeId),
                    item: (sake),
                }));
                const __VLS_15 = __VLS_14({
                    ...{ 'onFavoriteChanged': {} },
                    key: (sake.sakeId),
                    item: (sake),
                }, ...__VLS_functionalComponentArgsRest(__VLS_14));
                let __VLS_18;
                const __VLS_19 = {
                    /** @type {typeof __VLS_18.favoriteChanged} */
                    onFavoriteChanged: (__VLS_ctx.loadMySakes),
                };
                var __VLS_16;
                var __VLS_17;
                // @ts-ignore
                [loadMySakes, isSearching, selectedSake, selectedSake, isLoadingRecommendations, recommendationCards,];
            }
        }
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
