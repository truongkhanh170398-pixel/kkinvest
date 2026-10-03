/* Bối cảnh gửi cho trợ lý AI ở trang Radar dòng tiền.
   Radar có thể giữ hàng chục nghìn dòng lệnh → không gửi thô, mà tóm thành
   đúng những con số AI cần: cân mua/bán, xếp hạng mã, xếp hạng ngành, lệnh lớn nhất. */
(function () {
  var T = function (v) { return Math.round(v / 1e8) / 10; };   // ra tỷ, 1 số thập phân

  function gom(keyOf) {
    var m = {};
    for (var i = 0; i < EVT.length; i++) {
      var e = EVT[i], k = keyOf(e);
      if (!k) continue;
      var o = m[k] || (m[k] = { mua: 0, ban: 0, n: 0 });
      if (e.dir === 'B') o.mua += e.val; else o.ban += e.val;
      o.n++;
    }
    return Object.keys(m).map(function (k) {
      var o = m[k];
      return { ten: k, muaTy: T(o.mua), banTy: T(o.ban), rongTy: T(o.mua - o.ban), soLenh: o.n };
    }).sort(function (a, b) { return Math.abs(b.rongTy) - Math.abs(a.rongTy); });
  }

  window.AI_BOICANH = function () {
    var p = [];
    var ngay = (document.getElementById('selDay') && document.getElementById('selDay').value) || '?';
    var nguong = (document.getElementById('selTh') && document.getElementById('selTh').value) || '?';

    p.push('== RADAR DÒNG TIỀN · phiên ' + ngay + ' ==');
    p.push('Nguồn đang dùng: ' + ((SOURCE && SOURCE.label) || '?') +
      ' · ngưỡng lọc ' + nguong + ' tỷ/lệnh' +
      ' · gộp thời gian: ' + (SOURCE === SRC_DNSE ? 'KHÔNG (từng lệnh đơn lẻ)'
        : (+ND.gop ? ND.gop + ' giây' : 'không gộp')) +
      ' · đã loại thỏa thuận và ATC.');

    if (!window.EVT || !EVT.length) {
      p.push('Hiện CHƯA bắt được lệnh lớn nào trong phiên này. Đừng suy diễn — hãy nói thẳng là trang chưa có dữ liệu.');
    } else {
      var mua = 0, ban = 0, ma = {};
      for (var i = 0; i < EVT.length; i++) {
        if (EVT[i].dir === 'B') mua += EVT[i].val; else ban += EVT[i].val;
        ma[EVT[i].tk] = 1;
      }
      p.push('Tổng: ' + EVT.length + ' lệnh lớn · mua chủ động ' + T(mua) + ' tỷ · bán chủ động ' +
        T(ban) + ' tỷ · ròng ' + T(mua - ban) + ' tỷ · ' + Object.keys(ma).length + ' mã.');

      p.push('Theo MÃ (xếp theo |ròng|, 25 mã đầu):\n' +
        JSON.stringify(gom(function (e) { return e.tk; }).slice(0, 25)));

      p.push('Theo NGÀNH:\n' +
        JSON.stringify(gom(function (e) { return SEC_OF[e.tk] || 'Khác'; })));

      var to = EVT.slice().sort(function (a, b) { return b.val - a.val; }).slice(0, 15)
        .map(function (e) {
          return { luc: vnTime(e.t), ma: e.tk, chieu: e.dir === 'B' ? 'mua' : 'bán',
                   giaTriTy: T(e.val), gia: e.px, kl: e.vol };
        });
      p.push('15 lệnh GIÁ TRỊ LỚN NHẤT phiên:\n' + JSON.stringify(to));
    }

    if (window.ND && ND.data) {
      p.push('Dòng tiền theo nhóm nhà đầu tư (sàn ' + (SAN[ND.code] || ND.code) +
        '), mới→cũ:\n' + JSON.stringify(ND.data).slice(0, 14000));
    } else {
      p.push('Panel nhóm nhà đầu tư chưa tải — trang không có số khối ngoại/tự doanh lúc này.');
    }

    var box = document.querySelector('.wrap');
    if (box) p.push('== CHỮ ĐANG HIỆN TRÊN TRANG ==\n' +
      (box.innerText || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 22000));

    return p.join('\n\n');
  };

  window.AI_GOI_Y = [
    'Tiền lớn phiên nay chảy vào ngành nào, rút khỏi ngành nào?',
    'Mã nào có lệnh mua lớn dồn dập nhưng giá chưa chạy?',
    'Khối ngoại và lệnh lớn đang cùng chiều hay ngược chiều?',
    'Lệnh lớn nhất phiên nằm ở mã nào, đọc được gì từ nó?'
  ];
})();
