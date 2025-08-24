from app.providers.base import BaseLLMProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.groq_provider import GroqProvider
from app.providers.cerebras_provider import CerebrasProvider
from app.providers.openrouter_provider import OpenRouterProvider
from app.providers.lmstudio_provider import LMStudioProvider
from app.config.settings import Settings

class LLMProviderFactory:
    @staticmethod
    def create_provider(provider_type: str, settings: Settings) -> BaseLLMProvider:        
        if provider_type.lower() == "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY not configured")
            return OpenAIProvider(
                api_key=settings.OPENAI_API_KEY,
                model=settings.OPENAI_MODEL,
            )
        
        elif provider_type.lower() == "gemini":
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY not configured")
            return GeminiProvider(
                api_key=settings.GEMINI_API_KEY,
                model=settings.GEMINI_MODEL
            )
        
        elif provider_type.lower() == "groq":
            if not settings.GROQ_API_KEY:
                raise ValueError("GROQ_API_KEY not configured")
            return GroqProvider(
                api_key=settings.GROQ_API_KEY,
                model=settings.GROQ_MODEL
            )
        
        elif provider_type.lower() == "cerebras":
            if not settings.CEREBRAS_API_KEY:
                raise ValueError("CEREBRAS_API_KEY not configured")
            return CerebrasProvider(
                api_key=settings.CEREBRAS_API_KEY,
                model=settings.CEREBRAS_MODEL
            )
        
        elif provider_type.lower() == "openrouter":
            if not settings.OPENROUTER_API_KEY:
                raise ValueError("OPENROUTER_API_KEY not configured")
            return OpenRouterProvider(
                api_key=settings.OPENROUTER_API_KEY,
                model=settings.OPENROUTER_MODEL
            )
        
        elif provider_type.lower() == "lmstudio":
            return LMStudioProvider(
                api_key=settings.LMSTUDIO_API_KEY,
                model=settings.LMSTUDIO_MODEL,
                base_url=settings.LMSTUDIO_BASE_URL
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {provider_type}")
    
    @staticmethod
    def get_available_providers() -> list[str]:
        return ["openai", "gemini", "groq", "cerebras", "openrouter", "lmstudio"]