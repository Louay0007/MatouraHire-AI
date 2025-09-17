from dataclasses import dataclass
from typing import List, Optional, Dict, Any
import requests
from bs4 import BeautifulSoup
import time
import random
import json
import re
from urllib.parse import quote
from requests.adapters import HTTPAdapter
from urllib3.util import Retry
from datetime import datetime


@dataclass
class JobData:
    title: str
    company: str
    location: str
    job_link: str
    posted_date: str

@dataclass
class CandidateProfile:
    name: str
    email: str
    location: str
    skills: List[str]
    experience_years: int
    education: List[str]
    certifications: List[str]
    preferred_locations: List[str]
    salary_expectation: Optional[int]
    job_type_preference: str
    resume_text: str

@dataclass
class JobOpportunity:
    title: str
    company: str
    location: str
    description: str
    required_skills: List[str]
    preferred_skills: List[str]
    experience_level: str
    salary_range: Optional[tuple]
    job_type: str
    posted_date: datetime
    application_url: str
    match_score: float = 0.0


class ScraperConfig:
    BASE_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
    JOBS_PER_PAGE = 25
    MIN_DELAY = 2
    MAX_DELAY = 5
    RATE_LIMIT_DELAY = 30
    RATE_LIMIT_THRESHOLD = 10

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "DNT": "1",
        "Cache-Control": "no-cache",
    }


class LinkedInJobsScraper:
    def __init__(self):
        self.session = self._setup_session()

    def _setup_session(self) -> requests.Session:
        session = requests.Session()
        retries = Retry(
            total=5, backoff_factor=0.5, status_forcelist=[429, 500, 502, 503, 504]
        )
        session.mount("https://", HTTPAdapter(max_retries=retries))
        return session

    def _build_search_url(self, keywords: str, location: str, start: int = 0) -> str:
        params = {
            "keywords": keywords,
            "location": location,
            "start": start,
        }
        return f"{ScraperConfig.BASE_URL}?{'&'.join(f'{k}={quote(str(v))}' for k, v in params.items())}"

    def _clean_job_url(self, url: str) -> str:
        return url.split("?")[0] if "?" in url else url

    def _extract_job_data(self, job_card: BeautifulSoup) -> Optional[JobData]:
        try:
            title = job_card.find("h3", class_="base-search-card__title").text.strip()
            company = job_card.find(
                "h4", class_="base-search-card__subtitle"
            ).text.strip()
            location = job_card.find(
                "span", class_="job-search-card__location"
            ).text.strip()
            job_link = self._clean_job_url(
                job_card.find("a", class_="base-card__full-link")["href"]
            )
            posted_date = job_card.find("time", class_="job-search-card__listdate")
            posted_date = posted_date.text.strip() if posted_date else "N/A"

            return JobData(
                title=title,
                company=company,
                location=location,
                job_link=job_link,
                posted_date=posted_date,
            )
        except Exception as e:
            print(f"Failed to extract job data: {str(e)}")
            return None

    def _fetch_job_page(self, url: str) -> BeautifulSoup:
        try:
            response = self.session.get(url, headers=ScraperConfig.HEADERS)
            if response.status_code != 200:
                raise RuntimeError(
                    f"Failed to fetch data: Status code {response.status_code}"
                )
            return BeautifulSoup(response.text, "html.parser")
        except requests.RequestException as e:
            raise RuntimeError(f"Request failed: {str(e)}")

    def scrape_jobs(
        self, keywords: str, location: str, max_jobs: int = 100
    ) -> List[JobData]:
        all_jobs = []
        start = 0

        while len(all_jobs) < max_jobs:
            try:
                url = self._build_search_url(keywords, location, start)
                soup = self._fetch_job_page(url)
                job_cards = soup.find_all("div", class_="base-card")

                if not job_cards:
                    break
                for card in job_cards:
                    job_data = self._extract_job_data(card)
                    if job_data:
                        all_jobs.append(job_data)
                        if len(all_jobs) >= max_jobs:
                            break
                print(f"Scraped {len(all_jobs)} jobs...")
                start += ScraperConfig.JOBS_PER_PAGE
                time.sleep(
                    random.uniform(ScraperConfig.MIN_DELAY, ScraperConfig.MAX_DELAY)
                )
            except Exception as e:
                print(f"Scraping error: {str(e)}")
                break
        return all_jobs[:max_jobs]

    def save_results(
        self, jobs: List[JobData], filename: str = "linkedin_jobs.json"
    ) -> None:
        if not jobs:
            return
        with open(filename, "w", encoding="utf-8") as f:
            json.dump([vars(job) for job in jobs], f, indent=2, ensure_ascii=False)
        print(f"Saved {len(jobs)} jobs to {filename}")


