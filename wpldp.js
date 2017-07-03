jQuery( document ).ready(function($) {
  $('input:radio[name="tax_input[ldp_container][]"]').click(function() {
      //TODO: Switch to a smooth AJAX call for changing the container, instead of reloading the page.
      // var value = $(this).val();
      // console.log('Radio button selected value: ', value);
      // console.log(store);
      // var firstLabel = $('#ldp_container-' + value).find('label')[0];
      // var newContainerName = firstLabel.innerText.toLowerCase();
      //
      // console.log(newContainerName);
      // store.render('#ldpform', containerName, undefined, undefined, newContainerName, 'ldp_');

      var form = $('#post');
      form.submit();
  });

  $('input').keypress(function(event) {
      if (event.which == 13) {
          event.preventDefault();
          $('#post').submit();
      }
  });
});

window.wpldpAdmin = function( store, options ) {

    this.options = options || {};
    this.store   = store;

    this.render = function render( div, objectIri, template, context, modelName, prefix ) {
        var objectIri = this.store.getIri(objectIri);
        var template = template ? template : this.store.mainTemplate;
        var context = context || this.store.context;
        var fields = modelName ? this.store.models[modelName].fields : null;
        var instance = this;

        this.store.get(objectIri).then(function(object) {
            if (fields) {
              fields.forEach( function(field) {
                if (field.name) {
                  var propertyName = field.name;
                } else if (field['data-property']) {
                  field.name = field['data-property'];
                }  else if (field['object-property']) {
                  field.name = field['object-property'];
                }

                if (prefix) {
                  propertyName = propertyName.replace(prefix, '');
                }

                if ( field.multiple == "true" ) {
                  if (object[field.name]) {
                    if ( Array.isArray(object[field.name])) {
                      field.fields = object[field.name];
                    } else {
                     field.fields = [ object[field.name] ];
                    }
                  } else {
                    field.fields = new Array();
                  }
                } else {
                  field.fieldValue = object[field.name];
                }
              });
            }
           if (typeof(template) == 'string' && template.substring(0, 1) == '#') {
             var element = $(template);
             if (element && typeof element.attr('src') !== 'undefined') {
               instance.getTemplateAjax(element.attr('src'), function(template) {
                 $(div).html(template({object: object}));
               });
             } else {
               template = Handlebars.compile(element.html());
               $(div).html(template({object: object}));
             }
           } else {
             template = Handlebars.compile(template);
             $(div).html(template({object: object}));
           }

        });
    }

     // Get handlebars templates via ajax
    this.getTemplateAjax = function getTemplateAjax( path, callback ) {
       var source, template;
       $.ajax({
           url: path,
           success: function (data) {
               source = data;
               template = Handlebars.compile(source);
               if (callback) callback(template);
           }
       });
    }

    // The partial definition for displaying a form field
    var fieldPartialTest = "{{#if '@id'}}{{#if name}}<input id='{{name}}' type='text' name='{{name}}' value='{{'@id'}}' />{{/if}}{{/if}}";
    Handlebars.registerPartial("LDPFieldTest", fieldPartialTest);

    // The partial definition for displaying a form field handling array values, with possibility to add a field dynamically
    var fieldDisplayPartial = "{{#if name}}<label for='{{name}}'>{{label}}</label><button class='button add-field-button' id='add-field-{{name}}' onclick='return store.addField(event);'>+</button>{{/if}}\
                             <div id='field-{{name}}'>\
                               {{#if fields}}\
                                 {{#each fields}}\
                                   {{> LDPFieldTest}}\
                                 {{/each}}\
                               {{else}} \
                                 <input id='{{name}}' type='text' placeholder='{{title}}' name='{{name}}' />\
                               {{/if}}\
                             </div>";
    Handlebars.registerPartial("ArrayFieldDisplay", fieldDisplayPartial);

    this.addField = function addField( event ) {
       var target_id = event.target.id.substring('add-'.length);

       var target_div = document.getElementById(target_id);
       var child_count = target_div.childElementCount + 1;
       var input = document.createElement('input');
       input.id = target_id.substring('field-'.length) + child_count;
       input.name = target_id.substring('field-'.length) + child_count;
       input.type = "text";
       target_div.appendChild(input);
       event.stopPropagation();
       return false;
    }

    // The partial definition for displaying a form field
    var fieldPartial = "{{#ifCond multiple 'true'}}{{> ArrayFieldDisplay }}\
                        {{else}}\
                          {{#if name}}<label for='{{name}}'>{{label}}</label>{{/if}} \
                          {{#ifCond type 'textarea'}} \
                            {{#if name}}<textarea id='{{name}}' name='{{name}}' rows='10'>{{#if fieldValue}}{{fieldValue}}{{/if}}</textarea><br/>{{/if}}\
                          {{else}}\
                            {{#ifCond type 'checkbox'}} \
                              {{#if name}}<input type='checkbox' name='{{name}}' id='{{name}}'/>{{/if}}\
                            {{else}}\
                              {{#ifCond type 'select'}} \
                                {{#if name}}<select id='{{name}}' name='{{name}}'>{{/if}}\
                                  {{#each options}}{{> LDPOptions fieldValue='{{fieldValue}}' }}{{/each}} \
                              {{else}} \
                                {{#ifCond type 'date'}} \
                                  {{#if name}}<input id='{{name}}' type='date' placeholder='YYYY-MM-DD' name='{{name}}' value='{{fieldValue}}' />{{/if}}\
                                {{else}} \
                                  {{#ifCond type 'url'}} \
                                    {{#if name}}<input id='{{name}}' type='url' placeholder='http://www.example.com' name='{{name}}' value='{{fieldValue}}' />{{/if}}\
                                  {{else}} \
                                    {{#ifCond type 'email'}} \
                                      {{#if name}}<input id='{{name}}' type='email' placeholder='contact@example.com' name='{{name}}' value='{{fieldValue}}' />{{/if}}\
                                    {{else}} \
                                      {{#ifCond type 'resource'}} \
                                      <input id='{{name}}' type='url' placeholder='http://www.example.com/ldp/resource/my-resource/' name='{{name}}' value='{{fieldValue}}' />\
                                       {{else}} \
                                         {{#if name}}<input id='{{name}}' type='text' placeholder='{{title}}' name='{{name}}' value='{{fieldValue}}' />{{/if}}\
                                       {{/ifCond}}\
                                     {{/ifCond}}\
                                  {{/ifCond}}\
                                {{/ifCond}}\
                              {{/ifCond}}\
                            {{/ifCond}}\
                          {{/ifCond}}\
                         {{/ifCond}}";
    Handlebars.registerPartial("LDPField", fieldPartial);

    // The partial definition for displaying an option field inside a select
    var optionPartial = "{{#ifCond value fieldValue}} \
                          <option value='{{value}}' selected>{{name}}</option>\
                        {{else}}\
                          <option value='{{value}}'>{{name}}</option>\
                        {{/ifCond}}";
    Handlebars.registerPartial("LDPOptions", optionPartial);

    var formTemplate = Handlebars.compile(
        "<form data-container='{{container}}' onSubmit='return store.handleSubmit(event);'> \
            {{#each fields}}{{> LDPField }}{{/each}} \
            <input type='submit' value='Post' /> \
        </form>");

    // if('partials' in options) {
    //   for(var partialName in options.partials) {
    //     var element = $(options.partials[partialName]);
    //     if (element.attr('src')) {
    //       registerPartialFromFile(partialName, element.attr('src'));
    //     } else {
    //       Handlebars.registerPartial(partialName, element.html());
    //     }
    //   }
    // }

    this.registerPartialFromFile = function registerPartialFromFile( partialName, partialTemplatePath ) {
        $.ajax({
            url: partialTemplatePath,
            success: function (data) {
                Handlebars.registerPartial(partialName, data);
            }
        });
    }

     Handlebars.registerHelper("ldpeach", function(array, tagName, options) {
         var id = "ldp-"+Math.round(new Date().getTime() + (Math.random() * 10000));
         var objects = Array.isArray(array) ? array : [array];
         objects.forEach(function(object) {
             this.store.get(object, this.store.context).then(function(object) {
                 $('#'+id).append(options.fn(object));
             }.bind(this));
         }.bind(this));
         return '<'+ tagName +' id="'+id+'"></' + tagName + '>';
     }.bind(this));

     Handlebars.registerHelper('ldplist', function(obj) {
         return obj['ldp:contains'];
     });

     Handlebars.registerHelper('ifCond', function(value, tester, options) {
       if (value == tester) {
         return options.fn(this);
       } else {
         return options.inverse(this);
       }
     });

     Handlebars.registerHelper('if', function(conditional, options) {
      if(conditional) {
        return options.fn(this);
      }
     });

     Handlebars.registerHelper('form', function(context, options) {
         return formTemplate(this.store.models[context]);
     }.bind(this));
};
