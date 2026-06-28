<script setup lang="ts">
import type {
  FlavorProfile,
  SakeDetailResponse,
  SakeSearchResult,
} from "@sake-app/shared";
import { computed, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

import { createDrink } from "../api/drinkApi";
import { getSakeDetail, searchSakes } from "../api/sakeApi";

type FlavorKey = keyof FlavorProfile;

const flavorLabels: { key: FlavorKey; label: string }[] = [
  { key: "fruity", label: "華やか" },
  { key: "mellow", label: "芳醇" },
  { key: "rich", label: "重厚" },
  { key: "calm", label: "穏やか" },
  { key: "dry", label: "ドライ" },
  { key: "light", label: "軽快" },
];

const router = useRouter();

const searchQuery = ref("");
const searchResults = ref<SakeSearchResult[]>([]);
const selectedDetail = ref<SakeDetailResponse | null>(null);
const rating = ref<number | "">("");
const memo = ref("");
const drankAt = ref(new Date().toISOString().slice(0, 10));

const isSearching = ref(false);
const isLoadingDetail = ref(false);
const isSaving = ref(false);
const searchError = ref<string | null>(null);
const detailError = ref<string | null>(null);
const saveError = ref<string | null>(null);

const canSave = computed(() => {
  const hasValidRating =
    rating.value === "" || (rating.value >= 1 && rating.value <= 5);

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
  } catch (error) {
    console.error(error);
    searchError.value = "銘柄検索に失敗しました。";
  } finally {
    isSearching.value = false;
  }
}

async function selectSake(result: SakeSearchResult) {
  detailError.value = null;
  saveError.value = null;
  selectedDetail.value = null;
  isLoadingDetail.value = true;

  try {
    selectedDetail.value = await getSakeDetail(result.sakeId);
  } catch (error) {
    console.error(error);
    detailError.value = "日本酒の詳細取得に失敗しました。";
  } finally {
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
  } catch (error) {
    console.error(error);
    saveError.value = "飲酒記録の保存に失敗しました。";
  } finally {
    isSaving.value = false;
  }
}

function formatFlavorValue(flavor: FlavorProfile, key: FlavorKey) {
  return Math.round(Math.max(0, Math.min(1, flavor[key])) * 100);
}
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <h1>新規飲酒記録</h1>
        <p>飲んだ日本酒を検索して、評価やメモを残します。</p>
      </div>
      <RouterLink class="back-link" to="/">戻る</RouterLink>
    </div>

    <section class="panel">
      <form class="search-form" @submit.prevent="submitSearch">
        <label class="field search-field">
          <span>銘柄検索キーワード</span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="例: 獺祭"
            autocomplete="off"
          />
        </label>
        <button type="submit" :disabled="isSearching">
          {{ isSearching ? "検索中..." : "検索" }}
        </button>
      </form>

      <p v-if="searchError" class="error-message">{{ searchError }}</p>

      <div v-if="searchResults.length > 0" class="search-results">
        <button
          v-for="result in searchResults"
          :key="result.sakeId"
          type="button"
          class="result-button"
          :class="{ selected: selectedDetail?.sakeId === result.sakeId }"
          :disabled="isLoadingDetail"
          @click="selectSake(result)"
        >
          <span>{{ result.name }}</span>
          <small>sake #{{ result.sakeId }}</small>
        </button>
      </div>
    </section>

    <section class="panel">
      <div class="section-heading">
        <h2>選択中の日本酒</h2>
        <p v-if="isLoadingDetail" class="status">詳細取得中...</p>
      </div>

      <p v-if="detailError" class="error-message">{{ detailError }}</p>

      <div v-if="selectedDetail" class="selected-card">
        <div>
          <h3>{{ selectedDetail.name }}</h3>
          <p v-if="selectedDetail.breweryName" class="sub-text">
            {{ selectedDetail.breweryName }}
          </p>
          <p v-else class="sub-text">酒蔵名は未取得です。</p>
        </div>

        <div v-if="selectedDetail.flavor" class="flavor-grid">
          <span
            v-for="flavor in flavorLabels"
            :key="flavor.key"
            class="flavor-item"
          >
            <span>{{ flavor.label }}</span>
            <strong>
              {{ formatFlavorValue(selectedDetail.flavor, flavor.key) }}
            </strong>
          </span>
        </div>
        <p v-else class="status">風味データはありません。</p>
      </div>

      <p v-else-if="!isLoadingDetail" class="status">
        検索結果から銘柄を選択してください。
      </p>
    </section>

    <form class="panel form-panel" @submit.prevent="submitDrink">
      <h2>記録内容</h2>

      <label class="field">
        <span>評価</span>
        <select v-model.number="rating">
          <option value="">未評価</option>
          <option :value="1">1</option>
          <option :value="2">2</option>
          <option :value="3">3</option>
          <option :value="4">4</option>
          <option :value="5">5</option>
        </select>
      </label>

      <label class="field">
        <span>メモ</span>
        <textarea
          v-model="memo"
          rows="4"
          placeholder="味の印象、飲んだ場所、合わせた料理など"
        />
      </label>

      <label class="field">
        <span>飲酒日</span>
        <input v-model="drankAt" type="date" required />
      </label>

      <p v-if="saveError" class="error-message">{{ saveError }}</p>

      <div class="actions">
        <RouterLink class="secondary-button" to="/">戻る</RouterLink>
        <button
          class="primary-button"
          type="submit"
          :disabled="isSaving || !canSave"
        >
          {{ isSaving ? "保存中..." : "保存する" }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 22px;
}

.page-heading,
.section-heading,
.actions {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  color: #173f2b;
  font-size: 1.45rem;
}

h2 {
  color: #162018;
  font-size: 1rem;
}

h3 {
  color: #101711;
  font-size: 1.2rem;
}

.page-heading p,
.status,
.sub-text {
  color: #657064;
}

.panel {
  background: #fff;
  border: 1px solid #d8ddd7;
  border-radius: 18px;
  display: grid;
  gap: 16px;
  padding: 20px;
}

.search-form {
  align-items: end;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) auto;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #385140;
  font-size: 0.9rem;
  font-weight: 700;
}

