---
name: rnav-valuation
description: Định giá doanh nghiệp bất động sản Việt Nam bằng RNAV theo phương pháp Sum-of-the-Parts (định giá từng dự án bằng DCF/Book Value/PE rồi cộng lại, điều chỉnh tiền & nợ vay). Dùng khi định giá chủ đầu tư BĐS nặng tài sản (KDH, NLG, DXG, NVL, PDR, HDC...), khi giá trị nằm ở quỹ đất chưa tạo dòng tiền, hoặc khi cần đối chiếu giá mục tiêu của các CTCK. Bao gồm cả các bẫy đặc thù thị trường VN (lãi mua rẻ một lần, liên doanh, lợi nhuận đáy làm P/E vô nghĩa, quỹ đất distressed cần chiết khấu, franchise premium).
---

# RNAV Valuation — Bất động sản Việt Nam (Sum-of-the-Parts)

## Tổng quan

Với chủ đầu tư BĐS, phần lớn giá trị nằm trong **quỹ đất/tồn kho chưa tạo dòng tiền** — nên DCF trên dòng tiền hoạt động hiện tại và EV/EBITDA **định giá thấp một cách có hệ thống**. Phương pháp chuẩn là **RNAV (Revalued Net Asset Value) theo Sum-of-the-Parts (SOTP)**: định giá **từng dự án** bằng phương pháp phù hợp, cộng lại, rồi cầu nối sang vốn chủ.

> **Bài học cốt lõi: "RNAV ≠ RNAV".** Cùng tên nhưng hai cách tính cho kết quả rất khác:
> - **RNAV-SOTP (chuẩn CTCK):** tổng NPV/DCF từng dự án → ăn trọn biên phát triển ~30–40% → giá cao.
> - **RNAV proxy (book + % uplift):** vốn chủ sổ sách + % đánh giá lại tồn kho → thận trọng, nhanh, nhưng thấp hơn nhiều.
> Luôn nêu rõ đang dùng cách nào.

## Khi nào dùng RNAV (và khi nào KHÔNG)

| Hồ sơ doanh nghiệp | Neo định giá |
|---|---|
| Chủ đầu tư nặng tài sản, ROE thấp/vừa (KDH, NLG, DXG, PDR, HDC) | **RNAV-SOTP là chính** + P/B cross-check |
| ROE cao / franchise / tăng trưởng mạnh (VHM, VIC) | **P/E + tăng trưởng là chính**, RNAV chỉ tham chiếu (RNAV thường < giá vì không bắt được franchise premium) |
| KCN cho thuê / dòng tiền định kỳ (IDC) | **P/E + EV/EBITDA**, RNAV phụ (đất ghi ở dở dang, mô hình cho thuê không hợp giá bán/m²) |
| Distressed (NVL — P/B < 1, pháp lý/thanh khoản kém) | RNAV với **uplift = 0 hoặc CHIẾT KHẤU âm**; P/B 0,67 = thị trường đã haircut book |

## Quy trình RNAV-SOTP (chuẩn, ví dụ MBS định giá DXG)

**Bước 1 — Phân loại từng dự án và chọn phương pháp:**

| Trạng thái dự án | Phương pháp |
|---|---|
| Đã có quy hoạch 1/500, đang triển khai / đóng tiền sử dụng đất | **DCF** (NPV dòng tiền dự án) |
| Chưa có 1/500 | **Giá trị sổ sách (BV)** |
| Mảng dịch vụ định kỳ (môi giới, cho thuê) | **P/E** (vd môi giới DXS: PE 8× theo TB 4 năm) |

**Bước 2 — DCF cho mỗi dự án (mở bán → bàn giao):**
```
Doanh thu      = Diện tích sàn thương phẩm (NSA) × Giá bán/m²
(-) Giá vốn    = tiền đất + chi phí xây dựng + lãi vốn hóa (≈ giá vốn/m² × NSA)
(-) CP bán hàng (~4–5% DT) − CP quản lý (~2–3% DT)
= LN trước thuế → (-) Thuế TNDN 20% → LN ròng dự án
NPV dự án      = chiết khấu dòng lợi nhuận về hiện tại theo WACC, × tỷ lệ sở hữu
```
Biên ròng dự án căn hộ HCMC thường ~25–32%. Lợi nhuận **ghi nhận khi bàn giao** (thường sau 1–2 năm), KHÔNG vào năm ký bán.

**Bước 3 — Cộng các phần + cầu nối vốn chủ:**
```
Tổng giá trị các dự án (ΣNPV + ΣBV + Σ mảng dịch vụ)
(+) Tiền & tương đương tiền   (+) Đầu tư ngắn hạn
(-) Nợ vay  (chỉ trừ nợ của các dự án tính theo BV để tránh trừ 2 lần với dự án DCF)
= RNAV (tỷ đồng)
÷ Số cổ phiếu lưu hành  → RNAV/cp
```
*(Đơn vị thường: tài chính = tỷ VND, giá/cp = VND, số cp = triệu. RNAV/cp = RNAV(tỷ) / shares(triệu) × 1.000.)*

