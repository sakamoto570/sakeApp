<script setup lang="ts">
import type { FlavorProfile, SakeDetailResponse, SakeSearchResult } from "@sake-app/shared";
import { computed, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

import { createDrink } from "../api/drinkApi";
import { createImageUploadUrl, uploadImageToS3 } from "../api/imageApi";
import { getSakeDetail, searchSakes } from "../api/sakeApi";

type FlavorKey = keyof FlavorProfile;
type SelectionMode = "sakenowa" | "manual";

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
const selectionMode = ref<SelectionMode>("sakenowa");
const manualName = ref("");
const manualBreweryName = ref("");
const rating = ref<number | "">("");
const memo = ref("");
const drankAt = ref(new Date().toISOString().slice(0, 10));
const imageFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | null>(null);

const isSearching = ref(false);
const isLoadingDetail = ref(false);
const isSaving = ref(false);
const searchError = ref<string | null>(null);
const detailError = ref<string | null>(null);
const saveError = ref<string | null>(null);

const selectedRecord = computed<SakeDetailResponse | null>(() => {
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
  const hasValidRating =
    rating.value === "" || (rating.value >= 1 && rating.value <= 5);

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
  } catch (error) {
    console.error(error);
    searchError.value =
      "銘柄検索に失敗しました。手入力で記録を続けることもできます。";
  } finally {
    isSearching.value = false;
  }
}

async function selectSake(result: SakeSearchResult) {
  selectionMode.value = "sakenowa";
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

function startManualEntry(seedName = searchQuery.value) {
  selectionMode.value = "manual";
  selectedDetail.value = null;
  manualName.value = seedName.trim() || manualName.value;
  detailError.value = null;
  saveError.value = null;
}

function handleImageChange(event: Event) {
  const input = event.target as HTMLInputElement;
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

async function uploadSelectedImage(): Promise<string | undefined> {
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
  } catch (error) {
    console.error(error);
    saveError.value = "飲酒記録の保存に失敗しました。画像サイズや形式も確認してください。";
  } finally {
    isSaving.value = false;
  }
}

function createManualSakeId(name: string, breweryName: string) {
  const source = `${name}:${breweryName.trim()}`.toLowerCase();
  const encoded = encodeURIComponent(source)
    .replace(/%/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 80);

  return `manual#${encoded || Date.now().toString(36)}`;
}

function formatFlavorValue(flavor: FlavorProfile, key: FlavorKey) {
  return Math.round(Math.max(0, Math.min(1, flavor[key])) * 100);
}

function normalizedFlavorValue(value: number | undefined) {
  return Math.max(0, Math.min(1, value ?? 0));
}

function radarPoint(index: number, value: number, size = 150): string {
  const center = size / 2;
  const radius = size * 0.34 * normalizedFlavorValue(value);
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / flavorLabels.length;

  return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
}

function radarPolygon(flavor?: FlavorProfile, fallbackValue = 1): string {
  const values = flavor
    ? flavorLabels.map((axis) => flavor[axis.key])
    : flavorLabels.map(() => fallbackValue);

  return values.map((value, index) => radarPoint(index, value)).join(" ");
}

function radarAxisEnd(index: number): string {
  return radarPoint(index, 1);
}
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <h1>新規飲酒記録</h1>
        <p>さけのわに無い銘柄も、写真付きでそのまま記録できます。</p>
      </div>
      <RouterLink class="back-link" to="/">戻る</RouterLink>
    </div>

    <section class="panel">
      <form class="search-form" @submit.prevent="submitSearch">
        <label class="field search-field">
          <span>銘柄検索キーワード</span>
          <input v-model="searchQuery" type="search" placeholder="例: 獺祭" autocomplete="off" />
        </label>
        <button type="submit" :disabled="isSearching">
          {{ isSearching ? "検索中..." : "検索" }}
        </button>
        <button type="button" class="manual-entry-button" @click="startManualEntry()">
          手入力で記録
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

    <section v-if="selectionMode === 'manual'" class="panel manual-panel">
      <div class="section-heading">
        <h2>手入力の銘柄情報</h2>
        <p class="status">さけのわ未登録として、風味データなしで保存します。</p>
      </div>

      <div class="manual-fields">
        <label class="field">
          <span>銘柄名</span>
          <input v-model="manualName" type="text" placeholder="例: 蔵出し直汲み 純米生原酒" required />
        </label>

        <label class="field">
          <span>酒蔵名 任意</span>
          <input v-model="manualBreweryName" type="text" placeholder="例: ○○酒造" />
        </label>
      </div>
    </section>

    <section class="panel">
      <div class="section-heading">
        <h2>選択中の日本酒</h2>
        <p v-if="isLoadingDetail" class="status">詳細取得中...</p>
      </div>

      <p v-if="detailError" class="error-message">{{ detailError }}</p>

      <div v-if="selectedRecord" class="selected-card">
        <div class="record-summary">
          <div class="image-preview">
            <img v-if="imagePreviewUrl" :src="imagePreviewUrl" alt="選択したラベル写真" />
            <div v-else class="bottle-thumb" aria-hidden="true">
              <span class="bottle-neck" />
              <span class="bottle-body" />
              <span class="bottle-label">酒</span>
            </div>
          </div>

          <div class="record-main">
            <div>
              <h3>{{ selectedRecord.name }}</h3>
              <p v-if="selectedRecord.breweryName" class="sub-text">{{ selectedRecord.breweryName }}</p>
              <p v-else class="sub-text">酒蔵名は未入力です。</p>
            </div>

            <div class="record-meta">
              <span>{{ drankAt || "飲酒日未入力" }}</span>
              <span v-if="rating" class="rating-preview">★ {{ rating }}</span>
              <span v-else class="rating-preview muted">未評価</span>
              <span v-if="selectionMode === 'manual'" class="manual-badge">手入力</span>
            </div>

            <p class="memo-preview">{{ memo.trim() || "メモはまだ入力されていません。" }}</p>
          </div>
        </div>

        <div v-if="selectedRecord.flavor" class="flavor-section">
          <div class="radar-wrap">
            <svg class="radar" viewBox="0 0 150 150" aria-hidden="true">
              <polygon class="radar-grid radar-grid-outer" :points="radarPolygon()" />
              <polygon class="radar-grid radar-grid-inner" :points="radarPolygon(undefined, 0.5)" />
              <line
                v-for="(_, index) in flavorLabels"
                :key="index"
                class="radar-axis"
                x1="75"
                y1="75"
                :x2="radarAxisEnd(index).split(',')[0]"
                :y2="radarAxisEnd(index).split(',')[1]"
              />
              <polygon class="radar-fill" :points="radarPolygon(selectedRecord.flavor)" />
              <text class="radar-label radar-label-top" x="75" y="14">華やか</text>
              <text class="radar-label radar-label-upper-right" x="134" y="48">芳醇</text>
              <text class="radar-label radar-label-lower-right" x="134" y="105">重厚</text>
              <text class="radar-label radar-label-bottom" x="75" y="142">穏やか</text>
              <text class="radar-label radar-label-lower-left" x="16" y="105">ドライ</text>
              <text class="radar-label radar-label-upper-left" x="16" y="48">軽快</text>
            </svg>
          </div>

          <div class="flavor-grid">
            <span v-for="flavor in flavorLabels" :key="flavor.key" class="flavor-item">
              <span>{{ flavor.label }}</span>
              <strong>{{ formatFlavorValue(selectedRecord.flavor, flavor.key) }}</strong>
            </span>
          </div>
        </div>

        <div v-else class="missing-flavor-section">
          <div class="missing-icon" aria-hidden="true">!</div>
          <div>
            <h4>風味データ未取得</h4>
            <p>評価・メモ・日付・写真は通常通り記録できます。</p>
          </div>
        </div>
      </div>

      <p v-else-if="!isLoadingDetail" class="status">
        検索結果から銘柄を選ぶか、手入力で記録してください。
      </p>
    </section>

    <form class="panel form-panel" @submit.prevent="submitDrink">
      <h2>記録内容</h2>

      <label class="field">
        <span>ラベル写真 任意</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" @change="handleImageChange" />
      </label>
      <button v-if="imageFile" class="clear-image-button" type="button" @click="clearImage">
        画像を外す
      </button>

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
        <textarea v-model="memo" rows="4" placeholder="味の印象、飲んだ場所、合わせた料理など" />
      </label>

      <label class="field">
        <span>飲酒日</span>
        <input v-model="drankAt" type="date" required />
      </label>

      <p v-if="saveError" class="error-message">{{ saveError }}</p>

      <div class="actions">
        <RouterLink class="secondary-button" to="/">戻る</RouterLink>
        <button class="primary-button" type="submit" :disabled="isSaving || !canSave">
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
  grid-template-columns: minmax(0, 1fr) auto auto;
}

.manual-fields {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

input[type="file"] {
  padding: 10px 12px;
}

textarea {
  min-height: 108px;
  padding: 12px 14px;
  resize: vertical;
}

.search-form button,
.primary-button,
.secondary-button,
.back-link,
.manual-entry-button,
.clear-image-button {
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

.manual-entry-button,
.secondary-button,
.back-link,
.clear-image-button {
  background: #fff;
  border: 1px solid #aebbac;
  color: #173f2b;
  cursor: pointer;
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

.selected-card {
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(135deg, #dfe7dc, #aebbac) border-box;
  border: 1px solid transparent;
  border-radius: 18px;
  box-shadow: 0 10px 28px rgb(29 49 34 / 7%);
  display: grid;
  gap: 18px;
  overflow: hidden;
  padding: 16px;
}

.record-summary {
  align-items: stretch;
  display: grid;
  gap: 18px;
  grid-template-columns: 112px minmax(0, 1fr);
}

.image-preview,
.bottle-thumb {
  border-radius: 14px;
  min-height: 150px;
  overflow: hidden;
}

.image-preview img {
  display: block;
  height: 150px;
  object-fit: cover;
  width: 112px;
}

.bottle-thumb {
  align-items: center;
  background: linear-gradient(180deg, #f3f6f1, #e8eee5);
  border: 1px solid #dbe4d8;
  display: grid;
  justify-items: center;
  padding: 14px;
  position: relative;
}

.bottle-neck {
  background: #28583a;
  border-radius: 5px 5px 2px 2px;
  height: 42px;
  margin-bottom: -8px;
  width: 22px;
}

.bottle-body {
  background: linear-gradient(90deg, #315f42, #598761 48%, #2d543d);
  border-radius: 12px 12px 16px 16px;
  height: 88px;
  width: 42px;
}

.bottle-label {
  background: #fff;
  border-radius: 8px;
  color: #173f2b;
  font-weight: 700;
  left: 50%;
  padding: 5px 8px;
  position: absolute;
  top: 88px;
  transform: translateX(-50%);
}

.record-main {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.record-meta {
  align-items: center;
  color: #657064;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.rating-preview {
  color: #b88900;
  font-weight: 700;
}

.rating-preview.muted {
  color: #98a196;
}

.manual-badge {
  background: #e7f1fb;
  border-radius: 999px;
  color: #2d6a9f;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
}

.memo-preview {
  color: #34443a;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.flavor-section {
  border-top: 1px solid #e4ebe1;
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(170px, 240px) minmax(0, 1fr);
  padding-top: 18px;
}

.radar-wrap {
  display: grid;
  min-height: 170px;
  place-items: center;
}

.radar {
  height: 170px;
  overflow: visible;
  width: 170px;
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

.flavor-grid {
  align-content: center;
  display: grid;
  gap: 10px 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.flavor-item {
  align-items: center;
  background: #f4f7f1;
  border-radius: 999px;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  min-width: 0;
  padding: 8px 12px;
}

.flavor-item span {
  color: #4f5f52;
  font-size: 0.86rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flavor-item strong {
  color: #173f2b;
  font-variant-numeric: tabular-nums;
}

.missing-flavor-section {
  align-items: center;
  background: #f6f9fb;
  border: 1px solid #d8e6f1;
  border-radius: 14px;
  display: grid;
  gap: 14px;
  grid-template-columns: auto minmax(0, 1fr);
  padding: 16px;
}

.missing-icon {
  align-items: center;
  background: #e7f1fb;
  border-radius: 999px;
  color: #2d6a9f;
  display: flex;
  font-weight: 800;
  height: 34px;
  justify-content: center;
  width: 34px;
}

.missing-flavor-section h4 {
  color: #173f2b;
  font-size: 0.95rem;
  margin: 0 0 4px;
}

.missing-flavor-section p {
  color: #657064;
  line-height: 1.6;
}

.form-panel {
  max-width: 680px;
}

@media (max-width: 760px) {
  .page-heading,
  .section-heading,
  .actions {
    align-items: stretch;
    flex-direction: column;
  }

  .search-form,
  .manual-fields,
  .record-summary,
  .flavor-section,
  .missing-flavor-section {
    grid-template-columns: 1fr;
  }

  .image-preview img {
    height: 180px;
    width: 100%;
  }

  .bottle-thumb {
    min-height: 120px;
  }

  .flavor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
