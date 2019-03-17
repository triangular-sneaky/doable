Features = {
  opinions : {
    preferHideFilter: true,
    robustUX: {
      listsSortableOnlyInSwimlane: true,
      compactScreenInMobile: true,
      hideMobileSidebar: true,
    },
    specialCards: {
      special: /[-]{3}/,
      listSeparator: /[-]{4}/
    },
    specialLists: {
      done: /done/i,
      now: /today/i
    },
    focus: {
      assignToFocusedUser : true,
      labelSelectors: {
        private: /-/i,
        shared: /\+/i,
      },
      cardSelectors: {
        waiting: /^\.\./i
      }
    },
    dates: {
      formats: {
        date: 'D.M',
        time: 'H:mm'
      },
      dayStartTime: '2:00'
    }
  },
  queryParamExtensions : {
    focus: true
  }
};
