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

import SakeCard from "../components/sake/SakeCard.vue";
import {
  getMySakes,
  getRecommendations,
  getSakeDetail,
  searchSakes,
} from "../api/sakeApi";

type HomeMode = "record" | "search";

type DemoMySakeItem = MySakeItem;

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
    imageUrl:
      "https://images.unsplash.com/photo-1612878010854-1250dfc5000a?auto=format&fit=crop&w=240&q=80",
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
    imageUrl:
      "https://images.unsplash.com/photo-1612878010854-1250dfc5000a?auto=format&fit=crop&w=240&q=80",
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
];

const recommendationNames = ["伯楽星", "鳳凰美田"];

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

const recommendationCards = computed<MySakeItem[]>(() =>
  recommendations.value.map((recommendation, index) => ({
    sakeId: recommendation.sakeId,
    sakeName:
      recommendationNames[index] ?? `sake #${recommendation.sakeId}`,
    flavor: recommendation.flavor,
    rating: Number(recommendation.similarity.toFixed(2)),
    memo: "味わいが近い候補です。",
    isFavorite: false,
    lastDrankAt: `類似度 ${recommendation.similarity.toFixed(2)}`,
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
    };
    recommendations.value = demoRecommendations;
    searchNoticeMessage.value =
      "APIから詳細・推薦を取得できないため、サンプルを表示しています。";
  } finally {
    isLoadingRecommendations.value = false;
  }
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
      <p v-if="!isLoadingMySakes && mySakes.length === 0" class="status">
        まだ飲酒記録がありません。
      </p>

      <div v-if="mySakes.length > 0" class="card-grid">
        <SakeCard
          v-for="sake in mySakes"
          :key="sake.sakeId"
          :item="sake"
          @favorite-changed="loadMySakes"
        />
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
          <SakeCard
            v-for="sake in recommendationCards"
            :key="sake.sakeId"
            :item="sake"
            @favorite-changed="loadMySakes"
          />
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

.sake-name {
  color: #101711;
  font-weight: 700;
}

.sub-text {
  color: #657064;
  font-size: 0.82rem;
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
}
</style>
