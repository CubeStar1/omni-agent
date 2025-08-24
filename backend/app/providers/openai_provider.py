from app.providers.base import BaseLLMProvider
from app.prompts.traditional_rag_prompt import TraditionalRagPrompt
from langchain_openai import ChatOpenAI
from typing import Dict, Any, List
import json
import openai

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4.1-nano"):
        self.api_key = api_key
        self.model = model
        self.llm = ChatOpenAI(
            api_key=api_key,
            model=model,
            temperature=0.1
        )
        self.client = openai.AsyncOpenAI(api_key=api_key)
    
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
        return "openai"
    
    async def chat_completion_with_tools(
        self, 
        messages: List[Dict[str, Any]], 
        tools: List[Dict[str, Any]], 
        temperature: float = 1
    ) -> Any:
        """
        Chat completion with function calling support
        
        Args:
            messages: List of messages in OpenAI format
            tools: List of available tools/functions
            temperature: Temperature for generation
        
        Returns:
            OpenAI response object
        """
        try:
            functions = []
            for tool in tools:
                functions.append({
                    "type": "function",
                    "function": {
                        "name": tool["name"],
                        "description": tool["description"],
                        "parameters": tool["parameters"]
                    }
                })
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=functions,
                tool_choice="auto",
                temperature=temperature
            )
            
            return response
            
        except Exception as e:
            raise Exception(f"Function calling failed: {str(e)}")
