DatePicker = BlazeComponent.extendComponent({
  template() {
    return 'datepicker';
  },

  onCreated() {
    this.error = new ReactiveVar('');
    this.card = this.data();
    this.date = new ReactiveVar(moment.invalid());
  },

  onRendered() {
    const $picker = this.$('.js-datepicker').datepicker({
      todayHighlight: true,
      todayBtn: 'linked',
      language: TAPi18n.getLanguage(),
      weekStart: 1
    }).on('changeDate', function(evt) {
      this.find('#date').value = moment(evt.date).format(Features.opinions.dates.formats.date);
      this.error.set('');
      this.find('#time').focus();
    }.bind(this));

    if (this.date.get().isValid()) {
      $picker.datepicker('update', this.date.get().toDate());
    }
    this.find('#date').select();
  },

  showDate() {
    if (this.date.get().isValid())
      return this.date.get().format(Features.opinions.dates.formats.date);
    return '';
  },
  showTime() {
    if (this.date.get().isValid())
      return this.date.get().format(Features.opinions.dates.formats.time);
    return '';
  },
  dateFormat() {
    return moment.localeData().longDateFormat(Features.opinions.dates.formats.date);
  },
  timeFormat() {
    return moment.localeData().longDateFormat(Features.opinions.dates.formats.time);
  },

  events() {
    return [{
      'keyup .js-date-field'() {
        // parse for localized date format in strict mode
        const dateMoment = moment(this.find('#date').value, Features.opinions.dates.formats.date, true);
        if (dateMoment.isValid()) {
          this.error.set('');
          this.$('.js-datepicker').datepicker('update', dateMoment.toDate());
        }
      },
      'keyup .js-time-field'() {
        // parse for localized time format in strict mode
        const dateMoment = moment(this.find('#time').value, Features.opinions.dates.formats.time, true);
        if (dateMoment.isValid()) {
          this.error.set('');
        }
      },
      'submit .edit-date'(evt) {
        evt.preventDefault();

        // if no time was given, init with 12:00
        const time = evt.target.time.value || moment(new Date().setHours(12, 0, 0)).format(Features.opinions.dates.formats.time);

        const dateString = `${evt.target.date.value} ${time}`;
        const newDate = moment(dateString, `${Features.opinions.dates.formats.date} ${Features.opinions.dates.formats.time}`, true);
        if (newDate.isValid()) {
          this._storeDate(newDate.toDate());
          Popup.close();
        }
        else if (evt.target.date.value === "") {
          this._deleteDate();
          Popup.close();
        } else {
          this.error.set('invalid-date');
          evt.target.date.focus();
        }
      },
      'click .js-delete-date'(evt) {
        evt.preventDefault();
        this._deleteDate();
        Popup.close();
      },
    }];
  },
});
