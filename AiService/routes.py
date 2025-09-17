from fastapi import FastAPI, UploadFile, File
from fastapi.responses import Response
import json
from resume_rewriter import rewrite_resume, extract_text_from_pdf, create_pdf_from_text  
from create_report import create_report, create_aggregate_report 
from ai_interviewer import AIInterviewer
from job_matcher import LinkedInJobsScraper, JobMatcher, CandidateProfile, JobOpportunity
from footprint_scanner import FootprintScanner
from pydantic import BaseModel
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime

app = FastAPI()

# Pydantic models for request/response
class JobDescriptionRequest(BaseModel):
    job_description: str
    interview_type: str = "mixed"
    num_questions: int = 8

class ResponseAnalysisRequest(BaseModel):
    question: str
    response: str
    question_type: str = "general"

class InterviewSession(BaseModel):
    responses: List[Dict]

# Job Matcher models
class CandidateProfileRequest(BaseModel):
    name: str
    email: str
    location: str
    skills: List[str]
    experience_years: int
    education: List[str] = []
    certifications: List[str] = []
    preferred_locations: List[str] = []
    salary_expectation: Optional[int] = None
    job_type_preference: str = "full-time"
    resume_text: str

class JobSearchRequest(BaseModel):
    candidate_profile: CandidateProfileRequest
    job_filters: Dict[str, Any] = {}
    max_results: int = 20

class SkillGapRequest(BaseModel):
    candidate_skills: List[str]
    target_jobs: List[Dict[str, Any]]

class CVAnalysisRequest(BaseModel):
    resume_text: str

# Resume PDF-from-text model
class ResumePdfFromTextRequest(BaseModel):
    rewritten_resume: str
    templateId: str = "ats"

# Footprint Scanner models
class ProfileAnalysisRequest(BaseModel):
    github_username: Optional[str] = None
    linkedin_url: Optional[str] = None
    stackoverflow_id: Optional[str] = None
    target_role: str = "Software Developer"
    region: str = "Global"

class RegionalInsightsRequest(BaseModel):
    region: str
    target_role: str = "Software Developer"

@app.get("/")
def main():
    return {
        "message": "Welcome to the CS Challenge API. Available endpoints: /resume_writer, /create_report, /job_matcher, /ai_interviewer"
    }

@app.post("/resume_writer")
async def resume_writer(file: UploadFile = File(...)):
    pdf_bytes = await file.read()
    resume_text = extract_text_from_pdf(pdf_bytes)
    rewritten = rewrite_resume(resume_text)
    return {"rewritten_resume": rewritten}

@app.post("/resume_writer/pdf")
async def resume_writer_pdf(file: UploadFile = File(...), templateId: str = "ats"):
    pdf_bytes = await file.read()
    resume_text = extract_text_from_pdf(pdf_bytes)
    rewritten = rewrite_resume(resume_text)
    pdf_out = create_pdf_from_text(rewritten, templateId)
    return Response(content=pdf_out, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=enhanced_resume.pdf"
    })

@app.post("/resume_writer/pdf-from-text")
async def resume_writer_pdf_from_text(payload: ResumePdfFromTextRequest):
    pdf_out = create_pdf_from_text(payload.rewritten_resume, payload.templateId)
    return Response(content=pdf_out, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=enhanced_resume.pdf"
    })

@app.post("/create_report")
async def create_report_route(file: UploadFile = File(...)):
    pdf_bytes = await file.read()
    resume_text = extract_text_from_pdf(pdf_bytes)
    report = create_report(resume_text)
    return {"report": report}

@app.post("/create_report/aggregate")
async def create_aggregate_report_route(payload: Dict[str, Any]):
    try:
        report = create_aggregate_report(payload)
        return {"success": True, "report": report}
    except Exception as e:
        return {"success": False, "error": str(e), "message": "Failed to create aggregate report"}

