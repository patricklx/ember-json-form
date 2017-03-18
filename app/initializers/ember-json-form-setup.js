import Ember from 'ember';

var initialize = function(application) {
  Ember.TextSupport.reopen({
    _elementValueDidChange() {
      let r = this._super(...arguments);
      if (this.attrs.changed) {
        this.attrs.changed(this.element.value);
      }
      return r;
    }
  });

};

var SetupAllInitializer = {
  name: 'ember-json-form-setup',
  initialize: initialize
};

export {initialize};
export default SetupAllInitializer;
