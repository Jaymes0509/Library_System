<template>
    <div class="borrow-bg">
      <h1 class="borrow-title">歷史紀錄</h1>
      <div class="borrow-main">
        <!-- 控制面板 -->
        <div class="borrow-control-panel">
          <div class="borrow-control-panel-left">
            <div class="borrow-row">
              <span class="borrow-label">每頁顯示：</span>
              <select v-model="itemsPerPage" class="borrow-select">
                <option v-for="size in pageSizes" :key="size" :value="size">{{ size }} 筆</option>
              </select>
            </div>
            <div class="borrow-row">
              <span class="borrow-label">排序：</span>
              <select v-model="sortConfig.field" class="borrow-select">
                <option value="title">書名</option>
                <option value="author">作者</option>
                <option value="borrowDate">借閱日</option>
                <option value="dueDate">到期日</option>
              </select>
              <button @click="toggleSortOrder" class="borrow-sort-btn">
                <span v-if="sortConfig.ascending">↑ 升冪</span>
                <span v-else>↓ 降冪</span>
              </button>
            </div>
          </div>
          <div class="borrow-control-panel-right">
            <button
              @click="viewMode = 'table'"
              :class="['borrow-view-btn', viewMode === 'table' ? 'borrow-view-btn-active' : '']"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="borrow-view-icon"><path d="M3 12h.01"></path><path d="M3 18h.01"></path><path d="M3 6h.01"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M8 6h13"></path></svg>
              表格
            </button>
            <button
              @click="viewMode = 'grid'"
              :class="['borrow-view-btn', viewMode === 'grid' ? 'borrow-view-btn-active' : '']"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="borrow-view-icon"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              網格
            </button>
          </div>
        </div>
  
        <!-- 表格視圖 -->
        <div :class="['borrow-table-scroll', itemsPerPage > 10 ? 'borrow-table-scrollable' : 'borrow-table-fill']">
          <div v-if="viewMode === 'table'" class="borrow-grid-table">
            <div class="borrow-grid-header">
              <div>書名</div>
              <div>作者</div>
              <div>借閱日</div>
              <div>到期日</div>
              <div>續借次數</div>
              <div>功能</div>
            </div>
            <div class="borrow-grid-body">
              <div
                v-for="(book, index) in paginatedBooks"
                :key="index"
                class="borrow-grid-row"
              >
                <div>{{ book.title }}</div>
                <div>{{ book.author }}</div>
                <div>{{ book.borrowDate }}</div>
                <div :class="{ 
                  'text-red-600 font-medium': isOverdue(book.dueDate) && !book.isReturned,
                  'text-green-600 font-medium': book.isReturned
                }">
                  {{ formatDueDate(book.dueDate, book.isReturned) }}
                </div>
                <div>{{ book.renewCount }}/2</div>
                <div>
                  <button 
                    @click="renewBook(book)" 
                    class="borrow-detail-btn"
                    :class="{ 
                      'borrow-detail-btn-disabled': !canRenew(book.dueDate) || book.renewCount >= 2 || book.isReturned,
                      'borrow-detail-btn-overdue': isOverdue(book.dueDate) && !book.isReturned,
                      'borrow-detail-btn-returned': book.isReturned
                    }"
                    :disabled="!canRenew(book.dueDate) || book.renewCount >= 2 || book.isReturned || isOverdue(book.dueDate)"
                  >
                    {{ getButtonText(book) }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="borrow-grid">
            <div v-for="(book, index) in paginatedBooks" :key="index" class="borrow-grid-card">
              <div class="borrow-grid-img-wrap">
                <img :src="book.coverUrl || getDefaultCoverUrl(index)" :alt="book.title" class="borrow-grid-img" />
              </div>
              <div class="borrow-grid-info">
                <h3 class="borrow-grid-title">{{ book.title }}</h3>
                <p class="borrow-grid-author">{{ book.author }}</p>
                <div class="borrow-grid-dates">
                  <p>借閱日：{{ book.borrowDate }}</p>
                  <p :class="{ 
                    'text-red-600 font-medium': isOverdue(book.dueDate) && !book.isReturned,
                    'text-green-600 font-medium': book.isReturned
                  }">
                    到期日：{{ formatDueDate(book.dueDate, book.isReturned) }}
                  </p>
                  <p>續借次數：{{ book.renewCount }}/2</p>
                </div>
                <button 
                  class="borrow-detail-btn"
                  :class="{ 
                    'borrow-detail-btn-disabled': !canRenew(book.dueDate) || book.renewCount >= 2 || book.isReturned,
                    'borrow-detail-btn-overdue': isOverdue(book.dueDate) && !book.isReturned,
                    'borrow-detail-btn-returned': book.isReturned
                  }"
                  @click="renewBook(book)"
                  :disabled="!canRenew(book.dueDate) || book.renewCount >= 2 || book.isReturned || isOverdue(book.dueDate)"
                >
                  {{ getButtonText(book) }}
                </button>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 分頁控制 -->
        <div class="borrow-pagination">
          <div class="borrow-pagination-controls">
            <button 
              class="borrow-pagination-btn"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              <span class="sr-only">上一頁</span>
            </button>
            <span>共{{ totalPages }}頁</span>
            <input
              type="number"
              :value="currentPage"
              class="borrow-pagination-input"
              min="1"
              :max="totalPages"
              @change="e => goToPage(parseInt(e.target.value))"
            />
            <span>/{{ totalPages }}頁</span>
            <button 
              class="borrow-pagination-btn"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            >
              <span class="sr-only">下一頁</span>
            </button>
          </div>
          <div class="borrow-pagination-info">
            顯示第 {{ (currentPage - 1) * itemsPerPage + 1 }} 到 {{ Math.min(currentPage * itemsPerPage, sortedBooks.length) }} 筆，共 {{ sortedBooks.length }} 筆
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue'
  
  // 檢查是否可以續借（到期日前3天）
  function canRenew(dueDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDateObj = new Date(dueDate)
    const diffTime = dueDateObj.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays > 0
  }
  
  // 檢查是否逾期
  function isOverdue(dueDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDateObj = new Date(dueDate)
    return today > dueDateObj
  }
  
  // 格式化到期日顯示
  function formatDueDate(dueDate, isReturned) {
    if (isReturned) {
      return '已歸還'
    }
    if (isOverdue(dueDate)) {
      return `${dueDate} (逾期)`
    }
    return dueDate
  }
  
  // 取得按鈕文字
  function getButtonText(book) {
    if (book.isReturned) {
      return '已歸還'
    }
    if (isOverdue(book.dueDate)) {
      return '已逾期'
    }
    if (book.renewCount >= 2) {
      return '已達上限'
    }
    if (!canRenew(book.dueDate)) {
      return '尚未到續借時間'
    }
    return '續借'
  }
  
  // 視圖模式
  const viewMode = ref('table') // 'table' 或 'grid'
  
  // 分頁設定
  const pageSizes = [10, 20, 30, 50, 100]
  const itemsPerPage = ref(10)
  const currentPage = ref(1)
  
  // 排序設定
  const sortConfig = ref({
    field: 'title',
    ascending: true
  })
  
  // 生成大量測試資料
  const books = [
    '哈利波特：神秘的魔法石', '哈利波特：消失的密室', '哈利波特：阿茲卡班的逃犯',
    '魔戒首部曲：魔戒現身', '魔戒二部曲：雙城奇謀', '魔戒三部曲：王者再臨',
    '三體', '三體Ⅱ黑暗森林', '三體Ⅲ死神永生', '挪威的森林',
    '1984', '美麗新世界', '動物農莊', '華氏451度',
    '追風箏的孩子', '群山回唱', '燦爛千陽', '小王子',
    '百年孤寂', '霍爾的移動城堡', '神隱少女', '天空之城'
  ]
  
  const authors = [
    'J.K. 羅琳', '托爾金', '劉慈欣', '村上春樹',
    '喬治·歐威爾', '赫胥黎', '卡勒德·胡賽尼', '安東尼·聖修伯里',
    '加西亞·馬奎斯', '宮崎駿'
  ]
  
  // 預設封面圖片（這裡使用隨機顏色作為示例）
  function getDefaultCoverUrl(index) {
    const colors = ['FF6B6B', 'FF8787', '4ECDC4', '45B7D1', '96CEB4', 'FFEEAD', 'D4A5A5', 'FFE3E3']
    const color = colors[index % colors.length]
    return `https://via.placeholder.com/300x400/${color}/FFFFFF?text=${encodeURIComponent('書籍封面')}`
  }
  
  const borrowedBooks = ref(Array.from({ length: 50 }, (_, i) => {
    const isReturned = i % 10 === 0 // 每10本書將有1本是已歸還的狀態
    
    // 取得今天的日期
    const today = new Date()
    const baseDate = new Date(today)
    baseDate.setDate(baseDate.getDate() - 30) // 從30天前開始

    // 根據索引設置不同的借閱情況
    let borrowDate, dueDate, renewCount
    
    if (i % 8 === 0) { // 即將到期（1-2天內）
      borrowDate = new Date(today)
      borrowDate.setDate(borrowDate.getDate() - 28) // 28天前借的
      dueDate = new Date(today)
      dueDate.setDate(dueDate.getDate() + 2) // 還有2天到期
      renewCount = 0
    } else if (i % 8 === 1) { // 已經逾期
      borrowDate = new Date(today)
      borrowDate.setDate(borrowDate.getDate() - 35) // 35天前借的
      dueDate = new Date(today)
      dueDate.setDate(dueDate.getDate() - 5) // 5天前就到期了
      renewCount = Math.min(2, Math.floor(Math.random() * 3)) // 0-2次續借
    } else if (i % 8 === 2 || i % 8 === 3) { // 剛借不久
      borrowDate = new Date(today)
      borrowDate.setDate(borrowDate.getDate() - 5) // 5天前借的
      dueDate = new Date(today)
      dueDate.setDate(dueDate.getDate() + 25) // 還有25天到期
      renewCount = 0
    } else { // 已續借過的（一般借閱中）
      borrowDate = new Date(today)
      borrowDate.setDate(borrowDate.getDate() - 20) // 20天前借的
      dueDate = new Date(today)
      dueDate.setDate(dueDate.getDate() + 10) // 還有10天到期
      renewCount = 1 // 已續借1次
    }

    return {
      id: String(i + 1),
      title: books[i % books.length],
      author: authors[i % authors.length],
      borrowDate: borrowDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      coverUrl: null,
      renewCount,
      isReturned
    }
  }))
  
  // 排序功能
  function toggleSortOrder() {
    sortConfig.value.ascending = !sortConfig.value.ascending
  }
  
  function updateSort(field) {
    if (sortConfig.value.field === field) {
      sortConfig.value.ascending = !sortConfig.value.ascending
    } else {
      sortConfig.value.field = field
      sortConfig.value.ascending = true
    }
  }
  
  function getSortIcon(field) {
    if (sortConfig.value.field !== field) return ''
    return sortConfig.value.ascending ? '↑' : '↓'
  }
  
  // 排序後的資料
  const sortedBooks = computed(() => {
    return [...borrowedBooks.value].sort((a, b) => {
      const field = sortConfig.value.field
      const modifier = sortConfig.value.ascending ? 1 : -1
      
      if (a[field] < b[field]) return -1 * modifier
      if (a[field] > b[field]) return 1 * modifier
      return 0
    })
  })
  
  // 計算總頁數
  const totalPages = computed(() => Math.ceil(sortedBooks.value.length / itemsPerPage.value))
  
  // 監聽每頁顯示數量變更
  watch(itemsPerPage, () => {
    currentPage.value = 1
  })
  
  // 計算當前頁面應該顯示的資料
  const paginatedBooks = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return sortedBooks.value.slice(start, end)
  })
  
  // 續借功能
  function renewBook(book) {
    if (book.isReturned) {
      alert('此書已歸還')
      return
    }
    
    if (book.renewCount >= 2) {
      alert('此書已達到續借上限，無法再次續借')
      return
    }

    if (isOverdue(book.dueDate)) {
      alert('此書已逾期，無法續借')
      return
    }

    if (!canRenew(book.dueDate)) {
      alert('尚未到續借時間（到期前3天內才能續借）')
      return
    }

    // 取得當前到期日
    const currentDueDate = new Date(book.dueDate)
    
    // 計算新的到期日（當前到期日 + 30天）
    const newDueDate = new Date(currentDueDate)
    newDueDate.setDate(newDueDate.getDate() + 30)
    
    // 更新書籍的到期日
    book.dueDate = newDueDate.toISOString().split('T')[0]
    // 增加續借次數
    book.renewCount++
  }
  
  // 添加 goToPage 函數
  function goToPage(page) {
    const pageNum = parseInt(page)
    if (pageNum && !isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages.value) {
      currentPage.value = pageNum
    }
  }
  </script>
  
  <style scoped>
  .borrow-bg {
    padding: 24px 24px 100px 24px;
    background: #fff;
  }
  .borrow-title {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 16px;
    color: #18181b;
  }
  .borrow-main {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .borrow-control-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .borrow-control-panel-left {
    display: flex;
    align-items: center;
    gap: 32px;
    flex-wrap: wrap;
  }
  .borrow-control-panel-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .borrow-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .borrow-label {
    font-size: 1rem;
    color: #222;
  }
  .borrow-select {
    min-width: 120px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 1rem;
    background: #fff;
    color: #18181b;
    cursor: pointer;
    transition: background 0.2s;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    text-align-last: center;
  }
  .borrow-select:hover {
    background: #f3f4f6;
  }
  .borrow-sort-btn {
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 8px 16px;
    background: #fff;
    color: #18181b;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .borrow-view-btn {
    display: inline-flex;
    align-items: center;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    color: #18181b;
    font-size: 1rem;
    padding: 8px 16px;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    margin-right: 4px;
  }
  .borrow-view-btn:last-child {
    margin-right: 0;
  }
  .borrow-view-btn-active {
    background: #2563eb;
    color: #fff;
  }
  .borrow-view-icon {
    width: 20px;
    height: 20px;
    margin-right: 6px;
  }
  .borrow-table-scroll {
    width: 100%;
  }
  .borrow-table-fill {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  .borrow-table-scrollable {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  .borrow-grid-table {
    display: flex;
    flex-direction: column;
    width: 100%;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  .borrow-grid-header,
  .borrow-grid-row {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1fr 1fr 0.8fr 0.8fr;
    align-items: center;
  }
  .borrow-grid-header {
    background: #f3f4f6;
    color: #222;
    font-weight: 600;
    padding: 12px 0;
  }
  .borrow-grid-header > div {
    padding: 12px 16px;
    text-align: center;
  }
  .borrow-grid-header > div:first-child {
    text-align: left;
  }
  .borrow-grid-body {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .borrow-grid-row {
    min-height: 0;
    flex: 1;
    border-bottom: 1px solid #e5e7eb;
    transition: background 0.2s;
  }
  .borrow-grid-row:last-child {
    border-bottom: none;
  }
  .borrow-grid-row > div {
    padding: 12px 16px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .borrow-grid-row > div:first-child {
    text-align: left;
    justify-content: flex-start;
  }
  .borrow-grid-row > div:last-child {
    justify-content: flex-end;
  }
  .borrow-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }
  .borrow-grid-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.2s;
  }
  .borrow-grid-card:hover {
    box-shadow: 0 4px 16px #0002;
    background: #f3f4f6;
  }
  .borrow-grid-img-wrap {
    aspect-ratio: 3/4;
    background: #f3f4f6;
    position: relative;
  }
  .borrow-grid-img {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
  .borrow-grid-info {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    position: relative;
  }
  .borrow-grid-title {
    font-weight: 600;
    font-size: 1.1rem;
    color: #18181b;
    margin-bottom: 2px;
  }
  .borrow-grid-author {
    font-size: 0.95rem;
    color: #6b7280;
    margin-bottom: 4px;
  }
  .borrow-grid-dates {
    font-size: 0.9rem;
    color: #4b5563;
    margin-bottom: 8px;
    flex-grow: 1;
  }
  .borrow-detail-btn {
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background 0.2s;
    width: 100%;
    margin-top: auto;
  }
  .borrow-detail-btn:hover {
    background: #1d4ed8;
  }
  .borrow-detail-btn-disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  .borrow-detail-btn-disabled:hover {
    background: #9ca3af;
  }
  .borrow-detail-btn-overdue {
    background: #dc2626;
  }
  .borrow-detail-btn-overdue:hover {
    background: #b91c1c;
  }
  .borrow-detail-btn-returned {
    background: #16a34a;
    cursor: not-allowed;
  }
  .borrow-detail-btn-returned:hover {
    background: #16a34a;
  }
  .text-red-600 {
    color: #dc2626;
  }
  .text-green-600 {
    color: #16a34a;
  }
  .font-medium {
    font-weight: 500;
  }
  .borrow-pagination {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 16px;
  }
  .borrow-pagination-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .borrow-pagination-btn {
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
  .borrow-pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .borrow-pagination-btn:hover {
    background: #f3f4f6;
  }
  .borrow-pagination-input {
    height: 32px;
    width: 48px;
    text-align: center;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    color: #18181b;
    background: #fff;
  }
  /* 隱藏 Chrome, Safari, Edge, Opera 的箭頭 */
  .borrow-pagination-input::-webkit-outer-spin-button,
  .borrow-pagination-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  /* 隱藏 Firefox 的箭頭 */
  .borrow-pagination-input[type=number] {
    -moz-appearance: textfield;
  }
  .borrow-pagination-info {
    font-size: 0.95rem;
    color: #4b5563;
    text-align: center;
  }
  /* 響應式設計 */
  @media (max-width: 768px) {
    .borrow-control-panel {
      flex-direction: column;
      align-items: stretch;
    }

    .borrow-control-panel-left {
      flex-direction: column;
      gap: 16px;
    }

    .borrow-control-panel-right {
      justify-content: center;
    }

    .borrow-grid-header,
    .borrow-grid-row {
      grid-template-columns: 1.5fr 1fr 1fr 1fr 0.8fr 0.8fr;
      font-size: 0.9rem;
    }

    .borrow-grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
  }

  @media (max-width: 640px) {
    .borrow-bg {
      padding: 16px 16px 80px 16px;
    }

    .borrow-grid-header,
    .borrow-grid-row {
      grid-template-columns: 1.2fr 1fr 0.8fr;
      font-size: 0.85rem;
    }

    .borrow-grid-header > div,
    .borrow-grid-row > div {
      padding: 8px;
    }

    .borrow-grid {
      grid-template-columns: 1fr;
    }

    .borrow-pagination-controls {
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .borrow-select,
    .borrow-sort-btn,
    .borrow-view-btn {
      width: 100%;
      justify-content: center;
    }

    .borrow-row {
      flex-direction: column;
      align-items: stretch;
      width: 100%;
    }

    .borrow-label {
      text-align: center;
    }
  }
  </style>