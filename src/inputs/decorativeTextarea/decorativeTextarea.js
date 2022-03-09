/**
Textarea input

@class DecorativeTextarea
@extends abstractinput
@final
@example
<a href="#" id="comments" data-type="textarea" data-pk="1">awesome comment!</a>
<script>
$(function(){
    $('#comments').editable({
        url: '/post',
        title: 'Enter comments',
        rows: 10
    });
});
</script>
**/
(function ($) {
    "use strict";

    var DecorativeTextarea = function (options) {
        this.init('textarea', options, DecorativeTextarea.defaults);
    };

    $.fn.editableutils.inherit(DecorativeTextarea, $.fn.editabletypes.abstractinput);

    $.extend(DecorativeTextarea.prototype, {
        render: function () {
            this.setClass();
            this.setAttr('placeholder');
            this.setAttr('rows');
            this.blur();

            //enter do submit. shift + enter br edited by alex 2022.3.8
            this.$input.keydown(function (e) {
                if(e.shiftKey && e.which === 13) {
                    return;
                }

                if (e.which === 13) {
                    $(this).closest('form').submit();
                }

            });
        },

       //using `white-space: pre-wrap` solves \n  <--> BR conversion very elegant!
       /*
       value2html: function(value, element) {
            var html = '', lines;
            if(value) {
                lines = value.split("\n");
                for (var i = 0; i < lines.length; i++) {
                    lines[i] = $('<div>').text(lines[i]).html();
                }
                html = lines.join('<br>');
            }
            $(element).html(html);
        },

        html2value: function(html) {
            if(!html) {
                return '';
            }

            var regex = new RegExp(String.fromCharCode(10), 'g');
            var lines = html.split(/<br\s*\/?>/i);
            for (var i = 0; i < lines.length; i++) {
                var text = $('<div>').html(lines[i]).text();

                // Remove newline characters (\n) to avoid them being converted by value2html() method
                // thus adding extra <br> tags
                text = text.replace(regex, '');

                lines[i] = text;
            }
            return lines.join("\n");
        },
         */
        activate: function() {
            $.fn.editabletypes.text.prototype.activate.call(this);
        },
        blur: function() {
            var that = this;
            this.$input.blur(function(e){
                // that.$form.submit($.proxy(this.submit, this))
                // when lost focus do submit event
                e.stopPropagation();
                e.preventDefault();
                that.$input.closest("form").submit();
            });
        }
    });

    DecorativeTextarea.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
        /**
        @property tpl
        @default <textarea></textarea>
        **/
        tpl:'<textarea class="decorativeTextarea"></textarea>',
        /**
        @property inputclass
        @default input-large
        **/
        inputclass: 'input-large',
        /**
        Placeholder attribute of input. Shown when input is empty.

        @property placeholder
        @type string
        @default null
        **/
        placeholder: null,
        /**
        Number of rows in textarea

        @property rows
        @type integer
        @default 7
        **/
        rows: 7,

    });

    $.fn.editabletypes.decorativeTextarea = DecorativeTextarea;

}(window.jQuery));
