<template>
  <div class="container">
    <h1>館藏查詢</h1>
    <!-- Simple Search -->
    <div v-if="!isAdvancedSearch" class="simple-search">
      <div class="search-bar">
        <input
          v-model="simpleSearchQuery"
          @keyup.enter="performSimpleSearch"
          type="text"
          placeholder="輸入關鍵字..."
        />
        <button class="btn btn-primary" @click="performSimpleSearch">搜尋</button>
        <button class="btn btn-secondary" @click="toggleAdvancedSearch">進階搜尋</button>
      </div>
    </div>

    <!-- Advanced Search -->
    <div v-else class="advanced-search">
      <div class="search-layout">
        <!-- 左側：進階搜尋條件 -->
        <div class="search-conditions">
          <div class="search-bar">
            <h2>進階搜尋</h2>
            <button class="btn btn-secondary" @click="toggleAdvancedSearch">返回單一搜尋</button>
          </div>
          <div v-for="(condition, index) in advancedSearchConditions" :key="index" class="condition">
            <select v-if="index > 0" v-model="condition.operator">
              <option value="AND">AND</option>
              <option value="OR">OR</option>
              <option value="NOT">NOT</option>
            </select>
            <select v-model="condition.field">
              <option value="title">書名</option>
              <option value="author">作者</option>
              <option value="isbn">ISBN</option>
              <option value="publisher">出版社</option>
              <option value="classification">分類號</option>
              <option value="version">版本項</option>
            </select>
            <input v-model="condition.value" type="text" placeholder="輸入搜尋內容" />
            <button
              v-if="index > 0"
              class="btn btn-danger"
              @click="removeCondition(index)"
            >
              移除
            </button>
          </div>
          <div class="search-bar">
            <button
              class="btn btn-primary"
              :class="{ 'btn-disabled': advancedSearchConditions.length >= 6 }"
              @click="addCondition"
            >
              新增條件
            </button>
            <button class="btn btn-primary" @click="performAdvancedSearch">搜尋</button>
          </div>
        </div>

        <!-- 右側：過濾條件 -->
        <div class="advanced-filters">
          <div class="filter-section">
            <!-- 出版年 -->
            <div class="condition">
              <label>出版年</label>
              <input
                v-model="yearFrom"
                type="number"
                placeholder="從"
                style="width:100px;"
              />
              <span>至</span>
              <input
                v-model="yearTo"
                type="number"
                placeholder="至"
                style="width:100px;"
              />
            </div>
            <hr>
            <!-- 分類法 -->
            <div class="condition">
              <label>分類法</label>
              <select v-model="selectedClassification">
                <option value="">全部</option>
                <option
                  v-for="opt in classificationOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <hr>
            <!-- 語言 -->
            <div class="condition">
              <label>語言</label>
              <select v-model="selectedLanguages" >
                <option
                  v-for="lang in languageOptions"
                  :key="lang.value"
                  :value="lang.value"
                >
                  {{ lang.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="currentPageResults.length" class="results">
      <h2>搜尋結果</h2>
      <div class="result-control-panel">
        <div class="result-control-panel-left">
          <div class="result-row">
            <span class="result-label">每頁顯示：</span>
            <select v-model="itemsPerPage" class="result-select">
              <option v-for="size in pageSizes" :key="size" :value="size">{{ size }} 筆</option>
            </select>
          </div>
          <div class="result-row">
            <span class="result-label">排序：</span>
            <select v-model="sortConfig.field" class="result-select">
              <option value="title_desc">書名↓</option>
              <option value="title_asc">書名↑</option>
              <option value="author_desc">作者↓</option>
              <option value="author_asc">作者↑</option>
              <option value="publisher_desc">出版社↓</option>
              <option value="publisher_asc">出版社↑</option>
              <option value="year_desc">出版年↓</option>
              <option value="year_asc">出版年↑</option>
            </select>
          </div>
        </div>
      </div>
      <div v-for="book in currentPageResults" :key="book.isbn" class="result-item">
        <div class="result-image">
          <img :src="`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`" alt="Book cover" />
        </div>
        <div class="result-info">
          <p><strong>書名:</strong> {{ book.title }}</p>
          <p><strong>作者:</strong> {{ book.author }}</p>
          <p><strong>出版社:</strong> {{ book.publisher }}</p>
          <p><strong>出版年:</strong> {{ book.publishdate }}</p>
          <p><strong>版本項:</strong> {{ book.version }}</p>
          <p><strong>ISBN:</strong> {{ book.isbn }}</p>
          <p><strong>分類:</strong> {{ book.classification }}</p>
          <p><strong>語言:</strong> {{ book.language }}</p>
          <p>
            <strong>在架狀態:</strong>
            <span :class="book.is_available === 1 ? 'availability' : 'unavailable'">
              {{ book.is_available === 1 ? '是' : '否' }}
            </span>
          </p>
        </div>
        <div class="result-actions">
          <!-- <button
            class="btn"
            :class="book.favorite ? 'favorite' : 'not-favorite'"
            @click="toggleFavorite(book)"
          >
            最愛
          </button> -->
          <button
            class="btn bookinfo-btn"
            @click="navigateToBookDetail(book)"
          >
            更多資訊
          </button>
        </div>
      </div>
      <!-- Pagination -->
      <div class="result-pagination">
        <div class="result-pagination-controls">
          <button 
            class="pagination-btn"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <span class="sr-only">上一頁</span>
          </button>
          <span>共{{ totalPages }}頁</span>
          <input
            type="number"
            :value="currentPage"
            class="pagination-input"
            min="1"
            :max="totalPages"
            @change="e => goToPage(parseInt(e.target.value))"
          />
          <span>/{{ totalPages }}頁</span>
          <button 
            class="pagination-btn"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            <span class="sr-only">下一頁</span>
          </button>
        </div>
        <div class="pagination-info">
          顯示第 {{ searchResults.size * (searchResults.number) + 1 }} 到 
          {{ Math.min(searchResults.size * (searchResults.number + 1), searchResults.totalElements) }} 筆，
          共 {{ searchResults.totalElements }} 筆
        </div>
      </div>
    </div>
    <div v-else-if="searched" class="no-results">
      無搜尋結果
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'

// State
const route = useRoute()
const router = useRouter()
const book = ref(null)
const simpleSearchQuery = ref('');
const isAdvancedSearch = ref(false);
const advancedSearchConditions = ref([
  { field: 'title', operator: 'AND', value: '' },
]);
const searchResults = ref({
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 10,
  number: 0
});
const searched = ref(false);
const currentPage = ref(1);
const pageSizes = ref([10, 25, 50]);
const itemsPerPage = ref(10);
const sortConfig = ref({
  field: 'title_asc'
});

// 添加缺少的 ref 變數
const yearFrom = ref('');
const yearTo = ref('');
const selectedClassification = ref('');
const selectedLanguages = ref('');

// 分類選項
const classificationOptions = ref([
  { value: 'CLC', label: '中國圖書分類法' },
  { value: 'LCC', label: '美國國會圖書館分類法' }
]);

// 語言選項
const languageOptions = ref([
  { value: 'zh', label: '中文' },
  { value: 'en', label: '英文' },
  { value: 'ja', label: '日文' },
  { value: 'fr', label: '法文' },
  { value: 'de', label: '德文' }
]);

// 添加 onMounted 邏輯
onMounted(async () => {
  const route = useRoute()
  const bookId = route.query.bookId
  if (!bookId) return
  try {
    const response = await axios.get(`http://localhost:8080/api/books/${bookId}`)
    book.value = response.data
  } catch (e) {
    console.error('找不到書籍', e)
  }
})

onMounted(async () => {
  const route = useRoute()
  
  // 處理從書籍詳情頁返回的情況
  if (route.query.q && route.query.from !== 'bookinfo') {
    // 如果有搜尋參數且不是從 bookinfo 返回，執行搜尋
    if (route.query.q === 'advanced') {
      // 處理進階搜尋返回
      isAdvancedSearch.value = true
      // 這裡可以根據需要恢復進階搜尋條件
    } else {
      // 處理簡單搜尋返回
      simpleSearchQuery.value = route.query.q
      await performSimpleSearch()
    }
    
    // 恢復頁碼
    if (route.query.page) {
      currentPage.value = parseInt(route.query.page) || 1
    }
  }
  
  // 原有的書籍詳情邏輯
  const bookId = route.query.bookId
  if (!bookId) return
  try {
    const response = await axios.get(`http://localhost:8080/api/books/${bookId}`)
    book.value = response.data
  } catch (e) {
    console.error('找不到書籍', e)
  }
})

// 或者更完整的狀態恢復版本
const handleReturnFromBookInfo = () => {
  const route = useRoute()
  
  // 檢查 URL 參數以決定是否需要恢復搜尋狀態
  if (route.query.q) {
    if (route.query.returnType === 'advanced') {
      isAdvancedSearch.value = true
      // 可以在這裡添加更詳細的進階搜尋狀態恢復邏輯
    } else {
      simpleSearchQuery.value = route.query.q
      performSimpleSearch()
    }
    
    // 恢復頁碼
    if (route.query.page) {
      currentPage.value = parseInt(route.query.page)
    }
    
    // 清理 URL 參數（可選）
    router.replace({ query: {} })
  }
}

// 修改 fetchBooks 函數
const fetchBooks = async (params) => {
  try {
    const [field, direction] = sortConfig.value.field.split('_');
    console.log('搜尋參數：', params);
    
    const response = await axios.get('http://localhost:8080/api/books/simple-search', {
      params: {
        ...params,
        page: currentPage.value - 1,
        size: itemsPerPage.value,
        sort: `${field},${direction}`
      }
    });
    
    if (response.data) {
      console.log('API 回應資料：', response.data);
      console.log('API 回應資料類型：', typeof response.data);
      
      const content = Array.isArray(response.data.content) ? response.data.content : [];
      
      content.forEach((book, index) => {
        console.log(`第 ${index + 1} 本書的原始在架狀態：`, book.is_available);
        console.log(`第 ${index + 1} 本書的在架狀態類型：`, typeof book.is_available);
        
        book.is_available = Number(book.is_available);
        
        console.log(`第 ${index + 1} 本書的處理後在架狀態：`, book.is_available);
      });
      
      searchResults.value = {
        ...response.data,
        content
      };
    } else {
      searchResults.value = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: itemsPerPage.value,
        number: 0
      };
    }
    searched.value = true;
  } catch (error) {
    console.error('搜尋錯誤：', error);
    alert('搜尋失敗，請稍後再試');
    searchResults.value = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: itemsPerPage.value,
      number: 0
    };
    searched.value = true;
  }
};

