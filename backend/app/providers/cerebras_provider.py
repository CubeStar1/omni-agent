from app.providers.base import BaseLLMProvider
from app.prompts.traditional_rag_prompt import TraditionalRagPrompt
from langchain_openai import ChatOpenAI
from typing import Dict, Any, List
import json
import openai

class CerebrasProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "qwen-3-235b-a22b-instruct-2507"):
        self.api_key = api_key
        self.model = model
        self.llm = ChatOpenAI(
            api_key=api_key,
            base_url="https://api.cerebras.ai/v1",  
            model=model,
            temperature=0.3
        )
        self.client = openai.AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.cerebras.ai/v1"
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
        return "cerebras"
    
    async def chat_completion_with_tools(
        self, 
        messages: List[Dict[str, Any]], 
        tools: List[Dict[str, Any]], 
        temperature: float = 0.1
    ) -> Any:
        """
        Chat completion with function calling support
        
        Args:
            messages: List of messages in OpenAI format
            tools: List of available tools/functions
            temperature: Temperature for generation
        
        Returns:
            Cerebras response object (OpenAI-compatible format via Cerebras endpoint)
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
            raise Exception(f"Cerebras function calling failed: {str(e)}")