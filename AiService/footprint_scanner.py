from dataclasses import dataclass
from typing import Dict, List, Optional, Any
import os
import re
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv


load_dotenv()

RAPIDAPI_ENDPOINT = "https://linkedinscraper.p.rapidapi.com/profile-details"
RAPIDAPI_HOST = "linkedinscraper.p.rapidapi.com"


@dataclass
class LinkedInProfile:
    profile_url: Optional[str]
    connections: int
    endorsements: Dict[str, int]
    recent_posts: List[Dict[str, Any]]
    engagement_rate: float
    industry: Optional[str]
    profile_completeness: int
    profile_score: float
    network_quality: float
    professional_branding_score: float
    content_creation_score: float
    skills_endorsements_score: float
    headline_effectiveness: float
    summary_clarity: float
    visual_presentation: float
    industry_thought_leadership: float
    regional_networking_score: float
    # Contribution-centric fields
    full_name: Optional[str] = None
    headline: Optional[str] = None
    about: Optional[str] = None
    follower_count: int = 0
    experience: List[Dict[str, Any]] = None  # raw subset
    education: List[Dict[str, Any]] = None   # raw subset
    certifications: List[Dict[str, Any]] = None
    skills_list: List[str] = None
    profile_picture: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None


class FootprintScanner:
    def __init__(self, rapidapi_key: Optional[str] = None) -> None:
        self.rapidapi_key = rapidapi_key or os.getenv("RAPIDAPI_KEY")

        # Minimal regional contexts to keep existing routes working
        self.regional_contexts: Dict[str, Dict[str, Any]] = {
            "sub_saharan_africa": {
                "tech_priorities": ["FinTech", "AgriTech", "eCommerce", "HealthTech"],
                "networking_style": "Community and relationship-driven",
                "communication_preference": "Clear, respectful, and context-aware",
                "remote_work_adoption": 0.6,
            }
        }

    # ------------------ Public API: LinkedIn ------------------
    def analyze_linkedin_profile(
        self,
        profile_url: Optional[str] = None,
        target_role: str = "Professional",
        region: str = "Global",
        username: Optional[str] = None,
    ) -> LinkedInProfile:
        """
        Fetch LinkedIn profile details via RapidAPI using a username. If a `profile_url` is
        provided, attempts to extract the username from it.

        Returns a LinkedInProfile object mapped from the API response, with sensible defaults
        when fields are missing.
        """
        if not username:
            username = self._extract_username_from_url(profile_url) if profile_url else None

        if not username:
            raise ValueError("username or profile_url (containing username) is required")

        raw = self._fetch_linkedin_profile_by_username(username)
        return self._map_linkedin_api_to_profile(raw, profile_url)

    # ------------------ Internal helpers ------------------
    def _fetch_linkedin_profile_by_username(self, username: str) -> Dict[str, Any]:
        if not self.rapidapi_key:
            raise EnvironmentError(
                "RAPIDAPI_KEY is not set. Please add it to your environment or .env file."
            )

        headers = {
            "x-rapidapi-key": self.rapidapi_key,
            "x-rapidapi-host": RAPIDAPI_HOST,
        }
        params = {"username": username}

        response = requests.get(RAPIDAPI_ENDPOINT, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        try:
            return response.json()  # type: ignore[return-value]
        except ValueError as exc:
            raise RuntimeError("Invalid JSON response from LinkedIn RapidAPI") from exc

    def _map_linkedin_api_to_profile(
        self, data: Dict[str, Any], profile_url: Optional[str]
    ) -> LinkedInProfile:
        # Some providers wrap the payload under "data"
        obj = data.get("data", data)

        # Endorsements from skills list
        endorsements: Dict[str, int] = {}
        skills_raw = obj.get("skills") or []
        if isinstance(skills_raw, list):
            for entry in skills_raw:
                if isinstance(entry, dict):
                    name = str(entry.get("name", "")).strip()
                    if not name:
                        continue
                    # Many responses encode endorsement count in a string like "1 endorsement"
                    count_field = str(entry.get("position", "")).lower()
                    count_match = None
                    # Extract first integer if present
                    for token in count_field.split():
                        if token.isdigit():
                            count_match = int(token)
                            break
                    count = count_match if count_match is not None else 1
                    endorsements[name] = endorsements.get(name, 0) + count
                else:
                    # Fallback: simple string skill
                    skill_name = str(entry).strip()
                    if skill_name:
                        endorsements[skill_name] = endorsements.get(skill_name, 0) + 1

        # Recent posts if any
        recent_posts = obj.get("posts") or obj.get("recentPosts") or []
        if not isinstance(recent_posts, list):
            recent_posts = []

        # Core numeric fields
        connections = int(obj.get("connectionsCount") or obj.get("connections") or 0)
        followers = int(obj.get("followerCount") or 0)
        industry = obj.get("industry")

        # Construct URL from publicIdentifier if needed
        public_identifier = obj.get("publicIdentifier")
        derived_url = f"https://www.linkedin.com/in/{public_identifier}/" if public_identifier else None

        # Compute profile completeness (0-100)
        completeness_fields = {
            "about": obj.get("about"),
            "experience": obj.get("experience"),
            "education": obj.get("education"),
            "skills": skills_raw,
            "certifications": obj.get("certifications"),
            "profilePicture": obj.get("profilePicture"),
            "headline": obj.get("headline"),
            "location": obj.get("city") or obj.get("country"),
        }
        present = sum(1 for v in completeness_fields.values() if v)
        profile_completeness = int(round((present / len(completeness_fields)) * 100)) if completeness_fields else 0

        # Heuristic scoring
        # Engagement: followers and posting activity
        engagement_rate = min(100.0, (followers / 50.0) + (len(recent_posts) * 5.0))
        profile_score = min(100.0, (profile_completeness * 0.6) + (min(connections, 500) / 5) + (len(endorsements) * 1.5))
        network_quality = min(100.0, (len(endorsements) * 3) + (connections / 10))
        professional_branding_score = min(100.0, profile_score * 0.8)
        content_creation_score = min(100.0, (len(recent_posts) * 8) + (engagement_rate * 0.5))
        skills_endorsements_score = min(100.0, sum(endorsements.values()) * 3)
        headline_effectiveness = float(obj.get("headlineScore", professional_branding_score * 0.6))
        summary_clarity = float(obj.get("aboutScore", professional_branding_score * 0.6))
        visual_presentation = float(obj.get("visualScore", 70.0))
        industry_thought_leadership = min(100.0, content_creation_score * 0.7)
        regional_networking_score = min(100.0, network_quality * 0.8)

        return LinkedInProfile(
            profile_url=profile_url or obj.get("profileUrl") or obj.get("url") or derived_url,
            connections=connections,
            endorsements=endorsements,
            recent_posts=recent_posts,
            engagement_rate=round(float(engagement_rate), 2),
            industry=industry,
            profile_completeness=profile_completeness,
            profile_score=round(profile_score, 2),
            network_quality=round(network_quality, 2),
            professional_branding_score=round(professional_branding_score, 2),
            content_creation_score=round(content_creation_score, 2),
            skills_endorsements_score=round(skills_endorsements_score, 2),
            headline_effectiveness=round(float(headline_effectiveness), 2),
            summary_clarity=round(float(summary_clarity), 2),
            visual_presentation=round(float(visual_presentation), 2),
            industry_thought_leadership=round(float(industry_thought_leadership), 2),
            regional_networking_score=round(float(regional_networking_score), 2),
            full_name=obj.get("fullName"),
            headline=obj.get("headline"),
            about=obj.get("about"),
            follower_count=followers,
            experience=obj.get("experience") or [],
            education=obj.get("education") or [],
            certifications=obj.get("certifications") or [],
            skills_list=[k for k in endorsements.keys()],
            profile_picture=obj.get("profilePicture"),
            city=obj.get("city"),
            country=obj.get("country"),
        )

    def _extract_username_from_url(self, url: Optional[str]) -> Optional[str]:
        if not url:
            return None
        # Typical LinkedIn profile URLs: https://www.linkedin.com/in/<username>/
        match = re.search(r"linkedin\.com/(?:in|pub)/([a-zA-Z0-9\-_.]+)/?", url)
        return match.group(1) if match else None

    # ------------------ Stubs to satisfy imports in existing routes ------------------
    def _analyze_with_ai(self, prompt: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Minimal no-op to keep unrelated endpoints functional without Ollama setup here
        return {}

    # ------------------ GitHub Analysis ------------------
    @dataclass
    class GitHubProfile:
        username: str
        name: Optional[str]
        avatar_url: Optional[str]
        bio: Optional[str]
        company: Optional[str]
        location: Optional[str]
        blog: Optional[str]
        public_repos: int
        followers: int
        following: int
        total_stars: int
        total_forks: int
        languages: Dict[str, int]
        recent_activity: List[Dict[str, Any]]
        orgs: List[Dict[str, Any]]
        contribution_streak: int
        profile_score: float
        top_repos: List[Dict[str, Any]]
        collaboration_score: float
        # Enhanced metrics (kept for route compatibility)
        code_quality_score: float
        technical_diversity_score: float
        innovation_score: float
        problem_solving_score: float
        learning_curve_score: float
        regional_relevance_score: float
        remote_work_readiness: float

    def analyze_github_profile(self, username: str, target_role: str = "Software Developer", region: str = "Global") -> "FootprintScanner.GitHubProfile":
        token = os.getenv("GITHUB_TOKEN")
        headers = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "cs-challenge-app/1.0",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"

        def gh_get(url: str, params: Optional[Dict[str, Any]] = None) -> Any:
            resp = requests.get(url, headers=headers, params=params, timeout=30)
            if resp.status_code == 404:
                raise ValueError("GitHub user not found")
            if resp.status_code == 403:
                body = resp.text
                msg = "GitHub API 403: rate limit exceeded. Set GITHUB_TOKEN environment variable for higher limits."
                raise RuntimeError(f"{msg} | response={body}")
            if resp.status_code < 200 or resp.status_code >= 300:
                detail = resp.text
                raise RuntimeError(f"GitHub API {resp.status_code}: {detail}")
            try:
                return resp.json()
            except ValueError:
                raise RuntimeError("GitHub API returned non-JSON response")

        # 1) User core profile
        user = gh_get(f"https://api.github.com/users/{username}")
        public_repos = int(user.get("public_repos", 0))
        followers = int(user.get("followers", 0))
        following = int(user.get("following", 0))
        name = user.get("name")
        avatar_url = user.get("avatar_url")
        bio = user.get("bio")
        company = user.get("company")
        location_txt = user.get("location")
        blog = user.get("blog")

        # 2) Repositories (public)
        repos = gh_get(
            f"https://api.github.com/users/{username}/repos",
            params={"per_page": 100, "sort": "updated", "direction": "desc"}
        )
        if not isinstance(repos, list):
            repos = []

        total_stars = 0
        total_forks = 0
        languages: Dict[str, int] = {}

        # Aggregate repo metrics and fetch language bytes for up to 30 repos
        for i, repo in enumerate(repos):
            stargazers = int(repo.get("stargazers_count", 0) or 0)
            forks = int(repo.get("forks_count", 0) or 0)
            total_stars += stargazers
            total_forks += forks

            if i < 30:
                try:
                    langs = gh_get(f"https://api.github.com/repos/{username}/{repo.get('name')}/languages")
                    if isinstance(langs, dict):
                        for lang, bytes_count in langs.items():
                            languages[lang] = languages.get(lang, 0) + int(bytes_count or 0)
                except Exception:
                    pass

        # 3) Public events (recent activity)
        try:
            events = gh_get(f"https://api.github.com/users/{username}/events/public", params={"per_page": 20})
        except Exception:
            events = []
        recent_activity: List[Dict[str, Any]] = []
        for ev in events[:10]:
            recent_activity.append({
                "type": ev.get("type"),
                "repo": (ev.get("repo") or {}).get("name"),
                "created_at": ev.get("created_at"),
            })

        # 4) Organizations
        try:
            orgs = gh_get(f"https://api.github.com/users/{username}/orgs")
        except Exception:
            orgs = []

        # Top repos by stars
        top_repos_source = sorted(repos, key=lambda r: int(r.get("stargazers_count", 0) or 0), reverse=True)[:5]
        top_repos = [{
            "name": r.get("name"),
            "stars": int(r.get("stargazers_count", 0) or 0),
            "language": r.get("language"),
            "html_url": r.get("html_url"),
            "description": r.get("description"),
        } for r in top_repos_source]

        # Heuristic fields (kept for route compatibility)
        contribution_streak = 0  # Not available via REST easily
        # Keep legacy fields for compatibility, but set to neutral values
        profile_score = 0.0
        collaboration_score = 0.0
        code_quality_score = 0.0
        technical_diversity_score = 0.0
        innovation_score = 0.0
        problem_solving_score = 0.0
        learning_curve_score = 0.0
        regional_relevance_score = 0.0
        remote_work_readiness = 0.0

        return FootprintScanner.GitHubProfile(
            username=username,
            name=name,
            avatar_url=avatar_url,
            bio=bio,
            company=company,
            location=location_txt,
            blog=blog,
            public_repos=public_repos,
            followers=followers,
            following=following,
            total_stars=total_stars,
            total_forks=total_forks,
            languages=languages,
            recent_activity=recent_activity,
            orgs=orgs,
            contribution_streak=contribution_streak,
            profile_score=round(profile_score, 2),
            top_repos=top_repos,
            collaboration_score=round(collaboration_score, 2),
            code_quality_score=code_quality_score,
            technical_diversity_score=round(technical_diversity_score, 2),
            innovation_score=round(innovation_score, 2),
            problem_solving_score=problem_solving_score,
            learning_curve_score=learning_curve_score,
            regional_relevance_score=regional_relevance_score,
            remote_work_readiness=remote_work_readiness,
        )


    # ------------------ StackOverflow Analysis ------------------
    @dataclass
    class StackOverflowProfile:
        user_id: str
        display_name: Optional[str]
        reputation: int
        badge_counts: Dict[str, int]
        profile_image: Optional[str]
        location: Optional[str]
        website_url: Optional[str]
        about_me: Optional[str]
        view_count: Optional[int]
        creation_date: Optional[str]
        last_access_date: Optional[str]
        answers: int
        questions: int
        accepted_answer_rate: Optional[float]
        top_tags: List[Dict[str, Any]]
        top_question_tags: List[Dict[str, Any]]
        recent_questions: List[Dict[str, Any]]
        recent_answers: List[Dict[str, Any]]

    def analyze_stackoverflow_profile(self, user_id: str, target_role: str = "Developer", region: str = "Global") -> "FootprintScanner.StackOverflowProfile":
        base = "https://api.stackexchange.com/2.3"
        app_key = os.getenv("STACKEXCHANGE_KEY")

        def so_get(path: str, params: Optional[Dict[str, Any]] = None) -> Any:
            p = {"site": "stackoverflow"}
            if params:
                p.update(params)
            if app_key:
                p["key"] = app_key
            resp = requests.get(f"{base}{path}", params=p, timeout=30)
            if resp.status_code < 200 or resp.status_code >= 300:
                raise RuntimeError(f"StackExchange API {resp.status_code}: {resp.text}")
            try:
                data = resp.json()
            except ValueError:
                raise RuntimeError("StackExchange API returned non-JSON response")
            return data.get("items", [])

        # User core
        users = so_get(f"/users/{user_id}")
        if not users:
            raise ValueError("StackOverflow user not found")
        user = users[0]

        # Answers and questions (paged minimal: first page 100)
        answers = so_get(f"/users/{user_id}/answers", params={"pagesize": 100, "order": "desc", "sort": "activity"})
        questions = so_get(f"/users/{user_id}/questions", params={"pagesize": 100, "order": "desc", "sort": "activity"})

        # Accepted answers rate if available
        accepted_count = 0
        for a in answers:
            if isinstance(a, dict) and a.get("is_accepted"):
                accepted_count += 1
        accepted_rate = None
        if isinstance(answers, list) and len(answers) > 0:
            accepted_rate = round((accepted_count / len(answers)) * 100.0, 1)

        # Top tags by answer score
        top_answer_tags = so_get(f"/users/{user_id}/top-answer-tags")
        top_question_tags = so_get(f"/users/{user_id}/top-question-tags")
        top_tags: List[Dict[str, Any]] = []
        for t in top_answer_tags[:10]:
            top_tags.append({
                "tag_name": t.get("tag_name"),
                "answer_count": t.get("answer_count"),
                "answer_score": t.get("answer_score"),
            })

        top_q_tags: List[Dict[str, Any]] = []
        for t in top_question_tags[:10]:
            top_q_tags.append({
                "tag_name": t.get("tag_name"),
                "question_count": t.get("question_count"),
                "question_score": t.get("question_score"),
            })

        # Recent questions (show 5)
        recent_questions: List[Dict[str, Any]] = []
        for q in (questions[:5] if isinstance(questions, list) else []):
            recent_questions.append({
                "title": q.get("title"),
                "score": q.get("score"),
                "link": q.get("link"),
                "creation_date": q.get("creation_date"),
            })

        # Recent answers (show 5) - link to answer page
        recent_answers: List[Dict[str, Any]] = []
        for a in (answers[:5] if isinstance(answers, list) else []):
            answer_id = a.get("answer_id")
            question_id = a.get("question_id")
            recent_answers.append({
                "answer_id": answer_id,
                "question_id": question_id,
                "score": a.get("score"),
                "creation_date": a.get("creation_date"),
                "link": f"https://stackoverflow.com/a/{answer_id}" if answer_id else (f"https://stackoverflow.com/q/{question_id}" if question_id else None),
            })

        return FootprintScanner.StackOverflowProfile(
            user_id=str(user_id),
            display_name=user.get("display_name"),
            reputation=int(user.get("reputation", 0)),
            badge_counts=user.get("badge_counts", {}) or {},
            profile_image=user.get("profile_image"),
            location=user.get("location"),
            website_url=user.get("website_url"),
            about_me=user.get("about_me"),
            view_count=user.get("view_count"),
            creation_date=(datetime.fromtimestamp(user.get("creation_date"), tz=timezone.utc).isoformat() if user.get("creation_date") else None),
            last_access_date=(datetime.fromtimestamp(user.get("last_access_date"), tz=timezone.utc).isoformat() if user.get("last_access_date") else None),
            answers=len(answers) if isinstance(answers, list) else 0,
            questions=len(questions) if isinstance(questions, list) else 0,
            accepted_answer_rate=accepted_rate,
            top_tags=top_tags,
            top_question_tags=top_q_tags,
            recent_questions=recent_questions,
            recent_answers=recent_answers,
        )

