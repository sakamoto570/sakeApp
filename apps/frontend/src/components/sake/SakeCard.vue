<script setup lang="ts">
import type { FlavorProfile, MySakeItem } from "@sake-app/shared";
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import { createFavorite, deleteFavorite } from "../../api/favoriteApi";
import { createImageViewUrl } from "../../api/imageApi";

type FlavorKey = keyof FlavorProfile;

const props = defineProps<{
  item: MySakeItem;
}>();

const emit = defineEmits<{
  favoriteChanged: [];
}>();

const flavorAxes: { key: FlavorKey; label: string }[] = [
  { key: "fruity", label: "華やか" },
  { key: "mellow", label: "芳醇" },
  { key: "rich", label: "重厚" },
  { key: "calm", label: "穏やか" },
  { key: "dry", label: "ドライ" },
  { key: "light", label: "軽快" },
];

const imageSrc = ref<string | null>(null);
const isFavoriteUpdating = ref(false);

const hasFlavor = computed(() => Boolean(props.item.flavor));
const cardClasses = computed(() => ({
  "has-image": Boolean(imageSrc.value),
  "has-flavor": hasFlavor.value,
  "no-flavor": !hasFlavor.value,
}));

watch(
  () => props.item.imageUrl,
  async (imageUrl) => {
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
    } catch (error) {
      console.error(error);
    }
  },
  { immediate: true },
);

async function toggleFavorite() {
  if (isFavoriteUpdating.value) {
    return;
  }

  isFavoriteUpdating.value = true;

  try {
    if (props.item.isFavorite) {
      await deleteFavorite(props.item.sakeId);
    } else {
      await createFavorite({
        sakeId: props.item.sakeId,
        sakeNameSnapshot: props.item.sakeName,
        breweryNameSnapshot: props.item.breweryName,
        flavorSnapshot: props.item.flavor,
        imageUrl: props.item.imageUrl,
      });
    }

    emit("favoriteChanged");
  } finally {
    isFavoriteUpdating.value = false;
  }
}

function normalizedFlavorValue(value: number | undefined) {
  return Math.max(0, Math.min(1, value ?? 0));
}

function formatFlavor(value: number | undefined) {
  return Math.round(normalizedFlavorValue(value) * 100);
}

function radarPoint(index: number, value: number, size = 150): string {
  const center = size / 2;
  const radius = size * 0.34 * normalizedFlavorValue(value);
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / flavorAxes.length;

  return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
}

function radarPolygon(flavor?: FlavorProfile, fallbackValue = 1): string {
  const values = flavor
    ? flavorAxes.map((axis) => flavor[axis.key])
    : flavorAxes.map(() => fallbackValue);

  return values.map((value, index) => radarPoint(index, value)).join(" ");
}

function radarAxisEnd(index: number): string {
  return radarPoint(index, 1);
}
</script>

<template>
  <article class="sake-card" :class="cardClasses">
    <div class="top-row">
      <RouterLink class="image-link" :to="`/sakes/${item.sakeId}`">
        <img
          v-if="imageSrc"
          class="label-image"
          :src="imageSrc"
          :alt="`${item.sakeName} のラベル写真`"
        />
        <div v-else class="image-placeholder">
          <span class="placeholder-icon">酒</span>
          <span>画像なし</span>
        </div>
      </RouterLink>

      <div class="summary">
        <div class="title-row">
          <RouterLink class="name-link" :to="`/sakes/${item.sakeId}`">
            <h2>{{ item.sakeName }}</h2>
          </RouterLink>
          <button
            type="button"
            class="favorite-button"
            :class="{ active: item.isFavorite }"
            :disabled="isFavoriteUpdating"
            :aria-label="item.isFavorite ? 'お気に入り解除' : 'お気に入り登録'"
            @click="toggleFavorite"
          >
            {{ item.isFavorite ? "★" : "☆" }}
          </button>
        </div>

        <p v-if="item.breweryName" class="brewery">{{ item.breweryName }}</p>

        <div class="meta-row">
          <span>{{ item.lastDrankAt }}</span>
          <span v-if="item.rating" class="rating">★ {{ item.rating }}</span>
          <span v-else class="muted">未評価</span>
        </div>

        <p v-if="item.memo" class="memo">{{ item.memo }}</p>
      </div>
    </div>

    <div v-if="item.flavor" class="flavor-row">
      <svg class="radar" viewBox="0 0 150 150" aria-hidden="true">
        <polygon class="radar-grid radar-grid-outer" :points="radarPolygon()" />
        <polygon class="radar-grid radar-grid-inner" :points="radarPolygon(undefined, 0.5)" />
        <line
          v-for="(_, index) in flavorAxes"
          :key="index"
          class="radar-axis"
          x1="75"
          y1="75"
          :x2="radarAxisEnd(index).split(',')[0]"
          :y2="radarAxisEnd(index).split(',')[1]"
        />
        <polygon class="radar-fill" :points="radarPolygon(item.flavor)" />
        <text class="radar-label radar-label-top" x="75" y="14">華やか</text>
        <text class="radar-label radar-label-upper-right" x="134" y="48">芳醇</text>
        <text class="radar-label radar-label-lower-right" x="134" y="105">重厚</text>
        <text class="radar-label radar-label-bottom" x="75" y="142">穏やか</text>
        <text class="radar-label radar-label-lower-left" x="16" y="105">ドライ</text>
        <text class="radar-label radar-label-upper-left" x="16" y="48">軽快</text>
      </svg>

      <div class="flavor-values">
        <span v-for="axis in flavorAxes" :key="axis.key" class="flavor-value">
          <span>{{ axis.label }}</span>
          <strong>{{ formatFlavor(item.flavor[axis.key]) }}</strong>
        </span>
      </div>
    </div>

    <div v-else class="missing-flavor">
      <strong>フレーバーデータ未取得</strong>
      <span>
        さけのわ未登録、またはレーダーチャートが無い銘柄として表示しています。
      </span>
    </div>
  </article>
