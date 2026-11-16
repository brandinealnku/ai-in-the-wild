# AI in the Wild — Language Atlas research method

## What it does

The Language Atlas provides a fully traceable lexical analysis:

- **Document frequency**: number of records containing an exact token at least once.
- **Term frequency**: number of occurrences of that token across all records in the selected corpus.
- **Term → source**: selecting a word lists the records in which it appears, the per-document count, a source link, and (for approved cases) a link that opens the exact dashboard case.
- **All words**: select "All lengths" and "Include common words" to analyze common function words too. Defaults suppress common words because words such as "the" and "and" overwhelm subject terms.
- **No invented insights**: the UI does not automatically claim a frequent word is a causal factor, trend, sentiment, or validated research conclusion.

## Three distinct corpora

1. **Curated case records**: text contained in approved `data/cases.json` fields: title, summary, evidence note, risk, business experiment, student question. This covers **all words in those fields**, but is **not full-text analysis** of underlying source papers or articles. Company names, URLs and labels are excluded deliberately.
2. **Cited research studies**: up to five manually selected DOI-identified empirical workplace-AI research works. The opt-in OpenAlex builder retrieves each work's title, abstract inverted index, citation count, journal and date; converts the **title and abstract** to term counts; and stores **counts and metadata only**, not copyrighted abstract prose or article body. Citation ranking applies **only within the selected five-study corpus**. It does **not** identify the globally most-cited AI use case studies.
3. **My full texts**: select up to ten user-provided `.txt` or `.md` files, each no larger than 3 MB. The browser processes the entire provided text **locally**, without uploading or persisting it, so a full-text analysis is possible for studies the researcher is authorized to use. Citation rank cannot be inferred for those uploads.

## Scholarly selection (DOI verified against publications)

- Brynjolfsson, Li & Raymond, *Generative AI at Work*, QJE: `10.1093/qje/qjae044`.
- Noy & Zhang, *Experimental evidence on the productivity effects of generative artificial intelligence*, Science: `10.1126/science.adh2586`.
- Dell’Acqua et al., *Navigating the Jagged Technological Frontier*, Organization Science: `10.1287/orsc.2025.21838`.
- Cui et al., *The Effects of Generative AI on High-Skilled Work*, Management Science: `10.1287/mnsc.2025.00535`.
- Dillon et al., *Shifting Work Patterns with Generative AI*, NBER working paper: `10.3386/w33795`.

**These are selected empirical studies, not a systematic or exhaustive literature review.** The corpus mixes peer-reviewed papers and a working paper; the reader should examine study designs and publication status. No source is treated as representative of all industries.

## Rebuild scholarly metadata (optional)

From GitHub Actions, open **Refresh curated scholarly language corpus → Run workflow**. The workflow runs once when its source is first merged to `main`, and can subsequently be run manually. It uses five OpenAlex **singleton DOI lookups**, described as free in OpenAlex API documentation; it has **no recurring schedule** and makes no OpenAI or Gemini API calls. Source access may fail due to rate limits or endpoint changes. A previous successful dataset is retained if retrieval fails. No raw abstracts or full PDFs are stored in the public repository.

OpenAlex citation counts are time-sensitive, may differ from Google Scholar and other indexes, and reflect database coverage. The captured `citationCheckedAt` date is stored with each record. Sorting works by metadata retrieved at a point in time; it is not a scholarly quality rating.

## Boundaries

- The dashboard's 16 approved cases continue to be a **curated, nonrepresentative sample**, not a dataset from which industry-wide rates may be inferred.
- Tokenization lowercases words; it does not stem or lemmatize terms, so "study" and "studies" are separate tokens. Hyphenated words may be split; the tokenizer does not capture meaning or negation. Input text language is assumed to be English.
- Word counts and associations should never be described as "citations" or "cited themes": **citation count** applies to a scholarly work, not to a word.
- Full external article text is not downloaded by the public application; use authorized local texts for comprehensive analysis. No subscription or paid API is required.
- Inclusion criteria and DOI list are intentionally small for an initial test. Do not imply that the most frequent word represents the most important business concept.