// 修改 computed properties
const totalPages = computed(() => searchResults.value.totalPages || 0);

const sortedResults = computed(() => {
  const content = searchResults.value.content || [];
  if (!Array.isArray(content)) return [];
  
  console.log('排序前的資料：', content);
  const [field, order] = sortConfig.value.field.split('_');
  const sorted = [...content].sort((a, b) => {
    const modifier = order === 'asc' ? 1 : -1;
    if (a[field] < b[field]) return -1 * modifier;
    if (a[field] > b[field]) return 1 * modifier;
    return 0;
  });
  console.log('排序後的資料：', sorted);
  return sorted;
});

const currentPageResults = computed(() => sortedResults.value);

// Methods
const toggleAdvancedSearch = () => {
  isAdvancedSearch.value = !isAdvancedSearch.value;
  if (!isAdvancedSearch.value) {
    advancedSearchConditions.value = [{ field: 'title', operator: 'AND', value: '' }];
    searchResults.value = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: itemsPerPage.value,
      number: 0
    };
    searched.value = false;
    currentPage.value = 1;
  }
};

const addCondition = () => {
  if (advancedSearchConditions.value.length < 6) {
    advancedSearchConditions.value.push({ field: 'title', operator: 'AND', value: '' });
  }
};

const removeCondition = (index) => {
  advancedSearchConditions.value.splice(index, 1);
};

