/* Trợ lý AI KKINVEST — nút nổi + khung chat, dùng được trên mọi trang.
   Nguyên tắc: AI chỉ đọc số liệu CHÍNH TRANG đã tính, không tự đi tra chỗ khác.
   Trang nào muốn gửi số liệu gọn và chính xác thì khai báo:
     window.AI_BOICANH = () => 'văn bản số liệu…';
     window.AI_GOI_Y   = ['câu hỏi mẫu 1','câu hỏi mẫu 2'];
   Không khai báo thì widget tự đọc chữ đang hiện trên trang. */
(function () {
  if (window.__troLyAI) return; window.__troLyAI = true;

  var TRANG = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
  var KHOA = 'ai_chat_' + TRANG;
  var TRAN_BOICANH = 90000;

  var css = document.createElement('style');
  css.textContent = [
    '#aiFab{position:fixed;right:18px;bottom:18px;z-index:9998;display:flex;align-items:center;gap:8px;',
      'background:linear-gradient(135deg,#e2b33b,#c9972a);color:#1a1405;border:none;border-radius:26px;',
      'padding:11px 17px;font:700 13px "Segoe UI",system-ui,sans-serif;cursor:pointer;',
      'box-shadow:0 6px 22px rgba(0,0,0,.45)}',
    '#aiFab:hover{filter:brightness(1.08)}',
    '#aiWrap{position:fixed;right:18px;bottom:18px;z-index:9999;width:min(460px,calc(100vw - 24px));',
      'height:min(660px,calc(100vh - 36px));background:#0e1525;border:1px solid #1c2740;border-radius:14px;',
      'display:none;flex-direction:column;overflow:hidden;box-shadow:0 14px 48px rgba(0,0,0,.6);',
      'font-family:"Segoe UI",system-ui,Roboto,sans-serif;color:#e8edf7}',
    '#aiWrap.mo{display:flex}',
    '#aiTop{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #1c2740;background:#141d31;flex:0 0 auto}',
    '#aiTop b{font-size:13px;letter-spacing:.4px;color:#e2b33b}',
    '#aiTop select{margin-left:auto;background:#0e1525;color:#e8edf7;border:1px solid #1c2740;border-radius:7px;font-size:11px;padding:4px 6px}',
    '#aiTop button{background:#0e1525;color:#7e8db0;border:1px solid #1c2740;border-radius:7px;font-size:12px;',
      'width:26px;height:26px;cursor:pointer;line-height:1}',
    '#aiTop button:hover{color:#e8edf7;border-color:#4f8cff}',
    '#aiCtx{flex:0 0 auto;padding:6px 12px;font-size:10.5px;color:#7e8db0;border-bottom:1px solid #1c2740;background:#0b1120}',
    '#aiCtx b{color:#26c281}',
    '#aiBody{flex:1 1 auto;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;font-size:13px;line-height:1.5}',
    '.aiM{max-width:92%;padding:9px 11px;border-radius:11px;white-space:normal;word-break:break-word}',
    '.aiM.u{align-self:flex-end;background:#1d2b4a;border:1px solid #2a3c62}',
    '.aiM.a{align-self:flex-start;background:#121a2c;border:1px solid #1c2740}',
    '.aiM.e{align-self:stretch;background:#2a1520;border:1px solid #5a2435;color:#f0a8b6;font-size:12px}',
    '.aiM p{margin:0 0 7px}.aiM p:last-child{margin:0}',
    '.aiM ul{margin:0 0 7px;padding-left:17px}.aiM li{margin:2px 0}',
    '.aiM h4{margin:9px 0 5px;font-size:12px;letter-spacing:.6px;color:#e2b33b;text-transform:uppercase}',
    '.aiM code{background:#0b1120;border:1px solid #1c2740;border-radius:4px;padding:1px 4px;font-size:11.5px}',
    '.aiM strong{color:#fff}',
    '#aiGoi{flex:0 0 auto;display:flex;gap:6px;padding:0 12px 8px;flex-wrap:wrap}',
    '#aiGoi button{background:#141d31;color:#9fb0d4;border:1px solid #1c2740;border-radius:14px;',
      'font-size:11px;padding:5px 10px;cursor:pointer;text-align:left}',
    '#aiGoi button:hover{border-color:#4f8cff;color:#e8edf7}',
    '#aiBot{flex:0 0 auto;display:flex;gap:7px;padding:9px 12px;border-top:1px solid #1c2740;background:#0b1120}',
    '#aiIn{flex:1;background:#0e1525;color:#e8edf7;border:1px solid #1c2740;border-radius:9px;padding:8px 10px;',
      'font:13px "Segoe UI",system-ui,sans-serif;resize:none;max-height:110px;min-height:38px}',
    '#aiIn:focus{outline:none;border-color:#4f8cff}',
    '#aiGui{background:#e2b33b;color:#1a1405;border:none;border-radius:9px;font:700 13px "Segoe UI",sans-serif;',
      'padding:0 15px;cursor:pointer}',
    '#aiGui:disabled{background:#2a3350;color:#7e8db0;cursor:default}',
    '.aiNhay::after{content:"▌";animation:aiNhay 1s steps(2) infinite;color:#e2b33b}',
    '@keyframes aiNhay{50%{opacity:0}}',
    '@media(max-width:560px){#aiWrap{right:8px;bottom:8px;width:calc(100vw - 16px);height:calc(100vh - 20px)}}'
  ].join('');
  document.head.appendChild(css);

  var fab = document.createElement('button');
  fab.id = 'aiFab'; fab.innerHTML = '<span>✦</span><span>Trợ lý AI</span>';
  var wrap = document.createElement('div');
  wrap.id = 'aiWrap';
  wrap.innerHTML =
    '<div id="aiTop"><b>TRỢ LÝ AI</b>' +
      '<select id="aiMuc" title="Mức suy luận">' +
        '<option value="can" selected>Cân bằng</option>' +
        '<option value="nhanh">Nhanh</option>' +
        '<option value="sau">Suy luận sâu</option></select>' +
      '<button id="aiXoa" title="Xoá hội thoại">⟳</button>' +
      '<button id="aiDong" title="Đóng">✕</button></div>' +
    '<div id="aiCtx"></div><div id="aiBody"></div><div id="aiGoi"></div>' +
    '<div id="aiBot"><textarea id="aiIn" rows="1" placeholder="Hỏi về số liệu đang hiện trên trang…"></textarea>' +
      '<button id="aiGui">Gửi</button></div>';
  document.body.appendChild(fab); document.body.appendChild(wrap);

  var $ = function (id) { return document.getElementById(id); };
  var body = $('aiBody'), inp = $('aiIn'), gui = $('aiGui');
  var hoiDap = [], dangChay = false;

  /* ── bối cảnh ─────────────────────────────────────────────── */
  function tuDongDoc() {
    var goc = document.querySelector('.wrap') || document.body;
    var t = (goc.innerText || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    return t;
  }
  function layBoiCanh() {
    var t = '';
    try { if (typeof window.AI_BOICANH === 'function') t = String(window.AI_BOICANH() || ''); } catch (e) {}
    var tuDong = !t;
    if (tuDong) t = tuDongDoc();
    var cat = t.length > TRAN_BOICANH;
    return { text: cat ? t.slice(0, TRAN_BOICANH) + '\n…(đã cắt bớt)' : t, tuDong: tuDong, cat: cat };
  }
  function veCtx() {
    var c = layBoiCanh();
    $('aiCtx').innerHTML = c.text
      ? 'Đang đọc <b>' + c.text.length.toLocaleString('vi-VN') + ' ký tự</b> số liệu từ trang ' + TRANG +
        (c.tuDong ? ' (tự đọc nội dung hiển thị)' : ' (bảng số liệu của trang)') +
        (c.cat ? ' · đã cắt bớt cho vừa' : '') +
        ' · AI chỉ dùng số trong đây, thiếu thì nó nói thiếu'
      : '⚠ Trang chưa có số liệu nào để đọc — chờ dữ liệu tải xong rồi mở lại.';
    return c.text;
  }

  /* ── markdown tối giản ────────────────────────────────────── */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function md(s) {
    var d = esc(s)
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    var ra = [], ul = null;
    d.split('\n').forEach(function (l) {
      var m = l.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
      if (m) { if (!ul) { ul = []; ra.push(ul); } ul.push(m[1]); return; }
      ul = null;
      if (/^#{1,6}\s/.test(l)) ra.push({ h: l.replace(/^#{1,6}\s*/, '') });
      else if (l.trim()) ra.push({ p: l });
    });
    return ra.map(function (x) {
      if (Array.isArray(x)) return '<ul>' + x.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';
      return x.h ? '<h4>' + x.h + '</h4>' : '<p>' + x.p + '</p>';
    }).join('');
  }

  function theM(loai, chu) {
    var d = document.createElement('div');
    d.className = 'aiM ' + loai;
    d.innerHTML = loai === 'a' ? md(chu) : esc(chu);
    body.appendChild(d); body.scrollTop = body.scrollHeight;
    return d;
  }

  /* ── gợi ý ────────────────────────────────────────────────── */
  function veGoiY() {
    var g = $('aiGoi');
    if (hoiDap.length) { g.innerHTML = ''; return; }
    var ds = (window.AI_GOI_Y && window.AI_GOI_Y.length) ? window.AI_GOI_Y : [
      'Tóm tắt những gì đáng chú ý nhất trên trang này',
      'Số nào trên trang đang mâu thuẫn với nhau?',
      'Rủi ro lớn nhất mà số liệu này đang chỉ ra là gì?'
    ];
    g.innerHTML = '';
    ds.slice(0, 4).forEach(function (q) {
      var b = document.createElement('button');
      b.textContent = q;
      b.onclick = function () { inp.value = q; batDau(); };
      g.appendChild(b);
    });
  }

  /* ── lưu / nạp ────────────────────────────────────────────── */
  function luu() { try { localStorage.setItem(KHOA, JSON.stringify(hoiDap.slice(-16))); } catch (e) {} }
  function nap() {
    try {
      var a = JSON.parse(localStorage.getItem(KHOA) || '[]');
      if (Array.isArray(a)) { hoiDap = a; a.forEach(function (m) { theM(m.role === 'user' ? 'u' : 'a', m.content); }); }
    } catch (e) {}
  }

  /* ── gọi API ──────────────────────────────────────────────── */
  async function batDau() {
    var q = inp.value.trim();
    if (!q || dangChay) return;
    inp.value = ''; inp.style.height = 'auto';
    dangChay = true; gui.disabled = true; gui.textContent = '…';
    hoiDap.push({ role: 'user', content: q }); theM('u', q); veGoiY();

    var oA = theM('a', ''); oA.classList.add('aiNhay');
    var ra = '';
    try {
      var r = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hoiDap: hoiDap, boiCanh: layBoiCanh().text, trang: document.title, muc: $('aiMuc').value })
      });
      if (!r.ok || (r.headers.get('content-type') || '').indexOf('event-stream') < 0) {
        var j = null; try { j = await r.json(); } catch (e) {}
        oA.remove();
        theM('e', (j && j.loi ? j.loi : 'Gọi /api/ai lỗi ' + r.status) +
          (j && j.huongDan ? '\n\n' + j.huongDan : '') + (j && j.chiTiet ? '\n' + j.chiTiet : ''));
        return;
      }
      var rd = r.body.getReader(), dec = new TextDecoder(), dem = '';
      for (;;) {
        var b = await rd.read(); if (b.done) break;
        dem += dec.decode(b.value, { stream: true });
        var khoi = dem.split('\n\n'); dem = khoi.pop();
        for (var i = 0; i < khoi.length; i++) {
          var dl = khoi[i].split('\n').filter(function (l) { return l.indexOf('data:') === 0; });
          for (var k = 0; k < dl.length; k++) {
            var o = null; try { o = JSON.parse(dl[k].slice(5).trim()); } catch (e) { continue; }
            if (o.type === 'content_block_delta' && o.delta && o.delta.text) {
              ra += o.delta.text; oA.innerHTML = md(ra); body.scrollTop = body.scrollHeight;
            } else if (o.type === 'error' && o.error) {
              ra += '\n\n[lỗi: ' + (o.error.message || '') + ']';
            }
          }
        }
      }
      oA.classList.remove('aiNhay');
      if (!ra.trim()) { oA.remove(); theM('e', 'AI không trả về nội dung nào.'); }
      else { oA.innerHTML = md(ra); hoiDap.push({ role: 'assistant', content: ra }); luu(); }
    } catch (e) {
      oA.classList.remove('aiNhay');
      if (!ra) { oA.remove(); theM('e', 'Không gọi được trợ lý: ' + (e && e.message || e)); }
    } finally {
      dangChay = false; gui.disabled = false; gui.textContent = 'Gửi';
      body.scrollTop = body.scrollHeight;
    }
  }

  /* ── nối dây ──────────────────────────────────────────────── */
  fab.onclick = function () { wrap.classList.add('mo'); fab.style.display = 'none'; veCtx(); veGoiY(); inp.focus(); };
  $('aiDong').onclick = function () { wrap.classList.remove('mo'); fab.style.display = 'flex'; };
  $('aiXoa').onclick = function () { hoiDap = []; body.innerHTML = ''; luu(); veCtx(); veGoiY(); };
  gui.onclick = batDau;
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); batDau(); }
  });
  inp.addEventListener('input', function () {
    inp.style.height = 'auto'; inp.style.height = Math.min(110, inp.scrollHeight) + 'px';
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && wrap.classList.contains('mo')) $('aiDong').onclick();
  });
  nap();
})();
