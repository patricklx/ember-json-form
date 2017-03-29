import {moduleForComponent, test} from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import startApp from '../../helpers/start-app';

let application;

moduleForComponent('json-form', 'Integration | Component | json form', {
  integration: true,
  beforeEach: function() {
    Ember.run(function() {
      application = startApp();
    });

    this.set('globalOptions', {
      allowBlank() {
        console.log('options.presence', this.get('options.presence'));
        return !this.get('options.presence');
      },
      allowString() {
        return this.get('_type') === 'number';
      }
    });

    this.on('onSubmit', function (data) {
      this.set('result', data);
    });

    this.on('onChange', function () {

    });

    this.set('toggleProperty', Ember.Object.prototype.toggleProperty);
  }
});

const template = hbs`
  {{#json-form
    globalOptions=globalOptions
    onSubmit=(action 'onSubmit')
    onChange=(action 'onChange')
    fieldsets=fieldsets
  as |form|
}}
  <form class='form'>
  {{#form.fieldsets as |fieldset|}}
    <fieldset>
      {{#if fieldset.self.legend}}
        <legend>
          {{fieldset.self.legend}}
          <br>
          <small>{{fieldset.self.sub-legend}}</small>
        </legend>
      {{/if}}

    {{#fieldset.fields as |field|}}
      {{#field.input as |input|}}

        <div class='form-group'>

          {{#if field.self.label}}
            <label for='{{field.self.name}}'>{{field.self.label}}</label>
          {{/if}}

          {{input.component classNames='form-control' id=(concat 'field-' field.self.id) errors=input.validation.messages}}

          {{#if input.validation.isValidating}}
            <p class='text-info'>validating...</p>
          {{/if}}

          {{#if input.showMessage}}
            {{#each input.validation.messages as |message|}}
            <div class='text-danger'>{{message}}</div>
            {{/each}}
          {{/if}}
          
          {{#if checkValidations}}
            {{#each input.validation.messages as |message|}}
            <div class='text-danger'>{{message}}</div>
            {{/each}}
          {{/if}}

        </div>
      {{/field.input}}
    {{/fieldset.fields}}
    </fieldset>
  {{/form.fieldsets}}
  
  <div id='form-didValidate'>{{if form.self.validations.didValidate 'true' 'false'}}</div>
    
    {{#each form.self.validations.errors as |error|}}
      <div class='alert alert-danger'>
        <strong>{{error.attribute}} {{form.self.fieldsets}}:</strong> {{error.message}}</div>
    {{/each}}
    
    {{#if form.self.validations.isInvalid}}     
      <button class='first-button' onclick={{action toggleProperty 'checkValidations'}}>
      Toggle show validations
      </button>        
    {{else}}
        <button onclick={{action form.onSubmit}}>Save</button>
    {{/if}}
  </form>
{{/json-form}}
  `;

test('field with one validations', function (assert) {

  assert.expect(5);

  this.set('fieldsets', [{
    id: 'fieldset1',
    fields: [{
      id: 'mytextfied',
      label: 'mytextfied',
      type: 'number',
      validations: {
        presence: true
      }
    }]
  }]);

  this.render(template);

  this.$('.form-control').val('');
  this.$('.form-control').change();

  wait().then(() => {
    assert.equal(this.$('.text-danger').text(), '');
    assert.equal(this.$('.text-danger').length, 0, 'should not show an error');
  });

  return wait().then(() => {
    this.set('checkValidations', true);
    assert.equal(this.$('.form-control').val(), '', 'input is not empty');
    assert.equal(this.$('.text-danger').text(), 'This field can\'t be blank');
    assert.equal(this.$('.text-danger').length, 1, 'should show an error');
    this.set('checkValidations', false);
  });
});


test('field with 2 validations and multiple configs', function (assert) {

  assert.expect(4);

  this.set('fieldsets', [{
    id: 'fieldset1',
    fields: [{
      id: 'mytextfied',
      label: 'mytextfied',
      type: 'text',
      validations: {
        presence: true,
        length: {
          min: 5,
          max: 10
        }
      }
    }]
  }]);

  this.render(template);

  this.$('.form-control').val('a234');
  this.$('.form-control').change();

  wait().then(() => {
    assert.equal(this.$('.text-danger').text(), 'This field is too short (minimum is 5 characters)');
    assert.equal(this.$('.text-danger').length, 1, 'should show an error');
  });

  wait().then(() => {
    this.$('.form-control').val('1234567891011');
    this.$('.form-control').change();
  });

  return wait().then(() => {
    assert.equal(this.$('.text-danger').text(), 'This field is too long (maximum is 10 characters)');
    assert.equal(this.$('.text-danger').length, 1, 'should show an error');
  });
});


test('field should hide', function (assert) {

  assert.expect(2);

  this.set('fieldsets', [{
    id: 'fieldset1',
    fields: [
      {
        id: 'mynumberfied',
        label: 'mynumberfied',
        type: 'number'
      },
      {
        id: 'mytextfied',
        label: 'mytextfied',
        type: 'text',
        only_if: {
          'fieldset1.mynumberfied': 'eq:5'
        }
      }
    ]
  }]);

  this.render(template);

  this.$('#field-mynumberfied').val(1);
  this.$('#field-mynumberfied').change();

  wait().then(() => {
    assert.equal(this.$('#field-mytextfied').length, 0, 'field should not exist');
  });
  
  wait().then(() => {
    this.$('#field-mynumberfied').val(5);
    this.$('#field-mynumberfied').change();
  });

  return wait().then(() => {
    assert.equal(this.$('#field-mytextfied').length, 1, 'field should not exist');
  });
});
