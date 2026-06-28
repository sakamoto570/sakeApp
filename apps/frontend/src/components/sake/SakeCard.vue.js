import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { createFavorite, deleteFavorite } from "../../api/favoriteApi";
import { createImageViewUrl } from "../../api/imageApi";
const props = defineProps();
const emit = defineEmits();
const flavorAxes = [
    { key: "fruity", label: "華やか" },
    { key: "mellow", label: "芳醇" },
    { key: "rich", label: "重厚" },
    { key: "calm", label: "穏やか" },
    { key: "dry", label: "ドライ" },
    { key: "light", label: "軽快" },
];
const imageSrc = ref(null);
const isFavoriteUpdating = ref(false);
const hasFlavor = computed(() => Boolean(props.item.flavor));
const cardClasses = computed(() => ({
    "has-image": Boolean(imageSrc.value),
    "has-flavor": hasFlavor.value,
    "no-flavor": !hasFlavor.value,
}));
watch(() => props.item.imageUrl, async (imageUrl) => {
    imageSrc.value = null;
    if (!imageUrl) {
        return;
    }
    if (imageUrl.startsWith("http")) {
        imageSrc.value = imageUrl;
        return;
    }
    try {
        const response = await createImageViewUrl(imageUrl);
        imageSrc.value = response.viewUrl;
    }
    catch (error) {
        console.error(error);
    }
}, { immediate: true });
async function toggleFavorite() {
    if (isFavoriteUpdating.value) {
        return;
    }
    isFavoriteUpdating.value = true;
    try {
        if (props.item.isFavorite) {
            await deleteFavorite(props.item.sakeId);
        }
        else {
            await createFavorite({
                sakeId: props.item.sakeId,
                sakeNameSnapshot: props.item.sakeName,
                breweryNameSnapshot: props.item.breweryName,
                flavorSnapshot: props.item.flavor,
                imageUrl: props.item.imageUrl,
            });
        }
        emit("favoriteChanged");
    }
    finally {
        isFavoriteUpdating.value = false;
    }
}
function normalizedFlavorValue(value) {
    return Math.max(0, Math.min(1, value ?? 0));
}
function formatFlavor(value) {
    return Math.round(normalizedFlavorValue(value) * 100);
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
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['label-image']} */ ;
/** @type {__VLS_StyleScopedClasses['image-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['brewery']} */ ;
/** @type {__VLS_StyleScopedClasses['memo']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['favorite-button']} */ ;
/** @type {__VLS_StyleScopedClasses['favorite-button']} */ ;
/** @type {__VLS_StyleScopedClasses['flavor-value']} */ ;
/** @type {__VLS_StyleScopedClasses['flavor-value']} */ ;
/** @type {__VLS_StyleScopedClasses['missing-flavor']} */ ;
/** @type {__VLS_StyleScopedClasses['missing-flavor']} */ ;
/** @type {__VLS_StyleScopedClasses['missing-flavor']} */ ;
/** @type {__VLS_StyleScopedClasses['top-row']} */ ;
/** @type {__VLS_StyleScopedClasses['flavor-row']} */ ;
/** @type {__VLS_StyleScopedClasses['label-image']} */ ;
/** @type {__VLS_StyleScopedClasses['image-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['flavor-values']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
    ...{ class: "sake-card" },
    ...{ class: (__VLS_ctx.cardClasses) },
});
/** @type {__VLS_StyleScopedClasses['sake-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "top-row" },
});
/** @type {__VLS_StyleScopedClasses['top-row']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
RouterLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ class: "image-link" },
    to: (`/sakes/${__VLS_ctx.item.sakeId}`),
}));
const __VLS_2 = __VLS_1({
    ...{ class: "image-link" },
    to: (`/sakes/${__VLS_ctx.item.sakeId}`),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['image-link']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
if (__VLS_ctx.imageSrc) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        ...{ class: "label-image" },
        src: (__VLS_ctx.imageSrc),
        alt: (`${__VLS_ctx.item.sakeName} のラベル写真`),
    });
    /** @type {__VLS_StyleScopedClasses['label-image']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "image-placeholder" },
    });
    /** @type {__VLS_StyleScopedClasses['image-placeholder']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "placeholder-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['placeholder-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
// @ts-ignore
[cardClasses, item, item, imageSrc, imageSrc,];
var __VLS_3;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary" },
});
/** @type {__VLS_StyleScopedClasses['summary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "title-row" },
});
/** @type {__VLS_StyleScopedClasses['title-row']} */ ;
let __VLS_6;
/** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
RouterLink;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    ...{ class: "name-link" },
    to: (`/sakes/${__VLS_ctx.item.sakeId}`),
}));
const __VLS_8 = __VLS_7({
    ...{ class: "name-link" },
    to: (`/sakes/${__VLS_ctx.item.sakeId}`),
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
/** @type {__VLS_StyleScopedClasses['name-link']} */ ;
const { default: __VLS_11 } = __VLS_9.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.item.sakeName);
// @ts-ignore
[item, item,];
var __VLS_9;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.toggleFavorite) },
    type: "button",
    ...{ class: "favorite-button" },
    ...{ class: ({ active: __VLS_ctx.item.isFavorite }) },
    disabled: (__VLS_ctx.isFavoriteUpdating),
    'aria-label': (__VLS_ctx.item.isFavorite ? 'お気に入り解除' : 'お気に入り登録'),
});
/** @type {__VLS_StyleScopedClasses['favorite-button']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
(__VLS_ctx.item.isFavorite ? "★" : "☆");
if (__VLS_ctx.item.breweryName) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "brewery" },
    });
    /** @type {__VLS_StyleScopedClasses['brewery']} */ ;
    (__VLS_ctx.item.breweryName);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "meta-row" },
});
/** @type {__VLS_StyleScopedClasses['meta-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.item.lastDrankAt);
if (__VLS_ctx.item.rating) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "rating" },
    });
    /** @type {__VLS_StyleScopedClasses['rating']} */ ;
    (__VLS_ctx.item.rating);
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "muted" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
}
if (__VLS_ctx.item.memo) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "memo" },
    });
    /** @type {__VLS_StyleScopedClasses['memo']} */ ;
    (__VLS_ctx.item.memo);
}
if (__VLS_ctx.item.flavor) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flavor-row" },
    });
    /** @type {__VLS_StyleScopedClasses['flavor-row']} */ ;
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
        [item, item, item, item, item, item, item, item, item, item, item, toggleFavorite, isFavoriteUpdating, radarPolygon, radarPolygon, flavorAxes, radarAxisEnd, radarAxisEnd,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.polygon)({
        ...{ class: "radar-fill" },
        points: (__VLS_ctx.radarPolygon(__VLS_ctx.item.flavor)),
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
        ...{ class: "flavor-values" },
    });
    /** @type {__VLS_StyleScopedClasses['flavor-values']} */ ;
    for (const [axis] of __VLS_vFor((__VLS_ctx.flavorAxes))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            key: (axis.key),
            ...{ class: "flavor-value" },
        });
        /** @type {__VLS_StyleScopedClasses['flavor-value']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (axis.label);
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatFlavor(__VLS_ctx.item.flavor[axis.key]));
        // @ts-ignore
        [item, item, radarPolygon, flavorAxes, formatFlavor,];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "missing-flavor" },
    });
    /** @type {__VLS_StyleScopedClasses['missing-flavor']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