## WACC (CAPM) — tham số thị trường VN

```
Cost of Equity = Rf + Beta × ERP
  Rf (lãi phi rủi ro, TPCP 10Y VN): ~4,0–5,0%
  ERP (phần bù vốn CP VN):          ~7,0–8,0%   (cao hơn thị trường phát triển)
  Beta:                              ~1,0–1,3 (BĐS chu kỳ cao hơn)
WACC = Ke × tỷ trọng VCSH + Kd(sau thuế) × tỷ trọng nợ
```
WACC chủ đầu tư BĐS VN thực tế trong các báo cáo: **~11,6–13,6%** (ACBS KDH 11,7%; MBS DXG 13,6%). Tăng trưởng dài hạn g khi dùng terminal value: 2,5–3,5%.

## RNAV proxy nhanh (khi chưa có số từng dự án)

```
RNAV ≈ Vốn chủ sổ sách (công ty mẹ) + Tồn kho(quỹ đất) × uplift% × (1−thuế) × sở hữu hiệu dụng%
```
**Uplift theo CHẤT LƯỢNG quỹ đất, KHÔNG cào bằng:**
- Đất sạch nội đô / giá vốn thấp (KDH, NLG): **+40–60%**
- Execution risk (DXG, PDR): **+20–30%**
- Book đã cao / franchise (VHM, VIC): **+10–15%** (và RNAV không phải neo chính)
- Distressed (NVL): **0% hoặc âm**

⚠️ Proxy này cho kết quả **thấp hơn** SOTP đầy đủ (uplift đơn giản không bắt được trọn biên phát triển). Để tiệm cận SOTP, uplift hàm ý có thể tới ~70–90% cho dự án sắp bán hết biên cao — đó là dấu hiệu nên chuyển sang DCF từng dự án.

## Tổng hợp giá mục tiêu (blend)

Các CTCK thường pha:
- **MBS:** RNAV thuần (SOTP) → DXG 20.800đ
- **DSC:** RNAV + P/B (50/50) → DXG 17.700đ
- **ACBS:** RNAV + mô hình lợi nhuận dự phóng (P/E forward) → KDH 34.100đ

Khi blend, dùng **lợi nhuận DỰ PHÓNG (2026F/2027F), không phải EPS đáy/hiện tại**, và **P/B mục tiêu = trung bình 5 năm** của chính mã đó (không phải 1,0×).

## ⚠️ Các bẫy đặc thù thị trường VN (PHẢI kiểm tra)

1. **Lãi một lần làm đẹp lợi nhuận:** lãi mua rẻ (KDH +285 tỷ từ An Lập), chuyển nhượng dự án (HPG +3.800 tỷ Phố Nối). Bóc tách để lấy **lợi nhuận lõi**; LNST "+131%/+170%" có thể che lõi đi ngang/giảm.
2. **Liên doanh → chia lợi ích cổ đông thiểu số:** KDH × Keppel (Đoàn Nguyên 50,85% / Bình Trưng Mới 50,95%) → ~49% lãi thuộc NCI. "Lãi về công ty mẹ" = lãi dự án × tỷ lệ sở hữu.
3. **Lợi nhuận đáy làm P/E vô nghĩa:** DXG P/E 73, PDR P/E 25 — đừng dùng P/E TTM làm neo cho mã đang ở đáy chu kỳ; ưu tiên RNAV/P/B.
4. **Quỹ đất distressed:** tồn kho lớn (NVL ~155.000 tỷ) không có nghĩa giá trị lớn — pháp lý/thanh khoản kém; thị trường định P/B < 1. Dùng uplift 0 hoặc chiết khấu.
5. **Franchise premium:** VHM/VIC giao dịch 2×+ book vì lợi nhuận & tăng trưởng — RNAV thuần sẽ kêu "đắt" (sai bản chất). VIC cần SOTP có VinFast (hạch toán ở TSCĐ, KHÔNG phải tồn kho).
6. **Đòn bẩy:** kiểm Nợ ròng/VCSH và Nợ ròng/EBITDA so trung vị ngành (KDH Q1/2026 lên 53,5% và 5,6× — cao hơn ngành).

## Output chuẩn

- Bảng SOTP: từng dự án | phương pháp | tỷ lệ sở hữu | NPV/giá trị (tỷ)
- Cầu nối: Σ dự án (+) tiền (+) ĐTNH (−) nợ vay = RNAV → RNAV/cp
- Giá mục tiêu (blend nếu có) + Upside vs giá hiện tại
- Khuyến nghị: Upside ≥ +15% → MUA · −15%…+15% → KHẢ QUAN/THEO DÕI · ≤ −15% → BÁN
- Nêu rõ phương pháp, WACC, và các khoản một lần đã bóc tách

## Tham chiếu (giá mục tiêu CTCK, T5–6/2026)
- KDH: ACBS **34.100** (MUA) — RNAV + LN dự phóng, WACC 11,7%
- DXG: MBS **20.800** (Khả quan) — RNAV-SOTP, WACC 13,6% · DSC **17.700** (Mua) — RNAV+P/B 50/50
