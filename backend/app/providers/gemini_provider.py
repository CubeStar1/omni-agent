from app.providers.base import BaseLLMProvider
from app.prompts.traditional_rag_prompt import TraditionalRagPrompt
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import Dict, Any
import json

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.model = model
        self.llm = ChatGoogleGenerativeAI(
            google_api_key=api_key,
            model=model,
            temperature=0.1
        )
    
    async def generate_answer(self, context: str, question: str) -> str:
        prompt_template = TraditionalRagPrompt.get_traditional_rag_prompt()
        prompt = prompt_template.format(context=context, question=question)
        
        try:
            response = await self.llm.ainvoke(prompt)
            return response.content
        except Exception as e:
            return f"Error generating answer: {str(e)}"
    
    async def extract_structured_query(self, query: str) -> Dict:
        prompt = f"""
        Extract structured information from this query: "{query}"
        
        Return a JSON object with:
        - intent: main intent (search, information, comparison, etc.)
        - entities: key entities mentioned
        - keywords: important keywords for search
        - question_type: type of question (factual, conditional, temporal, etc.)
        
        Query: {query}
        
        JSON:
        """
        
        try:
            response = await self.llm.ainvoke(prompt)
            return json.loads(response.content)
        except:
            return {
                "intent": "search",
                "entities": [],
                "keywords": [query],
                "question_type": "factual"
            }
    
    def get_langchain_llm(self) -> Any:
        return self.llm
    
    @property
    def provider_name(self) -> str:
        return "gemini"
