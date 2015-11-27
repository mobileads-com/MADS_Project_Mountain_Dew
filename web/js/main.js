/*
*
* mads - version 2.00.01  
* Copyright (c) 2015, Ninjoe
* Dual licensed under the MIT or GPL Version 2 licenses.
* https://en.wikipedia.org/wiki/MIT_License
* https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html
*
*/
var mads = function () {
    /* Get Tracker */
    if (typeof custTracker == 'undefined' && typeof rma != 'undefined') {
        this.custTracker = rma.customize.custTracker;
    } else if (typeof custTracker != 'undefined') {
        this.custTracker = custTracker;
    } else {
        this.custTracker = [];
    }
    
    /* Unique ID on each initialise */
    this.id = this.uniqId();
    
    /* Tracked tracker */
    this.tracked = [];
    
    /* Body Tag */
    this.bodyTag = document.getElementsByTagName('body')[0];
    
    /* Head Tag */
    this.headTag = document.getElementsByTagName('head')[0];
    
    /* RMA Widget - Content Area */
    this.contentTag = document.getElementById('rma-widget');
    
    /* URL Path */
    this.path = typeof rma != 'undefined' ? rma.customize.src : '';
};

/* Generate unique ID */
mads.prototype.uniqId = function () {
    
    return new Date().getTime();
}

/* Link Opner */
mads.prototype.linkOpener = function (url) {

	if(typeof url != "undefined" && url !=""){
		if (typeof mraid !== 'undefined') {
			mraid.open(url);
		}else{
			window.open(url);
		}
	}
}

/* tracker */
mads.prototype.tracker = function (tt, type, name, value) {
    
    /* 
    * name is used to make sure that particular tracker is tracked for only once 
    * there might have the same type in different location, so it will need the name to differentiate them
    */
    name = name || type; 
    console.log(type)
    if ( typeof this.custTracker != 'undefined' && this.custTracker != '' && this.tracked.indexOf(name) == -1 ) {
        for (var i = 0; i < this.custTracker.length; i++) {
            var img = document.createElement('img');
            console.log(type)
            if (typeof value == 'undefined') {
                value = '';
            }
            
            /* Insert Macro */
            var src = this.custTracker[i].replace('{{type}}', type);
            src = src.replace('{{tt}}', tt);
            src = src.replace('{{value}}', value);
            /* */
            img.src = src + '&' + this.id;
            
            img.style.display = 'none';
            this.bodyTag.appendChild(img);
            
            this.tracked.push(name);
        }
    }
};

/* Load JS File */
mads.prototype.loadJs = function (js, callback) {
    var script = document.createElement('script');
    script.src = js;
    
    if (typeof callback != 'undefined') {
        script.onload = callback;
    }
    
    this.headTag.appendChild(script);
}

/* Load CSS File */
mads.prototype.loadCss = function (href) {
    var link = document.createElement('link');
    link.href = href;
    link.setAttribute('type', 'text/css');
    link.setAttribute('rel', 'stylesheet');
    
    this.headTag.appendChild(link);
}

/*
*
* Unit Testing for mads 
*
*/
var app = new mads();
var testunit = function () {
    
    var site = false;
    app.loadCss(app.path+'css/style.css');

    app.loadJs('https://code.jquery.com/jquery-1.11.3.min.js',function () {
        console.log(typeof window.jQuery != 'undefined');
        var jsAnimation = function(){
            app.loadJs(app.path+'js/js-animation.js',  bannerload);
        }
        app.loadJs('https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js', jsAnimation);
    });

    var  bannerload = function() {
        app.contentTag.innerHTML =
            '<div class="container"> \
            <div class="canv"> \
            <img id="redux" class="canv" src="' + app.path + 'img/men-line.png" /> \
            </div> \
            <img class="men-line2" src="' + app.path + 'img/men-line3.png" alt=""> \
            <div class="smoke2"> \
            <img src="' + app.path + 'img/psmoke.png" alt="">\
            </div> \
            <div class="hand"> \
            <img src="' + app.path + 'img/hand.png" alt=""> \
            </div> \
            <div class="dew"> \
            <img src="' + app.path + 'img/dew-bottle.png" alt=""/> \
            </div> \
             <div class="text-block"> \
            <img src="' + app.path + 'img/swipe-text.png" alt=""/> \
            </div> \
            <div class="halk0"> \
            <img src="' + app.path + 'img/halk.png" alt=""> \
            </div> \
            <div class="top-dew"> \
            <img src="' + app.path + 'img/top-dew.png" alt=""> \
            </div> \
            <div class="middle-dew"> \
            <img src="' + app.path + 'img/middle-dew.png" alt=""> \
            </div> \
            <div class="bottom-dew"> \
                <div class="find-out"></div>\
            </div> \
            </div>';

    }

    //app.custTracker = ['http://www.tracker.com?type={{type}}&tt={{tt}}','http://www.tracker2.com?type={{type}}'];
    //
    //app.tracker('CTR', 'test');
    //app.tracker('E','test','name');
    //
    //app.linkOpener('http://www.google.com');
}
testunit();