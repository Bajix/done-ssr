var path = require("path");
var assert = require("assert");
var ssr = require("../lib/");
var helpers = require("./helpers");
var through = require("through2");

describe("xhr async rendering", function() {
	this.timeout(10000);

	var render;
	var xhrOptions = {};

	before(function() {
		this.oldXHR = global.XMLHttpRequest;
		global.XMLHttpRequest = helpers.mockXHR('[1,2,3,4,5]', xhrOptions);

		render = ssr({
			config: "file:" + path.join(__dirname, "tests", "package.json!npm"),
			main: "xhr/index.stache!done-autorender",
			paths: {
				"$css": "file:" + path.resolve(__dirname + "/tests/less_plugin.js")
			}
		}, {
			auth: {
				cookie: 'feathers-jwt',
				domains: [
					'canjs.com',
					'donejs.com'
				]
			}
		});
	});

	after(function() {
		global.XMLHttpRequest = this.oldXHR;
	});

	it("works", function(done) {
		var didXhr = false;

		xhrOptions.beforeSend = function(xhr){
			var auth = xhr.getRequestHeader('authorization');
			assert.equal(auth, undefined);
			didXhr = true;
		};

		var stream = render({
			url: '/',
			headers: {
				cookie: "feathers-jwt=foobar;"
			}
		});

		stream.pipe(through(function(buffer) {
			assert.ok(didXhr);
			done();
		}));
	});
});
