import { Subject, timer } from "rxjs";
import { debounce, distinctUntilChanged, map } from "rxjs/operators";

QuickFilter = {
  init() {
    getAllBodies = function(e) {
      return $(e)
        .text()
        .split("\n")
        .map(s => s.trim())
        .join("\n");
    };
    normalRegex = function(token) {
      return token ? new RegExp(token, "mi") : null;
    };
    searcherInAttributes = function(selector, projection) {
      return e =>
        $(e)
          .find(selector)
          .toArray()
          .map(projection)
          .join("\n");
    };
    this.commands = {
      "": [{ regex: normalRegex, target: getAllBodies }],
      "#": [
        { regex: token => normalRegex("#" + token), target: getAllBodies },
        {
          regex: normalRegex,
          target: searcherInAttributes(".minicard-label", x => x.title)
        }
      ],
      ":": [
        {
          regex: normalRegex,
          target: searcherInAttributes("img", e => e.title)
        }
      ],
      "@": [
        { regex: token => normalRegex("@" + token), target: getAllBodies },
        {
          regex: normalRegex,
          target: searcherInAttributes(".member", e => e.title)
        }
      ],
      "/": [
        { regex: token => normalRegex(" /" + token), target: getAllBodies },
        {
          regex: token => normalRegex(token !== "" ? token : "."),
          target: e => getAllBodies($(e).find(".dates"))
        }
      ],
      "!": [
        {
          regex: _ => normalRegex(" /|:o:|:fire:|:bulb:|⭕|🔥|💡"),
          target: searcherInAttributes("img", e => e.title)
        },
        {
          regex: term => (term !== "-/" ? normalRegex(".") : null),
          target: e => getAllBodies($(e).find(".dates .due-date"))
        }
      ],
      "//": [
        {
          regex: _ => normalRegex("."),
          target: e =>
            getAllBodies(
              $(e).find(
                ".dates .due-date.due, .dates .due-date.long-overdue, .dates .due-date.almost-due"
              )
            )
        }
      ],
      "*": [
        {
          regex: _ => normalRegex("."),
          target: e => getAllBodies($(e).filter(":not(.card-dimmed)"))
        }
      ]
    };

    this.commands["№"] = this.commands["#"];
    this.commands[" /"] = this.commands["/"];

    this.filterApply$
      .pipe(map(c => c || ""))
      .pipe(distinctUntilChanged())
      .subscribe(c => this.doFilterCards(c));

    this.filterExpression$
      .pipe(debounce(_ => timer(150)))
      .subscribe(this.filterApply$);


  },
  commandParser: /^(-?)([#№:@*!]|\/\/|(?:\s*\/))?(.*)$/i,

  filterExpression$: new Subject(),
  filterApply$: new Subject(),

  filterCards(c) {
    this.filterExpression$.next(c || "");
  },

  filterCardsImmediately(c) {
    this.filterApply$.next(c);
  },

  doFilterCards(c) {
    try {
      var parsed = this.commandParser.exec(c);
      if (parsed) {
        var modifier = parsed[1];
        var cmd = parsed[2];
        var term = parsed[3];

        var command = this.commands[cmd || ""] || [];

        var neg = modifier === "-";
        var targets = $(
          ".minicard-wrapper:not(:has(.filter-exempt)):not(.card-hidden)"
        );

        const commandRegexes = command.map(c => {
          try {
            return c.regex(term);
          } catch (e) {
            console.log(e);
            return null;
          }
        });
        targets.each((_, e) => {
          var applicableCommands = command
            .map((c, i) => ({ regex: commandRegexes[i], target: c.target(e) }))
            .filter(c => c.regex != null);
          var show = true;
          if (applicableCommands.length) {
            show = applicableCommands
              .map(c => c.target && c.regex.test(c.target))
              .reduce((a, b) => a || b, false);
          }
          if (neg) show = !show;
          if (show) $(e).show();
          else $(e).hide();
        });
      }


      let quickfilterDesc = null;
      if (parsed && c.trim())  {
        quickfilterDesc = {query: c};
      }
      Session.set("QuickFilter", quickfilterDesc);
    } catch (e) {
      console.log(e);
    }
  }
};


QuickFilterController = {


  setFilter(c) {
    this.lastFilter = c;
    QuickFilter.filterCards(c)
  },

  showFilter: new ReactiveVar(false),
  displayMode: new ReactiveVar('normal'),

  setDisplayMode(mode) {
    this.displayMode.set( mode);
    //this.reapplyFilter();
  },

  reapplyFilter() {
    var lf = this.lastFilter;
    Tracker.afterFlush(()=>QuickFilter.filterCardsImmediately(lf ));

  },

  getDisplayMode() {
    return this.displayMode;
  },

  toggleShow(){
    this.showFilter.set(! this.showFilter.get());
    if (!this.showFilter.get()) {
      this.setFilter("");
    }
  },

  init() {
    const _this = this;
    Tracker.autorun(() => {
      const list = Session.get('currentList');
      const mode = this.displayMode;
      if (list || mode != 'single') {
        Tracker.afterFlush(() =>
          _this.reapplyFilter());
      }



    });
    // $(document).on('click', '.list-body', e => this.reapplyFilter())
  }

};

QuickFilter.init();
QuickFilterController.init();
