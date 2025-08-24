import json
import asyncio
import uuid
from typing import List, Dict, Any

from app.tools.registry import tool_registry
from app.providers.factory import LLMProviderFactory
from app.config.settings import settings
from app.prompts.worker_agent_prompt import WorkerAgentPrompt   
from app.prompts.output_parser_prompt import OutputParserPrompt


class WorkerHackRXAgent:
    def __init__(self):
        self.llm_provider = LLMProviderFactory.create_provider(
            settings.DEFAULT_LLM_PROVIDER, settings
        )
        self.max_iterations = 15

    async def _parse_output(self, question: str, draft_answer: str) -> str:
        """Post-process the raw LLM answer so that it strictly follows the
        answer-format rules defined in `OutputParserPrompt`.
        """
        try:
            llm = self.llm_provider.get_langchain_llm()
            parser_prompt = OutputParserPrompt.get_output_parser_prompt()
            prompt = parser_prompt.format(question=question, draft_answer=draft_answer)
            cleaned = await asyncio.to_thread(lambda: llm.invoke(prompt).content)
            return cleaned.strip()
        except Exception:
            return draft_answer.strip()

    async def answer_question(
        self,
        question: str,
        k: int = 10,
    ) -> tuple[str, List[Dict[str, Any]]]:
        """Answer a single question.

        Returns tuple of (answer, tool_call_log)."""

        system_prompt = WorkerAgentPrompt.get_worker_agent_prompt()
        question_id = uuid.uuid4().hex[:8]
        system_prompt = f"{question_id}\n\n{system_prompt}"

        conversation: List[Dict[str, Any]] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ]

        available_tools = [t for t in tool_registry.get_tools_for_llm() if t["name"] in ("retrieve_context", "url_request")]

        tool_call_log: List[Dict[str, Any]] = []

        for iteration in range(self.max_iterations):
            temp = 0.1 + (int(question_id, 16) % 100) / 1000.0

            print(f"\n🧠 [Iteration {iteration+1}] Sending conversation with {len(conversation)} messages to LLM…")
            response = await self.llm_provider.chat_completion_with_tools(
                messages=conversation, tools=available_tools, temperature=temp
            )
            msg = response.choices[0].message
            print(f"🤖 LLM response received. Tool calls: {len(msg.tool_calls) if msg.tool_calls else 0}")

            if msg.tool_calls:
                assistant_entry = {
                    "role": "assistant",
                    "content": msg.content,
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": tc.type,
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                        for tc in msg.tool_calls
                    ],
                }
                conversation.append(assistant_entry)

                print(f"🔧 Executing {len(msg.tool_calls)} tools in parallel...")
                
                tool_tasks = []
                tool_call_ids = []
                
                for tc in msg.tool_calls:
                    tool_name = tc.function.name
                    tool_args = {}
                    try:
                        tool_args = json.loads(tc.function.arguments)
                    except Exception:
                        pass

                    if tool_name == "retrieve_context":
                        tool_args.setdefault("k", k)

                    print(f"🔧 Preparing tool '{tool_name}' with args: {tool_args}")
                    
                    task = tool_registry.execute_tool(tool_name, **tool_args)
                    tool_tasks.append(task)
                    tool_call_ids.append(tc.id)
                
                tool_results = await asyncio.gather(*tool_tasks, return_exceptions=True)
                
                for i, (tc, tool_result) in enumerate(zip(msg.tool_calls, tool_results)):
                    tool_name = tc.function.name
                    
                    if isinstance(tool_result, Exception):
                        print(f"❌ Tool '{tool_name}' failed: {tool_result}")
                        tool_call_log.append({
                            "tool": tool_name,
                            "arguments": json.loads(tc.function.arguments) if tc.function.arguments else {},
                            "result": {"success": False, "error": str(tool_result)}
                        })
                        tool_content = f"Tool '{tool_name}' error: {str(tool_result)}"
                    else:
                        print(f"✅ Tool '{tool_name}' success={tool_result.success}")
                        tool_call_log.append({
                            "tool": tool_name,
                            "arguments": json.loads(tc.function.arguments) if tc.function.arguments else {},
                            "result": tool_result.model_dump(),
                        })
                        tool_content = (
                            f"Tool '{tool_name}' result: {tool_result.result}"
                            if tool_result.success
                            else f"Tool '{tool_name}' error: {tool_result.error}"
                        )
                    
                    print(f"📥 Appending tool response for id {tc.id}")
                    conversation.append({
                        "role": "tool",
                        "content": tool_content,
                        "tool_call_id": tc.id,
                    })
                
                print(f"✅ Completed {len(msg.tool_calls)} tools in parallel")
                continue
            else:
                print("✅ Final answer received from LLM without further tool calls")
                cleaned_answer = await self._parse_output(question, msg.content or "")
                return cleaned_answer or "No answer", tool_call_log

        print("⚠️ Max iterations reached without final answer")
        return "Max iterations reached", tool_call_log