// 修改簡單搜尋函數
const performSimpleSearch = async () => {
  const query = simpleSearchQuery.value.trim();
  if (!query) {
    searchResults.value = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: itemsPerPage.value,
      number: 0
    };
    searched.value = true;
    currentPage.value = 1;
    return;
  }
  
  await fetchBooks({
    field: 'title', // 直接使用 'title' 作為預設搜尋欄位
    keyword: query
  });
};

// 修改進階搜尋函數
const performAdvancedSearch = async () => {
  // 檢查是否有任何搜尋條件
  const hasSearchConditions = advancedSearchConditions.value.some(cond => cond.value.trim());
  const hasFilterConditions = yearFrom.value || yearTo.value || selectedClassification.value || selectedLanguages.value;

  if (!hasSearchConditions && !hasFilterConditions) {
    alert('請至少輸入一個搜尋條件');
    return;
  }

  // 組成條件陣列
  const conditions = advancedSearchConditions.value
    .filter(cond => cond.value.trim())
    .map(cond => ({
      field: cond.field,
      operator: cond.operator,
      value: cond.value.trim()
    }));

  // 添加其他篩選條件
  if (yearFrom.value || yearTo.value) {
    conditions.push({
      field: 'publishdate',
      operator: 'AND',
      value: JSON.stringify({
        from: yearFrom.value || null,
        to: yearTo.value || null
      })
    });
  }
  if (selectedClassification.value) {
    conditions.push({
      field: 'category_system',
      operator: 'AND',
      value: JSON.stringify({
        cs_id: selectedClassification.value,
        include_children: true
      })
    });
  }
  if (selectedLanguages.value) {
    conditions.push({ 
      field: 'language', 
      operator: 'AND', 
      value: selectedLanguages.value 
    });
  }

  // 分頁與排序參數
  const [sortField, sortDir] = sortConfig.value.field.split('_');

  try {
    const response = await axios.post('http://localhost:8080/api/books/advanced-search', conditions, {
      params: {
        page: currentPage.value - 1,
        size: itemsPerPage.value,
        sortField,
        sortDir
      }
    });
    searchResults.value = response.data;
    searched.value = true;
  } catch (error) {
    console.error('進階查詢錯誤：', error);
    alert('搜尋失敗，請稍後再試');
    searchResults.value = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: itemsPerPage.value,
      number: 0
    };
    searched.value = true;
  }
};

