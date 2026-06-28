import { computed, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { createDrink } from "../api/drinkApi";
import { createImageUploadUrl, uploadImageToS3 } from "../api/imageApi";
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
const selectionMode = ref("sakenowa");
const manualName = ref("");
const manualBreweryName = ref("");
const rating = ref("");
const memo = ref("");
const drankAt = ref(new Date().toISOString().slice(0, 10));
const imageFile = ref(null);
const imagePreviewUrl = ref(null);
const isSearching = ref(false);
const isLoadingDetail = ref(false);
const isSaving = ref(false);
const searchError = ref(null);
const detailError = ref(null);
const saveError = ref(null);
const selectedRecord = computed(() => {
    if (selectionMode.value === "manual") {
        const name = manualName.value.trim();
        if (!name) {
            return null;
        }
        return {
            sakeId: createManualSakeId(name, manualBreweryName.value),
            name,
            breweryName: manualBreweryName.value.trim() || undefined,
        };
    }
    return selectedDetail.value;
});
const canSave = computed(() => {
    const hasValidRating = rating.value === "" || (rating.value >= 1 && rating.value <= 5);
    return Boolean(selectedRecord.value && drankAt.value && hasValidRating);
});
async function submitSearch() {
    const q = searchQuery.value.trim();
    selectionMode.value = "sakenowa";
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
            searchError.value =
                "該当する銘柄が見つかりませんでした。手入力でも記録できます。";
            startManualEntry(q);
        }
    }
    catch (error) {
        console.error(error);
        searchError.value =
            "銘柄検索に失敗しました。手入力で記録を続けることもできます。";
    }
    finally {
        isSearching.value = false;
    }
}
async function selectSake(result) {
    selectionMode.value = "sakenowa";
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
function startManualEntry(seedName = searchQuery.value) {
    selectionMode.value = "manual";
    selectedDetail.value = null;
    manualName.value = seedName.trim() || manualName.value;
    detailError.value = null;
    saveError.value = null;
}
function handleImageChange(event) {
    const input = event.target;
    const file = input.files?.[0] ?? null;
    if (imagePreviewUrl.value) {
        URL.revokeObjectURL(imagePreviewUrl.value);
    }
    imageFile.value = file;
    imagePreviewUrl.value = file ? URL.createObjectURL(file) : null;
}
function clearImage() {
    if (imagePreviewUrl.value) {
        URL.revokeObjectURL(imagePreviewUrl.value);
    }
    imageFile.value = null;
    imagePreviewUrl.value = null;
}
async function uploadSelectedImage() {
    if (!imageFile.value) {
        return undefined;
    }
    const upload = await createImageUploadUrl({
        fileName: imageFile.value.name,
        contentType: imageFile.value.type,
    });
    await uploadImageToS3({
        uploadUrl: upload.uploadUrl,
        file: imageFile.value,
    });
    return upload.imageUrl;
}
async function submitDrink() {
    saveError.value = null;
    const record = selectedRecord.value;
    if (!record) {
        saveError.value = "銘柄を選択するか、手入力してください。";
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
        const imageUrl = await uploadSelectedImage();
        await createDrink({
            sakeId: record.sakeId,
            sakeNameSnapshot: record.name,
            breweryNameSnapshot: record.breweryName,
            flavorSnapshot: record.flavor,
            imageUrl,
            rating: rating.value === "" ? undefined : rating.value,
            memo: memo.value.trim() || undefined,
            drankAt: drankAt.value,
        });
        await router.push("/");
    }
    catch (error) {
        console.error(error);
        saveError.value = "飲酒記録の保存に失敗しました。画像サイズや形式も確認してください。";
    }
    finally {
        isSaving.value = false;
    }
}
function createManualSakeId(name, breweryName) {
    const source = `${name}:${breweryName.trim()}`.toLowerCase();
    const encoded = encodeURIComponent(source)
        .replace(/%/g, "")
        .replace(/[^a-z0-9]/gi, "")
        .slice(0, 80);
    return `manual#${encoded || Date.now().toString(36)}`;
}
function formatFlavorValue(flavor, key) {
    return Math.round(Math.max(0, Math.min(1, flavor[key])) * 100);
}
function normalizedFlavorValue(value) {
    return Math.max(0, Math.min(1, value ?? 0));
}
function radarPoint(index, value, size = 150) {
    const center = size / 2;
    const radius = size * 0.34 * normalizedFlavorValue(value);
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / flavorLabels.length;
    return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
}
function radarPolygon(flavor, fallbackValue = 1) {
    const values = flavor
        ? flavorLabels.map((axis) => flavor[axis.key])
        : flavorLabels.map(() => fallbackValue);
    return values.map((value, index) => radarPoint(index, value)).join(" ");
}
function radarAxisEnd(index) {
    return radarPoint(index, 1);
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
/** @type {__VLS_StyleScopedClasses['manual-entry-button']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-button']} */ ;
/** @type {__VLS_StyleScopedClasses['back-link']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-image-button']} */ ;
/** @type {__VLS_StyleScopedClasses['result-button']} */ ;
/** @type {__VLS_StyleScopedClasses['image-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['bottle-thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['rating-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['flavor-item']} */ ;
/** @type {__VLS_StyleScopedClasses['flavor-item']} */ ;
/** @type {__VLS_StyleScopedClasses['missing-flavor-section']} */ ;
/** @type {__VLS_StyleScopedClasses['missing-flavor-section']} */ ;
/** @type {__VLS_StyleScopedClasses['page-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['manual-fields']} */ ;
/** @type {__VLS_StyleScopedClasses['record-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['flavor-section']} */ ;
/** @type {__VLS_StyleScopedClasses['missing-flavor-section']} */ ;
/** @type {__VLS_StyleScopedClasses['image-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['bottle-thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['flavor-grid']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.startManualEntry();
            // @ts-ignore
            [submitSearch, searchQuery, isSearching, isSearching, startManualEntry,];
        } },
    type: "button",
    ...{ class: "manual-entry-button" },
});
/** @type {__VLS_StyleScopedClasses['manual-entry-button']} */ ;
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
                    [searchError, searchError, searchResults, searchResults, selectSake,];
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
if (__VLS_ctx.selectionMode === 'manual') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "panel manual-panel" },
    });
    /** @type {__VLS_StyleScopedClasses['panel']} */ ;
    /** @type {__VLS_StyleScopedClasses['manual-panel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-heading" },
    });
    /** @type {__VLS_StyleScopedClasses['section-heading']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "status" },
    });
    /** @type {__VLS_StyleScopedClasses['status']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "manual-fields" },
    });
    /** @type {__VLS_StyleScopedClasses['manual-fields']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "field" },
    });
    /** @type {__VLS_StyleScopedClasses['field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.manualName),
        type: "text",
        placeholder: "例: 蔵出し直汲み 純米生原酒",
        required: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "field" },
    });
    /** @type {__VLS_StyleScopedClasses['field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.manualBreweryName),
        type: "text",
        placeholder: "例: ○○酒造",
    });
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
if (__VLS_ctx.selectedRecord) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "selected-card" },
    });
    /** @type {__VLS_StyleScopedClasses['selected-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "record-summary" },
    });
    /** @type {__VLS_StyleScopedClasses['record-summary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "image-preview" },
    });
    /** @type {__VLS_StyleScopedClasses['image-preview']} */ ;
    if (__VLS_ctx.imagePreviewUrl) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (__VLS_ctx.imagePreviewUrl),
            alt: "選択したラベル写真",
        });
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
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
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "record-main" },
    });
    /** @type {__VLS_StyleScopedClasses['record-main']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.selectedRecord.name);
    if (__VLS_ctx.selectedRecord.breweryName) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "sub-text" },
        });
        /** @type {__VLS_StyleScopedClasses['sub-text']} */ ;
        (__VLS_ctx.selectedRecord.breweryName);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "sub-text" },
        });
        /** @type {__VLS_StyleScopedClasses['sub-text']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "record-meta" },
    });
    /** @type {__VLS_StyleScopedClasses['record-meta']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.drankAt || "飲酒日未入力");
    if (__VLS_ctx.rating) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "rating-preview" },
        });
        /** @type {__VLS_StyleScopedClasses['rating-preview']} */ ;
        (__VLS_ctx.rating);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "rating-preview muted" },
        });
        /** @type {__VLS_StyleScopedClasses['rating-preview']} */ ;
        /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    }
    if (__VLS_ctx.selectionMode === 'manual') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "manual-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['manual-badge']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "memo-preview" },
    });
    /** @type {__VLS_StyleScopedClasses['memo-preview']} */ ;
    (__VLS_ctx.memo.trim() || "メモはまだ入力されていません。");
    if (__VLS_ctx.selectedRecord.flavor) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flavor-section" },
        });
        /** @type {__VLS_StyleScopedClasses['flavor-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
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
        for (const [_, index] of __VLS_vFor((__VLS_ctx.flavorLabels))) {
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
            [isLoadingDetail, selectionMode, selectionMode, manualName, manualBreweryName, detailError, detailError, selectedRecord, selectedRecord, selectedRecord, selectedRecord, selectedRecord, imagePreviewUrl, imagePreviewUrl, drankAt, rating, rating, memo, radarPolygon, radarPolygon, flavorLabels, radarAxisEnd, radarAxisEnd,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.polygon)({
            ...{ class: "radar-fill" },
            points: (__VLS_ctx.radarPolygon(__VLS_ctx.selectedRecord.flavor)),
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
            (__VLS_ctx.formatFlavorValue(__VLS_ctx.selectedRecord.flavor, flavor.key));
            // @ts-ignore
            [selectedRecord, selectedRecord, radarPolygon, flavorLabels, formatFlavorValue,];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "missing-flavor-section" },
        });
        /** @type {__VLS_StyleScopedClasses['missing-flavor-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "missing-icon" },
            'aria-hidden': "true",
        });
        /** @type {__VLS_StyleScopedClasses['missing-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
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
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleImageChange) },
    type: "file",
    accept: "image/jpeg,image/png,image/webp",
});
if (__VLS_ctx.imageFile) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearImage) },
        ...{ class: "clear-image-button" },
        type: "button",
    });
    /** @type {__VLS_StyleScopedClasses['clear-image-button']} */ ;
}
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
[isLoadingDetail, drankAt, rating, memo, submitDrink, handleImageChange, imageFile, clearImage, saveError, saveError,];
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
