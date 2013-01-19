/*jshint strict:true, undef:true, noarg:true, immed:true, trailing:true, expr:true, maxlen:120*/
/*global browser:true, console:true, $:true, _:true, module:true*/

// rollout.js
// version : 0.0.1
// author : Jamie Rolfs
// license : MIT
// github.com/jrolfs/rolloutjs

(function(window) {
    'use strict';

    var Rollout = function (target, triggerEl, options) {
        this.target = target;
        this.triggerEl = triggerEl;
        
        this.$target = $(target);
        this.$triggerEl = triggerEl && $(triggerEl);
        
        this.options = $.extend({
            threshold: 100,
            delay: 2000,
            exitOnClick: true
        }, options);

        this.mouseX = 0;
        this.mouseY = 0;

        // Private

        _[this] = {};

        _[this].timeout = null;

        for (var method in _private) {
            _[this][method] = $.proxy(_private[method], this);
        }

        // Mix-in jQuery for Event capabilities
        $.extend(this, $.event);
    };

    /**
     * Start monitoring rollout status
     *
     * @return undefined
     */
    Rollout.prototype.start = function () {
        $(document.body).mousemove(_[this].onBodyMouseMove);

        if (this.options.exitOnClick) {
            $(document.body).mousedown(_[this].onBodyMouseDown);
        }
    };

    /**
     * Stop monitoring rollout status
     *
     * @return undefined
     */
    Rollout.prototype.stop = function () {
        $(document.body).off('mousemove', _[this].onBodyMouseMove);

        if (this.options.exitOnClick) {
            $(document.body).off('mousedown', _[this].onBodyMouseDown);
        }

        this.reset();
    };

    /**
     * Reset rollout timeout
     *
     * @return undefined
     */
    Rollout.prototype.reset = function () {
        clearTimeout(_[this].timeout);
        _[this].timeout = null;
    };

    /**
     * Stop monitoring rollout status and dispatch exit event
     *
     * @return undefined
     */
    Rollout.prototype.exit = function (properties) {
        this.stop();

        var event = new $.Event('exit', $.extend({
            target: this,
            relatedTarget: this.target,
            pageX: this.mouseX,
            pageY: this.mouseY
        }, properties));

        this.trigger(event);
    };

    /**
     * Check whether the mouse is with in the target element
     *
     * @param  {Boolean} includeThreshold Whether to consider threshold boundary
     * @return {Boolean}
     */
    Rollout.prototype.inTarget = function (includeThreshold) {
        return _[this].isWithin(this.$target, includeThreshold && this.options.threshold);
    };

    /**
     * Check whether the mouse is with in the trigger element
     *
     * @param  {Boolean} includeThreshold Whether to consider threshold boundary
     * @return {Boolean}
     */
    Rollout.prototype.inTrigger = function (includeThreshold) {
        if (!this.triggerEl) throw new Error('Rollout: no trigger element was supplied');
        return _[this].isWithin(this.$triggerEl, includeThreshold && this.options.threshold);
    };


    // ---------- Private ----------

    var _private = {
    
        //
        // -------------------- Control --------------------
        //

        isWithin: function ($el, threshold) {

            threshold = threshold || 0;

            var offset = $el.offset();

            if (this.mouseX > offset.left - threshold &&
                this.mouseY > offset.top - threshold &&
                this.mouseX < offset.left + $el.outerHeight() + threshold &&
                this.mouseY < offset.top + $el.outerWidth() + threshold) {
                return true;
            }

            return false;
        },


        //
        // -------------------- Listeners --------------------
        //

        onBodyMouseMove: function (event) {
            this.mouseX = event.pageX;
            this.mouseY = event.pageY;

            if (this.inTarget() || (this.triggerEl && this.inTrigger())) {
                this.reset();
                return;
            } else if (!this.inTarget() && this.inTarget(true)) {
                if (!_[this].timeout) {
                    _[this].timeout = setTimeout($.proxy(this.exit, this), this.options.delay);
                }
                return;
            } else if (!this.inTarget(true) && !this.inTrigger()) {
                this.exit();
            }
        },

        onBodyMouseDown: function (event) {
            this.exit();
        }
    };

     
    if (typeof(module) !== 'undefined') {
        module.exports = Rollout;
    } else {
        window.Rollout = Rollout;
    }
}(window));