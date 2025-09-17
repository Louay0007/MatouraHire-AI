from langchain_ollama import OllamaLLM
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
import os

load_dotenv()
OLLAMA_URL = os.getenv("OLLAMA_URL")
model = OllamaLLM(model="llama3.1", base_url=OLLAMA_URL)

def create_report(resume_text: str) -> str:
	"""
	Generate a strategic summary for personal development and career planning based on the resume text.
	"""
	prompt = PromptTemplate(
		input_variables=["resume_text"],
		template="""
        You are a highly skilled career strategist and personal development expert. Your task is to analyze the provided resume and generate a concise, strategic summary that guides the individual's career planning and professional growth. This summary should be insightful, empathetic, and highly actionable.

        Structure your analysis with three distinct sections, using the following headings:

        ### Strengths
        Highlight the individual's core competencies, unique value proposition, and significant achievements. Identify transferable skills and quantifiable successes that can be leveraged for future roles.

        ### Areas for Growth
        Identify key skills, knowledge, or experiences that are missing or could be developed to advance their career. These should be framed as opportunities rather than weaknesses, aligning with their stated or implied career goals.

        ### Actionable Recommendations
        Provide a clear, step-by-step plan. Offer specific and practical advice, such as a list of relevant certifications, technical skills to learn, networking strategies, or types of projects to pursue. Ensure these recommendations directly address the identified areas for growth and help the individual achieve their career aspirations.

        ---

        Resume:
        {resume_text}

        Strategic Summary:
		"""
	)
	chain = prompt | model
	report = chain.invoke({"resume_text": resume_text})
	return report

def create_aggregate_report(payload: dict) -> str:
	"""
	Generate a comprehensive career insights report from multiple sources:
	- resume_summary (text or dict)
	- interview_profile (dict)
	- footprints { github, linkedin, stackoverflow } (dicts)
	- job_market (dict: jobs list and insights)
	"""
	resume_summary = payload.get("resume_summary")
	interview_profile = payload.get("interview_profile")
	footprints = payload.get("footprints", {})
	job_market = payload.get("job_market")

	def to_bulleted(d: dict) -> str:
		if not isinstance(d, dict):
			return str(d or "")
		lines = []
		for k, v in d.items():
			lines.append(f"- {k}: {v}")
		return "\n".join(lines)

	prompt = PromptTemplate(
		input_variables=["resume_summary","interview_profile","github","linkedin","stackoverflow","job_market"],
		template="""
You are an expert career strategist. Create a concise, action-oriented Career Insights Report synthesizing the provided sources. Use clear headings, short paragraphs, and bullet points. Avoid fluff.

Include these sections:

### Snapshot
- One-paragraph overview of candidate strengths and target roles.

### Public Footprint Highlights
- Summarize notable contributions/activities across GitHub, LinkedIn, StackOverflow.

### Strengths
- Concrete skills, achievements, and differentiators.

### Areas for Growth
- Gaps to close for target roles. Keep constructive and specific.

### Job Market Readiness (Region-aware)
- Brief on role-market fit and region considerations from job data.

### Action Plan (next 30-60 days)
- 5–8 specific, high-impact actions (learning, projects, networking, certifications).

---
Resume summary:
{resume_summary}

Interview profile:
{interview_profile}

GitHub:
{github}

LinkedIn:
{linkedin}

StackOverflow:
{stackoverflow}

Job market:
{job_market}

Report:
"""
	)

	chain = prompt | model
	report = chain.invoke({
		"resume_summary": (resume_summary if isinstance(resume_summary, str) else to_bulleted(resume_summary or {})),
		"interview_profile": to_bulleted(interview_profile or {}),
		"github": to_bulleted(footprints.get("github") or {}),
		"linkedin": to_bulleted(footprints.get("linkedin") or {}),
		"stackoverflow": to_bulleted(footprints.get("stackoverflow") or {}),
		"job_market": to_bulleted(job_market or {}),
	})
	return report
