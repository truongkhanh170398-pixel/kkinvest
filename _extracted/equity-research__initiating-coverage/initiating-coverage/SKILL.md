---
name: initiating-coverage
description: Create institutional-quality equity research initiation reports through a 5-task workflow that runs end-to-end automatically - (1) company research, (2) financial modeling, (3) valuation analysis, (4) chart generation, (5) final report assembly. Tasks chain in dependency order; missing prerequisites are auto-run. Each task produces specific deliverables (markdown docs, Excel models, charts, or DOCX reports).
---

# Initiating Coverage

Create institutional-quality equity research initiation reports through a structured 5-task workflow that runs end-to-end automatically, each task verifying (and auto-running) its prerequisites.

## Overview

This skill produces comprehensive first-time coverage reports following institutional standards (JPMorgan, Goldman Sachs, Morgan Stanley format). Tasks are chained automatically in dependency order, each verifying (and auto-running) prerequisites before proceeding.

**Default Font**: Times New Roman throughout all documents (unless user specifies otherwise).

---

## ✅ AUTO-PIPELINE MODE: Run All Tasks End-to-End

**THIS SKILL OPERATES IN AUTO-PIPELINE MODE.**

When the user asks for an initiation report (or any request implying the full
workflow), execute **all 5 tasks automatically, in dependency order, without
pausing to ask which task to run or waiting for confirmation between tasks.**

### If User Requests Full Pipeline

When user requests:
- "Create a coverage initiation report for [Company]"
- "Write an initiation report for [Company]"
- "Do the entire equity research process for [Company]"
- "Complete all 5 tasks for [Company]"
- Any request that implies running multiple tasks or the entire workflow

**REQUIRED RESPONSE:**

1. Confirm the target company/ticker (only thing needed to start).
2. Execute Task 1 → Task 2 → Task 3 → Task 4 → Task 5 in sequence, automatically.
3. Before each dependent task, run the prerequisite verification. If a
   prerequisite output is missing, **auto-run the missing prerequisite task
   first**, then continue — do NOT stop to ask the user.
4. Deliver each task's outputs as they complete, then proceed to the next task
   without waiting for a new user request.
5. Only stop to ask the user when a genuine blocker exists (e.g., no access to
   any financial data at all, or the user explicitly asked to review a stage).

### Task Execution Rules

- ✅ Execute all 5 tasks per request, in dependency order
- ✅ Verify prerequisites before each task; auto-run any missing prerequisite
- ✅ Deliver each task's outputs, then continue to the next task automatically
- ✅ Chain tasks together end-to-end
- ❌ Do not ask "which task" or wait for confirmation between tasks
- ❌ Do not execute Tasks 3-5 without their required inputs — generate them first

### ⚠️ Deliverables Policy: NO SHORTCUTS

**DELIVER ONLY THE SPECIFIED OUTPUTS. DO NOT CREATE EXTRA DOCUMENTS.**

Each task specifies exact deliverables. Do NOT create:
- ❌ "Completion summaries"
- ❌ "Executive summaries"
- ❌ "Quick reference guides"
- ❌ "Next steps documents"
- ❌ "Task completion reports"
- ❌ Any other "helpful" documentation not explicitly specified

**Why**: These extras waste context and are not part of the professional workflow.

**What TO deliver**:
- ✅ Task 1: Research document (.md) — **NOTHING ELSE**
- ✅ Task 2: Financial model (.xlsx) — **NOTHING ELSE**
- ✅ Task 3: Valuation analysis (.md) + Excel tabs added to Task 2 file — **NOTHING ELSE**
- ✅ Task 4: Charts zip file (.zip) — **NOTHING ELSE**
- ✅ Task 5: Final report (.docx) — **NOTHING ELSE**

**If a deliverable is not listed above, DO NOT CREATE IT.**

---

## Task Selection

Select which task to execute:

| Task | Name | Prerequisites | Output |
|------|------|--------------|--------|
| **1** | Company Research | Company name/ticker | 6-8K word document |
| **2** | Financial Modeling | 10-K or financials access | Excel model (6 tabs) |
| **3** | Valuation Analysis | Financial model (Task 2) | Valuation + price target |
| **4** | Chart Generation | Tasks 1, 2, 3 + external data | 25-35 PNG/JPG charts |
| **5** | Report Assembly | ALL previous tasks (1-4) | 30-50 page DOCX report |

---

