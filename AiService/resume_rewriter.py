from langchain_ollama import OllamaLLM
from langchain.prompts import PromptTemplate
from langchain_core.runnables.base import RunnableSequence
from typing import Union
from io import BytesIO
from dotenv import load_dotenv
import fitz
import os
from fpdf import FPDF

load_dotenv()  # Load environment variables from .env file
OLLAMA_URL = os.getenv("OLLAMA_URL")

# Initialize the Ollama LLM
model = OllamaLLM(model="llama3.1", base_url=OLLAMA_URL)

def extract_text_from_pdf(pdf_path: Union[str, bytes]) -> str:
    """Extract Text from a PDF file."""
    text = ""
    if isinstance(pdf_path, str):
        doc = fitz.open(pdf_path)
    else:
        doc = fitz.open(stream=BytesIO(pdf_path), filetype="pdf")
    
    try:
        for page in doc:
            text += page.get_text()
    finally:
        doc.close()
    return text

def rewrite_resume(resume_text: str) -> str:
    """Rewrite the resume text and improve its quality."""
    prompt = PromptTemplate(
        input_variables=["resume_text"],
        template=
"""
You are an expert career coach and professional resume writer specialized in creating resumes optimized for both humans and Applicant Tracking Systems (ATS). Your task is to rewrite the following resume text to:

Improve clarity, professionalism, and impact.

Highlight quantifiable achievements, skills, and results (whenever possible).

Use strong action verbs and concise phrasing.

Tailor the wording to maximize relevance for job applications in [insert industry/role, e.g., “AI/ML Engineering” or “Data Science”].

Ensure the tone is confident but not exaggerated.

Maintain consistent tense (past for completed roles, present for current role).

Avoid filler words, passive voice, and vague terms.

Make the text ATS-friendly by naturally including relevant keywords.

Here is the text to rewrite: {resume_text}

Output requirements:
- Return ONLY the polished, professional version of the resume text.
- Do NOT include any explanations, lists, or sections like "Key improvements made".
- Do NOT add commentary or headings. Output must be the resume content only.
""")
    chain = RunnableSequence(prompt | model)
    rewritten_resume = chain.invoke({"resume_text": resume_text})
    return rewritten_resume

