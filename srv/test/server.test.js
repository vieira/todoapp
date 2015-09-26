var assert = require('assert'),
    WebSocket = require('ws'),
    MsgServer = require('../server'),
    User = require('../user'),
    NoLog = require('./utils');

describe('message server', function() {
    var ms, ws;

    beforeEach(function(done) {
        ms = new MsgServer('8080', new NoLog());
        ws = new WebSocket('ws://localhost:8080');
        done();
    });

    afterEach(function(done) {
        ws.close();
        ms.socket.close();
        done();
    });

    it('must accept connections', function(done) {
        ws.on('open', function() {
            done();
        });
    });

    it('must not track connection before id', function(done) {
        ws.on('open', function() {
            setTimeout(function() {
                assert.equal(Object.keys(ms.users).length, 0);
                done();
            }, 3);
        });
    });
    
    it('must track connection after id', function(done) {
        ws.on('open', function() {
            ws.send(JSON.stringify({type: "id", id: "vieira"}), function(err) {
                assert.equal(err, null);
                setTimeout(function() {
                    assert.equal(Object.keys(ms.users).length, 1);
                    done();
                }, 3);
            });
        });
    });
    
    it('must deliver message to other connected user', function(done) {
        var ows = new WebSocket('ws://localhost:8080');

        ows.on('message', function(message) { 
            message = JSON.parse(message);
            assert.equal(message.text, "hello :)");
            assert.equal(message.receiver, "master");
            assert.equal(message.type, "msg");
            done();
        });
        
        ws.on('open', function() {
            ws.send(JSON.stringify({type: "id", id: "vieira"}));
            setTimeout(function() {
                ws.send(JSON.stringify({type: "msg", 
                    text: "hello :)", receiver: "master"}));
            }, 3);
        });

        ows.on('open', function() {
            ows.send(JSON.stringify({type: "id", id: "master"}));
        });
    });

    it('must schedule message for delivery', function(done) {
        ws.on('open', function() {
            ws.send(JSON.stringify({type: "id", id: "vieira"}));
            setTimeout(function() {
                ws.send(JSON.stringify({type: "msg", 
                    text: "hello :)", receiver: "master"}));
            }, 3);
            setTimeout(function() {
                message = ms.users["master"].popOldestMessage();
                assert.equal(message.type, "msg");
                assert.equal(message.text, "hello :)");
                assert.equal(message.receiver, "master");
                done();
            }, 6);
        });
    });

    it('must deliver scheduled message', function(done) {
        ms.users["vieira"] = new User({type:"msg",text:"x",receiver:"vieira"});
        ws.on('open', function() {
            ws.send(JSON.stringify({type:"id", id:"vieira"}));
        });

        ws.on('message', function(message) {
            message = JSON.parse(message);
            assert.equal(message.type, "msg");
            assert.equal(message.text, "x");
            assert.equal(message.receiver, "vieira");
            done();
        });
    });
});