## How to Use This Skill

### User Request Patterns and Responses

**Pattern 1: User specifies a specific task**
```
User: "Use initiating-coverage, Task 1 for Tesla"
Response: ✅ Execute that single task immediately
```

**Pattern 2: User asks for "initiation report" or "full pipeline"**
```
User: "Create a coverage initiation report for Tesla"
Response: ✅ Run the full pipeline (Tasks 1→5) automatically for Tesla
```

**Pattern 3: User wants to do "all tasks" or "entire workflow"**
```
User: "I want to complete all 5 tasks for Tesla"
Response: ✅ Chain Tasks 1→5 end-to-end automatically, delivering each output
```

### Correct Usage Examples

**Executing a single task:**
```
"Use initiating-coverage skill, Task 1 for Tesla"
"Do Task 2 of initiating-coverage for Tesla"
"Run Task 3 for Tesla using the initiating-coverage skill"
```

**Completing full report (single request, auto-chained):**
```
Request: "Create an initiation report for Tesla" → run Tasks 1→5 automatically
Task 1 → Deliver outputs → Task 2 → Deliver outputs → Task 3 → ... → Task 5
```

### Task Execution Order

For a complete initiation report, run all tasks in one request, chained
automatically in this dependency order:

```
Task 1 - Company Research (independent)
           ↓ [auto-continue]
Task 2 - Financial Modeling (independent)
           ↓ [auto-continue]
Task 3 - Valuation Analysis (requires Task 2 output)
           ↓ [auto-continue]
Task 4 - Chart Generation (requires Tasks 2 & 3 outputs)
           ↓ [auto-continue]
Task 5 - Report Assembly (requires ALL previous task outputs)
```

**Note**: Tasks 1 and 2 can be run in any order. Tasks 3-5 have strict dependencies and must verify inputs before proceeding.

---

## Task 1: Company Research

**Purpose**: Research company's business, management, competitive position, industry, and risks.

**Prerequisites**: ✅ None (fully independent)
- Company name or ticker symbol

**Process**:
1. Verify company name/ticker provided
2. Load detailed instructions from references/task1-company-research.md
3. Execute qualitative research workflow
4. Deliver research document

**Output**: Company Research Document (6,000-8,000 words)
- Company overview & history
- Management bios (300-400 words × 3-4 execs)
- Products & services analysis
- Industry overview
- Competitive analysis (5-10 competitors)
- TAM sizing
- Risk assessment (8-12 risks)

**File name**: `[Company]_Research_Document_[Date].md`

**⚠️ DELIVER ONLY THIS 1 FILE. NO completion summaries, no extra documents.**

**⚠️ DO NOT TAKE SHORTCUTS:**
- ✅ Write full 6,000-8,000 words (not summaries)
- ✅ Complete 300-400 word bios for ALL 3-4 executives
- ✅ Analyze ALL 5-10 competitors thoroughly
- ✅ Cover all 8-12 risks across 4 categories
- ❌ Do not abbreviate sections to save time
- ❌ Do not skip any required sections

**Verification before proceeding**: None required for this task.

---

## Task 2: Financial Modeling

**Purpose**: Extract historical financials and build comprehensive Excel financial model with projections and scenarios.

**Prerequisites**: ⚠️ Verify before starting
- **Required**: Access to company financial data
  - For public companies: Latest 10-K from SEC EDGAR
  - For private companies: Financial statements or available estimates
  - OR: Pre-extracted historical financials provided by user
- **Optional**: Company research (Task 1) for business context

**Input Verification**:
```
BEFORE STARTING - Select approach:

Option A: Extract financials (most common)
- [ ] Have access to 10-K or financial statements?
- [ ] Ready to extract 3-5 years of data?

Option B: User provided pre-extracted financials
- [ ] Historical financials file received?
- [ ] Contains income statement, cash flow, balance sheet (3-5 years)?

Optional:
- [ ] Company research (Task 1) complete for context?
```

**Process**:
1. Verify access to financial data
2. Load detailed instructions from references/task2-financial-modeling.md
3. **Step 1**: Extract historical financials (if needed)
4. **Step 2+**: Build projection model with 6 essential tabs
5. Deliver Excel model

