import EventBus from './eventBus.mjs';
const noop = () => {};

export default function autocomplete({
  inputEl,
  dataSrc,
  itemClass = 'autocomplete-items',
  itemActiveClass = 'autocomplete-active',
  onSubmitTag = noop,
  onInput = noop,
  onKeyDown = noop,
  limit = 10,
}) {
  const REFOCUS = Symbol('refocus');

  let currentFocus = 0;

  inputEl.addEventListener('input', handleInput);
  inputEl.addEventListener('keydown', handleKeydown);

  function handleInput(e) {
    removeExistingList();
    const val = this.value;
    if (!val) {
      return false;
    }

    onInput(e);
    const match = dataSrc.search(val);
    if (match.length) {
      createHintList.call(this, match);
    }
  }

  function handleKeydown(e) {
    let list = document.getElementById(this.id + 'autocomplete-list');
    if (list) list = list.getElementsByTagName('div');

    onKeyDown(e);
    if (e.keyCode == 40) {
      // up
      EventBus.emit(REFOCUS, ++currentFocus);
    } else if (e.keyCode == 38) {
      // down
      EventBus.emit(REFOCUS, --currentFocus);
    } else if (e.keyCode == 13) {
      // enter
      e.preventDefault();
      if (currentFocus > -1) {
        if (list) list[currentFocus].click();
      }
    }
  }

  function createHintList(data) {
    data = data.slice(0, limit);
    removeExistingList();
    currentFocus = 0;

    const listFragment = document.createDocumentFragment();
    const listContainer = document.createElement('div');
    listContainer.setAttribute('id', this.id + 'autocomplete-list');
    listContainer.setAttribute('class', itemClass);
    listFragment.appendChild(listContainer);
    this.parentNode.appendChild(listFragment);

    data.forEach((item, index) => {
      const itemFragment = document.createDocumentFragment();
      const listItem = document.createElement('div');
      listItem.innerHTML = `${item}
            <input type="hidden" value=${item}>
          `;

      if (index === currentFocus) {
        listItem.classList.add(itemActiveClass);
      }
      listItem.addEventListener('click', onItemClick);
      listItem.addEventListener('mouseover', () => {
        EventBus.emit(REFOCUS, index);
      });
      itemFragment.appendChild(listItem);
      listContainer.appendChild(itemFragment);
    });

    EventBus.register(REFOCUS, (index) => {
      const { childNodes } = listContainer;
      if (childNodes.length) {
        removeActive(childNodes);
        currentFocus = index;
        addActive(childNodes);
      }
    });
  }

  function onItemClick() {
    const tag = this.getElementsByTagName('input')[0].value;

    onSubmitTag(tag);
    removeExistingList();
  }

  function addActive(list) {
    if (!list) return false;
    removeActive(list);
    if (currentFocus >= list.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = list.length - 1;

    list[currentFocus].classList.add(itemActiveClass);
  }

  function removeActive(list) {
    for (let i = 0; i < list.length; i++) {
      list[i].classList.remove(itemActiveClass);
    }
  }

  function removeExistingList(target) {
    document.querySelectorAll(`.${itemClass}`).forEach((item) => {
      if (target != item && target != inputEl) {
        item.parentNode.removeChild(item);
      }
    });

    EventBus.cancel(REFOCUS);
  }

  document.addEventListener('click', function (e) {
    removeExistingList(e.target);
  });
}