const goToPage = (page) => {
  const pageNum = parseInt(page);
  if (pageNum && !isNaN(pageNum)) {
    if (pageNum < 1) {
      currentPage.value = 1;
    } else if (pageNum > totalPages.value) {
      currentPage.value = totalPages.value;
    } else {
      currentPage.value = pageNum;
    }
  }
};

watch(itemsPerPage, () => {
  currentPage.value = 1;
});

// 添加排序監聽
watch(sortConfig, () => {
  if (searched.value) {
    if (isAdvancedSearch.value) {
      performAdvancedSearch();
    } else {
      performSimpleSearch();
    }
  }
}, { deep: true });

// 修改後的導航到書籍詳情頁方法
const navigateToBookDetail = (book) => {
  router.push({
    path: '/bookinfo', // 導航到 bookinfo.vue 頁面
    query: {
      id: book.id || book.bookId,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      publisher: book.publisher,
      publishdate: book.publishdate,
      classification: book.classification,
      language: book.language,
      description: book.description || '', // 如果沒有描述則使用空字串
      is_available: book.is_available.toString(),
      total_copies: String(book.total_copies || 1),
      available_copies: String(book.available_copies || (book.is_available === 1 ? 1 : 0)),
      // 保存返回資訊
      returnQuery: isAdvancedSearch.value ? 'advanced' : simpleSearchQuery.value,
      returnPage: currentPage.value.toString(),
      returnType: isAdvancedSearch.value ? 'advanced' : 'simple'
    }
  })
}
</script>