# Job Matcher endpoints - Commented out as classes don't exist
# @app.post("/job_matcher/analyze_profile")
# async def analyze_candidate_profile(profile_data: CandidateProfileRequest):
#     """Analyze candidate profile and extract skills"""
#     try:
#         job_matcher = JobMatcher()
#         
#         # Create candidate profile object
#         candidate = CandidateProfile(
#             name=profile_data.name,
#             email=profile_data.email,
#             location=profile_data.location,
#             skills=profile_data.skills,
#             experience_years=profile_data.experience_years,
#             education=profile_data.education,
#             certifications=profile_data.certifications,
#             preferred_locations=profile_data.preferred_locations,
#             salary_expectation=profile_data.salary_expectation,
#             job_type_preference=profile_data.job_type_preference,
#             resume_text=profile_data.resume_text
#         )
#         
#         # Extract additional skills from resume text (optimized)
#         extracted_skills = job_matcher.extract_skills_from_text(profile_data.resume_text)
#         all_skills = list(set(profile_data.skills + extracted_skills))
#         
#         # Skip regional insights for speed - return basic info
#         regional_insights = {"location": profile_data.location, "region": "unknown"}
#         
#         return {
#             "success": True,
#             "candidate_profile": {
#                 "name": candidate.name,
#                 "location": candidate.location,
#                 "skills": all_skills,
#                 "experience_years": candidate.experience_years,
#                 "education": candidate.education,
#                 "certifications": candidate.certifications
#             },
#             "extracted_skills": extracted_skills,
#             "regional_insights": regional_insights
#         }
#     except Exception as e:
#         return {
#             "success": False,
#             "error": str(e),
#             "message": "Failed to analyze candidate profile"
#         }

# @app.post("/job_matcher/find_jobs")
# async def find_job_recommendations(request: JobSearchRequest):
#     """Get personalized job recommendations"""
#     # Commented out as classes don't exist

# @app.get("/job_matcher/regional_insights/{location}")
# async def get_regional_insights(location: str):
#     """Get regional market insights"""
#     # Commented out as classes don't exist

# @app.post("/job_matcher/skill_gaps")
# async def analyze_skill_gaps(request: SkillGapRequest):
#     """Analyze skill gaps and suggest improvements"""
#     # Commented out as classes don't exist

@app.post("/job_matcher/analyze_cv")
async def analyze_cv(request: CVAnalysisRequest):
    """Analyze CV and extract skills, determine job categories, and generate keywords"""
    try:
        job_matcher = JobMatcher()
        analysis = job_matcher.analyze_cv(request.resume_text)
        
        return {
            "success": True,
            "analysis": analysis
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to analyze CV"
        }