class JobMatcher:
    def __init__(self):
        self.scraper = LinkedInJobsScraper()
    
    def extract_skills_from_text(self, text: str) -> List[str]:
        """Extract skills from resume text"""
        # Common technical skills
        skill_keywords = [
            'python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
            'react', 'angular', 'vue', 'node.js', 'django', 'flask', 'spring', 'express', 'laravel',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab',
            'machine learning', 'ai', 'data science', 'pandas', 'numpy', 'tensorflow', 'pytorch',
            'html', 'css', 'bootstrap', 'sass', 'webpack', 'gulp',
            'agile', 'scrum', 'kanban', 'devops', 'ci/cd', 'microservices',
            'excel', 'power bi', 'tableau', 'salesforce', 'marketing', 'finance', 'accounting',
            'project management', 'leadership', 'communication', 'analytics', 'strategy'
        ]
        
        text_lower = text.lower()
        found_skills = []
        for skill in skill_keywords:
            if skill in text_lower:
                found_skills.append(skill)
        
        return list(set(found_skills))
    
    def determine_job_categories(self, skills: List[str], experience_years: int, education: List[str]) -> List[str]:
        """Determine job categories based on skills and experience"""
        categories = []
        
        # Technical roles
        if any(skill in skills for skill in ['python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go']):
            if any(skill in skills for skill in ['machine learning', 'ai', 'data science', 'pandas', 'numpy']):
                categories.append("Data Science & AI")
            elif any(skill in skills for skill in ['react', 'angular', 'vue', 'html', 'css']):
                categories.append("Frontend Development")
            elif any(skill in skills for skill in ['node.js', 'django', 'flask', 'spring', 'express']):
                categories.append("Backend Development")
            elif any(skill in skills for skill in ['aws', 'azure', 'gcp', 'docker', 'kubernetes']):
                categories.append("DevOps & Cloud")
            else:
                categories.append("Software Development")
        
        # Business roles
        if any(skill in skills for skill in ['excel', 'power bi', 'tableau', 'analytics', 'finance', 'accounting']):
            categories.append("Business Analytics & Finance")
        
        if any(skill in skills for skill in ['marketing', 'sales', 'strategy', 'communication']):
            categories.append("Marketing & Sales")
        
        if any(skill in skills for skill in ['project management', 'leadership', 'agile', 'scrum']):
            categories.append("Project Management & Leadership")
        
        # If no specific categories found, determine based on experience
        if not categories:
            if experience_years >= 5:
                categories.append("Senior Professional")
            elif experience_years >= 2:
                categories.append("Mid-Level Professional")
            else:
                categories.append("Entry-Level Professional")
        
        return categories
    
    def generate_job_keywords(self, categories: List[str], skills: List[str]) -> str:
        """Generate job search keywords based on categories and skills"""
        keyword_mapping = {
            "Data Science & AI": ["Data Scientist", "Machine Learning Engineer", "AI Engineer", "Data Analyst"],
            "Frontend Development": ["Frontend Developer", "React Developer", "UI/UX Developer", "Web Developer"],
            "Backend Development": ["Backend Developer", "Python Developer", "Java Developer", "API Developer"],
            "DevOps & Cloud": ["DevOps Engineer", "Cloud Engineer", "AWS Engineer", "Infrastructure Engineer"],
            "Software Development": ["Software Engineer", "Software Developer", "Full Stack Developer"],
            "Business Analytics & Finance": ["Business Analyst", "Financial Analyst", "Data Analyst", "Business Intelligence"],
            "Marketing & Sales": ["Marketing Manager", "Sales Manager", "Digital Marketing", "Business Development"],
            "Project Management & Leadership": ["Project Manager", "Team Lead", "Product Manager", "Scrum Master"]
        }
        
        keywords = []
        for category in categories:
            if category in keyword_mapping:
                keywords.extend(keyword_mapping[category])
        
        # Add specific skills as keywords
        tech_skills = [skill for skill in skills if skill in ['python', 'javascript', 'java', 'react', 'angular', 'vue', 'django', 'flask']]
        if tech_skills:
            keywords.extend([f"{skill.title()} Developer" for skill in tech_skills[:3]])  # Limit to top 3
        
        return " OR ".join(keywords[:10])  # Limit to 10 keywords
    
    def analyze_cv(self, resume_text: str) -> Dict[str, Any]:
        """Analyze CV and extract all relevant information"""
        # Extract skills
        skills = self.extract_skills_from_text(resume_text)
        
        # Extract experience years
        experience_years = self._extract_experience_years(resume_text)
        
        # Extract education
        education = self._extract_education(resume_text)
        
        # Extract certifications
        certifications = self._extract_certifications(resume_text)
        
        # Determine job categories
        categories = self.determine_job_categories(skills, experience_years, education)
        
        # Generate job keywords
        job_keywords = self.generate_job_keywords(categories, skills)
        
        return {
            "skills": skills,
            "experience_years": experience_years,
            "education": education,
            "certifications": certifications,
            "job_categories": categories,
            "job_keywords": job_keywords,
            "suggested_roles": self._get_suggested_roles(categories, experience_years)
        }
    
    def _extract_experience_years(self, text: str) -> int:
        """Extract years of experience from resume text"""
        patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
            r'(\d+)\+?\s*years?\s*(?:in\s*)?(?:the\s*)?field',
            r'(\d+)\s*to\s*(\d+)\s*years?\s*experience'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                if isinstance(matches[0], tuple):
                    return int(matches[0][0])
                else:
                    return int(matches[0])
        
        return 2  # Default to 2 years if not found
    
    def _extract_education(self, text: str) -> List[str]:
        """Extract education information from resume text"""
        education = []
        
        degree_patterns = [
            r'(Bachelor|Master|PhD|B\.S\.|M\.S\.|Ph\.D\.|B\.A\.|M\.A\.)\s*(?:in\s*)?([A-Za-z\s]+)',
            r'(Computer Science|Engineering|Mathematics|Physics|Business|Economics)',
        ]
        
        for pattern in degree_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    education.append(f"{match[0]} {match[1]}")
                else:
                    education.append(match)
        
        return list(set(education)) if education else ["Bachelor's Degree"]
    
    def _extract_certifications(self, text: str) -> List[str]:
        """Extract certifications from resume text"""
        certifications = []
        
        cert_patterns = [
            r'(AWS|Azure|GCP|Google Cloud|Amazon Web Services)\s*[Cc]ertified',
            r'(PMP|CISSP|CISA|CISM|ITIL|Agile|Scrum)\s*[Cc]ertified?',
            r'(Microsoft|Oracle|Cisco|CompTIA)\s*[Cc]ertified?',
        ]
        
        for pattern in cert_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            certifications.extend(matches)
        
        return list(set(certifications))
    
    def _get_suggested_roles(self, categories: List[str], experience_years: int) -> List[str]:
        """Get suggested job roles based on categories and experience"""
        role_mapping = {
            "Data Science & AI": ["Data Scientist", "Machine Learning Engineer", "AI Engineer", "Data Analyst"],
            "Frontend Development": ["Frontend Developer", "React Developer", "UI Developer", "Web Developer"],
            "Backend Development": ["Backend Developer", "Python Developer", "Java Developer", "API Developer"],
            "DevOps & Cloud": ["DevOps Engineer", "Cloud Engineer", "AWS Engineer", "Infrastructure Engineer"],
            "Software Development": ["Software Engineer", "Software Developer", "Full Stack Developer"],
            "Business Analytics & Finance": ["Business Analyst", "Financial Analyst", "Data Analyst"],
            "Marketing & Sales": ["Marketing Manager", "Sales Manager", "Digital Marketing Specialist"],
            "Project Management & Leadership": ["Project Manager", "Team Lead", "Product Manager"]
        }
        
        suggested_roles = []
        for category in categories:
            if category in role_mapping:
                # Adjust roles based on experience level
                if experience_years >= 5:
                    suggested_roles.extend([f"Senior {role}" for role in role_mapping[category][:2]])
                elif experience_years >= 2:
                    suggested_roles.extend(role_mapping[category][:2])
                else:
                    suggested_roles.extend([f"Junior {role}" for role in role_mapping[category][:2]])
        
        return suggested_roles[:5]  # Return top 5 roles


def main():
    params = {
        "keywords": "Data Scientist OR Data Analyst OR Machine Learning Engineer",
        "location": "Tunisia",
        "max_jobs": 100
    }

    scraper = LinkedInJobsScraper()
    try:
        print(f"Searching for {params['keywords']} jobs in {params['location']}...")
        jobs = scraper.scrape_jobs(**params)
        scraper.save_results(jobs)
        print(f"Found {len(jobs)} jobs. Results saved to linkedin_jobs.json")
    except Exception as e:
        print(f"Error occurred: {str(e)}")


if __name__ == "__main__":
    main()