**Output**: Excel Financial Model (.xlsx)
- 6 essential tabs:
  1. **Revenue Model** - Product breakdown (20-30 rows) + Geography breakdown (15-20 rows)
  2. **Income Statement** - Full P&L with 40-50 line items, historical (3-5 years) + projected (5 years)
  3. **Cash Flow Statement** - Operating/Investing/Financing activities, historical + projected
  4. **Balance Sheet** - Assets/Liabilities/Equity, historical + projected
  5. **Scenarios** - Bull/Base/Bear comparison table
  6. **DCF Inputs** - Prepared for Task 3 valuation

**File name**: `[Company]_Financial_Model_[Date].xlsx`

**⚠️ DELIVER ONLY THIS 1 FILE. NO completion summaries, no extra documents.**

**⚠️ DO NOT TAKE SHORTCUTS:**
- ✅ If extracting financials: Extract ALL line items from 3 financial statements (3-5 years)
- ✅ Build ALL 6 projection tabs completely with full detail
- ✅ Create detailed revenue model with 20-30 product rows AND 15-20 geography rows
- ✅ Build complete income statement with 40-50 line items (not abbreviated)
- ✅ Include full cash flow statement and balance sheet with all line items
- ✅ Complete ALL three scenarios (Bull/Base/Bear) with different parameters
- ❌ Do not create simplified/abbreviated versions
- ❌ Do not skip any of the 6 essential tabs
- ❌ Do not skip historical financials extraction if needed

**Verification before proceeding to Task 3**:
- [ ] Historical financials extracted (if needed) or provided
- [ ] Excel file created and can be opened
- [ ] Model has all 6 essential tabs (Revenue Model, Income Statement, Cash Flow, Balance Sheet, Scenarios, DCF Inputs)
- [ ] Historical data (3-5 years) incorporated
- [ ] Projections complete (5 years forward)
- [ ] Scenarios complete (Bull/Base/Bear)

---

## Task 3: Valuation Analysis

**Purpose**: Perform comprehensive valuation using DCF, comparables, and precedent transactions.

**Prerequisites**: ⚠️ Verify before starting
- **Required**: Financial model from Task 2
  - Projected income statements
  - Projected cash flows
  - Revenue and EBITDA forecasts
  - DCF inputs (unlevered FCF)

**⚠️ CRITICAL: TASK 2 MUST EXIST BEFORE THIS TASK**

This task requires the financial model from Task 2.

**IF TASK 2 IS NOT COMPLETE**: Auto-run Task 2 (Financial Modeling) first, then continue with this task. Do not create placeholder valuations, and do not stop to ask the user.

**Input Verification**:
```
BEFORE STARTING:
- [ ] Task 2 complete? (Financial model exists)
- [ ] Model file path/location known?
- [ ] Can access projected financials from model?

Required from model:
- [ ] Projected FCF (5 years)
- [ ] Revenue projections
- [ ] EBITDA projections
- [ ] Terminal year metrics
```

**Process**:
1. Verify financial model is accessible
2. Load detailed instructions from references/task3-valuation.md
3. Execute valuation workflow
4. Deliver valuation analysis

**Output**: Valuation Analysis (4-6 pages + Excel tabs)
- DCF analysis with sensitivity tables
- Comparable companies (5-10 peers with statistical summary)
- Precedent transactions (if applicable)
- Valuation football field
- **Price target**: $XX.XX
- **Recommendation**: BUY/HOLD/SELL
- **Upside**: XX%
- Key catalysts (3-5)

**Files**:
- `[Company]_Valuation_Analysis_[Date].md` (written analysis document)
- Excel tabs added to `[Company]_Financial_Model_[Date].xlsx` (from Task 2)
  - DCF tab with calculations
  - Sensitivity analysis tab
  - Comparable companies tab
  - Valuation summary tab

**⚠️ DELIVER ONLY: 1 markdown file + 4 tabs added to existing Excel. NO completion summaries, no extra documents.**

**⚠️ DO NOT TAKE SHORTCUTS:**
- ✅ Complete full DCF analysis with sensitivity matrix (not simplified)
- ✅ Analyze ALL 5-10 comparable companies with full data
- ✅ Include statistical summary in comps table (max/75th/median/25th/min)
- ✅ Create complete sensitivity analysis tab with multiple WACC and terminal growth scenarios
- ✅ Write full 4-6 pages of valuation analysis (not abbreviated)
- ✅ Research and justify price target with specific methodology
- ❌ Do not skip comparable company analysis
- ❌ Do not create simplified DCF without sensitivity