@app.post("/job_matcher/search_jobs")
async def search_jobs_with_params(
    keywords: str,
    location: str = "",
    max_jobs: int = 50,
    region: str = "",
    remote_ok: bool = False,
    currency: str = ""
):
    """Search for jobs using keywords, location, and optional regional preferences."""
    try:
        from job_matcher import LinkedInJobsScraper, JobMatcher, CandidateProfile, JobOpportunity
        
        scraper = LinkedInJobsScraper()
        # Normalize incoming location/region (support common country codes/aliases)
        def normalize_term(term: str) -> str:
            if not term:
                return ""
            t = term.strip().lower()
            aliases = {
                # MENA common
                "uae": "united arab emirates",
                "u.a.e": "united arab emirates",
                "ksa": "saudi arabia",
                # Europe/North America common
                "uk": "united kingdom",
                "u.k.": "united kingdom",
                "us": "united states",
                "u.s.": "united states",
                "usa": "united states",
                "u.s.a.": "united states",
                # Other variants
                "czech": "czechia",
                "ivory coast": "cote d'ivoire",
                "drc": "democratic republic of the congo",
                "dr congo": "democratic republic of the congo",
            }
            return aliases.get(t, term.strip())

        location = normalize_term(location)
        region = normalize_term(region)
        # Decide a single-location query only (one country/city term per request)
        jobs = []
        
        # Region → country/keyword mapping to drive queries and post-filter results
        region_to_countries = {
            "europe": [
                "europe", "eu",
                "united kingdom", "uk", "england", "scotland", "wales", "northern ireland",
                "ireland", "france", "germany", "spain", "portugal", "italy",
                "netherlands", "belgium", "luxembourg", "switzerland", "austria",
                "poland", "czechia", "czech", "slovakia", "hungary", "romania", "bulgaria",
                "greece", "sweden", "norway", "denmark", "finland", "iceland",
                "estonia", "latvia", "lithuania", "slovenia", "croatia",
                "bosnia", "bosnia and herzegovina", "serbia", "montenegro", "kosovo", "albania",
                "north macedonia", "macedonia", "moldova", "ukraine", "belarus",
                "cyprus", "malta", "monaco", "andorra", "san marino", "liechtenstein", "vatican"
            ],
            "north america": [
                "united states", "usa", "us", "u.s.", "u.s.a.",
                "canada", "mexico", "north america"
            ],
            "mena": [
                "mena", "middle east",
                "algeria", "bahrain", "egypt", "iran", "iraq", "israel",
                "jordan", "kuwait", "lebanon", "libya", "morocco", "oman",
                "palestine", "qatar", "saudi arabia", "saudi", "ksa",
                "syria", "tunisia", "united arab emirates", "uae", "yemen",
                "western sahara"
            ],
            "north africa": [
                "north africa", "maghreb",
                "morocco", "algeria", "tunisia", "libya", "egypt", "sudan", "mauritania", "western sahara"
            ],
            "sub-saharan africa": [
                "sub-saharan", "sub saharan",
                "nigeria", "ghana", "kenya", "south africa", "ethiopia", "rwanda", "uganda", "tanzania",
                "angola", "mozambique", "zambia", "zimbabwe", "botswana", "namibia", "cameroon",
                "dr congo", "democratic republic of the congo", "congo", "cote d'ivoire", "ivory coast",
                "senegal", "sierra leone", "liberia", "benin", "togo", "burkina faso", "mali", "niger",
                "guinea", "guinea-bissau", "gabon", "equatorial guinea", "eritrea", "somalia", "south sudan",
                "lesotho", "eswatini", "swaziland", "mauritius", "seychelles", "gambia"
            ],
            "asia": [
                "asia",
                "china", "india", "japan", "south korea", "korea", "north korea",
                "singapore", "malaysia", "indonesia", "philippines", "vietnam", "thailand",
                "hong kong", "taiwan", "pakistan", "bangladesh", "sri lanka", "nepal",
                "cambodia", "laos", "myanmar", "burma", "mongolia", "brunei", "timor-leste", "east timor"
            ]
        }

        # Choose a single search_location
        region_key_lookup = (region or "").lower()
        country_terms = region_to_countries.get(region_key_lookup, [])
        preferred_country_for_region = {
            "mena": "united arab emirates",
            "north africa": "morocco",
            "sub-saharan africa": "south africa",
            "europe": "germany",
            "north america": "united states",
            "asia": "india"
        }
        if location:
            search_location = location
        elif country_terms:
            search_location = preferred_country_for_region.get(region_key_lookup, country_terms[0])
        else:
            search_location = region or ""

        # Single scrape call using one location term
        jobs = scraper.scrape_jobs(keywords, search_location, max_jobs)
        
        # Convert JobData objects to dictionaries
        job_list = []
        # Simple regional priors (can be expanded)
        regional_priors = {
            "north africa": {"tech": ["python", "javascript", "react", "node", "devops"], "remote": 0.6},
            "sub-saharan africa": {"tech": ["python", "java", "cloud", "data"], "remote": 0.5},
            "mena": {"tech": ["javascript", "react", "node", "devops"], "remote": 0.5},
            "europe": {"tech": ["typescript", "react", "java", "cloud"], "remote": 0.7},
            "north america": {"tech": ["typescript", "react", "python", "ml", "cloud"], "remote": 0.8},
            "asia": {"tech": ["java", "android", "cloud", "data"], "remote": 0.6},
            "": {"tech": [], "remote": 0.6}
        }
        region_key = (region or location or "").lower()
        priors = None
        for key in regional_priors.keys():
            if key and key in region_key:
                priors = regional_priors[key]
                break
        if priors is None:
            priors = regional_priors[""]

        # Helper: does a location string belong to the chosen region?
        def location_in_region(loc: str) -> bool:
            if not region:
                return True
            lk = (loc or "").lower()
            rkey = (region or "").lower()
            country_list = region_to_countries.get(rkey, [])
            if not country_list:
                return rkey in lk
            return any(c in lk for c in country_list)

        def compute_market_alignment(title: str) -> int:
            text = (title or "").lower()
            score = 0
            for kw in priors["tech"]:
                if kw in text:
                    score += 20
            return min(100, score)

        def is_remote(title: str, loc: str) -> bool:
            ll = (loc or "").lower()
            tt = (title or "").lower()
            return ("remote" in ll) or ("remote" in tt) or ("work from home" in tt)

        def region_match(loc: str) -> bool:
            if not region and not location:
                return False
            return location_in_region(loc)

        # Build list and normalize fields
        for job in jobs:
            remote_flag = is_remote(job.title, job.location)
            if remote_ok and not remote_flag:
                # If user prefers remote, down-rank non-remote by skipping into tail later
                pass
            al = compute_market_alignment(job.title)
            posted_date_value = getattr(job, "posted_date", None) or "Unknown"
            # Region match strictly by location string
            region_match_val = region_match(job.location)
            job_entry = {
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "job_link": job.job_link,
                "posted_date": posted_date_value,
                # Added fields
                "region_match": region_match_val,
                "inferred_salary_range": None,
                "remote_flag": remote_flag,
                "market_alignment": al
            }
            job_list.append(job_entry)

        # If a region is selected, strictly filter to region-matching locations (allow remote if preferred)
        if (region or "").strip():
            job_list = [j for j in job_list if j["region_match"] or (remote_ok and j["remote_flag"])]

        # Sort by regional preference and alignment
        job_list.sort(key=lambda x: (
            0 if (remote_ok and x["remote_flag"]) else 1,
            0 if x["region_match"] else 1,
            -x["market_alignment"]
        ))
        
        return {
            "success": True,
            "jobs": job_list,
            "total_found": len(job_list),
            "keywords": keywords,
            "location": location,
            "region": region,
            "remote_ok": remote_ok,
            "currency": currency
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to search for jobs"
        }

