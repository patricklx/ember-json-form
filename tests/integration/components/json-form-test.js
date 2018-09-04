import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';
import {render, click, settled} from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';


module('json-form', function (hooks) {
  setupRenderingTest(hooks);
  hooks.beforeEach(function () {

    this.set('globalOptions', {
      allowBlank() {
        return !this.get('options.presence');
      },
      allowString() {
        return this.get('_type') === 'number';
      }
    });

    this.set('onSubmit', (data) => {
      this.set('result', data);
    });

    this.set('onChange', (data) => {
      this.set('tmpData', data);
    });

    this.set('toggleProperty', Ember.Object.prototype.toggleProperty);
  });


  const template = hbs`
  {{#json-form
    globalOptions=globalOptions
    onSubmit=(action onSubmit)
    onChange=(action onChange)
    fieldsets=fieldsets
  as |Form|
}}
  <form class='form'>
  {{#Form.fieldsets as |Fieldset|}}
    <fieldset>
      {{#if Fieldset.self.legend}}
        <legend>
          {{Fieldset.self.legend}}
          <br>
          <small>{{Fieldset.self.sub-legend}}</small>
        </legend>
      {{/if}}

    {{#Fieldset.fields as |field|}}
      {{#field.input as |input|}}

        <div class='form-group'>

          {{#if field.self.label}}
            <label for='{{field.self.name}}'>{{field.self.label}}</label>
          {{/if}}

          {{input.component classNames=(concat 'form-control ' 'field-' field.self.id) errors=input.validation.messages}}

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
    {{/Fieldset.fields}}
    </fieldset>
  {{/Form.fieldsets}}
  
  <div id='form-didValidate'>{{if Form.self.validations.didValidate 'true' 'false'}}</div>
    
    {{#each form.self.validations.errors as |error|}}
      <div class='alert alert-danger'>
        <strong>{{error.attribute}} {{Form.self.fieldsets}}:</strong> {{error.message}}</div>
    {{/each}}
    
    {{#if Form.self.validations.isInvalid}}     
      <button class='first-button' onclick={{action toggleProperty 'checkValidations'}}>
      Toggle show validations
      </button>        
    {{else}}
        <button onclick={{action Form.onSubmit}}>Save</button>
    {{/if}}
  </form>
{{/json-form}}
  `;

  test('field with one validations', async function (assert) {

    assert.expect(7);

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

    await render(template);

    assert.equal(this.$('.text-danger').val(), undefined);

    this.$('.form-control').val('');
    this.$('.form-control').change();
    this.set('checkValidations', false);

    await settled();

    assert.ok(this.tmpData, 'should have tmpData');

    assert.equal(this.$('.text-danger').text(), '');
    assert.equal(this.$('.text-danger').length, 0, 'should not show an error');

    this.set('checkValidations', true);

    await settled();

    assert.equal(this.$('.form-control').val(), '', 'input is not empty');
    assert.equal(this.$('.text-danger').text(), 'This field can\'t be blank');
    assert.equal(this.$('.text-danger').length, 1, 'should show an error');
    this.set('checkValidations', false);
  });


  test('field with 2 validations and multiple configs', async function (assert) {

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

    await render(template);

    this.$('.form-control').val('a234');
    this.$('.form-control').change();

    await settled();

    assert.equal(this.$('.text-danger').text(), 'This field is too short (minimum is 5 characters)');
    assert.equal(this.$('.text-danger').length, 1, 'should show an error');


    await settled();
    this.$('.form-control').val('1234567891011');
    this.$('.form-control').change();


    await settled();
    assert.equal(this.$('.text-danger').text(), 'This field is too long (maximum is 10 characters)');
    assert.equal(this.$('.text-danger').length, 1, 'should show an error');

  });


  test('field should hide', async function (assert) {

    assert.expect(5);

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

    await render(template);

    this.$('.field-mynumberfied').val(1);
    this.$('.field-mynumberfied').change();

    await settled();
    assert.equal(this.$('.field-mynumberfied').length, 1, 'field not exists');
    assert.equal(this.$('.field-mynumberfied').val(), '1', 'val should be 1');
    assert.equal(this.$('.field-mytextfied').length, 0, 'field should not exist');


    await settled();
    this.$('.field-mynumberfied').val(5);
    this.$('.field-mynumberfied').change();


    await settled();
    assert.equal(this.$('.field-mynumberfied').val(), '5', 'val should be 5');
    assert.equal(this.$('.field-mytextfied').length, 1, 'field should exist');

  });
});
