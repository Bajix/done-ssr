var ssr = require("../lib/");
var helpers = require("./helpers");
var assert = require("assert");
var path = require("path");
var through = require("through2");

describe("Timeouts", function(){
	this.timeout(10000);

	before(function(){
		this.render = ssr({
			config: "file:" + path.join(__dirname, "tests", "package.json!npm"),
			main: "timeout/index.stache!done-autorender"
		}, {
			timeout: 100,
			debug: true
		});
	});

	it("App times out after the specified time", function(done){
		this.render("/slow").pipe(through(function(buffer){
			var html = buffer.toString();
			var node = helpers.dom(html);

			var result = node.getElementById("result").innerHTML;

			assert.equal(result, "failed", "Timed out");
			done();
		}));
	});

	it("Doesn't timeout if rendered quickly enough", function(done){
		this.render("/fast").pipe(through(function(buffer){
			var html = buffer.toString();
			var node = helpers.dom(html);

			var result = node.getElementById("result").innerHTML;

			assert.equal(result, "passed", "Timed out");

			var debug = node.getElementById("done-ssr-debug");
			assert.ok(!debug, "debug node not present");
			done();
		}));
	});

	it("Includes stack trace info when timing out", function(done){
		this.render("/slow").pipe(through(function(buffer){
			var html = buffer.toString();
			var node = helpers.dom(html);

			var debug = node.getElementById("done-ssr-debug").innerHTML;
			assert.ok(debug, "Got the debug node");
			done();
		}));
	});
});