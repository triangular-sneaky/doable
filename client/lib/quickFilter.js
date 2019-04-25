import { Subject, timer } from 'rxjs';
import { debounce } from 'rxjs/operators';

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
      { regex: token => normalRegex(" /" + token), target: getAllBodies},
      { regex: token => normalRegex(token !== "" ? token : "."), target: e => getAllBodies($(e).find(".dates")) }
    ],
    "!": [
      { regex: _ => normalRegex(" /|:o:|:fire:|:bulb:"), target: searcherInAttributes("img", e => e.title) },
      { regex: term => term !== "-/" ? normalRegex(".") : null, target: e => getAllBodies($(e).find(".dates .due-date")) }
    ],
    "//": [
      { regex: _ => normalRegex("."), target: e => getAllBodies($(e).find(".dates .due-date.due, .dates .due-date.long-overdue, .dates .due-date.almost-due")) }
    ],
    "*": [
      { regex: _ => normalRegex("."), target: e => getAllBodies($(e).filter(':not(.card-dimmed)')) }
    ]
  };

  this.commands["№"] = this.commands["#"];
  this.commands[" /"] = this.commands["/"];

  this.filterExpression$.pipe(
    debounce(_ => timer(150))
  ).subscribe(c => this.doFilterCards(c));
},
  commandParser: /^(-?)([#№:@*!]|\/\/|(?:\s*\/))?(.*)$/i,

  filterExpression$: new Subject(),

  filterCards(c) {
    this.filterExpression$.next(c);
  },

  doFilterCards(c) {
    var parsed = this.commandParser.exec(c);
    if (parsed) {
      var modifier = parsed[1];
      var cmd = parsed[2];
      var term = parsed[3];

      var command = this.commands[cmd || ""] || [];

      var neg = modifier === "-";
      var targets = $(".minicard-wrapper:not(:has(.filter-exempt)):not(.card-hidden)");
      targets.each((_, e) => {
        var applicableCommands = command
          .map(c => ({ regex: c.regex(term), target: c.target(e) }))
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
  }

};

QuickFilter.init();

