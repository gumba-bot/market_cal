document.addEventListener('DOMContentLoaded', () => {
  const itemsList = document.querySelector('.items-list');
  const totalCountEl = document.querySelector('.count-value');
  const totalPriceEl = document.querySelector('.price-value');
  const clearBtn = document.querySelector('.clear-btn');

  let items = [];

  // Load from localStorage
  const saved = localStorage.getItem('market_cal_items');
  if (saved) {
    try {
      items = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse localStorage data:', e);
    }
  }

  // Initial empty state if nothing was saved
  if (!items || items.length === 0) {
    items = [{ id: Date.now(), name: '', price: '', count: 1 }];
  }

  function saveToLocalStorage() {
    localStorage.setItem('market_cal_items', JSON.stringify(items));
  }

  function formatNumber(numStr) {
    if (!numStr) return '';
    const cleanNum = String(numStr).replace(/,/g, '').replace(/[^0-9]/g, '');
    if (!cleanNum) return '';
    return parseInt(cleanNum, 10).toLocaleString('ko-KR');
  }

  function parseNumber(numStr) {
    if (!numStr) return 0;
    return parseInt(String(numStr).replace(/,/g, ''), 10) || 0;
  }

  function updateTotals() {
    const validItems = items.filter(item => (item.name && item.name.trim() !== '') || item.price !== '');
    const totalCount = validItems.length;
    const totalPrice = validItems.reduce((sum, item) => {
      const countVal = item.count !== undefined && item.count !== '' ? item.count : 1;
      const countNum = parseInt(countVal, 10) || 0;
      return sum + (parseNumber(item.price) * countNum);
    }, 0);

    totalCountEl.textContent = `${totalCount}개`;
    totalPriceEl.textContent = `${totalPrice.toLocaleString('ko-KR')}원`;
  }

  function updateRowTotal(row, item) {
    const countVal = item.count !== undefined && item.count !== '' ? item.count : 1;
    const countNum = parseInt(countVal, 10) || 0;
    const itemTotal = (parseNumber(item.price) || 0) * countNum;
    row.querySelector('.item-total').textContent = itemTotal > 0 ? itemTotal.toLocaleString('ko-KR') : '';
  }

  function checkAutoAdd() {
    if (items.length === 0) return;
    const lastItem = items[items.length - 1];
    // Add a new row if the last row is filled
    if (lastItem && ((lastItem.name && lastItem.name !== '') || (lastItem.price && lastItem.price !== ''))) {
      const newItem = { id: Date.now(), name: '', price: '', count: 1 };
      items.push(newItem);
      appendRow(newItem);
    }
  }

  function appendRow(item) {
    const countVal = item.count !== undefined && item.count !== '' ? item.count : 1;
    const countNum = parseInt(countVal, 10) || 0;
    const itemTotal = (parseNumber(item.price) || 0) * countNum;

    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <div class="col name-col">
        <input type="text" placeholder="품목명" value="${item.name || ''}" class="item-input">
      </div>
      <div class="col price-col">
        <input type="text" inputmode="numeric" placeholder="단가" value="${item.price || ''}" class="price-input">
      </div>
      <div class="col count-col">
        <input type="number" inputmode="numeric" min="1" placeholder="수량" value="${countVal}" class="count-input">
      </div>
      <div class="col total-col">
        <span class="item-total">${itemTotal > 0 ? itemTotal.toLocaleString('ko-KR') : ''}</span>
      </div>
      <div class="col delete-col">
        <button class="delete-item-btn" tabindex="-1">🗑️</button>
      </div>
    `;

    const nameInput = row.querySelector('.item-input');
    const priceInput = row.querySelector('.price-input');
    const countInput = row.querySelector('.count-input');
    const deleteBtn = row.querySelector('.delete-item-btn');

    nameInput.addEventListener('input', (e) => {
      item.name = e.target.value;
      saveToLocalStorage();
      updateTotals();
      checkAutoAdd();
    });

    priceInput.addEventListener('input', (e) => {
      const cursorPosition = e.target.selectionStart;
      const oldLength = e.target.value.length;
      
      const formatted = formatNumber(e.target.value);
      item.price = formatted;
      e.target.value = formatted;
      
      // Attempt to preserve cursor
      const newLength = formatted.length;
      const diff = newLength - oldLength;
      const newPos = Math.max(0, cursorPosition + diff);
      try { e.target.setSelectionRange(newPos, newPos); } catch (err) {}

      updateRowTotal(row, item);
      saveToLocalStorage();
      updateTotals();
      checkAutoAdd();
    });

    countInput.addEventListener('input', (e) => {
      const val = e.target.value;
      const num = parseInt(val, 10);
      item.count = isNaN(num) ? '' : num;
      
      updateRowTotal(row, item);
      saveToLocalStorage();
      updateTotals();
    });

    deleteBtn.addEventListener('click', () => {
      if (!window.confirm('이 품목을 삭제하시겠습니까?')) {
        return;
      }
      
      const idx = items.indexOf(item);
      if (idx !== -1) {
        if (items.length <= 1) {
          // Reset the only row
          item.name = '';
          item.price = '';
          item.count = 1;
          nameInput.value = '';
          priceInput.value = '';
          countInput.value = 1;
          updateRowTotal(row, item);
        } else {
          // Remove the row entirely
          items.splice(idx, 1);
          row.remove();
        }
        saveToLocalStorage();
        updateTotals();
        checkAutoAdd();
      }
    });

    itemsList.appendChild(row);
  }

  function renderAll() {
    itemsList.innerHTML = '';
    items.forEach(item => appendRow(item));
    updateTotals();
    checkAutoAdd();
  }

  clearBtn.addEventListener('click', () => {
    if (window.confirm('모든 품목을 삭제하시겠습니까?')) {
      items = [{ id: Date.now(), name: '', price: '', count: 1 }];
      saveToLocalStorage();
      renderAll();
    }
  });

  // Initial load
  renderAll();
});
