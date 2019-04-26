Meteor.subscribe('user-admin');
Meteor.subscribe('boards');
Meteor.subscribe('setting');

Template.header.helpers({
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
    QuickFilter.filterCards(e.target.value);
  },

  'keydown #zz-quick-filter'(e) {
    if (e.key == "Escape") filter.blur();
  }

});