# @app.get("/job_matcher/test_linkedin")
# async def test_linkedin_api():
#     """Test the LinkedIn Job Search API"""
#     # Commented out as classes don't exist

@app.get("/job_matcher")
def job_matcher_info():
    """Get Job Matcher service information"""
    return {
        "service": "Job Matcher",
        "description": "AI-powered job matching with regional intelligence",
        "features": [
            "Smart skill matching",
            "Regional job market insights",
            "Salary benchmarking",
            "Skill gap analysis",
            "Personalized learning recommendations",
            "Real-time LinkedIn job data"
        ],
        "endpoints": [
            "/job_matcher/analyze_profile",
            "/job_matcher/find_jobs",
            "/job_matcher/regional_insights/{location}",
            "/job_matcher/skill_gaps",
            "/job_matcher/test_linkedin"
        ]
    }

# AI Interviewer endpoints
@app.post("/ai_interviewer/generate_questions")
async def generate_questions(request: JobDescriptionRequest):
    """Generate interview questions based on job description"""
    try:
        interviewer = AIInterviewer()
        questions = interviewer.generate_questions(
            job_description=request.job_description,
            interview_type=request.interview_type,
            num_questions=request.num_questions
        )
        return {
            "success": True,
            "questions": questions,
            "total_questions": len(questions)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to generate questions"
        }

@app.post("/ai_interviewer/analyze_response")
async def analyze_response(request: ResponseAnalysisRequest):
    """Analyze a single interview response"""
    try:
        interviewer = AIInterviewer()
        analysis = interviewer.analyze_response(
            question=request.question,
            response=request.response,
            question_type=request.question_type
        )
        return {
            "success": True,
            "analysis": analysis
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to analyze response"
        }

@app.post("/ai_interviewer/generate_profile")
async def generate_profile(session: InterviewSession):
    """Generate comprehensive interview profile from all responses"""
    try:
        interviewer = AIInterviewer()
        profile = interviewer.generate_profile(session.responses)
        return {
            "success": True,
            "profile": profile
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to generate profile"
        }

@app.get("/ai_interviewer")
def ai_interviewer_info():
    """Get AI Interviewer service information"""
    return {
        "service": "AI Interviewer",
        "description": "AI-powered interview simulation and analysis",
        "features": [
            "Dynamic question generation",
            "Response analysis and scoring",
            "Comprehensive performance profiling",
            "Personalized improvement recommendations"
        ],
        "endpoints": [
            "/ai_interviewer/generate_questions",
            "/ai_interviewer/analyze_response", 
            "/ai_interviewer/generate_profile"
        ]
    }

