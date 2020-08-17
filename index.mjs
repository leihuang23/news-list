import shortList from './data/shortList.mjs';
import tags from './data/tags.mjs';
import Trie from './utils/trie.mjs';
import lazyLoad from './utils/lazyload.mjs';
import autocomplete from './autocomplete/index.mjs';
import { computed, observe } from './utils/reactive.mjs';

let wholeList = [];

const tagsTrie = Trie.addAll(tags);
const newsMap = new Map();
const inputEl = document.getElementById('myInput');
const searchTitleEl = document.querySelector('#search-title');
const PAGE_SIZE = 10;

autocomplete({
  dataSrc: tagsTrie,
  inputEl,
  itemClass: 'autocomplete-items',
  itemActiveClass: 'autocomplete-active',
  onSubmitTag: searchNewsByTag,
});

const state = observe(
  {
    currentPage: 0,
    pageData: shortList,
    searchTerm: '',
  },
  { deep: false }
);

computed(() => {
  // Automatically re-render the list after page and data source changes
  const { currentPage, pageData } = state;
  const list = pageData.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );
  renderList(list);
});

computed(() => {
  const { searchTerm } = state;

  if (!searchTerm) {
    searchTitleEl.innerHTML = '';
  } else {
    searchTitleEl.innerHTML = `<h2>Search results for ${searchTerm}:</h2>`;
  }
});

function searchNewsByTag(tag) {
  inputEl.value = '';
  state.searchTerm = tag;
  state.pageData = newsMap.get(tag);
  state.currentPage = 0;
}

// Render the news list
function renderList(newsList) {
  const listContainer = document.querySelector('#news-list');
  listContainer.innerHTML = '';

  // Handle empty news list
  if (!newsList.length) {
    listContainer.innerHTML = '<div><p>Sorry, no results!</p></div>';
    return;
  }

  for (let i = 0; i < newsList.length; i++) {
    const itemFragment = document.createDocumentFragment();
    const itemContainer = document.createElement('div');

    itemContainer.innerHTML = `
    <div class="main-content">
      <div class="news-title">
        <h2>${newsList[i].title}</h2>
      </div>
      <img data-src="${newsList[i].pic}" class="news-preview-img lazy"/>
    </div>
    <div class="block-divider">
      <span class="date">${new Date(
        newsList[i].date
      ).toLocaleDateString()}</span>
      <span class="break-line"></span>
    </div>
    `;

    itemFragment.appendChild(itemContainer);
    listContainer.appendChild(itemFragment);
  }
  lazyLoad();
}

const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

computed(() => {
  const { currentPage, pageData } = state;

  // Hide pagination buttons when there's no data
  if (pageData.length === 0) {
    prevBtn.classList.add('hide');
    nextBtn.classList.add('hide');
  } else {
    prevBtn.classList.remove('hide');
    nextBtn.classList.remove('hide');
  }

  if (currentPage <= 0) {
    prevBtn.classList.add('hide');
  } else if (currentPage >= Math.floor(pageData.length / PAGE_SIZE)) {
    nextBtn.classList.add('hide');
  } else {
    prevBtn.classList.remove('hide');
    nextBtn.classList.remove('hide');
  }
});

prevBtn.addEventListener('click', () => {
  state.currentPage -= 1;
});

nextBtn.addEventListener('click', () => {
  state.currentPage += 1;
});

document.querySelector('.page-title').addEventListener('click', () => {
  state.pageData = wholeList;
  state.searchTerm = '';
  inputEl.value = '';
  state.currentPage = 0;
});

document.querySelector('#news-search').addEventListener('submit', function (e) {
  e.preventDefault();
  const val = inputEl.value;
  state.searchTerm = val;
  const res = tagsTrie.search(val);

  const searchRes = [];
  res.forEach((tag) => {
    searchRes.push(...newsMap.get(tag));
  });

  state.pageData = searchRes;
});

window.addEventListener('load', async (event) => {
  // Perform IO and CPU intensive computations
  // after the page is loaded to avoid blocking rendering
  const res = await import('./data/newsList.mjs');
  wholeList = res.default;
  // Index all news based on their tags
  // ! Notice: This is just for exercise purposes.
  // ! Usually we don't do this amount of calculations on the front end
  function iterate(list, processTask, continuation) {
    function handleOne(i, j, _continuation) {
      if (i < list.length) {
        const item = list[i];
        if (j < item.tags.length) {
          processTask(item, item.tags[j], function handleNext() {
            handleOne(i, j + 1, _continuation);
          });
        } else {
          handleOne(i + 1, 0, _continuation);
        }
      } else {
        _continuation();
      }
    }

    handleOne(0, 0, continuation);
  }

  function indexNews(item, tag, continuation) {
    if (!newsMap.has(tag)) {
      newsMap.set(tag, [item]);
    } else {
      newsMap.get(tag).push(item);
    }

    if (indexNews.skip++ % 400 === 0) {
      setTimeout(continuation, 0);
    } else {
      continuation();
    }
  }
  indexNews.skip = 0;

  iterate(wholeList, indexNews, () => {
    // TODO: Enable searching after indexing finishes
    console.log('done');
  });

  state.pageData = wholeList;
});