<style scoped>
body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
  margin: 0;
  padding: 20px;
  align-items: center;
}

.container {
  width: 100%; /* 確保容器能適應螢幕 */
  max-width: 1200px; /* 設定最大寬度，防止過寬 */
  margin: 0 auto;
  background-color: transparent;
  padding: 20px;
}

.simple-search,
.advanced-search {
  max-width: 100%;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-bar input {
  flex: 1;
  min-width: 200px;
  max-width: 600px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}

.search-bar input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.3);
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: transparent;
  color: #007bff;
  text-decoration: underline;
}

.btn-secondary:hover {
  color: #0056b3;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #b02a37;
}

.btn-disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.favorite {
  background-color: #ccc; 
  color: #333;
}

.favorite:hover {
  background-color: #b3b3b3; 
}

.not-favorite {
  background-color: #dc3545; 
  color: white;
}

.not-favorite:hover {
  background-color: #b02a37;
}

.bookinfo-btn {
  background-color: #007bff; 
  color: white;
}

.bookinfo-btn:hover {
  background-color: #0056b3;
}

.condition {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.condition select,
.condition input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}

.condition input {
  flex: 1;
  min-width: 150px;
}

.results {
  margin-top: 20px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ddd;
  margin: 0 50px;
  gap: 10px;
}

.result-item:hover {
  background-color: #96c0fdbe; 
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.result-item:last-child {
  border-bottom: none;
}

.result-info {
  flex: 1;
}

.result-info p {
  margin: 0;
  font-size: 16px;
}

.result-info p strong {
  margin-right: 5px;
}

.availability {
  color: green;
}

.unavailable {
  color: red;
}

.reserved {
  color: red;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-control-panel {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
}

.result-control-panel-left {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-label {
  font-size: 1rem;
  color: #222;
}

.result-select {
  width: 120px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 1rem;
  background: #fff;
  color: #18181b;
}

.result-pagination {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.result-pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  height: 32px;
  min-width: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #18181b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 1rem;
  line-height: 1;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn:hover {
  background: #f3f4f6;
}

.pagination-input {
  height: 32px;
  width: 48px;
  text-align: center;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  color: #18181b;
  background: #fff;
}

.pagination-info {
  font-size: 0.95rem;
  color: #4b5563;
  text-align: center;
}

.no-results {
  color: #6c757d;
  margin-top: 20px;
}

h2 {
  font-size: 20px;
  margin-bottom: 10px;
}

/* 佈局樣式 */
.search-layout {
  display: flex;
  gap: 20px;
}

.search-conditions {
  flex: 1;
  max-width: 600px;
}

.advanced-filters {
  min-width: 200px;
  padding: 15px;
  border-radius: 4px;
}

.filter-section h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #333;
}

.condition label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

/* RWD 樣式 */
@media (max-width: 768px) {
  .search-layout {
    flex-direction: column;
  }

  .search-conditions,
  .advanced-filters {
    max-width: 100%;
    min-width: auto;
  }

  .advanced-filters {
    order: 2; /* 確保 advanced-filters 移到下方 */
  }

  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-bar input,
  .search-bar button {
    width: 100%;
    margin-bottom: 10px;
  }

  .condition {
    flex-direction: column;
    align-items: stretch;
  }

  .condition select,
  .condition input {
    width: 100%;
    margin-bottom: 10px;
  }

  .result-item {
    flex-direction: row;
    align-items: flex-start;
    margin: 0 10px;
  }

  .result-actions {
    margin-top: 10px;
  }

  .result-control-panel {
    flex-direction: column;
    align-items: flex-start;
  }

  .result-control-panel-left {
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 10px;
  }

  .search-bar input {
    min-width: 150px;
  }

  .result-row {
    flex-direction: column;
    gap: 8px;
  }

  .result-select {
    width: 100%;
  }

  .pagination-controls {
    flex-direction: column;
    gap: 8px;
  }

  .pagination-input {
    width: 60px;
  }
}
</style>