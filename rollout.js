/*jshint strict:true, undef:true, noarg:true, immed:true, trailing:true, expr:true, maxlen:120*/
/*global browser:true, console:true, $:true, _:true, module:true*/

// rollout.js
// version : 0.0.4
// author : Jamie Rolfs
// license : MIT
// github.com/jrolfs/rolloutjs

(function(window) {
    'use strict';

    //
    // -------------------- Init --------------------
    //

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

        this._timeout = null;
        this._handlers = {};

        this._onBodyMouseMove = $.proxy(this._onBodyMouseMove, this);
        this._onBodyMouseDown = $.proxy(this._onBodyMouseDown, this);
    };


    //
    // -------------------- Control --------------------
    //

    /**
     * Start monitoring rollout status
     *
     * @return undefined
     */
    Rollout.prototype.start = function () {
        $(document.body).mousemove(this._onBodyMouseMove);

        if (this.options.exitOnClick) {
            $(document.body).mousedown(this._onBodyMouseDown);
        }
    };

    /**
     * Stop monitoring rollout status
     *
     * @return undefined
     */
    Rollout.prototype.stop = function () {
        $(document.body).off('mousemove', this._onBodyMouseMove);

        if (this.options.exitOnClick) {
            $(document.body).off('mousedown', this._onBodyMouseDown);
        }

        this.reset();
    };

    /**
     * Reset rollout timeout
     *
     * @return undefined
     */
    Rollout.prototype.reset = function () {
        clearTimeout(this._timeout);
        this._timeout = null;
    };

    /**
     * Stop monitoring rollout status and dispatch exit event
     *
     * @return undefined
     */
    Rollout.prototype.exit = function (properties) {
        this.stop();

        var event = new $.Event('rollout', $.extend({
            target: this,
            relatedTarget: this.target,
            pageX: this.mouseX,
            pageY: this.mouseY
        }, properties));

        this._trigger(event);
    };

    /**
     * Check whether the mouse is with in the target element
     *
     * @param  {Boolean} includeThreshold Whether to consider threshold boundary
     * @return {Boolean}
     */
    Rollout.prototype.inTarget = function (includeThreshold) {
        return this._isWithin(this.$target, includeThreshold && this.options.threshold);
    };

    /**
     * Check whether the mouse is with in the trigger element
     *
     * @param  {Boolean} includeThreshold Whether to consider threshold boundary
     * @return {Boolean}
     */
    Rollout.prototype.inTrigger = function (includeThreshold) {
        if (!this.triggerEl) throw new Error('Rollout: no trigger element was supplied');
        return this._isWithin(this.$triggerEl, includeThreshold && this.options.threshold);
    };

    /**
     * Add event handler to this instance
     *
     * @param  {String} eventName   Name of event to bind handler to
     * @param  {Function} handler   Handler function
     * @return
     */
    Rollout.prototype.on = function(eventName, handler) {
        var events = eventName.toString().split(/\s/g);

        for (var i = 0; i < events.length; i++) {
            eventName = events[i].toLowerCase().replace(/^on/, "");
            if (!this._handlers[eventName]) this._handlers[eventName] = handler;
        }
    };

    /**
     * Remove event handler from this instance
     *
     * @param  {String} eventName   Name of event handler to unbind
     * @param  {Function} handler   Handler function
     * @return {Boolean}            Whether a handlers was removed
     */
    Rollout.prototype.off = function(eventName, handler) {
        var events = eventName.toString().split(/\s/g);

        for (var i = 0; i < events.length; i++) {
            eventName = events[i].toLowerCase().replace(/^on/, "");
            for (var event in this._handlers) {
                if (event === events[i] && this._handlers[event] === handler) {
                    delete this._handlers[event];
                }
            }
        }
    };


    // ---------- Private ----------

    Rollout.prototype._isWithin = function($el, threshold) {

        threshold = threshold || 0;

        var offset = $el.offset();

        if (this.mouseX > offset.left - threshold &&
            this.mouseY > offset.top - threshold &&
            this.mouseX < offset.left + $el.outerWidth() + threshold &&
            this.mouseY < offset.top + $el.outerHeight() + threshold) {
            return true;
        }

        return false;
    };

    Rollout.prototype._trigger = function (event) {
        if (this._handlers[event.type]) {
            var handler = this._handlers[event.type];

            if (typeof handler === 'function') {
                handler.call(this, event);
            }
        }
    };


    //
    // -------------------- Listeners --------------------
    //

    // ---------- Private ----------

    Rollout.prototype._onBodyMouseMove = function (event) {
        this.mouseX = event.pageX;
        this.mouseY = event.pageY;

        if (this.inTarget() || (this.triggerEl && this.inTrigger())) {
            this.reset();
            return;
        } else if (!this.inTarget() && this.inTarget(true)) {
            if (!this._timeout) {
                this._timeout = setTimeout($.proxy(this.exit, this), this.options.delay);
            }
            return;
        } else if (!this.inTarget(true) && !this.inTrigger()) {
            this.exit();
        }
    };

    Rollout.prototype._onBodyMouseDown = function (event) {
        this.exit();
    };


    // Attach
     
    if (typeof(module) !== 'undefined') {
        module.exports = Rollout;
    } else {
        window.Rollout = Rollout;
    }
}(window));