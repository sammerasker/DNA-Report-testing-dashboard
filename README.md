# DNA Report Generator

A Next.js application that generates personalized entrepreneurial DNA reports from assessment data using AI. The system transforms raw assessment scores into comprehensive, human-readable reports through parallel chunk generation.

## Features

- **Parallel Chunk Generation**: Generates 6 report sections simultaneously for faster processing
- **Multiple AI Providers**: Supports OpenRouter and Hugging Face APIs
- **Data Enrichment**: Transforms raw scores into meaningful interpretations
- **Quality Validation**: Automated metrics ensure report completeness
- **Interactive Test Interface**: Real-time report generation with debug information

## Quick Start

1. **Install dependencies**
```bash
npm install
```

2. **Configure API keys**
```bash
cp .env.example .env.local
# Edit .env.local and add your API keys
```

3. **Run development server**
```bash
npm run dev
```

4. **Access the app**
- Main page: http://localhost:3000
- Test interface: http://localhost:3000/test-dna-report

## File Structure & Responsibilities

### Core Pipeline (`/lib/dna-report-chunked/`)

| File | Purpose |
|------|---------|
| `enrichment.js` | Transforms raw scores into human-readable context with interpretations |
| `chunk-definitions.js` | Defines the 6 report sections (intro, traits, roles, etc.) |
| `chunk-executor.js` | Executes chunks in parallel and manages API calls |
| `report-assembler.js` | Combines chunks into final formatted report |
| `api-provider.js` | Handles API communication with OpenRouter/Hugging Face |
| `quality-metrics.js` | Validates report completeness and quality |
| `trait-definitions.js` | Contains trait interpretations and scoring bands |
| `trait-helpers.js` | Helper functions for trait processing |
| `utils.js` | Utility functions for text processing |
| `constants.js` | Configuration constants |
| `monolithic-generator.js` | Alternative single-call generation (for comparison) |

### UI Components (`/components/dna-report-test/`)

| Component | Purpose |
|-----------|---------|
| `ControlPanel.js` | Provider/model selection and generation controls |
| `RawDataPanel.js` | Displays and edits raw assessment JSON input |
| `EnrichedDataPanel.js` | Shows enriched context sent to AI |
| `ReportOutputPanel.js` | Displays final generated report |
| `DebugPanel.js` | Shows execution details for each chunk |

### Pages (`/pages/`)

| Page | Purpose |
|------|---------|
| `index.js` | Landing page |
| `test-dna-report.js` | Main test interface for report generation |
| `_app.js` | Next.js app wrapper |
| `_document.js` | HTML document structure |

## How It Works

1. **Input**: Raw assessment data (JSON with scores, profile, roles)
2. **Enrichment**: `enrichment.js` transforms scores into interpretations
3. **Chunking**: `chunk-definitions.js` splits report into 6 sections
4. **Execution**: `chunk-executor.js` generates all chunks in parallel via AI
5. **Assembly**: `report-assembler.js` combines chunks into final report
6. **Validation**: `quality-metrics.js` checks completeness

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_OPENROUTER_API_KEY` - OpenRouter API key
- `NEXT_PUBLIC_HUGGINGFACE_API_KEY` - Hugging Face API key

See `.env.example` for template.

## Security

⚠️ Never commit `.env.local` - it contains sensitive API keys and is already in `.gitignore`
