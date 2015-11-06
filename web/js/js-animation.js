
(function($){
    var methods = {

        init: function(options) {
            return this.each(function(){
                var $this = $(this),
                    data = $this.data('eraser');

                if (!data) {

                    var handleImage = function() {
                        var $canvas = $('<canvas/>'),
                            canvas = $canvas.get(0),
                            ctx = canvas.getContext('2d'),

                        // calculate scale ratio for high DPI devices
                        // http://www.html5rocks.com/en/tutorials/canvas/hidpi/
                            devicePixelRatio = window.devicePixelRatio || 1,
                            backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                                ctx.mozBackingStorePixelRatio ||
                                ctx.msBackingStorePixelRatio ||
                                ctx.oBackingStorePixelRatio ||
                                ctx.backingStorePixelRatio || 1,
                            scaleRatio = devicePixelRatio / backingStoreRatio,

                            realWidth = $this.width(),
                            realHeight = $this.height(),
                            width = realWidth * scaleRatio,
                            height = realHeight * scaleRatio,
                            pos = $this.offset(),
                            size = ((options && options.size) ? options.size : 50) * scaleRatio,
                            completeRatio = (options && options.completeRatio) ? options.completeRatio : .7,
                            completeFunction = (options && options.completeFunction) ? options.completeFunction : null,
                            progressFunction = (options && options.progressFunction) ? options.progressFunction : null,
                            zIndex = $this.css('z-index') == "auto"?1:$this.css('z-index'),
                            parts = [],
                            colParts = Math.floor(width / size),
                            numParts = colParts * Math.floor(height / size),
                            n = numParts,
                            that = $this[0];

                        // replace target with canvas
                        $this.after($canvas);
                        canvas.id = that.id;
                        canvas.className = that.className;
                        canvas.width = width;
                        canvas.height = height;
                        canvas.style.width = realWidth.toString() + "px";
                        canvas.style.height = realHeight.toString() + "px";
                        ctx.drawImage(that, 0, 0, width, height);
                        $this.remove();

                        // prepare context for drawing operations
                        ctx.globalCompositeOperation = 'destination-out';
                        ctx.strokeStyle = 'rgba(255,0,0,255)';
                        ctx.lineWidth = size;

                        ctx.lineCap = 'round';
                        // bind events
                        $canvas.bind('mousedown.eraser', methods.mouseDown);
                        $canvas.bind('touchstart.eraser', methods.touchStart);
                        $canvas.bind('touchmove.eraser', methods.touchMove);
                        $canvas.bind('touchend.eraser', methods.touchEnd);

                        // reset parts
                        while(n--) parts.push(1);

                        // store values
                        data = {
                            posX: pos.left,
                            posY: pos.top,
                            touchDown: false,
                            touchID: -999,
                            touchX: 0,
                            touchY: 0,
                            ptouchX: 0,
                            ptouchY: 0,
                            canvas: $canvas,
                            ctx: ctx,
                            w: width,
                            h: height,
                            scaleRatio: scaleRatio,
                            source: that,
                            size: size,
                            parts: parts,
                            colParts: colParts,
                            numParts: numParts,
                            ratio: 0,
                            complete: false,
                            completeRatio: completeRatio,
                            completeFunction: completeFunction,
                            progressFunction: progressFunction,
                            zIndex: zIndex
                        };
                        $canvas.data('eraser', data);

                        // listen for resize event to update offset values
                        $(window).resize(function() {
                            var pos = $canvas.offset();
                            data.posX = pos.left;
                            data.posY = pos.top;
                        });
                    }

                    if (this.complete && this.naturalWidth > 0) {
                        handleImage();
                    } else {
                        //this.onload = handleImage;
                        $this.load(handleImage);
                    }
                }
            });
        },

        touchStart: function(event) {
            var $this = $(this),
                data = $this.data('eraser');

            if (!data.touchDown) {
                var t = event.originalEvent.changedTouches[0],
                    tx = t.pageX - data.posX,
                    ty = t.pageY - data.posY;
                tx *= data.scaleRatio;
                ty *= data.scaleRatio;
                methods.evaluatePoint(data, tx, ty);
                data.touchDown = true;
                data.touchID = t.identifier;
                data.touchX = tx;
                data.touchY = ty;
                event.preventDefault();
            }
        },

        touchMove: function(event) {
            var $this = $(this),
                data = $this.data('eraser');

            if (data.touchDown) {
                var ta = event.originalEvent.changedTouches,
                    n = ta.length;
                while (n--) {
                    if (ta[n].identifier == data.touchID) {
                        var tx = ta[n].pageX - data.posX,
                            ty = ta[n].pageY - data.posY;
                        tx *= data.scaleRatio;
                        ty *= data.scaleRatio;
                        methods.evaluatePoint(data, tx, ty);
                        data.ctx.beginPath();
                        data.ctx.moveTo(data.touchX, data.touchY);
                        data.touchX = tx;
                        data.touchY = ty;
                        data.ctx.lineTo(data.touchX, data.touchY);
                        data.ctx.stroke();
                        $this.css({"z-index":$this.css('z-index')==data.zIndex?parseInt(data.zIndex)+1:data.zIndex});
                        event.preventDefault();
                        break;
                    }
                }
            }
        },

        touchEnd: function(event) {
            var $this = $(this),
                data = $this.data('eraser');

            if ( data.touchDown ) {
                var ta = event.originalEvent.changedTouches,
                    n = ta.length;
                while( n-- ) {
                    if ( ta[n].identifier == data.touchID ) {
                        data.touchDown = false;
                        event.preventDefault();
                        break;
                    }
                }
            }

        },

        evaluatePoint: function(data, tx, ty) {
            var p = Math.floor(tx/data.size) + Math.floor( ty / data.size ) * data.colParts;
            if ( p >= 0 && p < data.numParts ) {
                data.ratio += data.parts[p];
                data.parts[p] = 0;
                if (!data.complete) {

                    p = data.ratio/data.numParts;
                    if ( p >= data.completeRatio ) {
                        data.complete = true;
                        if ( data.completeFunction != null ) data.completeFunction();
                    } else {
                        if ( data.progressFunction != null ) data.progressFunction(p);
                    }
                }
            }

        },

        mouseDown: function(event) {
            var $this = $(this),
                data = $this.data('eraser'),
                tx = event.pageX - data.posX,
                ty = event.pageY - data.posY;
            tx *= data.scaleRatio;
            ty *= data.scaleRatio;

            methods.evaluatePoint( data, tx, ty );
            data.touchDown = true;
            data.touchX = tx;
            data.touchY = ty;
            data.ctx.beginPath();
            data.ctx.moveTo(data.touchX-1, data.touchY);
            data.ctx.lineTo(data.touchX, data.touchY);
            data.ctx.stroke();
            $this.bind('mousemove.eraser', methods.mouseMove);
            $(document).bind('mouseup.eraser', data, methods.mouseUp);
            event.preventDefault();
        },

        mouseMove: function(event) {

            var $this = $(this),
                data = $this.data('eraser'),
                tx = event.pageX - data.posX,
                ty = event.pageY - data.posY;
            tx *= data.scaleRatio;
            ty *= data.scaleRatio;

            methods.evaluatePoint( data, tx, ty );
            data.ctx.beginPath();
            data.ctx.moveTo( data.touchX, data.touchY );
            data.touchX = tx;
            data.touchY = ty;
            data.ctx.lineTo( data.touchX, data.touchY );
            data.ctx.stroke();
            $this.css({"z-index":$this.css('z-index')==data.zIndex?parseInt(data.zIndex)+1:data.zIndex});
            event.preventDefault();
        },

        mouseUp: function(event) {
            var data = event.data,
                $this = data.canvas;
            

            //$('#redux').eraser( 'reset' );

            data.touchDown = false;
            $this.unbind('mousemove.eraser');
            $(document).unbind('mouseup.eraser');
            event.preventDefault();
        },

        clear: function() {
            var $this = $(this),
                data = $this.data('eraser');

            if (data) {
                data.ctx.clearRect(0, 0, data.w, data.h);
                var n = data.numParts;
                while(n--) data.parts[n] = 0;
                data.ratio = data.numParts;
                data.complete = true;
                if (data.completeFunction != null) data.completeFunction();
            }
        },


        reset: function() {
            var $this = $(this),
                data = $this.data('eraser');

            if (data) {
                data.ctx.globalCompositeOperation = 'source-over';
                data.ctx.drawImage( data.source, 0, 0, data.w, data.h);
                data.ctx.globalCompositeOperation = 'destination-out';
                var n = data.numParts;
                while (n--) data.parts[n] = 1;
                data.ratio = 0;
                data.complete = false;
                data.touchDown = false;
            }
        },

        progress: function() {
            var $this = $(this),
                data = $this.data('eraser');

            if (data) {

                return data.ratio/data.numParts;

            }
            return 0;

        }

    };

    $.fn.eraser = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || ! method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' +  method + ' does not yet exist on jQuery.eraser');
        }
    };
})(jQuery);

