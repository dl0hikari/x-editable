/**
input like DIV DecorativeInput attribute

@class DecorativeInput
@extends abstractinput
@final
@example
<a href="#" id="username" data-type="text" data-pk="1">awesome</a>
<script>
$(function(){
    $('#username').editable({
        url: '/post',
        title: 'Enter username'
    });
});
</script>
**/
(function ($) {
    "use strict";

    var DecorativeInput = function (options) {
        this.init('decorativeInput', options, DecorativeInput.defaults);
    };

    $.fn.editableutils.inherit(DecorativeInput, $.fn.editabletypes.abstractinput);

    $.extend(DecorativeInput.prototype, {
        render: function() {
           // this.renderClear();
           this.setClass();
           this.setAttr('placeholder');
           this.computeInputWidth();
           this.blur();
        },

        activate: function() {
            if(this.$input.is(':visible')) {
                this.$input.focus();
//                if (this.$input.is('input,textarea') && !this.$input.is('[type="checkbox"],[type="range"],[type="number"],[type="email"]')) {
                if (this.$input.is('input,textarea') && !this.$input.is('[type="checkbox"],[type="range"]')) {
                    $.fn.editableutils.setCursorPosition(this.$input.get(0), this.$input.val().length);
                }

                if(this.toggleClear) {
                    this.toggleClear();
                }
            }
        },

        //render clear button
        renderClear:  function() {
           if (this.options.clear) {
               this.$clear = $('<span class="editable-clear-x"></span>');
               this.$input.after(this.$clear)
                          .css('padding-right', 24)
                          .keyup($.proxy(function(e) {
                              //arrows, enter, tab, etc
                              if(~$.inArray(e.keyCode, [40,38,9,13,27])) {
                                return;
                              }

                              clearTimeout(this.t);
                              var that = this;
                              this.t = setTimeout(function() {
                                that.toggleClear(e);
                              }, 100);

                          }, this))
                          .parent().css('position', 'relative');

               this.$clear.click($.proxy(this.clear, this));
           }
        },

        postrender: function() {
            /*
            //now `clear` is positioned via css
            if(this.$clear) {
                //can position clear button only here, when form is shown and height can be calculated
//                var h = this.$input.outerHeight(true) || 20,
                var h = this.$clear.parent().height(),
                    delta = (h - this.$clear.height()) / 2;

                //this.$clear.css({bottom: delta, right: delta});
            }
            */
        },

        //show / hide clear button
        toggleClear: function(e) {
            if(!this.$clear) {
                return;
            }

            var len = this.$input.val().length,
                visible = this.$clear.is(':visible');

            if(len && !visible) {
                this.$clear.show();
            }

            if(!len && visible) {
                this.$clear.hide();
            }
        },

        clear: function() {
           this.$clear.hide();
           this.$input.val('').focus();
        },

        // blur event submit data
        blur: function() {
            var that = this;
            this.$input.blur(function(e){
                // that.$form.submit($.proxy(this.submit, this))
                // when lost focus do submit event
                e.stopPropagation();
                e.preventDefault();
                that.$input.closest("form").submit();
            });
        },
        //
        computeInputWidth: function () {
            // console.log('computeInputWidth', this.input)
        }

    });

    DecorativeInput.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
        /**
        @property tpl
        @default <input type="text">
        **/
        tpl: '<input type="text" class="decorativeInput">',
        /**
        Placeholder attribute of input. Shown when input is empty.

        @property placeholder
        @type string
        @default null
        **/
        placeholder: null,

        /**
        Whether to show `clear` button

        @property clear
        @type boolean
        @default true
        **/
        clear: true
    });

    $.fn.editabletypes.decorativeInput = DecorativeInput;

}(window.jQuery));
