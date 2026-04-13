"""Claude system and user prompts."""

import json

RESEARCH_SYSTEM = (
    "You are an elite market research AI with access to 8 worldwide intelligence sources. "
    "You synthesize realistic, industry-grounded signals. When you cannot access live web data, "
    "you infer plausible patterns from public knowledge and still return structured JSON exactly "
    "as requested, with concrete-sounding examples."
)

BUILD_SYSTEM = (
    "You are an agentic product design AI. You return structured JSON only, no markdown fences, "
    "no commentary outside JSON."
)


def build_research_user_prompt(query: str) -> str:
    return f"""Research the {query} industry/niche across all 8 sources:
1. REDDIT — specific subreddits, post titles with upvotes, exact frustrated user quotes
2. QUORA — most-viewed questions, Indian professional pain signals, view counts
3. YOUTUBE — channel names + subscribers, video titles + views, exact comment quotes
4. LINKEDIN — professional complaint posts, exact quotes, engagement numbers
5. APP STORE/AMAZON — exact 1-star review quotes, most-requested missing features
6. TWITTER/X — viral complaint threads, hashtags, customer service failures
7. GOOGLE TRENDS — top rising searches, autocomplete pain signals, vs searches
8. INDIA-SPECIFIC — IndiaMART/Justdial complaints, WhatsApp group signals

Return JSON ONLY (no markdown fences, no commentary) with this exact shape:
{{
  "market": "4-5 sentence overview with market size USD/INR, YoY growth %, why NOW",
  "sourceSignals": {{
    "reddit": "string summary with concrete examples",
    "quora": "string",
    "youtube": "string",
    "linkedin": "string",
    "reviews": "string",
    "twitter": "string",
    "googleTrends": "string",
    "india": "string"
  }},
  "painPoints": [
    {{
      "title": "real frustrated user quote in double quotes",
      "impact": "quantified money/hours lost",
      "sourceValidation": "top 3 sources that confirmed this",
      "difficulty": "Easy|Medium|Hard",
      "tam": "Niche TAM|Large TAM|Massive TAM",
      "demand": "High|Very High|Explosive",
      "aiSolution": "specific AI solution naming exact tech"
    }}
  ]
}}
Generate exactly 10 pain points ordered by opportunity."""


def build_build_user_prompt(query: str, pain: dict) -> str:
    pain_json = json.dumps(pain, ensure_ascii=False)
    return f"""You are an agentic product design AI. For this pain point in {query}:
Pain (JSON): {pain_json}

Build 3 complete business ideas (AI Software, AI Coaching Program, AI Service).

Return JSON ONLY with this exact shape:
{{
  "painDeep": "string — deeper analysis of the pain, buyers, workflow",
  "competitorGap": "string — what incumbents miss",
  "sourceEvidence": {{
    "reddit": "string",
    "quora": "string",
    "youtube": "string",
    "linkedin": "string",
    "reviews": "string",
    "twitter": "string",
    "googleTrends": "string",
    "india": "string"
  }},
  "buildPaths": [
    {{
      "type": "AI Software",
      "name": "string",
      "tagline": "string",
      "description": "what it does, who for, what outcome",
      "buildTime": "string",
      "priceRange": "string",
      "revenueTarget": "string e.g. path to ₹1Cr",
      "tools": ["tool or stack"],
      "features": ["four key features"],
      "idealCustomer": "string",
      "unfairAdvantage": "string"
    }}
  ]
}}
The buildPaths array must contain exactly 3 items in this order: AI Software, AI Coaching Program, AI Service.
Use type values exactly: "AI Software", "AI Coaching Program", "AI Service"."""
