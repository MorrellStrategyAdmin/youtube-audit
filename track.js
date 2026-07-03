/* Morrell Strategy — first-party, cookieless site analytics.
   Logs pageviews + clicks (source, page, button/link) into the CRM's
   Supabase `web_events` table. No cookies, no PII. View it in the CRM
   Reporting tab -> Website. */
(function () {
  var SUPA = 'https://gjfrarupnpsfiolpgtdc.supabase.co';
  var KEY = 'sb_publishable_eqj4ZpwmFnG3s1tLCy2qlA_MXgtuETs';

  function qp(name) { try { return new URLSearchParams(location.search).get(name) || ''; } catch (e) { return ''; } }
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
  function device() { var w = window.innerWidth || screen.width || 0; return w && w <= 640 ? 'mobile' : w && w <= 1024 ? 'tablet' : 'desktop'; }
  function source() {
    var us = qp('utm_source'); if (us) return us.toLowerCase();
    var r = host(document.referrer);
    if (!r || r === host(location.href)) return 'direct';
    if (/youtube|youtu\.be/.test(r)) return 'youtube';
    if (/instagram/.test(r)) return 'instagram';
    if (/tiktok/.test(r)) return 'tiktok';
    if (/t\.co|twitter|x\.com/.test(r)) return 'twitter';
    if (/facebook|fb\.com|fb\.me/.test(r)) return 'facebook';
    if (/linkedin|lnkd\.in/.test(r)) return 'linkedin';
    if (/google\./.test(r)) return 'google';
    if (/bing\./.test(r)) return 'bing';
    return r;
  }
  function sess() {
    try { var s = sessionStorage.getItem('ms_sid'); if (!s) { s = Date.now().toString(36) + Math.random().toString(36).slice(2, 8); sessionStorage.setItem('ms_sid', s); } return s; }
    catch (e) { return ''; }
  }

  var BASE = {
    referrer: host(document.referrer),
    ref_source: source(),
    utm_source: qp('utm_source'), utm_medium: qp('utm_medium'), utm_campaign: qp('utm_campaign'),
    device: device(), session_id: sess(), screen_w: window.innerWidth || screen.width || null
  };

  function send(ev) {
    try {
      var row = {}; for (var k in BASE) row[k] = BASE[k];
      row.path = location.pathname || '/';
      for (var j in ev) row[j] = ev[j];
      fetch(SUPA + '/rest/v1/web_events', {
        method: 'POST', keepalive: true,
        headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(row)
      }).catch(function () {});
    } catch (e) {}
  }

  // First-touch: remember the first video tag that ever brought this device, so a
  // later booking (even direct, even weeks later) still traces back to that video.
  try { var _fv = qp('utm_campaign'); if (_fv && !localStorage.getItem('ms_first_video')) localStorage.setItem('ms_first_video', _fv); } catch (e) {}

  send({ event_type: 'pageview' });

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a,button,[data-track]') : null;
    if (!el) return;
    var id = el.getAttribute('data-track') || '';
    var text = (el.innerText || el.getAttribute('aria-label') || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    var href = el.getAttribute('href') || '';
    var label = (id || text || href || el.tagName.toLowerCase()).slice(0, 80);
    send({ event_type: 'click', click_id: label, click_text: text, click_href: href.slice(0, 300) });
  }, true);
})();
