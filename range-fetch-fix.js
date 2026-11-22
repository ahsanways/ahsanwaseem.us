/*
 * Next.js static export probes destination pages with `fetch(url, { headers: { Range: "bytes=0-63" } })`
 * to compare build IDs. GitHub Pages answers 206 + Cache-Control: max-age=600, and Chrome then serves
 * that 64-byte fragment for a full reload of the same URL → blank page. Never cache those probes.
 */
(function () {
  var orig = window.fetch;
  if (!orig || orig.__rangeFix) return;
  var patched = function (input, init) {
    try {
      var h = new Headers((init && init.headers) || (input instanceof Request ? input.headers : undefined));
      var range = h.get("range");
      if (range && /^bytes=0-\d+$/.test(range)) {
        return orig.call(this, input, Object.assign({}, init, { cache: "no-store" }));
      }
    } catch (e) { /* fall through */ }
    return orig.call(this, input, init);
  };
  patched.__rangeFix = true;
  window.fetch = patched;
})();