input,
select,
textarea {
  border: 1px solid #aebbac;
  border-radius: 10px;
  font: inherit;
  min-height: 44px;
  padding: 0 14px;
}

textarea {
  min-height: 108px;
  padding: 12px 14px;
  resize: vertical;
}

.search-form button,
.primary-button,
.secondary-button,
.back-link {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  font: inherit;
  font-weight: 700;
  justify-content: center;
  min-height: 44px;
  padding: 0 20px;
  text-decoration: none;
}

.search-form button,
.primary-button {
  background: #173f2b;
  border: 1px solid #173f2b;
  color: #fff;
  cursor: pointer;
}

.secondary-button,
.back-link {
  background: #fff;
  border: 1px solid #aebbac;
  color: #173f2b;
}

button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.error-message {
  color: #b42318;
  line-height: 1.6;
}

.search-results {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.result-button {
  background: #f8faf6;
  border: 1px solid #d8ddd7;
  border-radius: 12px;
  color: #101711;
  cursor: pointer;
  display: grid;
  gap: 4px;
  min-height: 72px;
  padding: 12px;
  text-align: left;
}

.result-button.selected {
  background: #efffda;
  border-color: #89c45f;
}

.result-button span {
  font-weight: 700;
  overflow-wrap: anywhere;
}

.result-button small {
  color: #657064;
}

.selected-card {
  display: grid;
  gap: 18px;
}

.flavor-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
}

.flavor-item {
  align-items: center;
  background: #f4f7f1;
  border-radius: 999px;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  padding: 8px 12px;
}

.flavor-item span {
  color: #4f5f52;
  font-size: 0.86rem;
}

.flavor-item strong {
  color: #173f2b;
  font-variant-numeric: tabular-nums;
}

.form-panel {
  max-width: 680px;
}

@media (max-width: 640px) {
  .page-heading,
  .section-heading,
  .actions {
    align-items: stretch;
    flex-direction: column;
  }

  .search-form {
    grid-template-columns: 1fr;
  }
}
</style>
