Meteor.subscribe('user-admin');
Meteor.subscribe('boards');
Meteor.subscribe('setting');


Template.header.helpers({

  showFilter() {
    return QuickFilterController.showFilter;
  },

  wrappedHeader() {
    return !Session.get('currentBoard');
  },

  currentSetting() {
    return Settings.findOne();
  },

  hideLogo() {
    return Utils.isMiniScreen() && Session.get('currentBoard');
  },

  compactScreen() {
    return Utils.isMiniScreen() && Features.opinions.robustUX.compactScreenInMobile;
  },

  appIsOffline() {
    return !Meteor.status().connected;
  },

  hasAnnouncement() {
    const announcements =  Announcements.findOne();
    return announcements && announcements.enabled;
  },

  announcement() {
    $('.announcement').show();
    const announcements =  Announcements.findOne();
    return announcements && announcements.body;
  },

});

Template.header.events({
  'click .js-create-board': Popup.open('headerBarCreateBoard'),
  'click .js-close-announcement'() {
    $('.announcement').hide();
  },
  'click .js-select-list'() {
    Session.set('currentList', this._id);
    Session.set('currentCard', null);
  },
  'click .js-open-search-view'() {
    Sidebar.setView('search');
  },

  'input #zz-quick-filter'(e) {
    QuickFilterController.setFilter(e.target.value);
  },

  'keydown #zz-quick-filter'(e) {
    if (e.key == "Escape") e.target.blur();
  },

  'click .js-toggle-squash-mode': Popup.open('minisreenListsDisplayMode'),

  'click .js-open-quick-search'() {
    QuickFilterController.toggleShow();
    const c = this;
    if (QuickFilterController.showFilter.get()) {
      //Tracker.afterFlush(() => c.find('#zz-quick-filter').focus());
    }
  }


});

BlazeComponent.extendComponent({
  displayMode() {
    return QuickFilterController.getDisplayMode();
  },

  toggled() {
    return Session.get("currentList") == null &&
      this.currentData() == displayMode().get();
  },


  events() {
    return [{
       'click .js-select-displaymode'() {
        const level = this.currentData();
        QuickFilterController.setDisplayMode(level);
        Session.set("currentList", null);
        Popup.close();
      },
    }];
  },
}).register('minisreenListsDisplayModePopup');