**Verification before proceeding to Task 4**:
- [ ] Price target determined
- [ ] Valuation uses multiple methods (DCF + Comps minimum)
- [ ] DCF sensitivity table complete
- [ ] Comparable companies table includes statistical summary

---

## Task 4: Chart Generation

**Purpose**: Generate 25-35 professional financial charts for the report.

**Prerequisites**: ⚠️ Verify before starting
- **Required**: Company research from Task 1
  - Company history and milestones (for timeline charts)
  - Management team and org structure (for org charts)
  - Product portfolio (for product charts)
  - Customer segmentation (for customer charts)
  - Competitive landscape (for competitive charts)
  - TAM analysis (for market size charts)
- **Required**: Financial model from Task 2 (with Task 3 valuation tabs added)
  - Revenue by product/geography data (Task 2 tabs)
  - Margin trends (Task 2 tabs)
  - Scenario comparison data (Task 2 tabs)
  - DCF sensitivity table (Task 3 tab in same Excel file)
  - Comparable companies data (Task 3 tab in same Excel file)
  - Valuation ranges (Task 3 tab in same Excel file)
- **Required**: External market data
  - Historical stock price data (Yahoo Finance, Bloomberg, etc.)
  - Historical valuation multiples (for historical trend charts)

**⚠️ CRITICAL: TASKS 1, 2, AND 3 MUST EXIST BEFORE THIS TASK**

This task requires outputs from all three previous tasks.

**IF ANY OF TASKS 1, 2, OR 3 ARE NOT COMPLETE**: Auto-run the missing task(s) first, in dependency order (1 → 2 → 3), then continue with chart generation. The specific requirements are:
- Task 1: Company research document (for 9 charts)
- Task 2: Financial model with all 6 tabs (for 8 charts)
- Task 3: Valuation tabs added to the model (for 6 charts)
- External data access (for 2 charts)

Do not create placeholder charts, do not skip charts due to missing data, and do not stop to ask the user — generate the prerequisites instead.

**Input Verification**:
```
BEFORE STARTING:
- [ ] Task 1 complete? (Company research exists)
- [ ] Task 2 complete? (Financial model exists)
- [ ] Task 3 complete? (Valuation analysis exists)
- [ ] Can access external market data sources?

Required from Task 1:
- [ ] Company history and milestones (for charts 05, 06)
- [ ] Management team structure (for chart 07)
- [ ] Product portfolio details (for chart 08)
- [ ] Customer segmentation data (for chart 09)
- [ ] Competitive landscape analysis (for charts 16, 17, 18)
- [ ] TAM sizing and market data (for chart 15)

Required from Task 2:
- [ ] Revenue by product (historical + projected) - for chart 03 ⭐
- [ ] Revenue by geography (historical + projected) - for chart 04 ⭐
- [ ] Income statement with margins (for charts 02, 10, 11)
- [ ] Cash flow statement (for chart 12)
- [ ] Scenario comparison data (for chart 14)

Required from Task 3:
- [ ] DCF sensitivity matrix - for chart 28 ⭐
- [ ] DCF components (for chart 29)
- [ ] Comparable companies data (for charts 30, 31)
- [ ] Valuation ranges - for chart 32 ⭐

Required from External Sources:
- [ ] Historical stock price data (for chart 01)
- [ ] Historical valuation multiples (for chart 34)
```

**Process**:
1. Verify model and valuation outputs are accessible
2. Load detailed instructions from references/task4-chart-generation.md
3. Execute chart generation workflow
4. Package all charts into a zip file
5. Deliver zip file

**Output**: 25-35 Professional Chart Files (PNG/JPG, 300 DPI) packaged in zip

**4 MANDATORY Charts** (must be present) ⭐:
- chart_03: Revenue by product (stacked area)
- chart_04: Revenue by geography (stacked bar)
- chart_28: DCF sensitivity (2-way heatmap)
- chart_32: Valuation football field (horizontal bars)

**25 REQUIRED Charts** (specific list):
- Investment Summary: chart_01
- Financial Performance: charts 02, 03⭐, 04⭐, 10, 11, 12, 14
- Company 101: charts 05, 06, 07, 08, 09, 15, 16
- Competitive/Market: charts 17, 18
- Scenario Analysis: chart 13
- Valuation: charts 28⭐, 29, 30, 31, 32⭐, 33, 34

**10 OPTIONAL Charts** (for 26-35 range):
- charts 19-27, 35 (customer acquisition, unit economics, product roadmap, etc.)

