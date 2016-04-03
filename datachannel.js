/* webrtc interop testing using using selenium 
 * Copyright (c) 2016, Philipp Hancke
 * This work has been sponsored by the International Multimedia
 * Teleconferencing Consortium in preparation for the 
 * SuperOp! 2016 event.
 */

var os = require('os');
var test = require('tape');
var buildDriver = require('./webdriver');
var WebRTCClient = require('./webrtcclient');

function interop(t, browserA, browserB, preferredAudioCodec) {
  var driverA = buildDriver(browserA);
  var driverB = buildDriver(browserB);

  var clientA = new WebRTCClient(driverA);
  var clientB = new WebRTCClient(driverB);

  // static page with adapter shim
  driverA.get('https://fippo.github.io/adapter/testpage.html')
  .then(function() {
    return driverB.get('https://fippo.github.io/adapter/testpage.html')
  })
  .then(function() {
    clientA.create();
    return clientA.createDataChannel('somechannel');
  })
  .then(function() {
    return clientA.createOffer();
  })
  .then(function(offer) {
    t.pass('created offer');
    return clientA.setLocalDescription(offer);
  })
  .then(function(offerWithCandidates) {
    t.pass('offer ready to signal');

    clientB.create();
    return clientB.setRemoteDescription(offerWithCandidates);
  })
  .then(function() {
    return clientB.createAnswer();
  })
  .then(function(answer) {
    t.pass('created answer');
    return clientB.setLocalDescription(answer); // modify answer here?
  })
  .then(function(answerWithCandidates) {
    t.pass('answer ready to signal');
    return clientA.setRemoteDescription(answerWithCandidates);
  })
  .then(function() {
    // wait for the iceConnectionState to become either connected/completed
    // or failed.
    return clientA.waitForIceConnectionStateChange();
  })
  .then(function(iceConnectionState) {
    t.ok(iceConnectionState !== 'failed', 'ICE connection is established');
  })
  .then(function() {
    driverA.quit();
    driverB.quit()
    .then(function() {
      t.end();
    });
  })
  .catch(function(err) {
    t.fail(err);
  });
}

test('Chrome-Firefox', function (t) {
  interop(t, 'chrome', 'firefox');
});

test('Firefox-Chrome', function (t) {
  interop(t, 'firefox', 'chrome');
});