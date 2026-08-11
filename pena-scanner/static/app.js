(function () {
  "use strict";

  // DUCKMAN Score criteria (buy side, from RS Duck Man.afl).
  // [key, full label (tooltip / buy-sell page), short label (main table header)]
  var CRITERIA = [
    ["is_ath", "All-Time High", "ATH"],
    ["rs_new_high", "RS 52W High", "RS 52W"],
    ["daily_ma_order", "Dly: MA 5>8>10>21", "D: MA Order"],
    ["weekly_outperform_drop", "Wkly: Drop < Market", "W: RS Drop"],
    ["weekly_rs_divergence", "Wkly: Higher High vs Mkt Low", "W: RS Div"],
    ["weekly_5green", "Wkly: 5+ Green", "W: 5+ Green"],
    ["weekly_tight", "Wkly: 4w Tight", "W: Tight"],
    ["monthly_bigmove", "Mthly: >50% Move", "M: >50%"],
    ["monthly_ma_order", "Mthly: Short MA > Long MA", "M: MA Order"],
  ];
  // Bearish mirror (my own extension, not in the source AFL -- see scanner.py).
  var SELL_CRITERIA = [
    ["is_atl", "All-Time Low", "ATL"],
    ["rs_new_low", "RS 52W Low", "RS 52W"],
    ["daily_ma_order_down", "Dly: MA 5<8<10<21", "D: MA Order"],
    ["weekly_underperform_drop", "Wkly: Drop > Market", "W: RS Drop"],
    ["weekly_rs_divergence_down", "Wkly: Lower Low vs Mkt High", "W: RS Div"],
    ["weekly_5red", "Wkly: 5+ Red", "W: 5+ Red"],
    ["weekly_tight", "Wkly: 4w Tight", "W: Tight"],
    ["monthly_bigdrop", "Mthly: >33% Drop", "M: >33%"],
    ["monthly_ma_order_down", "Mthly: Short MA < Long MA", "M: MA Order"],
  ];

  var state = { sector: "all", query: "", rows: [], polling: null, buysellView: "buy" };

  var els = {
    search: document.getElementById("ticker-search"),
    sectorSelect: document.getElementById("sector-select"),
    rescanBtn: document.getElementById("rescan-btn"),
    status: document.getElementById("scan-status"),
    head: document.getElementById("results-head"),
    body: document.getElementById("results-body"),
    rankBtn: document.getElementById("rank-btn"),
    rankBackBtn: document.getElementById("rank-back-btn"),
    rankSub: document.getElementById("rank-sub"),
    rankBody: document.getElementById("rank-body"),
    viewScanner: document.getElementById("view-scanner"),
    viewBuysell: document.getElementById("view-buysell"),
    viewRank: document.getElementById("view-rank"),
    buysellBtn: document.getElementById("buysell-btn"),
    buysellBackBtn: document.getElementById("buysell-back-btn"),
    buysellSub: document.getElementById("buysell-sub"),
    buysellHead: document.getElementById("buysell-head"),
    buysellBody: document.getElementById("buysell-body"),
    viewSubtabs: document.querySelectorAll(".view-subtab"),
  };

  function scorePillClass(score) {
    return score >= 5 ? "score-pill" : score === 4 ? "score-pill mid" : "score-pill low";
  }

  function fmtInt(n) { return (n === null || n === undefined) ? "—" : Number(n).toLocaleString("en-US"); }
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function fmtDateTime(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + " · " + pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1) + "/" + d.getFullYear();
  }
  function fmtDate(isoDate) {
    if (!isoDate) return "";
    var parts = isoDate.split("-");
    return parts.length === 3 ? parts[2] + "/" + parts[1] + "/" + parts[0] : isoDate;
  }

  /* ---------------- Suc manh CP table (main scanner view) ---------------- */
  function renderHead() {
    var cols = ["#", "Mã CK", "Date/Time", "Close", "Volume", "DUCKMAN"];
    var html = cols.map(function (c) {
      var cls = (c === "Close" || c === "Volume" || c === "DUCKMAN") ? "num" : "";
      return '<th class="' + cls + '">' + c + "</th>";
    }).join("");
    // Short labels keep 15 columns fitting on one desktop screen without a
    // horizontal scrollbar; the full description is still one hover away.
    html += CRITERIA.map(function (c) {
      return '<th class="center" title="' + c[1] + '">' + c[2] + "</th>";
    }).join("");
    els.head.innerHTML = html;
  }

  function renderBody(rows) {
    if (!rows.length) {
      var colspan = 6 + CRITERIA.length;
      var msg = state.query ? "Không tìm thấy mã \"" + state.query + "\"." : "Không có mã nào khớp bộ lọc hiện tại.";
      els.body.innerHTML = '<tr><td class="empty-cell" colspan="' + colspan + '">' + msg + "</td></tr>";
      return;
    }

    var html = rows.map(function (row, i) {
      var score = row.buy_score;
      var scoreCls = scorePillClass(score);
      var flags = row.buy || {};
      var flagCells = CRITERIA.map(function (c) {
        var on = !!flags[c[0]];
        return '<td class="center">' + (on ? '<span class="chk">✓</span>' : '<span class="chk no">—</span>') + "</td>";
      }).join("");

      return (
        '<tr>' +
        '<td class="rank">' + (i + 1) + "</td>" +
        '<td class="ticker">' + row.symbol + "</td>" +
        '<td class="date-cell">' + (row.date || "—") + "</td>" +
        '<td class="num">' + (row.close != null ? row.close.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—") + "</td>" +
        '<td class="num">' + fmtInt(row.volume) + "</td>" +
        '<td class="num"><span class="' + scoreCls + '">' + score + "</span></td>" +
        flagCells +
        "</tr>"
      );
    }).join("");
    els.body.innerHTML = html;
  }

  function applyFilter() {
    var q = state.query.trim().toUpperCase();
    var rows = q ? state.rows.filter(function (r) { return r.symbol.toUpperCase().indexOf(q) !== -1; }) : state.rows;
    renderBody(rows);
  }

  function loadResults() {
    renderHead();
    return fetch("/api/scan?view=strength&sector=" + encodeURIComponent(state.sector))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        state.rows = data.rows;
        applyFilter();
      });
  }

  function loadSectors() {
    return fetch("/api/sectors").then(function (r) { return r.json(); }).then(function (data) {
      var current = els.sectorSelect.value;
      els.sectorSelect.innerHTML = '<option value="all">Tất cả ngành / sàn</option>' +
        data.sectors.map(function (s) { return '<option value="' + s + '">' + s + "</option>"; }).join("");
      if (data.sectors.indexOf(current) !== -1) els.sectorSelect.value = current;
    });
  }

  function fmtEta(seconds) {
    if (seconds == null) return null;
    if (seconds < 90) return Math.round(seconds) + " giây";
    var mins = Math.round(seconds / 60);
    if (mins < 90) return mins + " phút";
    return (mins / 60).toFixed(1) + " giờ";
  }

  function setStatus(progress) {
    var el = els.status;
    if (progress.status === "running") {
      el.className = "scan-status is-running";
      var txt = "⏳ Đang quét " + progress.scanned + "/" + progress.total + " mã";
      if (progress.rate_per_min != null) {
        txt += " · " + progress.rate_per_min + " mã/phút";
      }
      var eta = fmtEta(progress.eta_seconds);
      txt += eta ? " · còn ~" + eta : " · đang đo tốc độ…";
      el.textContent = txt;
    } else if (progress.status === "error") {
      el.className = "scan-status";
      el.textContent = "✗ Lỗi khi quét: " + progress.error;
    } else if (progress.total) {
      el.className = "scan-status";
      el.innerHTML = 'Cập nhật lúc <b>' + fmtDateTime(progress.updated_at || progress.started_at) + "</b>";
    } else {
      el.className = "scan-status";
      el.textContent = "Chưa quét lần nào";
    }
  }

  function pollProgress() {
    fetch("/api/scan/progress").then(function (r) { return r.json(); }).then(function (progress) {
      setStatus(progress);
      if (progress.status === "running") {
        els.rescanBtn.disabled = true;
        loadResults(); // live-fill the table as rows come in, like the reference screenshot
      } else {
        els.rescanBtn.disabled = false;
        if (state.polling) {
          clearInterval(state.polling);
          state.polling = null;
          loadResults();
          loadSectors();
        }
      }
    });
  }

  function startPolling() {
    if (state.polling) return;
    state.polling = setInterval(pollProgress, 2000);
    pollProgress();
  }

  /* ---------------- rank-change modal ---------------- */
  function renderRankRows(rows) {
    if (!rows.length) {
      els.rankBody.innerHTML = '<tr><td class="empty-cell" colspan="6">Không có mã nào xuất hiện ở cả hai phiên để so sánh.</td></tr>';
      return;
    }
    els.rankBody.innerHTML = rows.map(function (r, i) {
      var change = r.rank_change;
      var cls = change > 0 ? "chg-pos" : change < 0 ? "chg-neg" : "chg-flat";
      var arrow = change > 0 ? "▲ " : change < 0 ? "▼ " : "— ";
      var text = change === 0 ? "Không đổi" : arrow + Math.abs(change);
      return (
        '<tr>' +
        '<td class="rank">' + (i + 1) + "</td>" +
        '<td class="ticker">' + r.symbol + "</td>" +
        '<td class="sector-cell">' + (r.sector || "—") + "</td>" +
        '<td class="num">#' + r.prior_rank + "</td>" +
        '<td class="num">#' + r.today_rank + "</td>" +
        '<td class="num ' + cls + '">' + text + "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function loadRankChanges() {
    els.rankSub.textContent = "Đang tải…";
    els.rankBody.innerHTML = "";
    fetch("/api/rank-changes").then(function (r) { return r.json(); }).then(function (data) {
      if (!data.available) {
        els.rankSub.textContent = "Chưa có dữ liệu phiên trước để so sánh — quét lại vào phiên giao dịch tiếp theo sẽ có dữ liệu.";
        els.rankBody.innerHTML = "";
        return;
      }
      els.rankSub.textContent = "So sánh thứ hạng Sức mạnh CP: " + fmtDate(data.prior_date) + " → " + fmtDate(data.today_date) +
        " (" + data.rows.length + " mã có ở cả hai phiên)";
      renderRankRows(data.rows);
    });
  }

  function openRankPage() {
    els.viewScanner.hidden = true;
    els.viewRank.hidden = false;
    loadRankChanges();
  }
  function closeRankPage() {
    els.viewRank.hidden = true;
    els.viewScanner.hidden = false;
  }

  /* ---------------- Diem mua/ban -- full-page view, not a modal ---------------- */
  // Reuses the AFL's own buy_filter/sell_filter + buy_score/sell_score,
  // computed in scanner.py all along -- just not surfaced in the UI since
  // the old Diem MUA/Diem BAN tabs were removed earlier. Clicking the
  // toolbar button swaps #view-scanner out for #view-buysell entirely
  // (both live permanently in the DOM, toggled via the `hidden` attribute)
  // -- no modal/overlay/dialog involved.
  function criteriaForBuySell(view) { return view === "sell" ? SELL_CRITERIA : CRITERIA; }

  function renderBuySellHead(view) {
    var crit = criteriaForBuySell(view);
    var cols = ["#", "Mã CK", "Ngành", "Close", "Volume", view === "sell" ? "ĐIỂM BÁN" : "ĐIỂM MUA"];
    var html = cols.map(function (c, i) {
      return '<th class="' + (i >= 3 ? "num" : "") + '">' + c + "</th>";
    }).join("");
    html += crit.map(function (c) { return '<th class="center">' + c[1] + "</th>"; }).join("");
    els.buysellHead.innerHTML = html;
  }

  function renderBuySellBody(rows, view) {
    var crit = criteriaForBuySell(view);
    var totalCols = 6 + crit.length;
    var label = view === "sell" ? "Điểm BÁN" : "Điểm MUA";
    if (!rows.length) {
      els.buysellBody.innerHTML = '<tr><td class="empty-cell" colspan="' + totalCols + '">Không có mã nào khớp bộ lọc ' + label + " hiện tại.</td></tr>";
      return;
    }
    var scoreKey = view === "sell" ? "sell_score" : "buy_score";
    var dataKey = view === "sell" ? "sell" : "buy";
    els.buysellBody.innerHTML = rows.map(function (r, i) {
      var score = r[scoreKey];
      var flags = r[dataKey] || {};
      var flagCells = crit.map(function (c) {
        var on = !!flags[c[0]];
        return '<td class="center">' + (on ? '<span class="chk">✓</span>' : '<span class="chk no">—</span>') + "</td>";
      }).join("");
      return (
        '<tr>' +
        '<td class="rank">' + (i + 1) + "</td>" +
        '<td class="ticker">' + r.symbol + "</td>" +
        '<td class="sector-cell">' + (r.sector || "—") + "</td>" +
        '<td class="num">' + (r.close != null ? r.close.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—") + "</td>" +
        '<td class="num">' + fmtInt(r.volume) + "</td>" +
        '<td class="num"><span class="' + scorePillClass(score) + '">' + score + "</span></td>" +
        flagCells +
        "</tr>"
      );
    }).join("");
  }

  function loadBuySellView() {
    var view = state.buysellView;
    renderBuySellHead(view);
    els.buysellSub.textContent = "Đang tải…";
    fetch("/api/scan?view=" + encodeURIComponent(view) + "&sector=all")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var label = view === "sell" ? "Điểm BÁN" : "Điểm MUA";
        els.buysellSub.textContent = data.count + " mã đạt " + label + " · Filter gốc AFL (thanh khoản + điều kiện kỹ thuật hội tụ)";
        renderBuySellBody(data.rows, view);
      });
  }

  function openBuySellPage() {
    els.viewScanner.hidden = true;
    els.viewBuysell.hidden = false;
    loadBuySellView();
  }
  function closeBuySellPage() {
    els.viewBuysell.hidden = true;
    els.viewScanner.hidden = false;
  }

  els.search.addEventListener("input", function () {
    state.query = els.search.value;
    applyFilter();
  });

  els.sectorSelect.addEventListener("change", function () {
    state.sector = els.sectorSelect.value;
    loadResults();
  });

  els.rescanBtn.addEventListener("click", function () {
    fetch("/api/rescan", { method: "POST" }).then(function (r) {
      if (r.ok) startPolling();
    });
  });

  els.rankBtn.addEventListener("click", openRankPage);
  els.rankBackBtn.addEventListener("click", closeRankPage);

  els.buysellBtn.addEventListener("click", openBuySellPage);
  els.buysellBackBtn.addEventListener("click", closeBuySellPage);
  els.viewSubtabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      els.viewSubtabs.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      state.buysellView = btn.dataset.view;
      loadBuySellView();
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!els.viewRank.hidden) closeRankPage();
    if (!els.viewBuysell.hidden) closeBuySellPage();
  });

  // initial load
  loadSectors();
  loadResults();
  pollProgress();
})();
