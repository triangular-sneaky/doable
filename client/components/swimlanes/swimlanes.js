import { Subject, timer } from 'rxjs';
import { debounce } from 'rxjs/operators';
import ResizeObserver from 'resize-observer-polyfill';

// import { ResizeObserver as Polyfill } from 'resize-observer-polyfill';
// const ResizeObserver = window.ResizeObserver || Polyfill;
// const ResizeObserver = Polyfill;

const { calculateIndex, enableClickOnTouch } = Utils;



function currentListIsInThisSwimlane(swimlaneId) {
  const currentList = Lists.findOne(Session.get('currentList'));
  return currentList && (currentList.swimlaneId === swimlaneId || currentList.swimlaneId === '');
}

function currentCardIsInThisList(listId, swimlaneId) {
  const currentCard = Cards.findOne(Session.get('currentCard'));
  const currentUser = Meteor.user();
  if (currentUser && currentUser.profile.boardView === 'board-view-swimlanes')
    return currentCard && currentCard.listId === listId && currentCard.swimlaneId === swimlaneId;
  else // Default view: board-view-lists
    return currentCard && currentCard.listId === listId;
  // https://github.com/wekan/wekan/issues/1623
  // https://github.com/ChronikEwok/wekan/commit/cad9b20451bb6149bfb527a99b5001873b06c3de
  // TODO: In public board, if you would like to switch between List/Swimlane view, you could
  //       1) If there is no view cookie, save to cookie board-view-lists
  //          board-view-lists / board-view-swimlanes / board-view-cal
  //       2) If public user changes clicks board-view-lists then change view and
  //          then change view and save cookie with view value
  //          without using currentuser above, because currentuser is null.
}

function initSortable(boardComponent, $listsDom) {
  // We want to animate the card details window closing. We rely on CSS
  // transition for the actual animation.
  $listsDom._uihooks = {
    removeElement(node) {
      const removeNode = _.once(() => {
        node.parentNode.removeChild(node);
      });
      if ($(node).hasClass('js-card-details')) {
        $(node).css({
          flexBasis: 0,
          padding: 0,
        });
        $listsDom.one(CSSEvents.transitionend, removeNode);
      } else {
        removeNode();
      }
    },
  };

  $listsDom.sortable({
    tolerance: 'pointer',
    helper: 'clone',
    handle: '.js-list-header',
    items: '.js-list:not(.js-list-composer)',
    placeholder: 'list placeholder',
    distance: 7,
    start(evt, ui) {
      ui.placeholder.height(ui.helper.height());
      EscapeActions.executeUpTo('popup-close');
      boardComponent.setIsDragging(true);
    },
    stop(evt, ui) {
      // To attribute the new index number, we need to get the DOM element
      // of the previous and the following card -- if any.
      const prevListDom = ui.item.prev('.js-list').get(0);
      const nextListDom = ui.item.next('.js-list').get(0);
      const sortIndex = calculateIndex(prevListDom, nextListDom, 1);

      $listsDom.sortable('cancel');
      const listDomElement = ui.item.get(0);
      const list = Blaze.getData(listDomElement);

      Lists.update(list._id, {
        $set: {
          sort: sortIndex.base,
        },
      });

      boardComponent.setIsDragging(false);
    },
  });

  // ugly touch event hotfix
  enableClickOnTouch('.js-list:not(.js-list-composer)');

  function userIsMember() {
    return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
  }

  // Disable drag-dropping while in multi-selection mode, or if the current user
  // is not a board member
  boardComponent.autorun(() => {
    const $listDom = $listsDom;
    if ($listDom.data('sortable')) {
      $listsDom.sortable('option', 'disabled',
        MultiSelection.isActive() || !userIsMember());
    }
  });
}

