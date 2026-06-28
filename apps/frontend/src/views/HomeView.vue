<script setup lang="ts">
import type {
  FlavorProfile,
  MySakeItem,
  SakeDetailResponse,
  SakeRecommendation,
  SakeSearchResult,
} from "@sake-app/shared";
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

import {
  getMySakes,
  getRecommendations,
  getSakeDetail,
  searchSakes,
} from "../api/sakeApi";

type HomeMode = "record" | "search";
type FlavorKey = keyof FlavorProfile;

type DisplaySake = {
  sakeId: string;
  name: string;
  breweryName?: string;
  flavor?: FlavorProfile;
  isFavorite?: boolean;
  rating?: number;
  meta?: string;
  memo?: string;
};

type DemoMySakeItem = MySakeItem & {
  rating?: number;
};

const flavorAxes: { key: FlavorKey; label: string }[] = [
  { key: "fruity", label: "華やか" },
  { key: "mellow", label: "芳醇" },
  { key: "rich", label: "重厚" },
  { key: "calm", label: "穏やか" },
  { key: "dry", label: "ドライ" },
  { key: "light", label: "軽快" },
];

const recommendationNameSamples = ["伯楽星", "鳳凰美田", "来福"];

const demoMySakes: DemoMySakeItem[] = [
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

const demoSearchResults: SakeSearchResult[] = [
  { sakeId: "144", name: "十四代" },
  { sakeId: "109", name: "新政" },
  { sakeId: "887", name: "獺祭" },
];

const demoRecommendations: SakeRecommendation[] = [
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

const mode = ref<HomeMode>("record");
const mySakes = ref<MySakeItem[]>([]);
const searchQuery = ref("");
const searchResults = ref<SakeSearchResult[]>([]);
const selectedSake = ref<SakeDetailResponse | null>(null);
const recommendations = ref<SakeRecommendation[]>([]);
const isLoadingMySakes = ref(false);
const isSearching = ref(false);
const isLoadingRecommendations = ref(false);
const noticeMessage = ref<string | null>(null);
const searchNoticeMessage = ref<string | null>(null);

const mySakeCards = computed<DisplaySake[]>(() =>
  mySakes.value.map((sake) => ({
    sakeId: sake.sakeId,
    name: sake.sakeName,
    breweryName: sake.breweryName,
    flavor: sake.flavor,
    isFavorite: sake.isFavorite,
    rating: (sake as MySakeItem & { rating?: number }).rating,
    meta: sake.lastDrankAt,
    memo: "記録した時点の情報を表示しています。",
  })),
);

const recommendationCards = computed<DisplaySake[]>(() =>
  recommendations.value.map((sake, index) => ({
    sakeId: sake.sakeId,
    name: recommendationNameSamples[index] ?? `sake #${sake.sakeId}`,
    flavor: sake.flavor,
    meta: `類似度 ${sake.similarity.toFixed(2)}`,
    memo: "味わいが近い候補です。",
  })),
);

function setMode(nextMode: HomeMode) {
  mode.value = nextMode;
}

async function loadMySakes() {
  isLoadingMySakes.value = true;
  noticeMessage.value = null;

  try {
    mySakes.value = await getMySakes();
  } catch (error) {
    console.error(error);
    mySakes.value = demoMySakes;
    noticeMessage.value =
      "APIから取得できないため、カード確認用のサンプルを表示しています。";
  } finally {
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
  } catch (error) {
    console.error(error);
    searchResults.value = demoSearchResults;
    searchNoticeMessage.value =
      "APIから検索できないため、サンプル候補を表示しています。";
  } finally {
    isSearching.value = false;
  }
}

async function selectSake(result: SakeSearchResult) {
  isLoadingRecommendations.value = true;
  searchNoticeMessage.value = null;
  recommendations.value = [];

  try {
    selectedSake.value = await getSakeDetail(result.sakeId);
    recommendations.value = await getRecommendations(result.sakeId);
  } catch (error) {
    console.error(error);
    selectedSake.value = {
      sakeId: result.sakeId,
      name: result.name,
      breweryName: result.name === "獺祭" ? "旭酒造" : undefined,
    };
    recommendations.value = demoRecommendations;
    searchNoticeMessage.value =
      "APIから詳細・推薦を取得できないため、サンプルを表示しています。";
  } finally {
    isLoadingRecommendations.value = false;
  }
}

function normalizedFlavorValue(value: number | undefined) {
  return Math.max(0, Math.min(1, value ?? 0));
}

function flavorValue(flavor: FlavorProfile | undefined, key: FlavorKey) {
  return normalizedFlavorValue(flavor?.[key]);
}

function formatFlavor(value: number | undefined) {
  return `${Math.round(normalizedFlavorValue(value) * 100)}`;
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

onMounted(() => {
  void loadMySakes();
});
</script>

<template>
  <section class="home">
    <div class="mode-switch" aria-label="ホーム表示切り替え">
      <button
        type="button"
        class="mode-button"
        :class="{ active: mode === 'record' }"
        @click="setMode('record')"
      >
        記録する
      </button>
      <button
        type="button"
        class="mode-button"
        :class="{ active: mode === 'search' }"
        @click="setMode('search')"
      >
        探す
      </button>
    </div>

    <section v-if="mode === 'record'" class="panel">
      <div class="section-heading">
        <h1>今まで飲んだお酒</h1>
        <button
          type="button"
          class="text-button"
          :disabled="isLoadingMySakes"
          @click="loadMySakes"
        >
          更新
        </button>
      </div>

      <p v-if="isLoadingMySakes" class="status">読み込み中...</p>
      <p v-if="noticeMessage" class="notice">{{ noticeMessage }}</p>
      <p v-if="!isLoadingMySakes && mySakeCards.length === 0" class="status">
        まだ飲酒記録がありません。
      </p>

      <div v-if="mySakeCards.length > 0" class="card-grid">
        <RouterLink
          v-for="sake in mySakeCards"
          :key="sake.sakeId"
          class="taste-card"
          :to="`/sakes/${sake.sakeId}`"
        >
          <span class="card-summary">
            <span class="visual-stack">
              <span class="bottle-thumb" aria-hidden="true">
                <span class="bottle-neck" />
                <span class="bottle-body" />
                <span class="bottle-label">酒</span>
              </span>
              <span v-if="sake.isFavorite" class="favorite-pill">
                お気に入り
              </span>
            </span>

            <span class="card-main">
              <span class="card-topline">
                <span>
                  <span class="sake-name">{{ sake.name }}</span>
                  <span v-if="sake.breweryName" class="sub-text">
                    {{ sake.breweryName }}
                  </span>
                </span>
              </span>

              <span class="record-meta">
                <span v-if="sake.meta">最終記録 {{ sake.meta }}</span>
                <span class="rating-chip">
                  ★ {{ sake.rating ?? "未評価" }}
                </span>
                <span v-if="!sake.flavor" class="missing-badge">風味未取得</span>
              </span>
              <span class="memo-preview">{{ sake.memo }}</span>
            </span>
          </span>

          <span v-if="sake.flavor" class="flavor-section">
            <span class="radar-wrap">
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
                <polygon class="radar-fill" :points="radarPolygon(sake.flavor)" />
                <text class="radar-label radar-label-top" x="75" y="14">華やか</text>
                <text class="radar-label radar-label-upper-right" x="134" y="48">芳醇</text>
                <text class="radar-label radar-label-lower-right" x="134" y="105">重厚</text>
                <text class="radar-label radar-label-bottom" x="75" y="142">穏やか</text>
                <text class="radar-label radar-label-lower-left" x="16" y="105">ドライ</text>
                <text class="radar-label radar-label-upper-left" x="16" y="48">軽快</text>
              </svg>
            </span>

            <span class="flavor-values" aria-label="風味の数値">
              <span
                v-for="axis in flavorAxes"
                :key="axis.key"
                class="flavor-value"
              >
                <span class="flavor-label">{{ axis.label }}</span>
                <span class="flavor-number">
                  {{ formatFlavor(flavorValue(sake.flavor, axis.key)) }}
                </span>
              </span>
            </span>
          </span>

          <span v-else class="missing-flavor-section">
            <span class="missing-icon" aria-hidden="true">!</span>
            <span>
              <span class="missing-title">風味データ未取得</span>
              <span class="missing-text">
                さけのわ側にレーダーチャートがないため、銘柄情報を中心に表示しています。
              </span>
            </span>
          </span>
        </RouterLink>
      </div>

      <RouterLink class="secondary-action" to="/drinks/new">
        新規記録
      </RouterLink>
    </section>

    <section v-else class="panel search-panel">
      <div class="search-block">
        <h1>日本酒を探す</h1>
        <form class="search-form" @submit.prevent="submitSearch">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="銘柄名で検索"
            aria-label="銘柄名で検索"
          />
          <button type="submit" :disabled="isSearching">
            検索
          </button>
        </form>
      </div>

      <p v-if="searchNoticeMessage" class="notice">
        {{ searchNoticeMessage }}
      </p>

      <div v-if="searchResults.length > 0" class="result-strip">
        <button
          v-for="result in searchResults.slice(0, 6)"
          :key="result.sakeId"
          type="button"
          class="result-card"
          @click="selectSake(result)"
        >
          <span class="sake-name">{{ result.name }}</span>
          <span class="sub-text">sake #{{ result.sakeId }}</span>
        </button>
      </div>

      <p v-else-if="isSearching" class="status">検索中...</p>

      <section v-if="selectedSake" class="recommendation-block">
        <div>
          <h2>近い風味の日本酒</h2>
          <p class="status">
            {{ selectedSake.name }} に近い味わいの候補です。
          </p>
        </div>

        <p v-if="isLoadingRecommendations" class="status">
          レコメンド取得中...
        </p>

        <div v-else class="card-grid">
          <RouterLink
            v-for="sake in recommendationCards"
            :key="sake.sakeId"
            class="taste-card"
            :to="`/sakes/${sake.sakeId}`"
          >
            <span class="card-summary recommendation-summary">
              <span class="card-main">
                <span class="sake-name">{{ sake.name }}</span>
                <span v-if="sake.meta" class="sub-text">{{ sake.meta }}</span>
                <span class="memo-preview">{{ sake.memo }}</span>
              </span>
            </span>

            <span class="flavor-section">
              <span class="radar-wrap">
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
                  <polygon class="radar-fill" :points="radarPolygon(sake.flavor)" />
                  <text class="radar-label radar-label-top" x="75" y="14">華やか</text>
                  <text class="radar-label radar-label-upper-right" x="134" y="48">芳醇</text>
                  <text class="radar-label radar-label-lower-right" x="134" y="105">重厚</text>
                  <text class="radar-label radar-label-bottom" x="75" y="142">穏やか</text>
                  <text class="radar-label radar-label-lower-left" x="16" y="105">ドライ</text>
                  <text class="radar-label radar-label-upper-left" x="16" y="48">軽快</text>
                </svg>
              </span>

              <span class="flavor-values" aria-label="風味の数値">
                <span
                  v-for="axis in flavorAxes"
                  :key="axis.key"
                  class="flavor-value"
                >
                  <span class="flavor-label">{{ axis.label }}</span>
                  <span class="flavor-number">
                    {{ formatFlavor(flavorValue(sake.flavor, axis.key)) }}
                  </span>
                </span>
              </span>
            </span>
          </RouterLink>
        </div>
      </section>
    </section>
  </section>
</template>

<style scoped>
.home {
  display: grid;
  gap: 28px;
  max-width: 1040px;
  min-width: 0;
}

.mode-switch {
  background: #f4f7f1;
  border: 1px solid #d8ddd7;
  border-radius: 999px;
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  width: fit-content;
}

.mode-button,
.text-button,
.search-form button,
.result-card {
  cursor: pointer;
  font: inherit;
}

.mode-button {
  background: transparent;
  border: 0;
  border-radius: 999px;
  color: #385140;
  min-width: 108px;
  padding: 12px 20px;
}

.mode-button.active {
  background: #c9ff8b;
  color: #173f2b;
  font-weight: 700;
}

.panel {
  display: grid;
  gap: 22px;
  justify-items: start;
  min-width: 0;
  width: 100%;
}

.section-heading {
  align-items: center;
  display: flex;
  gap: 16px;
}

h1,
h2,
p {
  margin: 0;
}

h1,
h2 {
  color: #162018;
  font-size: 1rem;
  font-weight: 700;
}

.status {
  color: #657064;
}

.notice {
  color: #7a5b00;
  line-height: 1.6;
  max-width: 680px;
}

.text-button {
  background: transparent;
  border: 0;
  color: #2d6a46;
  padding: 4px 0;
}

.text-button:disabled {
  cursor: wait;
  opacity: 0.5;
}

.card-grid,
.result-strip {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  max-width: 100%;
  width: 100%;
}

.taste-card {
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(135deg, #dfe7dc, #aebbac) border-box;
  border: 1px solid transparent;
  border-radius: 18px;
  box-shadow: 0 10px 28px rgb(29 49 34 / 7%);
  color: #111;
  display: grid;
  gap: 16px;
  min-width: 0;
  overflow: hidden;
  padding: 16px;
  text-align: left;
  text-decoration: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.taste-card:hover {
  box-shadow: 0 14px 30px rgb(29 49 34 / 12%);
  transform: translateY(-2px);
}

.card-summary {
  display: grid;
  gap: 14px;
  grid-template-columns: 74px minmax(0, 1fr);
  min-width: 0;
}

.recommendation-summary {
  grid-template-columns: 1fr;
}

.visual-stack {
  align-content: start;
  display: grid;
  gap: 7px;
  justify-items: center;
}

.bottle-thumb {
  align-items: center;
  background: linear-gradient(180deg, #f3f6f1, #e8eee5);
  border: 1px solid #dbe4d8;
  border-radius: 14px;
  display: grid;
  height: 88px;
  justify-items: center;
  padding: 8px 10px;
  position: relative;
  width: 74px;
}

.bottle-neck {
  background: #28583a;
  border-radius: 4px 4px 2px 2px;
  height: 24px;
  margin-bottom: -7px;
  width: 14px;
}

.bottle-body {
  background: linear-gradient(90deg, #315f42, #598761 48%, #2d543d);
  border-radius: 10px 10px 13px 13px;
  height: 50px;
  width: 28px;
}

.bottle-label {
  background: #fff;
  border-radius: 7px;
  color: #173f2b;
  font-size: 0.75rem;
  font-weight: 700;
  left: 50%;
  padding: 2px 6px;
  position: absolute;
  top: 56px;
  transform: translateX(-50%);
}

.favorite-pill {
  background: #e8f4e2;
  border-radius: 999px;
  color: #2d6a46;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
  padding: 5px 8px;
  white-space: nowrap;
}

.card-main {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.card-topline {
  align-items: start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  min-width: 0;
}

.sake-name {
  color: #101711;
  display: block;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.35;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.sub-text,
.record-meta,
.memo-preview {
  color: #657064;
  display: block;
  font-size: 0.82rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.record-meta {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.memo-preview {
  color: #34443a;
}

.missing-badge {
  background: #e7f1fb;
  border-radius: 999px;
  color: #2d6a9f;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
}

.rating-chip {
  color: #b88900;
  font-weight: 700;
}

.flavor-section {
  border-top: 1px solid #e4ebe1;
  display: grid;
  gap: 14px;
  grid-template-columns: 150px minmax(0, 1fr);
  padding-top: 14px;
}

.radar-wrap {
  display: grid;
  min-height: 150px;
  place-items: center;
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

.flavor-label {
  color: #4f5f52;
  font-size: 0.78rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flavor-number {
  color: #1f4d33;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
  text-align: right;
}

.missing-flavor-section {
  align-items: center;
  background: #f6f9fb;
  border: 1px solid #d8e6f1;
  border-radius: 14px;
  display: grid;
  gap: 12px;
  grid-template-columns: auto minmax(0, 1fr);
  padding: 14px;
}

.missing-icon {
  align-items: center;
  background: #e7f1fb;
  border-radius: 999px;
  color: #2d6a9f;
  display: flex;
  font-weight: 800;
  height: 32px;
  justify-content: center;
  width: 32px;
}

.missing-title,
.missing-text {
  display: block;
}

.missing-title {
  color: #173f2b;
  font-size: 0.9rem;
  font-weight: 700;
}

.missing-text {
  color: #657064;
  font-size: 0.8rem;
  line-height: 1.6;
}

.secondary-action {
  align-items: center;
  background: #fff;
  border: 1px solid #222;
  border-radius: 12px;
  color: #111;
  display: inline-flex;
  min-height: 56px;
  padding: 0 26px;
  text-decoration: none;
}

.search-panel {
  gap: 28px;
}

.search-block {
  display: grid;
  gap: 10px;
}

.search-form {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-form input {
  border: 1px solid #aebbac;
  border-radius: 10px;
  font: inherit;
  min-height: 44px;
  min-width: min(280px, 70vw);
  padding: 0 14px;
}

.search-form button {
  background: #173f2b;
  border: 1px solid #173f2b;
  border-radius: 10px;
  color: #fff;
  min-height: 44px;
  padding: 0 18px;
}

.search-form button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.result-card {
  background: #fff;
  border: 1px solid #d8ddd7;
  border-radius: 14px;
  display: grid;
  gap: 6px;
  min-height: 86px;
  padding: 14px;
  text-align: left;
}

.recommendation-block {
  display: grid;
  gap: 18px;
  min-width: 0;
  width: 100%;
}

@media (max-width: 760px) {
  .home {
    max-width: 100%;
  }

  .mode-switch {
    width: 100%;
  }

  .mode-button {
    min-width: 0;
    width: 50%;
  }

  .card-grid,
  .result-strip {
    grid-template-columns: 1fr;
    width: 100%;
  }

  .flavor-section,
  .card-summary {
    grid-template-columns: 1fr;
  }

  .bottle-thumb {
    height: 120px;
  }

  .flavor-values {
    grid-template-columns: 1fr;
  }
}
</style>