def create_pdf_from_text(text: str, template_id: str = "ats") -> bytes:
    """Create a professional PDF file from the given text using a template."""
    def sanitize_text(s: str) -> str:
        # Replace common unicode punctuation with ASCII equivalents
        replacements = {
            '\u2013': '-',  # en dash
            '\u2014': '-',  # em dash
            '\u2018': "'", # left single quote
            '\u2019': "'", # right single quote
            '\u201c': '"', # left double quote
            '\u201d': '"', # right double quote
            '\u2026': '...',# ellipsis
            '\u2022': '-',  # bullet
            '\u00a0': ' ',  # non-breaking space
            '\u00b7': '-',  # middle dot
            '\u00ae': '(R)', # registered trademark
            '\u00a9': '(C)', # copyright
            '\u2122': '(TM)', # trademark
        }
        for k, v in replacements.items():
            s = s.replace(k, v)
        
        # Handle any remaining non-latin-1 characters by replacing them
        result = ""
        for char in s:
            try:
                # Try to encode the character in latin-1
                char.encode('latin-1')
                result += char
            except UnicodeEncodeError:
                # Replace with a safe alternative
                if char.isalpha():
                    result += '?'
                elif char.isdigit():
                    result += char
                elif char.isspace():
                    result += ' '
                else:
                    result += '?'
        return result

    def create_professional_pdf(content: str) -> bytes:
        """Create a professional-looking PDF with proper text positioning"""
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        
        # Template styles
        if template_id.lower() == "modern":
            header_color = (99, 102, 241)  # Indigo
            accent_color = (31, 41, 55)    # Slate-800
            text_color = (17, 24, 39)      # Gray-900
            title_font = ("Arial", "B", 24)
            subtitle_font = ("Arial", "", 12)
            section_font = ("Arial", "B", 14)
            body_font = ("Arial", "", 11)
        elif template_id.lower() == "classic":
            header_color = (33, 150, 243)  # Blue
            accent_color = (66, 66, 66)    # Dark gray
            text_color = (33, 33, 33)      # Dark text
            title_font = ("Times", "B", 24)
            subtitle_font = ("Times", "", 12)
            section_font = ("Times", "B", 14)
            body_font = ("Times", "", 11)
        elif template_id.lower() == "compact":
            header_color = (16, 185, 129)  # Emerald
            accent_color = (31, 41, 55)
            text_color = (17, 24, 39)
            title_font = ("Arial", "B", 22)
            subtitle_font = ("Arial", "", 11)
            section_font = ("Arial", "B", 13)
            body_font = ("Arial", "", 10)
        else:  # ats (default)
            header_color = (41, 128, 185)  # Professional blue
            accent_color = (52, 73, 94)    # Dark gray
            text_color = (44, 62, 80)      # Dark blue-gray
            title_font = ("Arial", "B", 24)
            subtitle_font = ("Arial", "", 12)
            section_font = ("Arial", "B", 14)
            body_font = ("Arial", "", 11)

        # Header section with colored background
        pdf.set_fill_color(*header_color)
        pdf.rect(0, 0, 210, 40, 'F')  # Full width header
        
        # Title in header
        pdf.set_font(*title_font)
        pdf.set_text_color(255, 255, 255)  # White text
        pdf.cell(0, 15, "ENHANCED RESUME", 0, 1, "C")
        
        # Subtitle
        pdf.set_font(*subtitle_font)
        pdf.cell(0, 8, "AI-Optimized Professional Profile", 0, 1, "C")
        
        # Reset text color for content
        pdf.set_text_color(*text_color)
        pdf.ln(10)
        
        # Process content line by line with proper positioning
        lines = content.split("\n")
        
        for line in lines:
            line = line.strip()
            if not line:
                pdf.ln(3)
                continue
            
            # Remove markdown formatting
            line = line.replace("**", "").replace("*", "")
            
            # Common contact/personal info keywords to exclude from section headers
            CONTACT_KEYWORDS = {"PHONE", "EMAIL", "CONTACT", "LINKEDIN", "GITHUB", "ADDRESS", "TEL", "MOBILE", "WEBSITE", "LOCATION"}
            COMMON_SECTIONS = {"EDUCATION", "EXPERIENCE", "SKILLS", "PROJECTS", "CERTIFICATIONS", "LANGUAGES", "ACHIEVEMENTS", "PUBLICATIONS"}
            
            # Check if line looks like a section header
            def is_section_header(text: str) -> bool:
                # Must be uppercase and longer than 3 chars
                if not (text.isupper() and len(text) > 3):
                    return False
                    
                # Skip if it starts with common contact info keywords
                if any(text.startswith(keyword) for keyword in CONTACT_KEYWORDS):
                    return False
                    
                # Likely a section header if it's a known section or contains these words
                section_indicator_words = {"SUMMARY", "PROFILE", "OBJECTIVE", "WORK", "PROFESSIONAL", "TECHNICAL", "ACADEMIC"}
                
                # Count words in the line
                words = text.split()
                
                # Check various conditions that indicate a section header:
                # 1. Known common section
                # 2. Contains common section indicator words
                # 3. Short (1-3 words) all-caps line that's not a name (names typically don't contain section indicator words)
                return (text in COMMON_SECTIONS or
                       any(indicator in text for indicator in section_indicator_words) or
                       (len(words) <= 3 and not any(char.isdigit() for char in text)))
            
            # Apply the section header check
            if is_section_header(line):
                
                # Section header
                pdf.ln(5)
                pdf.set_font(*section_font)
                pdf.set_text_color(*accent_color)
                pdf.multi_cell(0, 8, line, 0, 1)
                
                # Add underline
                pdf.set_draw_color(*header_color)
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.ln(5)
                
                pdf.set_font(*body_font)
                pdf.set_text_color(*text_color)
                
            # Check for bullet points
            elif line.startswith("-") or line.startswith("•") or line.startswith("*"):
                pdf.set_font(body_font[0], body_font[1], max(9, body_font[2]-1))
                # Use multi_cell for the entire line to avoid positioning issues
                pdf.multi_cell(0, 6, "  - " + line[1:].strip(), 0, 1)
                pdf.set_font(*body_font)
                
            # Check for key-value pairs (contact info) - handle differently
            elif ":" in line and len(line.split(":")[0]) < 30:
                parts = line.split(":", 1)
                if len(parts) == 2:
                    # Use multi_cell for the entire line to keep it together
                    pdf.set_font(body_font[0], "B", body_font[2])
                    full_line = parts[0].strip() + ": " + parts[1].strip()
                    pdf.multi_cell(0, 6, full_line, 0, 1)
                    pdf.set_font(*body_font)
                else:
                    pdf.multi_cell(0, 6, line, 0, 1)
                    
            else:
                # Regular text - always use multi_cell to avoid positioning issues
                pdf.set_font(*body_font)
                pdf.multi_cell(0, 6, line, 0, 1)
        
        # Footer
        pdf.set_y(-20)
        pdf.set_font("Arial", "I", 8)
        pdf.set_text_color(128, 128, 128)
        pdf.cell(0, 5, "Generated by Career Coach AI", 0, 1, "C")
        pdf.cell(0, 5, "Professional Resume Enhancement Service", 0, 1, "C")
        
        return pdf.output(dest='S')
    
    text = sanitize_text(text)
    pdf_data = create_professional_pdf(text)
    
    # fpdf may return a 'str' in some versions; convert to bytes
    if isinstance(pdf_data, str):
        return pdf_data.encode('latin-1')
    return pdf_data


