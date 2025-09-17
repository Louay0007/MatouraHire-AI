from langchain_ollama import OllamaLLM
from langchain.prompts import PromptTemplate
from langchain_core.runnables.base import RunnableSequence
from typing import List, Dict, Optional
from dotenv import load_dotenv
import os
import json

load_dotenv()

class AIInterviewer:
    def __init__(self):
        """Initialize the AI Interviewer with Ollama LLM"""
        self.model = OllamaLLM(model="llama3.1", base_url=os.getenv("OLLAMA_URL"))
    
    def generate_questions(self, job_description: str, interview_type: str = "mixed", num_questions: int = 8) -> List[Dict]:
        """
        Generate interview questions based on job description
        
        Args:
            job_description: The job description text
            interview_type: Type of interview (behavioral, technical, mixed, situational)
            num_questions: Number of questions to generate
            
        Returns:
            List of question dictionaries with metadata
        """
        prompt = PromptTemplate(
            input_variables=["job_description", "interview_type", "num_questions"],
            template="""
            You are an expert HR professional and interview coach. Generate {num_questions} high-quality interview questions for this job description:

            Job Description:
            {job_description}

            Interview Type: {interview_type}

            For each question, provide:
            1. The question text
            2. Question type (behavioral/technical/situational/general)
            3. Expected competencies/skills being assessed
            4. Difficulty level (1-5, where 1=easy, 5=expert)
            5. Suggested response time (in minutes)
            6. What the interviewer is looking for

            Format your response as a JSON array where each question is an object with these fields:
            - question: string
            - type: string
            - competencies: array of strings
            - difficulty: integer (1-5)
            - suggested_time: integer (minutes)
            - looking_for: string

            Make the questions:
            - Relevant to the specific role and company
            - Progressive in difficulty
            - Mix of question types if interview_type is "mixed"
            - Professional and fair
            - Designed to assess both technical and soft skills

            Return only the JSON array, no additional text.
            """
        )
        
        chain = RunnableSequence(prompt | self.model)
        
        try:
            response = chain.invoke({
                "job_description": job_description,
                "interview_type": interview_type,
                "num_questions": num_questions
            })
            
            # Parse the JSON response
            questions_data = json.loads(response)
            return questions_data
            
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return self._generate_fallback_questions(job_description, interview_type, num_questions)
        except Exception as e:
            print(f"Error generating questions: {e}")
            return self._generate_fallback_questions(job_description, interview_type, num_questions)
    
    def _generate_fallback_questions(self, job_description: str, interview_type: str, num_questions: int) -> List[Dict]:
        """Fallback questions if AI generation fails"""
        fallback_questions = [
            {
                "question": "Tell me about yourself and your relevant experience for this role.",
                "type": "general",
                "competencies": ["communication", "self-presentation", "experience"],
                "difficulty": 2,
                "suggested_time": 3,
                "looking_for": "Clear communication, relevant experience, confidence"
            },
            {
                "question": "What interests you most about this position and our company?",
                "type": "general",
                "competencies": ["motivation", "research", "cultural-fit"],
                "difficulty": 2,
                "suggested_time": 2,
                "looking_for": "Genuine interest, company knowledge, motivation"
            },
            {
                "question": "Describe a challenging project you worked on and how you overcame obstacles.",
                "type": "behavioral",
                "competencies": ["problem-solving", "persistence", "project-management"],
                "difficulty": 3,
                "suggested_time": 4,
                "looking_for": "Problem-solving approach, resilience, specific examples"
            },
            {
                "question": "How do you handle working under pressure or tight deadlines?",
                "type": "behavioral",
                "competencies": ["stress-management", "time-management", "prioritization"],
                "difficulty": 3,
                "suggested_time": 3,
                "looking_for": "Stress management strategies, time management skills"
            },
            {
                "question": "Tell me about a time you had to learn something new quickly.",
                "type": "behavioral",
                "competencies": ["learning-agility", "adaptability", "initiative"],
                "difficulty": 3,
                "suggested_time": 3,
                "looking_for": "Learning approach, adaptability, initiative"
            },
            {
                "question": "Describe a situation where you had to work with a difficult team member.",
                "type": "behavioral",
                "competencies": ["teamwork", "conflict-resolution", "communication"],
                "difficulty": 4,
                "suggested_time": 4,
                "looking_for": "Conflict resolution skills, emotional intelligence"
            },
            {
                "question": "What are your greatest strengths and how do they apply to this role?",
                "type": "general",
                "competencies": ["self-awareness", "role-relevance", "communication"],
                "difficulty": 2,
                "suggested_time": 3,
                "looking_for": "Self-awareness, role alignment, specific examples"
            },
            {
                "question": "Where do you see yourself in 5 years?",
                "type": "general",
                "competencies": ["career-planning", "ambition", "goal-setting"],
                "difficulty": 2,
                "suggested_time": 2,
                "looking_for": "Career vision, ambition, realistic planning"
            }
        ]
        
        return fallback_questions[:num_questions]
    
    def analyze_response(self, question: str, response: str, question_type: str = "general") -> Dict:
        """
        Analyze user's response to an interview question
        
        Args:
            question: The interview question
            response: User's response
            question_type: Type of question (behavioral, technical, etc.)
            
        Returns:
            Analysis dictionary with scores and feedback
        """
        prompt = PromptTemplate(
            input_variables=["question", "response", "question_type"],
            template="""
            You are an expert interview coach and HR professional. Analyze this interview response:

            Question: {question}
            Question Type: {question_type}
            Response: {response}

            Provide a comprehensive analysis in JSON format with these fields:

            {{
                "overall_score": integer (1-10),
                "content_quality": integer (1-10),
                "structure_clarity": integer (1-10),
                "relevance": integer (1-10),
                "specificity": integer (1-10),
                "confidence_level": integer (1-10),
                "strengths": array of strings,
                "weaknesses": array of strings,
                "specific_feedback": string,
                "improvement_suggestions": array of strings,
                "follow_up_questions": array of strings
            }}

            Scoring criteria:
            - Content Quality: How well does the response address the question?
            - Structure & Clarity: Is the response well-organized and easy to follow?
            - Relevance: How relevant is the response to the specific question?
            - Specificity: Does the response include specific examples and details?
            - Confidence Level: Does the response demonstrate confidence and conviction?

            Provide constructive, actionable feedback that helps the candidate improve.

            Return only the JSON object, no additional text.
            """
        )
        
        chain = RunnableSequence(prompt | self.model)
        
        try:
            response_text = chain.invoke({
                "question": question,
                "response": response,
                "question_type": question_type
            })
            
            # Parse the JSON response
            analysis = json.loads(response_text)
            return analysis
            
        except json.JSONDecodeError:
            # Fallback analysis if JSON parsing fails
            return self._generate_fallback_analysis(question, response, question_type)
        except Exception as e:
            print(f"Error analyzing response: {e}")
            return self._generate_fallback_analysis(question, response, question_type)
    
    def _generate_fallback_analysis(self, question: str, response: str, question_type: str) -> Dict:
        """Fallback analysis if AI analysis fails"""
        return {
            "overall_score": 6,
            "content_quality": 6,
            "structure_clarity": 6,
            "relevance": 6,
            "specificity": 6,
            "confidence_level": 6,
            "strengths": ["Response provided", "Attempted to address question"],
            "weaknesses": ["Could use more specific examples", "Structure could be improved"],
            "specific_feedback": "Thank you for your response. Consider adding more specific examples and structuring your answer with clear points.",
            "improvement_suggestions": [
                "Use the STAR method (Situation, Task, Action, Result) for behavioral questions",
                "Include specific examples and metrics when possible",
                "Structure your response with clear beginning, middle, and end"
            ],
            "follow_up_questions": [
                "Can you provide a specific example?",
                "What was the outcome of that situation?"
            ]
        }
    
    def generate_profile(self, responses: List[Dict]) -> Dict:
        """
        Generate comprehensive interview profile from all responses
        
        Args:
            responses: List of response analysis dictionaries
            
        Returns:
            Comprehensive profile with strengths, weaknesses, and recommendations
        """
        if not responses:
            return {"error": "No responses provided for analysis"}
        
        # Calculate average scores
        total_responses = len(responses)
        avg_scores = {
            "overall_score": sum(r.get("overall_score", 0) for r in responses) / total_responses,
            "content_quality": sum(r.get("content_quality", 0) for r in responses) / total_responses,
            "structure_clarity": sum(r.get("structure_clarity", 0) for r in responses) / total_responses,
            "relevance": sum(r.get("relevance", 0) for r in responses) / total_responses,
            "specificity": sum(r.get("specificity", 0) for r in responses) / total_responses,
            "confidence_level": sum(r.get("confidence_level", 0) for r in responses) / total_responses
        }
        
        # Aggregate strengths and weaknesses
        all_strengths = []
        all_weaknesses = []
        all_improvements = []
        
        for response in responses:
            all_strengths.extend(response.get("strengths", []))
            all_weaknesses.extend(response.get("weaknesses", []))
            all_improvements.extend(response.get("improvement_suggestions", []))
        
        # Remove duplicates and get most common
        from collections import Counter
        common_strengths = [item for item, count in Counter(all_strengths).most_common(5)]
        common_weaknesses = [item for item, count in Counter(all_weaknesses).most_common(5)]
        common_improvements = [item for item, count in Counter(all_improvements).most_common(5)]
        
        # Generate overall assessment
        overall_score = avg_scores["overall_score"]
        if overall_score >= 8:
            performance_level = "Excellent"
            performance_description = "Outstanding interview performance with strong communication and relevant examples."
        elif overall_score >= 6:
            performance_level = "Good"
            performance_description = "Solid interview performance with room for improvement in specific areas."
        elif overall_score >= 4:
            performance_level = "Fair"
            performance_description = "Basic interview performance with several areas needing development."
        else:
            performance_level = "Needs Improvement"
            performance_description = "Interview performance requires significant improvement and practice."
        
        return {
            "performance_level": performance_level,
            "performance_description": performance_description,
            "average_scores": avg_scores,
            "top_strengths": common_strengths,
            "key_weaknesses": common_weaknesses,
            "improvement_areas": common_improvements,
            "total_questions": total_responses,
            "recommendations": self._generate_recommendations(avg_scores, common_weaknesses),
            "next_steps": self._generate_next_steps(performance_level, common_weaknesses)
        }
    
    def _generate_recommendations(self, scores: Dict, weaknesses: List[str]) -> List[str]:
        """Generate personalized recommendations based on scores and weaknesses"""
        recommendations = []
        
        if scores["structure_clarity"] < 6:
            recommendations.append("Practice structuring your responses using frameworks like STAR (Situation, Task, Action, Result)")
        
        if scores["specificity"] < 6:
            recommendations.append("Include more specific examples, metrics, and quantifiable results in your responses")
        
        if scores["confidence_level"] < 6:
            recommendations.append("Work on projecting confidence through practice and preparation")
        
        if scores["content_quality"] < 6:
            recommendations.append("Focus on directly addressing the question asked and staying on topic")
        
        if "communication" in str(weaknesses).lower():
            recommendations.append("Practice clear and concise communication")
        
        if "examples" in str(weaknesses).lower():
            recommendations.append("Prepare specific examples for common behavioral questions")
        
        return recommendations[:5]  # Limit to top 5 recommendations
    
    def _generate_next_steps(self, performance_level: str, weaknesses: List[str]) -> List[str]:
        """Generate actionable next steps based on performance"""
        next_steps = []
        
        if performance_level == "Excellent":
            next_steps = [
                "Continue practicing to maintain your strong performance",
                "Consider advanced interview techniques and leadership scenarios",
                "Help others improve their interview skills"
            ]
        elif performance_level == "Good":
            next_steps = [
                "Focus on the identified improvement areas",
                "Practice with mock interviews",
                "Prepare more specific examples for common questions"
            ]
        else:
            next_steps = [
                "Dedicate time to interview preparation and practice",
                "Work on fundamental communication skills",
                "Consider professional interview coaching",
                "Practice with friends or mentors"
            ]
        
        return next_steps