**IMPORTANT**: Task 5 embeds ALL charts created (25-35) for visual density (1 chart per 200-300 words).

**File naming**: `chart_01_description.png`, `chart_02_description.png`, etc.

**Deliverable**: `[Company]_Charts_[Date].zip` containing all 25-35 chart files + chart_index.txt

**⚠️ DELIVER ONLY THIS 1 ZIP FILE. NO completion summaries, no separate chart lists, no extra documents.**

**⚠️ DO NOT TAKE SHORTCUTS:**
- ✅ Create ALL 25 required charts minimum (specific list provided in task4-chart-generation.md)
- ✅ Include ALL 4 mandatory charts:
  - chart_03: Revenue by product (stacked area) ⭐
  - chart_04: Revenue by geography (stacked bar) ⭐
  - chart_28: DCF sensitivity (heatmap) ⭐
  - chart_32: Valuation football field ⭐
- ✅ Optional: Add 1-10 more charts to reach 26-35 total for greater visual density
- ✅ Generate professional-quality charts at 300 DPI (not low-res placeholders)
- ✅ Create unique, well-formatted charts for each visualization
- ✅ Package all charts in zip file with chart index
- ❌ Do not create only 10-15 charts (minimum is 25)
- ❌ Do not skip any of the 4 mandatory charts
- ❌ Do not use low-quality/placeholder images

**Verification before proceeding to Task 5**:
- [ ] Minimum 25 chart files created (required)
- [ ] All 4 mandatory charts present:
  - [ ] chart_03: Revenue by product ⭐
  - [ ] chart_04: Revenue by geography ⭐
  - [ ] chart_28: DCF sensitivity ⭐
  - [ ] chart_32: Valuation football field ⭐
- [ ] All charts open and display correctly
- [ ] Charts saved at 300 DPI (print quality)
- [ ] Chart index created listing all files with categories
- [ ] All charts packaged in zip file
- [ ] File naming follows convention: chart_##_description.png

---

## Task 5: Report Assembly

**Purpose**: Write and assemble the comprehensive final DOCX report.

**Prerequisites**: ⚠️ Verify before starting
- **Required**: Company research from Task 1
  - All 6-8K words of content
  - Management bios
  - Competitive analysis
  - Risk assessment
- **Required**: Financial model from Task 2
  - Excel workbook
  - All projections and scenarios
- **Required**: Valuation analysis from Task 3
  - Price target and recommendation
  - DCF, comps, precedent transactions
  - All valuation data
- **Required**: Chart files from Task 4
  - Zip file containing all 25-35 PNG/JPG files
  - Chart index included in zip

**⚠️ CRITICAL: ALL TASKS 1-4 MUST EXIST BEFORE THIS TASK**

This is the final assembly task. It cannot be completed without all previous work products.

**IF ANY OF TASKS 1, 2, 3, OR 4 ARE NOT COMPLETE**: Auto-run the missing task(s) first, in dependency order (1 → 2 → 3 → 4), then assemble the report. The specific requirements are:
- Task 1: Company research document (6-8K words)
- Task 2: Financial model with all 6 tabs
- Task 3: Valuation analysis with price target and recommendation
- Task 4: Charts zip file with 25-35 charts

Do not create placeholder content, substitute missing sections, or assemble an incomplete report, and do not stop to ask the user — generate the missing prerequisites first. The report requires ALL inputs to be publication-ready.

**Input Verification**:
```
BEFORE STARTING - ALL TASKS MUST BE COMPLETE:

Task 1 Verification:
- [ ] Company research document exists? (6-8K words)
- [ ] Management bios complete? (300-400 words × 3-4 execs)
- [ ] Competitive analysis complete? (5-10 competitors)
- [ ] Risk assessment complete? (8-12 risks)

Task 2 Verification:
- [ ] Financial model exists and can be opened?
- [ ] Model has projections (5 years)?
- [ ] Scenarios exist (Bull/Base/Bear)?

Task 3 Verification:
- [ ] Valuation analysis complete?
- [ ] Price target determined?
- [ ] Recommendation set? (BUY/HOLD/SELL)
- [ ] DCF and comps complete?

Task 4 Verification:
- [ ] Chart zip file exists?
- [ ] Can extract/access all 25-35 chart files from zip?
- [ ] All 4 mandatory charts present?
  - [ ] Revenue by product (stacked area)
  - [ ] Revenue by geography (stacked bar)
  - [ ] DCF sensitivity (heatmap)
  - [ ] Valuation football field
- [ ] Chart files accessible and can be opened?

IF ANY VERIFICATION FAILS: Stop and complete missing task first.
```

