import asyncio
from typing import List, Dict, Any
import os
from urllib.parse import urlparse

from app.tools.registry import tool_registry
from app.prompts.master_agent_prompt import MasterAgentPrompt
from app.providers.factory import LLMProviderFactory
from app.config.settings import settings
from app.services.agents.worker_hackrx_agent import WorkerHackRXAgent
from app.services.vector_stores.vector_store_factory import VectorStoreFactory


class MasterHackRXAgent:
    """Coordinates preprocessing and question answering.

    Execution flow:
    1. Classify the incoming `document_url` → (is_supported_file, unsupported_ext).
    2. If it is a supported local file → preprocess & fetch context snippet.
    3. Decide `mode_token` using simple heuristics + an LLM selector prompt.
       - unsupported file ext      → agentic (changed from traditional)
       - non-file URL              → agentic
       - otherwise                 → LLM decides
    4. Execute the chosen pipeline with graceful fallback to agentic.
    """
    def __init__(self):
        self.worker_agent = WorkerHackRXAgent()

    async def process_request(
        self,
        document_url: str,
        questions: List[str],
        k: int = 10,
    ) -> Dict[str, Any]:

        url_path = urlparse(document_url).path.lower()
        ext = os.path.splitext(url_path)[1].lower()

        SUPPORTED_FILE_EXT = {
            ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".md", ".xlsx", ".xls", ".jpg", ".jpeg", ".png"
        }
        is_supported_file = ext in SUPPORTED_FILE_EXT
        unsupported_extension = bool(ext) and (not is_supported_file)

        VectorStoreFactory.create_vector_store(settings).delete_all_documents()

        chunks_processed = None
        context_snippet: str = ""
        document_id: str = ""
        
        # Early return for unsupported file types
        if unsupported_extension:
            return {
                "answers": [f"Sorry, I cannot answer this question. If you have any other queries, feel free to ask."],
                "execution_log": [{"mode": "error", "reason": f"unsupported_extension: {ext}"}],
                "preprocessed": False,
            }
        
        if is_supported_file:
            # Initial preprocessing (standard PDF loader: PyMuPDF)
            proc_res = await tool_registry.execute_tool(
                "process_document", document_url=document_url, use_cache=True, llm_friendly=False
            )
            if not proc_res.success:
                # If preprocessing fails, return error instead of continuing
                return {
                    "answers": [f"Failed to process document: {proc_res.error}"],
                    "execution_log": [{"mode": "error", "reason": "preprocessing_failed"}],
                    "preprocessed": False,
                }
            chunks_processed = proc_res.result.get("chunks_processed") if proc_res.success else None
            document_id = proc_res.result.get("document_id") if proc_res.success else None
            try:
                rc_res = await tool_registry.execute_tool(
                    "retrieve_context",
                    questions=questions[:1],
                    k=5,
                )
                context_snippet = rc_res.result.get("summary") if rc_res.success else ""
            except Exception:
                context_snippet = ""

        # --------------------------------------------------------------
        # Decide execution path (traditional vs agentic) using a lightweight LLM call
        # --------------------------------------------------------------
        llm_provider = LLMProviderFactory.create_provider(settings.DEFAULT_LLM_PROVIDER, settings)
        llm = llm_provider.get_langchain_llm()
        info_blob = (
            f"supported_file: {is_supported_file}, ext: {ext or 'n/a'}, "
            f"chunks: {chunks_processed}, questions: {len(questions)}\n"
            f"context: {context_snippet[:500]}"
        )
        selector_prompt = MasterAgentPrompt.get_master_agent_prompt().format(info=info_blob)
        
        # unsupported extensions should use agentic mode
        if not is_supported_file:
            mode_token = "agentic"
        else:
            try:
                mode_token = await asyncio.to_thread(lambda: llm.invoke(selector_prompt).content.strip().lower())
            except Exception:
                mode_token = "agentic"

        # --------------------------------------------------------------
        # Execute chosen path
        # --------------------------------------------------------------
        if mode_token == "traditional" and is_supported_file and document_id:
            try:
                rag_res = await tool_registry.execute_tool(
                    "traditional_rag", document_url=document_url, document_id=document_id, questions=questions, k=k
                )
                if rag_res and rag_res.success:
                    return {
                        "answers": rag_res.result["answers"],
                        "execution_log": [{"mode": "traditional", "debug": rag_res.result["debug_info"]}],
                        "preprocessed": True,
                    }
            except Exception as err:
                # Fall back to agentic if traditional fails
                pass

        # If agentic path is chosen ensure we have a llm-friendly cache (PyMuPDF4LLM)
        if mode_token == "agentic" and is_supported_file:
            await tool_registry.execute_tool(
                "process_document", document_url=document_url, use_cache=True, llm_friendly=True
            )

        # default agentic path
        prepared_questions: List[str] = []
        for q in questions:
            if is_supported_file:
                prepared_questions.append(q)
            else:
                prepared_questions.append(f"{q}\nSource URL: {document_url}")

        tasks = [
            self.worker_agent.answer_question(pq, k=k) for pq in prepared_questions
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        final_answers: List[str] = []
        execution_log: List[Dict[str, Any]] = []
        for idx, res in enumerate(results):
            if isinstance(res, Exception):
                final_answers.append(f"Error: {res}")
            else:
                ans, logs = res
                final_answers.append(ans)
                execution_log.append({
                    "question": questions[idx],
                    "tool_calls": logs,
                })

        return {"answers": final_answers, "execution_log": execution_log, "preprocessed": is_supported_file}