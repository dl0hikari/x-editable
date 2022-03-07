/*
Editableform based on Twitter Bootstrap 3
*/
(function ($) {
    "use strict";

    //store parent methods
    var pInitInput = $.fn.editableform.Constructor.prototype.initInput;

    $.extend($.fn.editableform.Constructor.prototype, {
        initTemplate: function() {
            this.$form = $($.fn.editableform.template);
            this.$form.find('.control-group').addClass('form-group');
            this.$form.find('.editable-error-block').addClass('help-block');
        },
        initInput: function() {
            pInitInput.apply(this);

            var emptyInputClass = this.input.options.inputclass === null || this.input.options.inputclass === false;
            var defaultClass = 'form-control-sm';

            //bs3 add `form-control` class to standard inputs
            var stdtypes = 'text,select,textarea,password,email,url,tel,number,range,time,typeaheadjs'.split(',');
            if(~$.inArray(this.input.type, stdtypes)) {
                this.input.$input.addClass('form-control');
                if(emptyInputClass) {
                    this.input.options.inputclass = defaultClass;
                    this.input.$input.addClass(defaultClass);
                }
            }

            //apply size class also to buttons (to fit size of control)
            var $btn = this.$form.find('.editable-buttons');
            var classes = emptyInputClass ? [defaultClass] : this.input.options.inputclass.split(' ');
            for(var i=0; i<classes.length; i++) {
                // `btn-sm` is default now
                /*
                if(classes[i].toLowerCase() === 'input-sm') {
                    $btn.find('button').addClass('btn-sm');
                }
                */
                if(classes[i].toLowerCase() === 'input-lg') {
                    $btn.find('button').removeClass('btn-sm').addClass('btn-lg');
                }
            }

        },
        /**
         Renders editableform

         @method render
         **/
        render: function() {
            //init loader
            this.$loading = $($.fn.editableform.loading);
            this.$div.empty().append(this.$loading);

            //init form template and buttons
            this.initTemplate();
            if(this.options.showbuttons && this.options.type !== 'decorativeInput') {
                this.initButtons();
            } else {
                this.$form.find('.editable-buttons').remove();
            }

            //show loading state
            this.showLoading();

            //flag showing is form now saving value to server.
            //It is needed to wait when closing form.
            this.isSaving = false;

            /**
             Fired when rendering starts
             @event rendering
             @param {Object} event event object
             **/
            this.$div.triggerHandler('rendering');

            //init input
            this.initInput();

            //append input to form
            this.$form.find('div.editable-input').append(this.input.$tpl);

            //append form to container
            this.$div.append(this.$form);

            //set div and children css style  added by Alex
            this.$form.find('editable-container').attr({style: 'width: 100%'});

            //render input
            $.when(this.input.render())
                .then($.proxy(function () {
                    //setup input to submit automatically when no buttons shown
                    if(!this.options.showbuttons) {
                        this.input.autosubmit();
                    }

                    //attach 'cancel' handler
                    this.$form.find('.editable-cancel').click($.proxy(this.cancel, this));

                    if(this.input.error) {
                        this.error(this.input.error);
                        this.$form.find('.editable-submit').attr('disabled', true);
                        this.input.$input.attr('disabled', true);
                        //prevent form from submitting
                        this.$form.submit(function(e){ e.preventDefault(); });
                    } else {
                        this.error(false);
                        this.input.$input.removeAttr('disabled');
                        this.$form.find('.editable-submit').removeAttr('disabled');
                        var value = (this.value === null || this.value === undefined || this.value === '') ? this.options.defaultValue : this.value;
                        this.input.value2input(value);
                        //attach submit handler
                        this.$form.submit($.proxy(this.submit, this));
                    }

                    /**
                     Fired when form is rendered
                     @event rendered
                     @param {Object} event event object
                     **/
                    this.$div.triggerHandler('rendered');

                    this.showForm();

                    //call postrender method to perform actions required visibility of form
                    if(this.input.postrender) {
                        this.input.postrender();
                    }
                }, this));

            // Only the type is decorativeInput,  set $div & $form & $input css style  fixed by alex 2022.3.5
            if(this.options && this.options.type === 'decorativeInput') {
                this.$div.css({'width': '100%'})
                    .parent().css({'width': '100%'});

                this.$form.find('.form-group, .editable-input, .decorativeInput').css({'width': '100%'});
            }
        },

        submit: function(e) {
            e.stopPropagation();
            e.preventDefault();

            //get new value from input
            var newValue = this.input.input2value();

            //validation: if validate returns string or truthy value - means error
            //if returns object like {newValue: '...'} => submitted value is reassigned to it
            var error = this.validate(newValue);
            // a new attribute validateError store errorMsg
            window.validateError = error;

            if ($.type(error) === 'object' && error.newValue !== undefined) {
                newValue = error.newValue;
                this.input.value2input(newValue);
                if(typeof error.msg === 'string') {
                    this.error(error.msg);
                    this.showForm();
                    return;
                }
            } else if (error) {
                this.error(error);
                this.showForm();
                return;
            }

            //if value not changed --> trigger 'nochange' event and return
            /*jslint eqeq: true*/
            if (!this.options.savenochange && this.input.value2str(newValue) === this.input.value2str(this.value)) {
                /*jslint eqeq: false*/
                /**
                 Fired when value not changed but form is submitted. Requires savenochange = false.
                 @event nochange
                 @param {Object} event event object
                 **/
                this.$div.triggerHandler('nochange');
                return;
            }

            //convert value for submitting to server
            var submitValue = this.input.value2submit(newValue);

            this.isSaving = true;

            //sending data to server
            $.when(this.save(submitValue))
                .done($.proxy(function(response) {
                    this.isSaving = false;

                    //run success callback
                    var res = typeof this.options.success === 'function' ? this.options.success.call(this.options.scope, response, newValue) : null;

                    //if success callback returns false --> keep form open and do not activate input
                    if(res === false) {
                        this.error(false);
                        this.showForm(false);
                        return;
                    }

                    //if success callback returns string -->  keep form open, show error and activate input
                    if(typeof res === 'string') {
                        this.error(res);
                        this.showForm();
                        return;
                    }

                    //if success callback returns object like {newValue: <something>} --> use that value instead of submitted
                    //it is useful if you want to chnage value in url-function
                    if(res && typeof res === 'object' && res.hasOwnProperty('newValue')) {
                        newValue = res.newValue;
                    }

                    //clear error message
                    this.error(false);
                    this.value = newValue;
                    /**
                     Fired when form is submitted
                     @event save
                     @param {Object} event event object
                     @param {Object} params additional params
                     @param {mixed} params.newValue raw new value
                     @param {mixed} params.submitValue submitted value as string
                     @param {Object} params.response ajax response

                     @example
                     $('#form-div').on('save'), function(e, params){
                    if(params.newValue === 'username') {...}
                });
                     **/
                    this.$div.triggerHandler('save', {newValue: newValue, submitValue: submitValue, response: response});
                }, this))
                .fail($.proxy(function(xhr) {
                    this.isSaving = false;

                    var msg;
                    if(typeof this.options.error === 'function') {
                        msg = this.options.error.call(this.options.scope, xhr, newValue);
                    } else {
                        msg = typeof xhr === 'string' ? xhr : xhr.responseText || xhr.statusText || 'Unknown error!';
                    }

                    this.error(msg);
                    this.showForm();
                }, this));
        },


        error: function(msg) {
            var $group = this.$form.find('.control-group'),
                $block = this.$form.find('.editable-error-block'),
                lines;

            if(msg === false) {
                $group.removeClass($.fn.editableform.errorGroupClass);
                $block.removeClass($.fn.editableform.errorBlockClass).empty().hide();
            } else {
                //convert newline to <br> for more pretty error display

                // Only the type is DecorativeInput, add additional css.  fixed by alex 2022.3.4
                $block.css({lineHeight: '14px', margin: '0 0 10px 0'});

                if(msg) {
                    lines = (''+msg).split('\n');
                    for (var i = 0; i < lines.length; i++) {
                        lines[i] = $('<div>').text(lines[i]).html();
                    }
                    msg = lines.join('<br>');
                }
                $group.addClass($.fn.editableform.errorGroupClass);
                $block.addClass($.fn.editableform.errorBlockClass).html(msg).show();
            }
        }
    });

    //buttons
    $.fn.editableform.buttons =
      '<button type="submit" class="btn btn-primary btn-sm editable-submit">'+
        '<i class="fa fa-check" aria-hidden="true"></i>'+
      '</button>'+
      '<button type="button" class="btn btn-default btn-sm editable-cancel">'+
        '<i class="fa fa-times" aria-hidden="true"></i>'+
      '</button>';

    //error classes
    $.fn.editableform.errorGroupClass = 'has-error';
    $.fn.editableform.errorBlockClass = null;
    //engine
    $.fn.editableform.engine = 'bs4';
}(window.jQuery));
