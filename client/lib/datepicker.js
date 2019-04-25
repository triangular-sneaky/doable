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
      this.find('#date').value = Utils.dates.format(moment(evt.date));
      this.error.set('');
      this._submitDate(evt.date);
    }.bind(this));

    if (this.date.get().isValid()) {
      $picker.datepicker('update', this.date.get().toDate());
    }
    this.find('#date').select();
  },

  showDate() {
    if (this.date.get().isValid())
      return Utils.dates.format(this.date.get());
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

  _submitDate(date ) {
    this._storeDate(date);
    Popup.close();

  },
  _submit(evt) {
    // if no time was given, init with dayStartTime
    const time = Features.opinions.dates.dayStartTime;

    const dateString = `${evt.target.date.value} ${time}`;
    const newDate = moment(dateString, `${Features.opinions.dates.formats.date} ${Features.opinions.dates.formats.time}`, true);
    if (newDate.isValid()) {
      this._submitDate(newDate.toDate());
    }
    else if (evt.target.date.value === "") {
      this._deleteDate();
      Popup.close();
    } else {
      this.error.set('invalid-date');
      evt.target.date.focus();
    }

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
      'submit .edit-date'(evt) {
        evt.preventDefault();
        this._submit(evt);
      },
      'click .js-delete-date'(evt) {
        evt.preventDefault();
        this._deleteDate();
        Popup.close();
      },
    }];
  },
});
