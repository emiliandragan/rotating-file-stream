/* jshint mocha: true */
"use strict";

var assert = require("assert");
var fs = require("fs");
var rfs = require("./helper");

describe("interval", function() {
	describe("rotation", function() {
		before(function(done) {
			var now  = new Date().getTime();
			var sec  = parseInt(now / 1000) * 1000;
			var open = sec + (sec + 900 > now ? 900 : 1900);
			var self = this;
			setTimeout(function() {
				self.rfs = rfs(done, { interval: "1s" });
				setTimeout(self.rfs.end.bind(self.rfs, "test\n"), 300);
			}, open - now);
		});

		it("no error", function() {
			assert.ifError(this.rfs.ev.err);
		});

		it("1 rotation", function() {
			assert.equal(this.rfs.ev.rotation, 1);
		});

		it("1 rotated", function() {
			assert.equal(this.rfs.ev.rotated.length, 1);
			assert.equal(this.rfs.ev.rotated[0], "4-test.log");
		});

		it("1 single write", function() {
			assert.equal(this.rfs.ev.single, 1);
		});

		it("0 multi write", function() {
			assert.equal(this.rfs.ev.multi, 0);
		});

		it("file content", function() {
			assert.equal(fs.readFileSync("test.log"), "test\n");
		});

		it("rotated file content", function() {
			assert.equal(fs.readFileSync("4-test.log"), "test\n");
		});
	});

	describe("rotation while _write", function() {
		before(function(done) {
			var now  = new Date().getTime();
			var sec  = parseInt(now / 1000) * 1000;
			var open = sec + (sec + 900 > now ? 900 : 1900);
			var self = this;
			setTimeout(function() {
				self.rfs = rfs(done, { interval: "1s"});

				var prev = self.rfs.stream._write;
				self.rfs.stream._write = function(chunk, encoding, callback) {
					setTimeout(prev.bind(self.rfs.stream, chunk, encoding, callback), 200);
				};

				self.rfs.write("test\n");
				self.rfs.end("test\n");
			}, open - now);
		});

		it("no error", function() {
			assert.ifError(this.rfs.ev.err);
		});

		it("1 rotation", function() {
			assert.equal(this.rfs.ev.rotation, 1);
		});

		it("1 rotated", function() {
			assert.equal(this.rfs.ev.rotated.length, 1);
			assert.equal(this.rfs.ev.rotated[0], "5-test.log");
		});

		it("2 single write", function() {
			assert.equal(this.rfs.ev.single, 2);
		});

		it("0 multi write", function() {
			assert.equal(this.rfs.ev.multi, 0);
		});

		it("file content", function() {
			assert.equal(fs.readFileSync("test.log"), "test\n");
		});

		it("rotated file content", function() {
			assert.equal(fs.readFileSync("5-test.log"), "test\ntest\n");
		});
	});
});
