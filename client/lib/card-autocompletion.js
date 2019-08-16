CardAutocompletion = {

  autocomplete: function($textarea, handlers) {

    handlers = handlers || {};

    $textarea.escapeableTextComplete([
      // Emoji
      {
        match: /\B:\s?([-+\w]*)$/,
        search(term, callback) {
          callback(Emoji.values.map((emoji) => ({emoji: emoji, index: emoji.indexOf(term)}))
            .filter(v => v.index != -1)
            .sort((a,b) => {
              if (a.index == 0 && b.index != 0) return -1;
              if (b.index == 0 && a.index != 0) return 1;
              // return a.emoji.localeCompare(b.emoji);
              return 1;
            })
            .map(x => x.emoji));
        },
        template(value) {
          const imgSrc = Emoji.baseImagePath + value;
          const image = `<img alt="${value}" class="emoji" src="${imgSrc}.png" />`;
          return image + value;
        },
        replace(value) {
          return `:${value}:`;
        },
        index: 1,
      },

      // User mentions
      {
        match: /\B@([\w.]*)$/,
        search(term, callback) {
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          callback($.map(currentBoard.activeMembers(), (member) => {
            const user = Users.findOne(member.userId);
            return user.username.toLowerCase().indexOf(term.toLowerCase()) === 0 ? user : null;
          }));
        },
        template(user) {
          return user.username;
        },
        replace(user) {
          if (handlers.user)
            return handlers.user(user);
          return `@${user.username}`;
        },
        index: 1,
      },
      // DueDate
      {
        match: /\B\/([\w\.]*)$/i,
        parseTerm(term, moments, withTime) {
          const m = withTime(moment(term, Features.opinions.dates.formats.date, true));
          if (m.isValid()) {
            moments.push(m);
            return;
          }
          // maybe its a date
          const date = parseInt(term);
          if (date) {
            const justDate = withTime( moment().date(date));
            const monthsOffset = moment().date() <= justDate.date() ? 0 : 1;
            if (justDate.isValid()) {
              for (var i = 0; i < 2; i++) {
                var d = justDate.clone().month(moment().month() + i + monthsOffset)
                if (d != m) {
                  moments.push(d);
                }
              }
            }
            return;
          }

          // maybe its a day?
          const day = withTime(moment().day(term));
          if (day.isValid()) {
            moments.push(day);
            moments.push(day.clone().add(7, 'd'));
            return;
          }

        },
        search(term, callback) {
          var moments = [];
          tod = moment(Features.opinions.dates.dayStartTime, Features.opinions.dates.formats.time);
          withTime = m => m.startOf('day').add(tod);
          if (term.length > 0) {
            this.parseTerm(term, moments, withTime);
          } else {
            now = withTime(moment());
            moments = [ now, now.clone().add(1, 'd'), now.clone().day(5), now.clone().day(7) ];
          }
          //moments = moments.map(m => m.tim)
          callback(moments);
        },
        template(date) {
          return `<span>${date.format(Features.opinions.dates.formats.date)}&nbsp</span><span class="altName">${date.calendar(null, {
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            nextWeek: 'dddd',
            lastDay: '[Yesterday]',
            lastWeek: '[Last] dddd',
            sameElse: function() {
              const diffDays = this.diff( moment(),"d");
              if (this.day() == 0 && diffDays < 7) {
                return 'dddd';
              } else if (diffDays > 6 && diffDays < 14)  return '[Next] dddd';
              else return 'dddd (LL)';
            }
          })}, ${date.clone().endOf('day').fromNow()}</span>`;
        },

        replace(date) {
          if (handlers.date)
            return handlers.date(date.toDate());
          return `/${date.format(Features.opinions.dates.formats.date)}`;
        },
        index: 1
      },
      // Labels
      {
        match: /\B[#№]([\S]*)$/i,
        search(term, callback) {
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          callback($.map(currentBoard.activeLabels(), (label) => {
            lterm = term.toLowerCase();
            if (label.name.toLowerCase().indexOf(lterm) > -1 ||
                label.color.toLowerCase().indexOf(lterm) > -1) {
              return label;
            }
            return null;
          }));
        },
        template(label) {
          return Blaze.toHTMLWithData(Template.autocompleteLabelLine, {
            label,
            hasNoName: !label.name,
            colorName: label.color,
            labelName: label.shortName || label.color,
          });
        },
        replace(label) {
          if (handlers.label)
            return handlers.label(label);
          return `#${label.shortName}`;
        },
        index: 1,
      },

      // Link
      {
        match: /\b(http[s]?:\/\/[^) ]*)\s?$/i,
        index: 1,
        search(term, callback) {
          let regex = /[\/\?.&#=]([^\/\?.&#=]+)/g;

          var r = [];
          let m;
          while ((m = regex.exec(term)) !== null) {
            if (m.index === regex.lastIndex) {
              regex.lastIndex++;
            }
            r = r.concat(m[1]);
          }

          var menu = r
            .sort((x, y) => - x.length + y.length)
            .slice(0, 5)
            .map(title => ({md: `[ ${title} ](${term})`, title: `'${title}' (as link)`}));

          callback(
            menu
          );
        },
        template: term => term.title,
        replace: term => term.md
      }
    ], {
      // When the autocomplete menu is shown we want both a press of both `Tab`
      // or `Enter` to validation the auto-completion. We also need to stop the
      // event propagation to prevent the card from submitting (on `Enter`) or
      // going on the next column (on `Tab`).
      onKeydown(evt, commands) {
        if (evt.keyCode === 9 || evt.keyCode === 13) {
          evt.stopPropagation();
          return commands.KEY_ENTER;
        }
        return null;
      },
    });
  }
};

Blaze.registerHelper('CardAutocompletion', CardAutocompletion);

