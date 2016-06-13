import Ember from 'ember';
import {
  validator, buildValidations
} from 'ember-cp-validations';
import template from './template'

export default Ember.Component.extend({
  layout: template,

  iniData: null,
  fields: [],
  legend: null,

  form: Ember.computed('fields.[]', function () {
    var formSections = [];
    var validations = {};
    var fields = [];
    let sectionFields = this.get('fields');
    for (let i in sectionFields) {
      let field = sectionFields[i];
      if (!sectionFields.hasOwnProperty(i)) continue;
      field.label = field.name;
      field.name = field.name.replace(/ /g, '-');
      fields.push(field);
      let fieldName = field.name.replace(/ /g, '-');

      validations[fieldName] = [];
      for (let valid in field.validations) {
        if (!field.validations.hasOwnProperty(valid)) continue;
        let v = validator(valid, field.validations[valid]);
        validations[fieldName].push(v);
      }
    }


    let ValidationsMixin = buildValidations(validations);
    var Form = Ember.Object.extend(ValidationsMixin, {
      isFormInvalid: Ember.computed.not('validations.isValid'),

      legend: this.get('legend'),
      fields: fields
    });
    let data = this.get('iniData');
    let form = Form.create(Ember.getOwner(this).ownerInjection(), {});
    if (data) {
      for (let key of Object.keys(data)) {
        let value = data[key];
        form.set(key, value);
      }
    }
    return form;
  })
})
;