$(document).ready(function(){

    $(".dew").addClass("dew2");
    $(".canv").mousedown(function(){
        $(".hand").css({
            display:"none"
        });
    });

    $("#redux").eraser({
        completeRatio: .35,
        completeFunction: function(){
            $(".hand").hide();
            $( "#redux" ).hide();
            $( ".men-line2" ).css({
                "z-index":"0"
            });
            $(".smoke2").addClass("smoke3");
            setTimeout(function() {
                $(".halk0").addClass("halk1");
            }, 2700);
            setTimeout(function(){
                $( ".men-line2" ).css({
                    "opacity": "0",
                    "transition": "2s"
                });
            }, 3000);

            //setTimeout(function(){
            //    $( ".ray" ).css({
            //        "transform": "scale(1,1)"
            //    });
            //}, 6500);
            setTimeout(function(){
                $( ".men-line2" ).css({
                    "opacity":"0",
                    "transition-duration": "0.5s"
                });
                $(".container").css({
                    "background":"url(img/bg2.jpg) 50% 100%",
                });
                $( ".text-block" ).hide();

            }, 5500);

            setTimeout(function(){
                $(".top-dew").addClass("topdew2");
            }, 8500);
            setTimeout(function(){
                $(".middle-dew").addClass("middle-dew2");
            }, 9000);
            setTimeout(function(){
                $(".bottom-dew").addClass("bottom-dew2");
            }, 9500);
        }
    });
});
(function() {

    function tapClip() {

        var hastouch = "ontouchstart" in window ? true : false,
            tapstart = hastouch ? "touchstart" : "mousedown",
            tapmove = hastouch ? "touchmove" : "mousemove",
            tapend = hastouch ? "touchend" : "mouseup";

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = a * 1;
        ctx.globalCompositeOperation = "destination-out";

        canvas.addEventListener(tapstart, function(e) {
            clearTimeout(timeout);
            e.preventDefault();

            x1 = hastouch ? e.targetTouches[0].pageX : e.clientX - canvas.offsetLeft;
            y1 = hastouch ? e.targetTouches[0].pageY : e.clientY - canvas.offsetTop;

            ctx.save();
            ctx.beginPath();
            ctx.arc(x1, y1, 1, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
            console.log(ctx.beginPath());
            canvas.addEventListener(tapmove, tapmoveHandler);
            canvas.addEventListener(tapend, function() {
                canvas.removeEventListener(tapmove, tapmoveHandler);

                timeout = setTimeout(function() {
                    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    var dd = 0;
                    for (var x = 0; x < imgData.width; x += jiange) {
                        for (var y = 0; y < imgData.height; y += jiange) {
                            var i = (y * imgData.width + x) * 4;
                            if (imgData.data[i + 3] > 0) {
                                dd++
                            }
                        }
                    }
                    if (dd / (imgData.width * imgData.height / (jiange * jiange)) < 8) {
                        canvas.className = "noOp";
                    }
                }, totimes)
            });

            function tapmoveHandler(e) {
                clearTimeout(timeout);
                e.preventDefault();
                x2 = hastouch ? e.targetTouches[0].pageX : e.clientX - canvas.offsetLeft;
                y2 = hastouch ? e.targetTouches[0].pageY : e.clientY - canvas.offsetTop;

                ctx.save();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.restore();

                x1 = x2;
                y1 = y2;
            }
        })
    }
})();