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

type DisplaySake = {
  sakeId: string;
  name: string;
  breweryName?: string;
  flavor?: FlavorProfile;
  isFavorite?: boolean;
  meta?: string;
};

const mode = ref<HomeMode>("record");
const mySakes = ref<MySakeItem[]>([]);
const searchQuery = ref("");
const searchResults = ref<SakeSearchResult[]>([]);
const selectedSake = ref<SakeDetailResponse | null>(null);
const recommendations = ref<SakeRecommendation[]>([]);
const isLoadingMySakes = ref(false);
const isSearching = ref(false);
const isLoadingRecommendations = ref(false);
const errorMessage = ref<string | null>(null);
const searchErrorMessage = ref<string | null>(null);

const mySakeCards = computed<DisplaySake[]>(() =>
  mySakes.value.map((sake) => ({
    sakeId: sake.sakeId,
    name: sake.sakeName,
    breweryName: sake.breweryName,
    flavor: sake.flavor,
    isFavorite: sake.isFavorite,
    meta: sake.lastDrankAt,
  })),
);

const recommendationCards = computed<DisplaySake[]>(() =>
  recommendations.value.map((sake) => ({
    sakeId: sake.sakeId,
    name: `sake #${sake.sakeId}`,
    flavor: sake.flavor,
    meta: `similarity ${sake.similarity.toFixed(2)}`,
  })),
);

function setMode(nextMode: HomeMode) {
  mode.value = nextMode;
}

async function loadMySakes() {
  isLoadingMySakes.value = true;
  errorMessage.value = null;

  try {
    mySakes.value = await getMySakes();
  } catch (error) {
    console.error(error);
    errorMessage.value = "今まで飲んだお酒を取得できませんでした。";
  } finally {
    isLoadingMySakes.value = false;
  }
}

async function submitSearch() {
  const q = searchQuery.value.trim();

  if (!q) {
    searchErrorMessage.value = "検索キーワードを入力してください。";
    return;
  }

  isSearching.value = true;
  searchErrorMessage.value = null;
  selectedSake.value = null;
  recommendations.value = [];

  try {
    searchResults.value = await searchSakes(q);
  } catch (error) {
    console.error(error);
    searchErrorMessage.value = "日本酒を検索できませんでした。";
  } finally {
    isSearching.value = false;
  }
}

async function selectSake(result: SakeSearchResult) {
  isLoadingRecommendations.value = true;
  searchErrorMessage.value = null;
  recommendations.value = [];

  try {
    selectedSake.value = await getSakeDetail(result.sakeId);
    recommendations.value = await getRecommendations(result.sakeId);
  } catch (error) {
    console.error(error);
    searchErrorMessage.value = "選択した日本酒の詳細を取得できませんでした。";
  } finally {
    isLoadingRecommendations.value = false;
  }
}

function radarPoint(index: number, value: number, size = 88): string {
  const center = size / 2;
  const radius = size * 0.38 * Math.max(0, Math.min(1, value));
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 6;

  return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
}

function radarPolygon(flavor?: FlavorProfile): string {
  const values = flavor
    ? [
        flavor.fruity,
        flavor.mellow,
        flavor.rich,
        flavor.calm,
        flavor.dry,
        flavor.light,
      ]
    : [0.72, 0.72, 0.72, 0.72, 0.72, 0.72];

  return values.map((value, index) => radarPoint(index, value)).join(" ");
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
      <p v-else-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p v-else-if="mySakeCards.length === 0" class="status">
        まだ飲酒記録がありません。
      </p>

      <div v-else class="card-grid compact">
        <RouterLink
          v-for="sake in mySakeCards"
          :key="sake.sakeId"
          class="taste-card"
          :to="`/sakes/${sake.sakeId}`"
        >
          <span class="favorite-mark" :class="{ active: sake.isFavorite }">
            {{ sake.isFavorite ? "★" : "☆" }}
          </span>
          <span class="sake-name">{{ sake.name }}</span>
          <span v-if="sake.breweryName" class="sub-text">
            {{ sake.breweryName }}
          </span>
          <svg class="radar" viewBox="0 0 88 88" aria-hidden="true">
            <polygon class="radar-grid" :points="radarPolygon()" />
            <polygon class="radar-fill" :points="radarPolygon(sake.flavor)" />
          </svg>
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

      <p v-if="searchErrorMessage" class="error">{{ searchErrorMessage }}</p>

      <div v-if="searchResults.length > 0" class="result-strip">
        <button
          v-for="result in searchResults.slice(0, 6)"
          :key="result.sakeId"
          type="button"
          class="taste-card result-card"
          @click="selectSake(result)"
        >
          <span class="sake-name">{{ result.name }}</span>
          <span class="sub-text">sake #{{ result.sakeId }}</span>
          <svg class="radar" viewBox="0 0 88 88" aria-hidden="true">
            <polygon class="radar-grid" :points="radarPolygon()" />
          </svg>
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
            <span class="sake-name">{{ sake.name }}</span>
            <span v-if="sake.meta" class="sub-text">{{ sake.meta }}</span>
            <svg class="radar" viewBox="0 0 88 88" aria-hidden="true">
              <polygon class="radar-grid" :points="radarPolygon()" />
              <polygon class="radar-fill" :points="radarPolygon(sake.flavor)" />
            </svg>
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

.error {
  color: #9f2d20;
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
  grid-template-columns: repeat(auto-fit, minmax(136px, 1fr));
  width: min(100%, 620px);
}

.card-grid.compact {
  grid-template-columns: repeat(auto-fit, 136px);
}

.result-strip {
  align-items: start;
}

.taste-card {
  align-items: center;
  aspect-ratio: 0.86;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(135deg, #dfe7dc, #aebbac) border-box;
  border: 1px solid transparent;
  border-radius: 18px;
  color: #111;
  display: grid;
  gap: 6px;
  justify-items: center;
  padding: 16px 12px;
  position: relative;
  text-align: center;
  text-decoration: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.taste-card:hover {
  box-shadow: 0 10px 24px rgb(29 49 34 / 10%);
  transform: translateY(-2px);
}

.result-card {
  min-height: 154px;
}

.sake-name {
  color: #101711;
  font-weight: 700;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.sub-text {
  color: #657064;
  font-size: 0.78rem;
}

.favorite-mark {
  color: #bbc2b9;
  position: absolute;
  right: 12px;
  top: 10px;
}

.favorite-mark.active {
  color: #b88900;
}

.radar {
  height: 74px;
  width: 74px;
}

.radar-grid {
  fill: #f8faf6;
  stroke: #1b241d;
  stroke-width: 1.2;
}

.radar-fill {
  fill: rgb(201 255 139 / 45%);
  stroke: #3f7a4d;
  stroke-linejoin: round;
  stroke-width: 1.6;
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

.recommendation-block {
  display: grid;
  gap: 18px;
  width: 100%;
}
</style>