</template>

<style scoped>
.sake-card {
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(135deg, #dfe7dc, #aebbac) border-box;
  border: 1px solid transparent;
  border-radius: 18px;
  box-shadow: 0 10px 28px rgb(29 49 34 / 7%);
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 16px;
}

.top-row {
  display: grid;
  gap: 16px;
  grid-template-columns: 112px minmax(0, 1fr);
}

.image-link {
  border-radius: 14px;
  display: block;
  overflow: hidden;
  text-decoration: none;
}

.label-image,
.image-placeholder {
  border: 1px solid #dbe4d8;
  border-radius: 14px;
  height: 142px;
  width: 112px;
}

.label-image {
  display: block;
  object-fit: cover;
}

.image-placeholder {
  align-items: center;
  background: linear-gradient(180deg, #f3f6f1, #e8eee5);
  color: #657064;
  display: grid;
  font-size: 0.8rem;
  gap: 6px;
  justify-items: center;
  padding: 16px;
}

.placeholder-icon {
  align-items: center;
  background: #fff;
  border-radius: 999px;
  color: #173f2b;
  display: flex;
  font-weight: 800;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.summary {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.title-row {
  align-items: start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.name-link {
  color: inherit;
  min-width: 0;
  text-decoration: none;
}

h2 {
  color: #101711;
  font-size: 1.08rem;
  line-height: 1.35;
  margin: 0;
  overflow-wrap: anywhere;
}

p {
  margin: 0;
}

.brewery,
.memo,
.muted,
.missing-flavor span {
  color: #657064;
}

.brewery,
.meta-row,
.memo {
  font-size: 0.86rem;
  line-height: 1.55;
}

.meta-row {
  align-items: center;
  color: #657064;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.rating,
.favorite-button.active {
  color: #b88900;
}

.favorite-button {
  background: transparent;
  border: 0;
  color: #bbc2b9;
  cursor: pointer;
  flex: 0 0 auto;
  font: inherit;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1;
  padding: 0;
}

.favorite-button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.flavor-row {
  border-top: 1px solid #e4ebe1;
  display: grid;
  gap: 14px;
  grid-template-columns: 150px minmax(0, 1fr);
  padding-top: 14px;
}

.radar {
  height: 150px;
  overflow: visible;
  width: 150px;
}

.radar-grid {
  fill: #f8faf6;
  stroke: #9caf98;
  stroke-width: 1;
}

.radar-grid-outer {
  stroke: #1b241d;
  stroke-width: 1.2;
}

.radar-grid-inner {
  fill: transparent;
  stroke-dasharray: 3 3;
}

.radar-axis {
  stroke: #d3ddd0;
  stroke-width: 1;
}

.radar-fill {
  fill: rgb(201 255 139 / 55%);
  stroke: #3f7a4d;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.radar-label {
  fill: #48604d;
  font-size: 8px;
  font-weight: 700;
  paint-order: stroke;
  stroke: #fff;
  stroke-linejoin: round;
  stroke-width: 3px;
}

.radar-label-top,
.radar-label-bottom {
  text-anchor: middle;
}

.radar-label-upper-right,
.radar-label-lower-right {
  text-anchor: end;
}

.radar-label-upper-left,
.radar-label-lower-left {
  text-anchor: start;
}

.flavor-values {
  align-content: center;
  display: grid;
  gap: 8px 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-width: 0;
}

.flavor-value {
  align-items: center;
  background: #f4f7f1;
  border-radius: 999px;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(44px, 1fr) 34px;
  min-width: 0;
  padding: 7px 10px;
}

.flavor-value span {
  color: #4f5f52;
  font-size: 0.78rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flavor-value strong {
  color: #1f4d33;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.missing-flavor {
  background: #f6f9fb;
  border: 1px solid #d8e6f1;
  border-radius: 14px;
  display: grid;
  gap: 4px;
  padding: 14px;
}

.missing-flavor strong {
  color: #173f2b;
  font-size: 0.92rem;
}

.missing-flavor span {
  font-size: 0.82rem;
  line-height: 1.6;
}

@media (max-width: 760px) {
  .top-row,
  .flavor-row {
    grid-template-columns: 1fr;
  }

  .label-image,
  .image-placeholder {
    height: 190px;
    width: 100%;
  }

  .flavor-values {
    grid-template-columns: 1fr;
  }
}
</style>
