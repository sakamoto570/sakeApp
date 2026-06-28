import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { getMySakes, getRecommendations, getSakeDetail, searchSakes, } from "../api/sakeApi";
const flavorAxes = [
    { key: "fruity", label: "華やか" },
    { key: "mellow", label: "芳醇" },
    { key: "rich", label: "重厚" },
    { key: "calm", label: "穏やか" },
    { key: "dry", label: "ドライ" },
    { key: "light", label: "軽快" },
];
const recommendationNameSamples = ["伯楽星", "鳳凰美田", "来福"];
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
        isFavorite: true,
        rating: 4.5,
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
        isFavorite: false,
        rating: 4.2,
        lastDrankAt: "2026-06-10",
    },
    {
        sakeId: "887",
        sakeName: "蔵出し直汲み",
        breweryName: "○○酒造",
        isFavorite: true,
        rating: 4,
        lastDrankAt: "2026-05-30",
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
    {
        sakeId: "232",
        similarity: 0.89,
        flavor: {
            fruity: 0.7,
            mellow: 0.58,
            rich: 0.38,
            calm: 0.56,
            dry: 0.48,
            light: 0.78,
        },
    },
];
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
const mySakeCards = computed(() => mySakes.value.map((sake) => ({
    sakeId: sake.sakeId,
    name: sake.sakeName,
    breweryName: sake.breweryName,
    flavor: sake.flavor,
    isFavorite: sake.isFavorite,
    rating: sake.rating,
    meta: sake.lastDrankAt,
    memo: "記録した時点の情報を表示しています。",
})));
const recommendationCards = computed(() => recommendations.value.map((sake, index) => ({
    sakeId: sake.sakeId,
    name: recommendationNameSamples[index] ?? `sake #${sake.sakeId}`,
    flavor: sake.flavor,
    meta: `類似度 ${sake.similarity.toFixed(2)}`,
    memo: "味わいが近い候補です。",
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
            breweryName: result.name === "獺祭" ? "旭酒造" : undefined,
        };
        recommendations.value = demoRecommendations;
        searchNoticeMessage.value =
            "APIから詳細・推薦を取得できないため、サンプルを表示しています。";
    }
    finally {
        isLoadingRecommendations.value = false;
    }
}
function normalizedFlavorValue(value) {
    return Math.max(0, Math.min(1, value ?? 0));
}
function flavorValue(flavor, key) {
    return normalizedFlavorValue(flavor?.[key]);
}
function formatFlavor(value) {
    return `${Math.round(normalizedFlavorValue(value) * 100)}`;
}
function radarPoint(index, value, size = 150) {
    const center = size / 2;
    const radius = size * 0.34 * normalizedFlavorValue(value);
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / flavorAxes.length;
    return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
}
function radarPolygon(flavor, fallbackValue = 1) {
    const values = flavor
        ? flavorAxes.map((axis) => flavor[axis.key])
        : flavorAxes.map(() => fallbackValue);
    return values.map((value, index) => radarPoint(index, value)).join(" ");
}
function radarAxisEnd(index) {
    return radarPoint(index, 1);
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
/** @type {__VLS_StyleScopedClasses['taste-card']} */ ;
/** @type {__VLS_StyleScopedClasses['record-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['missing-title']} */ ;
/** @type {__VLS_StyleScopedClasses['missing-text']} */ ;
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
/** @type {__VLS_StyleScopedClasses['flavor-section']} */ ;
/** @type {__VLS_StyleScopedClasses['card-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['bottle-thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['flavor-values']} */ ;
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
    if (!__VLS_ctx.isLoadingMySakes && __VLS_ctx.mySakeCards.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "status" },
        });
        /** @type {__VLS_StyleScopedClasses['status']} */ ;
    }
    if (__VLS_ctx.mySakeCards.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['card-grid']} */ ;
        for (const [sake] of __VLS_vFor((__VLS_ctx.mySakeCards))) {
            let __VLS_0;
            /** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                key: (sake.sakeId),
                ...{ class: "taste-card" },
                to: (`/sakes/${sake.sakeId}`),
            }));
            const __VLS_2 = __VLS_1({
                key: (sake.sakeId),
                ...{ class: "taste-card" },
                to: (`/sakes/${sake.sakeId}`),
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
            /** @type {__VLS_StyleScopedClasses['taste-card']} */ ;
            const { default: __VLS_5 } = __VLS_3.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "card-summary" },
            });
            /** @type {__VLS_StyleScopedClasses['card-summary']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "bottle-thumb" },
                'aria-hidden': "true",
            });
            /** @type {__VLS_StyleScopedClasses['bottle-thumb']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
                ...{ class: "bottle-neck" },
            });
            /** @type {__VLS_StyleScopedClasses['bottle-neck']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
                ...{ class: "bottle-body" },
            });
            /** @type {__VLS_StyleScopedClasses['bottle-body']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "bottle-label" },
            });
            /** @type {__VLS_StyleScopedClasses['bottle-label']} */ ;
            if (sake.isFavorite) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "favorite-pill" },
                });
                /** @type {__VLS_StyleScopedClasses['favorite-pill']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "card-main" },
            });
            /** @type {__VLS_StyleScopedClasses['card-main']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "card-topline" },
            });
            /** @type {__VLS_StyleScopedClasses['card-topline']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "sake-name" },
            });
            /** @type {__VLS_StyleScopedClasses['sake-name']} */ ;
            (sake.name);
            if (sake.breweryName) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "sub-text" },
                });
                /** @type {__VLS_StyleScopedClasses['sub-text']} */ ;
                (sake.breweryName);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "record-meta" },
            });
            /** @type {__VLS_StyleScopedClasses['record-meta']} */ ;
            if (sake.meta) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (sake.meta);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "rating-chip" },
            });
            /** @type {__VLS_StyleScopedClasses['rating-chip']} */ ;
            (sake.rating ?? "未評価");
            if (!sake.flavor) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "missing-badge" },
                });
                /** @type {__VLS_StyleScopedClasses['missing-badge']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "memo-preview" },
            });
            /** @type {__VLS_StyleScopedClasses['memo-preview']} */ ;
            (sake.memo);
            if (sake.flavor) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "flavor-section" },
                });
                /** @type {__VLS_StyleScopedClasses['flavor-section']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "radar-wrap" },
                });
                /** @type {__VLS_StyleScopedClasses['radar-wrap']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                    ...{ class: "radar" },
                    viewBox: "0 0 150 150",
                    'aria-hidden': "true",
                });
                /** @type {__VLS_StyleScopedClasses['radar']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.polygon)({
                    ...{ class: "radar-grid radar-grid-outer" },
                    points: (__VLS_ctx.radarPolygon()),
                });
                /** @type {__VLS_StyleScopedClasses['radar-grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-grid-outer']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.polygon)({
                    ...{ class: "radar-grid radar-grid-inner" },
                    points: (__VLS_ctx.radarPolygon(undefined, 0.5)),
                });
                /** @type {__VLS_StyleScopedClasses['radar-grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-grid-inner']} */ ;
                for (const [_, index] of __VLS_vFor((__VLS_ctx.flavorAxes))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
                        key: (index),
                        ...{ class: "radar-axis" },
                        x1: "75",
                        y1: "75",
                        x2: (__VLS_ctx.radarAxisEnd(index).split(',')[0]),
                        y2: (__VLS_ctx.radarAxisEnd(index).split(',')[1]),
                    });
                    /** @type {__VLS_StyleScopedClasses['radar-axis']} */ ;
                    // @ts-ignore
                    [mode, mode, loadMySakes, isLoadingMySakes, isLoadingMySakes, isLoadingMySakes, noticeMessage, noticeMessage, mySakeCards, mySakeCards, mySakeCards, radarPolygon, radarPolygon, flavorAxes, radarAxisEnd, radarAxisEnd,];
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.polygon)({
                    ...{ class: "radar-fill" },
                    points: (__VLS_ctx.radarPolygon(sake.flavor)),
                });
                /** @type {__VLS_StyleScopedClasses['radar-fill']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.text, __VLS_intrinsics.text)({
                    ...{ class: "radar-label radar-label-top" },
                    x: "75",
                    y: "14",
                });
                /** @type {__VLS_StyleScopedClasses['radar-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-label-top']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.text, __VLS_intrinsics.text)({
                    ...{ class: "radar-label radar-label-upper-right" },
                    x: "134",
                    y: "48",
                });
                /** @type {__VLS_StyleScopedClasses['radar-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-label-upper-right']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.text, __VLS_intrinsics.text)({
                    ...{ class: "radar-label radar-label-lower-right" },
                    x: "134",
                    y: "105",
                });
                /** @type {__VLS_StyleScopedClasses['radar-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-label-lower-right']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.text, __VLS_intrinsics.text)({
                    ...{ class: "radar-label radar-label-bottom" },
                    x: "75",
                    y: "142",
                });
                /** @type {__VLS_StyleScopedClasses['radar-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-label-bottom']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.text, __VLS_intrinsics.text)({
                    ...{ class: "radar-label radar-label-lower-left" },
                    x: "16",
                    y: "105",
                });
                /** @type {__VLS_StyleScopedClasses['radar-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-label-lower-left']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.text, __VLS_intrinsics.text)({
                    ...{ class: "radar-label radar-label-upper-left" },
                    x: "16",
                    y: "48",
                });
                /** @type {__VLS_StyleScopedClasses['radar-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-label-upper-left']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "flavor-values" },
                    'aria-label': "風味の数値",
                });
                /** @type {__VLS_StyleScopedClasses['flavor-values']} */ ;
                for (const [axis] of __VLS_vFor((__VLS_ctx.flavorAxes))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        key: (axis.key),
                        ...{ class: "flavor-value" },
                    });
                    /** @type {__VLS_StyleScopedClasses['flavor-value']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "flavor-label" },
                    });
                    /** @type {__VLS_StyleScopedClasses['flavor-label']} */ ;
                    (axis.label);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "flavor-number" },
                    });
                    /** @type {__VLS_StyleScopedClasses['flavor-number']} */ ;
                    (__VLS_ctx.formatFlavor(__VLS_ctx.flavorValue(sake.flavor, axis.key)));
                    // @ts-ignore
                    [radarPolygon, flavorAxes, formatFlavor, flavorValue,];
                }
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "missing-flavor-section" },
                });
                /** @type {__VLS_StyleScopedClasses['missing-flavor-section']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "missing-icon" },
                    'aria-hidden': "true",
                });
                /** @type {__VLS_StyleScopedClasses['missing-icon']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "missing-title" },
                });
                /** @type {__VLS_StyleScopedClasses['missing-title']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "missing-text" },
                });
                /** @type {__VLS_StyleScopedClasses['missing-text']} */ ;
            }
            // @ts-ignore
            [];
            var __VLS_3;
            // @ts-ignore
            [];
        }
    }
    let __VLS_6;
    /** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        ...{ class: "secondary-action" },
        to: "/drinks/new",
    }));
    const __VLS_8 = __VLS_7({
        ...{ class: "secondary-action" },
        to: "/drinks/new",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['secondary-action']} */ ;
    const { default: __VLS_11 } = __VLS_9.slots;
    // @ts-ignore
    [];
    var __VLS_9;
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
                let __VLS_12;
                /** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
                RouterLink;
                // @ts-ignore
                const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
                    key: (sake.sakeId),
                    ...{ class: "taste-card" },
                    to: (`/sakes/${sake.sakeId}`),
                }));
                const __VLS_14 = __VLS_13({
                    key: (sake.sakeId),
                    ...{ class: "taste-card" },
                    to: (`/sakes/${sake.sakeId}`),
                }, ...__VLS_functionalComponentArgsRest(__VLS_13));
                /** @type {__VLS_StyleScopedClasses['taste-card']} */ ;
                const { default: __VLS_17 } = __VLS_15.slots;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "card-summary recommendation-summary" },
                });
                /** @type {__VLS_StyleScopedClasses['card-summary']} */ ;
                /** @type {__VLS_StyleScopedClasses['recommendation-summary']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "card-main" },
                });
                /** @type {__VLS_StyleScopedClasses['card-main']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "sake-name" },
                });
                /** @type {__VLS_StyleScopedClasses['sake-name']} */ ;
                (sake.name);
                if (sake.meta) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "sub-text" },
                    });
                    /** @type {__VLS_StyleScopedClasses['sub-text']} */ ;
                    (sake.meta);
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "memo-preview" },
                });
                /** @type {__VLS_StyleScopedClasses['memo-preview']} */ ;
                (sake.memo);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "flavor-section" },
                });
                /** @type {__VLS_StyleScopedClasses['flavor-section']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "radar-wrap" },
                });
                /** @type {__VLS_StyleScopedClasses['radar-wrap']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                    ...{ class: "radar" },
                    viewBox: "0 0 150 150",
                    'aria-hidden': "true",
                });
                /** @type {__VLS_StyleScopedClasses['radar']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.polygon)({
                    ...{ class: "radar-grid radar-grid-outer" },
                    points: (__VLS_ctx.radarPolygon()),
                });
                /** @type {__VLS_StyleScopedClasses['radar-grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-grid-outer']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.polygon)({
                    ...{ class: "radar-grid radar-grid-inner" },
                    points: (__VLS_ctx.radarPolygon(undefined, 0.5)),
                });
                /** @type {__VLS_StyleScopedClasses['radar-grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-grid-inner']} */ ;
                for (const [_, index] of __VLS_vFor((__VLS_ctx.flavorAxes))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
                        key: (index),
                        ...{ class: "radar-axis" },
                        x1: "75",
                        y1: "75",
                        x2: (__VLS_ctx.radarAxisEnd(index).split(',')[0]),
                        y2: (__VLS_ctx.radarAxisEnd(index).split(',')[1]),
                    });
                    /** @type {__VLS_StyleScopedClasses['radar-axis']} */ ;
                    // @ts-ignore
                    [radarPolygon, radarPolygon, flavorAxes, radarAxisEnd, radarAxisEnd, isSearching, selectedSake, selectedSake, isLoadingRecommendations, recommendationCards,];
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.polygon)({
                    ...{ class: "radar-fill" },
                    points: (__VLS_ctx.radarPolygon(sake.flavor)),
                });
                /** @type {__VLS_StyleScopedClasses['radar-fill']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.text, __VLS_intrinsics.text)({
                    ...{ class: "radar-label radar-label-top" },
                    x: "75",
                    y: "14",
                });
                /** @type {__VLS_StyleScopedClasses['radar-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-label-top']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.text, __VLS_intrinsics.text)({
                    ...{ class: "radar-label radar-label-upper-right" },
                    x: "134",
                    y: "48",
                });
                /** @type {__VLS_StyleScopedClasses['radar-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-label-upper-right']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.text, __VLS_intrinsics.text)({
                    ...{ class: "radar-label radar-label-lower-right" },
                    x: "134",
                    y: "105",
                });
                /** @type {__VLS_StyleScopedClasses['radar-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-label-lower-right']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.text, __VLS_intrinsics.text)({
                    ...{ class: "radar-label radar-label-bottom" },
                    x: "75",
                    y: "142",
                });
                /** @type {__VLS_StyleScopedClasses['radar-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-label-bottom']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.text, __VLS_intrinsics.text)({
                    ...{ class: "radar-label radar-label-lower-left" },
                    x: "16",
                    y: "105",
                });
                /** @type {__VLS_StyleScopedClasses['radar-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-label-lower-left']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.text, __VLS_intrinsics.text)({
                    ...{ class: "radar-label radar-label-upper-left" },
                    x: "16",
                    y: "48",
                });
                /** @type {__VLS_StyleScopedClasses['radar-label']} */ ;
                /** @type {__VLS_StyleScopedClasses['radar-label-upper-left']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "flavor-values" },
                    'aria-label': "風味の数値",
                });
                /** @type {__VLS_StyleScopedClasses['flavor-values']} */ ;
                for (const [axis] of __VLS_vFor((__VLS_ctx.flavorAxes))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        key: (axis.key),
                        ...{ class: "flavor-value" },
                    });
                    /** @type {__VLS_StyleScopedClasses['flavor-value']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "flavor-label" },
                    });
                    /** @type {__VLS_StyleScopedClasses['flavor-label']} */ ;
                    (axis.label);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "flavor-number" },
                    });
                    /** @type {__VLS_StyleScopedClasses['flavor-number']} */ ;
                    (__VLS_ctx.formatFlavor(__VLS_ctx.flavorValue(sake.flavor, axis.key)));
                    // @ts-ignore
                    [radarPolygon, flavorAxes, formatFlavor, flavorValue,];
                }
                // @ts-ignore
                [];
                var __VLS_15;
                // @ts-ignore
                [];
            }
        }
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