BlazeComponent.extendComponent({
  onRendered() {
    const boardComponent = this.parentComponent();
    const $listsDom = this.$('.js-lists');

    if (!Session.get('currentCard')) {
      boardComponent.scrollLeft();
    }

    initSortable(boardComponent, $listsDom);
  },
  onCreated() {
    this.draggingActive = new ReactiveVar(false);

    this._isDragging = false;
    this._lastDragPositionX = 0;
  },

  id() {
    return this._id;
  },

  currentCardIsInThisList(listId, swimlaneId) {
    return currentCardIsInThisList(listId, swimlaneId);
  },

  currentListIsInThisSwimlane(swimlaneId) {
    return currentListIsInThisSwimlane(swimlaneId);
  },

  events() {
    return [{
      // Click-and-drag action
      'mousedown .board-canvas'(evt) {
        // Translating the board canvas using the click-and-drag action can
        // conflict with the build-in browser mechanism to select text. We
        // define a list of elements in which we disable the dragging because
        // the user will legitimately expect to be able to select some text with
        // his mouse.
        const noDragInside = ['a', 'input', 'textarea', 'p', '.js-list-header'];
        if ($(evt.target).closest(noDragInside.join(',')).length === 0 && this.$('.swimlane').prop('clientHeight') > evt.offsetY) {
          this._isDragging = true;
          this._lastDragPositionX = evt.clientX;
        }
      },
      'mouseup'() {
        if (this._isDragging) {
          this._isDragging = false;
        }
      },
      'mousemove'(evt) {
        if (this._isDragging) {
          // Update the canvas position
          this.listsDom.scrollLeft -= evt.clientX - this._lastDragPositionX;
          this._lastDragPositionX = evt.clientX;
          // Disable browser text selection while dragging
          evt.stopPropagation();
          evt.preventDefault();
          // Don't close opened card or inlined form at the end of the
          // click-and-drag.
          EscapeActions.executeUpTo('popup-close');
          EscapeActions.preventNextClick();
        }
      },
    }];
  },
}).register('swimlane');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Boards.findOne(Session.get('currentBoard'));
    this.isListTemplatesSwimlane = this.currentBoard.isTemplatesBoard() && this.currentData().isListTemplatesSwimlane();
    this.currentSwimlane = this.currentData();
  },

  // Proxy
  open() {
    this.childComponents('inlinedForm')[0].open();
  },

  events() {
    return [{
      submit(evt) {
        evt.preventDefault();
        const titleInput = this.find('.list-name-input');
        const title = titleInput.value.trim();
        if (title) {
          Lists.insert({
            title,
            boardId: Session.get('currentBoard'),
            sort: $('.list').length,
            type: (this.isListTemplatesSwimlane)?'template-list':'list',
            swimlaneId: (this.currentBoard.isTemplatesBoard())?this.currentSwimlane._id:'',
          });

          titleInput.value = '';
          titleInput.focus();
        }
      },
      'click .js-list-template': Popup.open('searchElement'),
    }];
  },
}).register('addListForm');

Template.swimlane.helpers({
  canSeeAddList() {
    return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
  },
});

BlazeComponent.extendComponent({
  currentCardIsInThisList(listId, swimlaneId) {
    return currentCardIsInThisList(listId, swimlaneId);
  },

  onCreated() {
    const qfController = QuickFilterController;
    this.squashMode = qfController.getDisplayMode();
  },

  onRendered() {
    const boardComponent = this.parentComponent();
    const $listsDom = this.$('.js-lists');

    if (!Session.get('currentCard')) {
      boardComponent.scrollLeft();
    }

    if (!Features.opinions.robustUX.listsSortableOnlyInSwimlane) {
      initSortable(boardComponent, $listsDom);
    }

    if (!Utils.isMiniScreen()) {
      this.driveListLayout();
    }

  },

  onDestroyed() {
    if (this._resizeObserver)
      this._resizeObserver.disconnect();
    if (this._heightSub)
      this._heightSub.unsubscribe();
  },

  driveListLayout() {
    const heightX  = new Subject();
    this._heightSub = heightX
      .pipe(
        debounce(_ => timer(500)))
      .subscribe(x => x.$$.height(x.height));
    this._resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const boxEl = entry.target;
        const dimensions = entry.contentRect;
        heightX.next({$$: $(boxEl).find(".list-body"), height: dimensions.height - 49});
      }
    });
    this._resizeObserver.observe(this.firstNode());
  },

  // squashMode() {
  //   return 'todo';
  // },

  todoListsOnly(lists) {
    return lists.map(x => x).filter(x => x.getSpecialListTag() != "special-list-done").reverse();
  },
}).register('listsGroup');