# Footprint Scanner endpoints
@app.post("/footprint_scanner/analyze_github")
async def analyze_github_profile(username: str, target_role: str = "Software Developer", region: str = "Global"):
    """Analyze GitHub profile and contributions with enhanced AI analysis"""
    try:
        scanner = FootprintScanner()
        github_profile = scanner.analyze_github_profile(
            username=username,
            target_role=target_role,
            region=region
        )
        
        return {
            "success": True,
            "github_profile": {
                "name": github_profile.name,
                "avatar_url": github_profile.avatar_url,
                "bio": github_profile.bio,
                "company": github_profile.company,
                "location": github_profile.location,
                "blog": github_profile.blog,
                "username": github_profile.username,
                "public_repos": github_profile.public_repos,
                "followers": github_profile.followers,
                "following": github_profile.following,
                "total_stars": github_profile.total_stars,
                "total_forks": github_profile.total_forks,
                "languages": github_profile.languages,
                "recent_activity": github_profile.recent_activity,
                "orgs": github_profile.orgs,
                "contribution_streak": github_profile.contribution_streak,
                "profile_score": github_profile.profile_score,
                "top_repos": github_profile.top_repos,
                "collaboration_score": github_profile.collaboration_score,
                # Enhanced metrics
                "code_quality_score": github_profile.code_quality_score,
                "technical_diversity_score": github_profile.technical_diversity_score,
                "innovation_score": github_profile.innovation_score,
                "problem_solving_score": github_profile.problem_solving_score,
                "learning_curve_score": github_profile.learning_curve_score,
                "regional_relevance_score": github_profile.regional_relevance_score,
                "remote_work_readiness": github_profile.remote_work_readiness
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to analyze GitHub profile"
        }

@app.post("/footprint_scanner/analyze_linkedin")
async def analyze_linkedin_profile(
    request: Optional[Dict[str, Any]] = None,
    profile_url: Optional[str] = None,
    target_role: str = "Professional",
    region: str = "Global",
    username: Optional[str] = None,
):
    """Analyze LinkedIn profile and network with enhanced AI analysis.

    Accepts either a JSON body (with keys `profile_url`, `target_role`, `region`) or query parameters.
    """
    try:
        scanner = FootprintScanner()
        # prefer explicit query params, otherwise fall back to JSON body
        url = profile_url or (request.get("profile_url") if request else None)
        user = username or (request.get("username") if request else None)
        if not user and not url:
            return {
                "success": False,
                "error": "Missing required parameter `username` or `profile_url`. Provide either as a query param or in the JSON body.",
                "message": "username or profile_url is required"
            }

        linkedin_profile = scanner.analyze_linkedin_profile(
            profile_url=url,
            target_role=(request.get("target_role") if request and request.get("target_role") else target_role),
            region=(request.get("region") if request and request.get("region") else region),
            username=user,
        )
        
        return {
            "success": True,
            "linkedin_profile": {
                "profile_url": linkedin_profile.profile_url,
                "connections": linkedin_profile.connections,
                "endorsements": linkedin_profile.endorsements,
                "recent_posts": linkedin_profile.recent_posts,
                # Contribution-focused fields
                "full_name": linkedin_profile.full_name,
                "headline": linkedin_profile.headline,
                "about": linkedin_profile.about,
                "industry": linkedin_profile.industry,
                "follower_count": linkedin_profile.follower_count,
                "experience": linkedin_profile.experience,
                "education": linkedin_profile.education,
                "certifications": linkedin_profile.certifications,
                "skills": linkedin_profile.skills_list,
                "profile_picture": linkedin_profile.profile_picture,
                "city": linkedin_profile.city,
                "country": linkedin_profile.country
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to analyze LinkedIn profile"
        }

@app.post("/footprint_scanner/analyze_stackoverflow")
async def analyze_stackoverflow_profile(user_id: str, target_role: str = "Developer", region: str = "Global"):
    """Analyze StackOverflow profile and contributions (contribution-centric, no scores)."""
    try:
        scanner = FootprintScanner()
        so_profile = scanner.analyze_stackoverflow_profile(
            user_id=user_id,
            target_role=target_role,
            region=region
        )
        return {
            "success": True,
            "stackoverflow_profile": {
                "user_id": so_profile.user_id,
                "display_name": so_profile.display_name,
                "reputation": so_profile.reputation,
                "badge_counts": so_profile.badge_counts,
                "profile_image": so_profile.profile_image,
                "location": so_profile.location,
                "website_url": so_profile.website_url,
                "about_me": so_profile.about_me,
                "view_count": so_profile.view_count,
                "creation_date": so_profile.creation_date,
                "last_access_date": so_profile.last_access_date,
                "answers": so_profile.answers,
                "questions": so_profile.questions,
                "accepted_answer_rate": so_profile.accepted_answer_rate,
                "top_tags": so_profile.top_tags,
                "top_question_tags": so_profile.top_question_tags,
                "recent_questions": so_profile.recent_questions,
                "recent_answers": so_profile.recent_answers,
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to analyze StackOverflow profile"
        }

@app.post("/footprint_scanner/comprehensive_analysis")
async def comprehensive_profile_analysis(request: ProfileAnalysisRequest):
    """Perform comprehensive analysis across all platforms with AI integration"""
    try:
        scanner = FootprintScanner()
        analysis = scanner.comprehensive_profile_analysis(
            github_username=request.github_username,
            linkedin_url=request.linkedin_url,
            stackoverflow_id=request.stackoverflow_id,
            target_role=request.target_role,
            region=request.region
        )
        
        return {
            "success": True,
            "analysis": {
                "overall_score": analysis.overall_score,
                "platform_scores": analysis.platform_scores,
                "cross_platform_consistency": analysis.cross_platform_consistency,
                "unique_strengths": analysis.unique_strengths,
                "potential_red_flags": analysis.potential_red_flags,
                "skill_gaps": analysis.skill_gaps,
                "career_insights": analysis.career_insights,
                "optimization_roadmap": analysis.optimization_roadmap,
                "regional_recommendations": analysis.regional_recommendations,
                "next_steps": analysis.next_steps,
                "target_role_alignment": analysis.target_role_alignment,
                "market_readiness": analysis.market_readiness
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to perform comprehensive analysis"
        }

@app.post("/footprint_scanner/regional_insights")
async def get_regional_insights(request: RegionalInsightsRequest):
    """Get regional market insights and cultural context"""
    try:
        scanner = FootprintScanner()
        region = request.region.lower()
        
        # Get regional context
        regional_context = scanner.regional_contexts.get(region, scanner.regional_contexts["sub_saharan_africa"])
        
        # Generate AI-powered regional insights
        insights_data = {
            "region": request.region,
            "target_role": request.target_role,
            "tech_priorities": regional_context["tech_priorities"],
            "networking_style": regional_context["networking_style"],
            "communication_preference": regional_context["communication_preference"],
            "remote_work_adoption": regional_context["remote_work_adoption"]
        }
        
        ai_insights = scanner._analyze_with_ai(
            f"""
            Generate comprehensive regional insights for {request.region} targeting {request.target_role}:
            
            Regional Data: {{insights_data}}
            
            Provide:
            1. Market demands and opportunities
            2. Cultural communication preferences
            3. Networking patterns and professional development resources
            4. Remote work potential and global market access
            5. Local opportunities and career advancement strategies
            
            Output format (JSON):
            {{
                "market_demands": ["demand1", "demand2", "demand3"],
                "cultural_preferences": {{"communication": "style", "networking": "approach"}},
                "networking_patterns": ["pattern1", "pattern2"],
                "professional_development_resources": ["resource1", "resource2"],
                "remote_work_potential": <0-100>,
                "global_market_access": <0-100>,
                "local_opportunities": ["opp1", "opp2", "opp3"],
                "career_advancement_strategies": ["strategy1", "strategy2"]
            }}
            """,
            {"insights_data": json.dumps(insights_data)}
        )
        
        return {
            "success": True,
            "regional_insights": {
                "region": request.region,
                "target_role": request.target_role,
                "market_demands": ai_insights.get("market_demands", regional_context["tech_priorities"]),
                "cultural_preferences": ai_insights.get("cultural_preferences", {
                    "communication": regional_context["communication_preference"],
                    "networking": regional_context["networking_style"]
                }),
                "networking_patterns": ai_insights.get("networking_patterns", []),
                "professional_development_resources": ai_insights.get("professional_development_resources", []),
                "remote_work_potential": ai_insights.get("remote_work_potential", regional_context["remote_work_adoption"] * 100),
                "global_market_access": ai_insights.get("global_market_access", 70),
                "local_opportunities": ai_insights.get("local_opportunities", []),
                "career_advancement_strategies": ai_insights.get("career_advancement_strategies", [])
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to get regional insights"
        }

@app.post("/footprint_scanner/skill_analysis")
async def analyze_skills(request: Dict[str, Any]):
    """Analyze skills across platforms and provide gap analysis"""
    try:
        scanner = FootprintScanner()
        
        # Get profiles
        profiles = {}
        if request.get("github_username"):
            profiles["github"] = scanner.analyze_github_profile(
                request["github_username"], 
                request.get("target_role", "Software Developer"),
                request.get("region", "Global")
            )
        
        if request.get("linkedin_url"):
            profiles["linkedin"] = scanner.analyze_linkedin_profile(
                request["linkedin_url"],
                request.get("target_role", "Professional"),
                request.get("region", "Global")
            )
        
        if request.get("stackoverflow_id"):
            profiles["stackoverflow"] = scanner.analyze_stackoverflow_profile(
                request["stackoverflow_id"],
                request.get("target_role", "Developer"),
                request.get("region", "Global")
            )
        
        # Extract skills from profiles
        all_skills = set()
        platform_skills = {}
        
        for platform, profile in profiles.items():
            if platform == "github" and hasattr(profile, 'languages'):
                skills = list(profile.languages.keys())
                all_skills.update(skills)
                platform_skills[platform] = skills
            elif platform == "linkedin" and hasattr(profile, 'endorsements'):
                skills = list(profile.endorsements.keys())
                all_skills.update(skills)
                platform_skills[platform] = skills
            elif platform == "stackoverflow" and hasattr(profile, 'top_tags'):
                skills = [tag[0] for tag in profile.top_tags]
                all_skills.update(skills)
                platform_skills[platform] = skills
        
        # Generate AI-powered skill analysis
        skill_analysis = scanner._analyze_with_ai(
            f"""
            Analyze skills for {request.get('target_role', 'Software Developer')} in {request.get('region', 'Global')}:
            
            Skills Data: {{skills_data}}
            
            Provide:
            1. Skill categorization (technical, soft, domain-specific)
            2. Skill gaps for target role
            3. Skill development recommendations
            4. Regional skill priorities
            5. Cross-platform skill consistency
            
            Output format (JSON):
            {{
                "technical_skills": ["skill1", "skill2"],
                "soft_skills": ["skill1", "skill2"],
                "domain_skills": ["skill1", "skill2"],
                "skill_gaps": ["gap1", "gap2"],
                "development_recommendations": ["rec1", "rec2"],
                "regional_priorities": ["priority1", "priority2"],
                "consistency_score": <0-100>,
                "strength_areas": ["area1", "area2"],
                "improvement_areas": ["area1", "area2"]
            }}
            """,
            {"skills_data": json.dumps({
                "all_skills": list(all_skills),
                "platform_skills": platform_skills,
                "target_role": request.get("target_role", "Software Developer"),
                "region": request.get("region", "Global")
            })}
        )
        
        return {
            "success": True,
            "skill_analysis": {
                "all_skills": list(all_skills),
                "platform_skills": platform_skills,
                "technical_skills": skill_analysis.get("technical_skills", []),
                "soft_skills": skill_analysis.get("soft_skills", []),
                "domain_skills": skill_analysis.get("domain_skills", []),
                "skill_gaps": skill_analysis.get("skill_gaps", []),
                "development_recommendations": skill_analysis.get("development_recommendations", []),
                "regional_priorities": skill_analysis.get("regional_priorities", []),
                "consistency_score": skill_analysis.get("consistency_score", 0),
                "strength_areas": skill_analysis.get("strength_areas", []),
                "improvement_areas": skill_analysis.get("improvement_areas", [])
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to analyze skills"
        }

@app.post("/footprint_scanner/career_roadmap")
async def generate_career_roadmap(request: Dict[str, Any]):
    """Generate personalized career development roadmap"""
    try:
        scanner = FootprintScanner()
        
        # Get comprehensive analysis
        analysis = scanner.comprehensive_profile_analysis(
            github_username=request.get("github_username"),
            linkedin_url=request.get("linkedin_url"),
            stackoverflow_id=request.get("stackoverflow_id"),
            target_role=request.get("target_role", "Software Developer"),
            region=request.get("region", "Global")
        )
        
        # Generate AI-powered career roadmap
        roadmap_data = {
            "current_score": analysis.overall_score,
            "target_role": request.get("target_role", "Software Developer"),
            "region": request.get("region", "Global"),
            "skill_gaps": analysis.skill_gaps,
            "strengths": analysis.unique_strengths,
            "platform_scores": analysis.platform_scores
        }
        
        career_roadmap = scanner._analyze_with_ai(
            f"""
            Generate a comprehensive career development roadmap for {request.get('target_role', 'Software Developer')} in {request.get('region', 'Global')}:
            
            Analysis Data: {{roadmap_data}}
            
            Create a 6-month career development plan including:
            1. Immediate actions (0-1 month)
            2. Short-term goals (1-3 months)
            3. Medium-term objectives (3-6 months)
            4. Skill development priorities
            5. Platform optimization strategies
            6. Regional networking opportunities
            7. Professional development resources
            8. Milestone tracking metrics
            
            Output format (JSON):
            {{
                "immediate_actions": ["action1", "action2"],
                "short_term_goals": ["goal1", "goal2"],
                "medium_term_objectives": ["obj1", "obj2"],
                "skill_priorities": ["skill1", "skill2"],
                "platform_strategies": {{"github": "strategy", "linkedin": "strategy"}},
                "networking_opportunities": ["opp1", "opp2"],
                "development_resources": ["resource1", "resource2"],
                "milestone_metrics": ["metric1", "metric2"],
                "expected_outcomes": ["outcome1", "outcome2"],
                "timeline": {{"month1": "focus", "month3": "focus", "month6": "focus"}}
            }}
            """,
            {"roadmap_data": json.dumps(roadmap_data, default=str)}
        )
        
        return {
            "success": True,
            "career_roadmap": {
                "current_score": analysis.overall_score,
                "target_role": request.get("target_role", "Software Developer"),
                "region": request.get("region", "Global"),
                "immediate_actions": career_roadmap.get("immediate_actions", []),
                "short_term_goals": career_roadmap.get("short_term_goals", []),
                "medium_term_objectives": career_roadmap.get("medium_term_objectives", []),
                "skill_priorities": career_roadmap.get("skill_priorities", []),
                "platform_strategies": career_roadmap.get("platform_strategies", {}),
                "networking_opportunities": career_roadmap.get("networking_opportunities", []),
                "development_resources": career_roadmap.get("development_resources", []),
                "milestone_metrics": career_roadmap.get("milestone_metrics", []),
                "expected_outcomes": career_roadmap.get("expected_outcomes", []),
                "timeline": career_roadmap.get("timeline", {}),
                "optimization_roadmap": analysis.optimization_roadmap,
                "regional_recommendations": analysis.regional_recommendations
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to generate career roadmap"
        }

@app.get("/footprint_scanner")
def footprint_scanner_info():
    """Get Footprint Scanner service information"""
    return {
        "service": "Footprint Scanner",
        "description": "AI-powered public profile analysis across multiple platforms",
        "features": [
            "GitHub profile analysis",
            "LinkedIn network assessment",
            "StackOverflow contribution analysis",
            "Comprehensive professional footprint",
            "Skill and reputation scoring"
        ],
        "endpoints": [
            "/footprint_scanner/analyze_github",
            "/footprint_scanner/analyze_linkedin",
            "/footprint_scanner/analyze_stackoverflow",
            "/footprint_scanner/comprehensive_analysis",
            "/footprint_scanner/regional_insights",
            "/footprint_scanner/skill_analysis",
            "/footprint_scanner/career_roadmap"
        ]
    }