**Process**:
1. **CRITICAL**: Verify ALL prerequisites before starting
2. Load detailed instructions from references/task5-report-assembly.md
3. Execute report assembly workflow using Claude's built-in skills:
   - **Use DOCX skill** to create and manipulate the Word document
   - **Use XLSX skill** to read Excel data from Task 2/3
   - **Use Read tool** to read Task 1 and Task 3 markdown files
   - Read Task 1 .md file → Convert to Word formatting → Insert charts inline
   - Read Task 2 .xlsx file → Extract tables → Write quantitative analysis
   - Read Task 3 .md file + Excel tabs → Copy/adapt valuation analysis
   - Insert Task 4 .png chart files throughout using DOCX skill
   - Create text-dense report with charts interspersed every 200-300 words
4. Save and deliver final DOCX report

**Key Principles**:
- Use Claude's DOCX and XLSX skills (NOT Python libraries)
- Use actual file operations (read .md/.xlsx/.png files, write .docx file)
- Good equity research reports are text-dense with lots of illustrating images (60-80% page coverage, 1+ chart per page)

**🔥 CRITICAL: GO ALL OUT ON THIS TASK**

**THIS IS THE FINAL DELIVERABLE. DO NOT TAKE SHORTCUTS.**

- ✅ **Use full token budget** - This is the culmination of all previous work
- ✅ **Write every section completely** - Do not summarize or abbreviate
- ✅ **Hit ALL minimum requirements** - 30+ pages, 10,000+ words, 25+ charts, 12+ tables
- ✅ **Be thorough on projection assumptions** - 2,000-3,000 words with product-by-product detail
- ✅ **Be comprehensive on scenarios** - 1,500-2,000 words with specific Bull/Base/Bear parameters
- ✅ **Insert ALL charts from Task 4** - Not just a few, ALL 25-35 charts throughout
- ✅ **Create ALL tables from Task 2/3** - Extract every financial table, don't skip any
- ✅ **Use Task 1 content verbatim** - Copy/paste full Company 101 sections (6-8K words)
- ✅ **Professional quality only** - This must be indistinguishable from JPMorgan/Goldman Sachs research

**NEVER:**
- ❌ "This section would include..." - WRITE THE ACTUAL SECTION
- ❌ "Charts would be inserted here..." - INSERT THE ACTUAL CHARTS
- ❌ "See financial model for details..." - EXTRACT AND INCLUDE THE DETAILS
- ❌ Skip sections due to length - Every section MUST be complete
- ❌ Abbreviate for token conservation - Use whatever tokens are needed

**This is publication-ready institutional research. Spare no effort, tokens, or detail.**

**Output**: Comprehensive Equity Research Report (.docx)

**Specifications**:
- **Length**: 30-50 pages (MINIMUM 30)
- **Word count**: 10,000-15,000 words (MINIMUM 10,000)
- **Charts**: 25-35 embedded images
- **Tables**: 12-20 comprehensive tables
- **Format**: Professional DOCX with clickable hyperlinks

**Structure**:
- Page 1: Investment Summary (INITIATING COVERAGE format)
- Pages 2-5: Investment thesis & risks
- Pages 6-17: Company 101
- Pages 18-30: Financial analysis & projections
- Pages 31-40: Valuation analysis
- Pages 41-50: Appendices

**File name**: `[Company]_Initiation_Report_[Date].docx`

**⚠️ DELIVER ONLY THIS 1 DOCX FILE. NO executive summaries, no "highlights" documents, no extra files.**

**Final Verification**:
- [ ] Report is 30-50 pages
- [ ] Word count is 10,000-15,000
- [ ] 25-35 charts embedded
- [ ] 12-20 tables included
- [ ] All citations are clickable hyperlinks
- [ ] Numbers match financial model exactly

---

## Input Verification Protocol

### Why Input Verification Matters

Each task has strict prerequisites. Running a task without required inputs will:
- Waste time with incomplete work
- Produce low-quality outputs
- Require rework

**Always verify inputs before starting a task.**

### Verification Checklist by Task

**Task 1**: ✅ No verification needed (independent)

