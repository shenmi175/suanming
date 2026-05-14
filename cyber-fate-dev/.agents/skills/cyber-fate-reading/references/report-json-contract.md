# Cyber Fate report JSON contract

Use this contract when a reading is consumed by the app or PDF renderer.

## Top-level shape

```ts
type Confidence = 'high' | 'medium' | 'low';

type CyberFateReport = {
  id: string;
  title: string;
  generatedAt: string;
  entertainmentNotice: string;
  profileSummary: {
    displayName: string;
    missingFields: string[];
    confidence: Confidence;
  };
  calculatedSignals: CalculatedSignal[];
  researchNotes: ResearchNote[];
  chapters: ReportChapter[];
  stamps: ReportStamp[];
  reviewer: ReviewResult;
  appendix: AppendixItem[];
};
```

## Chapter shape

```ts
type ReportChapter = {
  id: string;
  title: string;
  summary: string;
  body: string;
  confidence: Confidence;
  signalRefs: string[];
  researchNoteRefs: string[];
  stampIds: string[];
};
```

## Stamp shape

```ts
type ReportStamp = {
  id: string;
  label: string;
  domain: string;
  reason: string;
  status: 'passed' | 'limited' | 'needs_review';
  assetPath?: string;
};
```

## Review shape

```ts
type ReviewResult = {
  passed: boolean;
  renderReady: boolean;
  issues: Array<{
    severity: 'blocker' | 'major' | 'minor';
    path: string;
    message: string;
    requiredAction?: string;
  }>;
};
```

## Required chapter IDs

```text
cover
summary
wuxing
stars_time
iching
career
wealth
love_relationships
fengshui
next_12_months
stamps
appendix
```

## Hard requirements

- Every chapter must have `summary`, `body`, `confidence`.
- Every stamp must have `reason`.
- Every generated claim should be traceable to either `calculatedSignals` or `researchNotes` when possible.
- If birth time is unknown, mark bazi/time-related chapters as `medium` or `low` confidence.
- `entertainmentNotice` must be present on cover and appendix.
