/* Bối cảnh gửi cho trợ lý AI ở trang Tổng quan.
   Trang này có hai thứ không trang nào khác có: bảng thị trường QUỐC TẾ và
   dòng tin RSS. Gửi thẳng từ biến dữ liệu thay vì để widget đọc chữ trên màn
   hình — chữ hiển thị bị cắt bởi hiệu ứng chạy ngang nên đọc không đủ. */
(function () {
  var so2 = function (n) { return (n == null || !isFinite(n)) ? '—' : (n >= 0 ? '+' : '') + n.toFixed(2) + '%'; };

  function thiTruongQuocTe() {
    if (typeof GLOBAL === 'undefined' || typeof gmData === 'undefined') return '';
    var ra = [];
    for (var i = 0; i < GLOBAL.length; i++) {
      var g = GLOBAL[i], c = [];
      for (var k = 0; k < g.items.length; k++) {
        var sym = g.items[k][0], ten = g.items[k][1], d = gmData[sym];
        if (!d) continue;
        // >3 giờ không có nhịp giá mới = sàn đang đóng, % là của PHIÊN TRƯỚC
        var dong = d.t && (Date.now() - d.t * 1000) > 3 * 3600e3;
        var ngay = d.t ? new Date((d.t + 7 * 3600) * 1000).toISOString().slice(5, 10).split('-').reverse().join('/') : '';
        c.push(ten + ' ' + (d.price != null ? d.price : '—') + ' ' + so2(d.pct)
          + (d.stale ? ' (số cũ, lỗi tải)' : (dong ? ' (sàn đã đóng, số phiên ' + ngay + ')' : '')));
      }
      if (c.length) ra.push(g.grp + ': ' + c.join(' · '));
    }
    return ra.length ? 'THỊ TRƯỜNG QUỐC TẾ (Yahoo Finance)\n' + ra.join('\n') : '';
  }

  function dongTin() {
    if (typeof newsItems === 'undefined' || !newsItems.length) return '';
    var gio = function (t) {
      return t ? new Date(t * 1000).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '';
    };
    var trong = [], ngoai = [];
    for (var i = 0; i < newsItems.length && (trong.length + ngoai.length) < 60; i++) {
      var n = newsItems[i];
      var d = '· ' + gio(n.t) + ' [' + ((n.src && n.src.name) || n.src || '?') + '] ' + String(n.title || '').slice(0, 160);
      (n.intl ? ngoai : trong).push(d);
    }
    var p = [];
    if (trong.length) p.push('TIN TRONG NƯỚC (' + trong.length + ' tin gần nhất, RSS CafeF/Vietstock/TNCK/VnEconomy)\n' + trong.join('\n'));
    if (ngoai.length) p.push('TIN QUỐC TẾ (' + ngoai.length + ' tin, CNBC/MarketWatch)\n' + ngoai.join('\n'));
    return p.join('\n\n');
  }

  function bangDien() {
    if (typeof wlData === 'undefined') return '';
    var c = [];
    for (var tk in wlData) {
      var d = wlData[tk];
      if (!d || d.close == null) continue;
      c.push(tk + ' ' + d.close + ' ' + so2(d.pctChange));
    }
    return c.length ? 'BẢNG ĐIỆN MÃ THEO DÕI (' + c.length + ' mã)\n' + c.join(' · ') : '';
  }

  window.AI_BOICANH = function () {
    var p = ['== TRANG TỔNG QUAN KKINVEST · ' + new Date().toLocaleString('vi-VN') + ' =='];
    var qt = thiTruongQuocTe(); if (qt) p.push(qt);
    var bd = bangDien(); if (bd) p.push(bd);
    var tin = dongTin(); if (tin) p.push(tin);

    if (p.length === 1) p.push('Dữ liệu chưa tải xong — đừng suy diễn, hãy nói là trang chưa có số.');

    // kèm cả chữ đang hiện, phòng khi có khối nào chưa được gom ở trên
    var ds = document.querySelectorAll('.wrap'), t = '';
    for (var i = 0; i < ds.length; i++) t += (ds[i].innerText || '') + '\n\n';
    t = t.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    if (t) p.push('== CHỮ ĐANG HIỆN TRÊN TRANG ==\n' + t.slice(0, 20000));

    return p.join('\n\n');
  };

  window.AI_GOI_Y = [
    'Thị trường quốc tế đêm qua tác động gì tới phiên hôm nay?',
    'Tin nào trong ngày đáng chú ý nhất với nhà đầu tư Việt Nam?',
    'Chứng khoán Mỹ, châu Á, hàng hoá đang cùng chiều hay ngược chiều?',
    'Tổng hợp bức tranh thị trường lúc này, ngắn gọn'
  ];
})();
