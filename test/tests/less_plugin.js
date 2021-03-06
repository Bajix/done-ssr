
var getDoc = function () {
	if ( typeof doneSsr !== "undefined" && doneSsr.globalDocument ) {
		return doneSsr.globalDocument;
	}

	return document;
};

if( steal.config('env') === 'production' ) {
	exports.fetch = function(load) {
		// return a thenable for fetching (as per specification)
		// alternatively return new Promise(function(resolve, reject) { ... })
		var cssFile = load.address;
		var document = getDoc();
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = cssFile;

		document.head.appendChild(link);
		return "";
	};
} else {
	exports.instantiate = function(load) {
		var loader = this, assetRegister;

		var instantiatePromise = Promise.resolve();
		if(loader.has("asset-register")) {
			instantiatePromise = loader.import("asset-register").then(function(register){
				assetRegister = register;
			})
		}

		load.metadata.deps = [];
		load.metadata.execute = function(){
			var source = load.source+"/*# sourceURL="+load.address+" */";
			source = source.replace(/url\(['"]?([^'"\)]*)['"]?\)/g, function( whole, part ) {
				return "url(" + steal.joinURIs( load.address, part) + ")";
			});
			var document = getDoc();

			if(load.source && typeof document !== "undefined") {
				var doc = document.head ? document : document.getElementsByTagName ?
					document : document.documentElement;

				var head = doc.head || doc.getElementsByTagName('head')[0],
					style = document.createElement('style');

				if(!head) {
					head = document.createElement("head");
					doc.insertBefore(head, doc.firstChild);
				}


				// make source load relative to the current page

				style.type = 'text/css';

				if (style.styleSheet){
					style.styleSheet.cssText = source;
				} else {
					style.appendChild(document.createTextNode(source));
				}
				head.appendChild(style);

				if(loader.has("live-reload")) {
					var cssReload = loader.import("live-reload", { name: "$css" });
					Promise.resolve(cssReload).then(function(reload){
						loader.import(load.name).then(function(){
							reload.once(load.name, function(){
								head.removeChild(style);
							});
						});
					});
				}

				if(assetRegister) {
					assetRegister(load.name, "css", function(){
						return style.cloneNode(true);
					});
				}
			}

			return System.newModule({source: source});
		};
		load.metadata.format = "css";

		return instantiatePromise;
	};

}

exports.buildType = "css";
exports.includeInBuild = true;