**Task 2**: Check historical financials available

**Task 3**: Check financial model exists and is accessible

**Task 4**: Check both model (Task 2) AND valuation (Task 3) exist

**Task 5**: Check ALL previous tasks complete (1, 2, 3, 4)

### What to Do if Verification Fails

```
IF prerequisites are missing:
1. Identify which prerequisite task(s) are missing
2. Auto-run the missing prerequisite task(s) first, in dependency order
3. Continue with the requested task once prerequisites are produced
4. Do NOT stop to ask the user — only escalate on a genuine blocker
```

### Example Verification Behavior

```
User: "Use initiating-coverage, Task 5 for Tesla"

Claude: "Starting Task 5: Report Assembly for Tesla

VERIFICATION - Checking prerequisites:
- Task 1 (Company research)... ❌ NOT FOUND → auto-running
- Task 2 (Financial model)... ❌ NOT FOUND → auto-running
- Task 3 (Valuation)... ❌ NOT FOUND → auto-running
- Task 4 (Charts)... ❌ NOT FOUND → auto-running

Auto-running missing prerequisites (Tasks 1-4) in order, then completing
Task 5. Deliverables will be produced for each stage automatically."
```

---

## Task Reference Files

Detailed instructions for each task are in separate reference files to keep this skill lean:

- **references/task1-company-research.md** - Company research workflow
- **references/task2-financial-modeling.md** - Financial modeling workflow
- **references/task3-valuation.md** - Valuation methodology
  - Also see: references/valuation-methodologies.md for DCF/comps deep dive
- **references/task4-chart-generation.md** - Chart generation workflow
- **references/task5-report-assembly.md** - Report writing workflow
  - Also see: assets/report-template.md for report structure
  - Also see: assets/quality-checklist.md for quality checks

**When to load reference files**: Load ONLY the reference file associated with the specific task being performed. These files are very large - do not load multiple reference files at once. Read the appropriate task reference file at the start of the task for detailed step-by-step instructions.

---

## Quality Standards

All outputs meet institutional standards from leading investment banks (JPMorgan, Goldman Sachs, Morgan Stanley):

- **Comprehensive**: Meet all minimum requirements
- **Detailed**: Specific data and examples, not generic statements
- **Quantified**: Lead with numbers and metrics
- **Cited**: Proper sources with clickable hyperlinks
- **Professional**: Institutional-quality formatting
- **Accurate**: All numbers verified and cross-checked

---

## Important Notes

### Task Independence

- **Task 1** can run anytime (no dependencies)
- **Task 2** can run anytime (just needs historical data)
- **Tasks 1 & 2** can run in parallel
- **Task 3** requires Task 2
- **Task 4** requires Tasks 2 & 3
- **Task 5** requires Tasks 1, 2, 3, & 4

### Session Management

**Same session**: Outputs automatically available to subsequent tasks

**Different sessions**: Reference previous task outputs explicitly
```
"Use Task 3 with the model from yesterday at [path]"
"Use Task 5 with the research document at [path]"
```

### File Organization

Recommended structure during workflow:
```
ProjectFolder/
├── Task1_Research/
│   └── [Company]_Research_Document.md
├── Task2_Model/
│   └── [Company]_Financial_Model.xlsx
├── Task3_Valuation/
│   └── [Company]_Valuation_Analysis.pdf
├── Task4_Charts/
│   ├── chart_01.png
│   └── ... (25-35 files)
└── Task5_Report/
    └── [Company]_Initiation_Report.docx
```

### End-to-End Execution (Enabled)

This skill **supports running all tasks automatically in sequence**. From a
single full-pipeline request it chains Task 1 → Task 5, auto-running any
missing prerequisite before each dependent task.

**Quality is still enforced by:**
- Per-task prerequisite verification (auto-runs missing inputs)
- Per-task deliverable specs and "NO SHORTCUTS" rules
- Cross-checking numbers between task outputs
- Stopping only on a genuine blocker (no data access, or explicit user request to pause)

---

## Success Criteria

A successful initiation report workflow should:
1. Complete all 5 tasks in order
2. Pass all input verifications
3. Meet all quality standards
4. Produce all required deliverables
5. Numbers cross-check between outputs
6. Final report is publication-ready

**Output quality**: Institutional (JPMorgan/Goldman/Morgan Stanley level)
**Use case**: First-time comprehensive coverage of a company
