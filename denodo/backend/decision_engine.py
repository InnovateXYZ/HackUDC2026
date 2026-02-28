import os
import requests
import time
from typing import Dict, Any


class GenericDecisionEngine:

    # Default query parameters shared by both endpoints
    DEFAULT_PARAMS = {
        "plot": False,
        "embeddings_provider": "googleaistudio",
        "embeddings_model": "gemini-embedding-001",
        "vector_store_provider": "chroma",
        "llm_provider": "googleaistudio",
        "llm_model": "gemma-3-27b-it",
        "llm_temperature": 0,
        "llm_max_tokens": 8192,
        "allow_external_associations": False,
        "expand_set_views": True,
        "markdown_response": True,
        "vector_search_k": 5,
        "vector_search_sample_data_k": 3,
        "vector_search_total_limit": 20,
        "vector_search_column_description_char_limit": 200,
        "disclaimer": True,
        "verbose": True,
    }

    # Extra parameters only for answerDataQuestion
    DATA_QUESTION_EXTRA_PARAMS = {
        "check_ambiguity": True,
        "vql_execute_rows_limit": 100,
        "llm_response_rows_limit": 30,
    }

    # Available LLM models
    AVAILABLE_MODELS = [
        "gemma-3-27b-it",
        "gemini-2.5-flash",
        "gemini-3-flash-preview",
    ]

    def __init__(
        self,
        base_url: str = "http://localhost:8008",
        auth_user: str = "admin",
        auth_pass: str = "admin",
        timeout: int = 60,
        max_retries: int = 3,
        backoff_factor: float = 1.5,
    ):
        self.base_url = base_url
        self.auth = (auth_user, auth_pass)
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.headers = {"accept": "application/json"}

    # -----------------------------
    # INTERNAL SAFE REQUEST (GET)
    # -----------------------------
    def _get_with_retry(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:

        attempt = 0
        delay = 1

        while attempt < self.max_retries:
            try:
                response = requests.get(
                    f"{self.base_url}/{endpoint}",
                    params=params,
                    headers=self.headers,
                    auth=self.auth,
                    timeout=self.timeout,
                )

                response.raise_for_status()
                data = response.json()

                if not isinstance(data, dict):
                    raise ValueError("Invalid JSON response format")

                return data

            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as exc:
                attempt += 1
                if attempt >= self.max_retries:
                    raise RuntimeError("AI SDK unreachable after multiple retries") from exc
                time.sleep(delay)
                delay *= self.backoff_factor

            except requests.exceptions.HTTPError as e:
                raise RuntimeError(f"HTTP error from AI SDK: {str(e)}") from e

            except ValueError as ve:
                raise RuntimeError(f"Invalid response format: {str(ve)}") from ve

        raise RuntimeError("Max retries exceeded")

    # -----------------------------
    # PHASE 1 — METADATA DISCOVERY
    # -----------------------------
    def get_metadata(self, user_question: str) -> Dict[str, Any]:
        """Discover relevant schema for a question (metadata phase only)."""
        params = {**self.DEFAULT_PARAMS, "question": user_question}
        try:
            result = self._get_with_retry("answerMetadataQuestion", params)
            return {
                "status": "success",
                "metadata": result.get("answer", ""),
            }
        except RuntimeError as e:
            return {
                "status": "error",
                "message": str(e),
            }

    def _discover_relevant_schema(self, user_question: str) -> Dict[str, Any]:

        params = {**self.DEFAULT_PARAMS, "question": user_question}

        return self._get_with_retry("answerMetadataQuestion", params)

    # -----------------------------
    # PHASE 2 — DATA EXECUTION
    # -----------------------------
    def _execute_reasoning(
        self,
        user_question: str,
        discovered_schema: str,
    ) -> Dict[str, Any]:

        execution_prompt = (
            f"You are a senior data analyst generating a professional analytical report.\n\n"
            f'USER QUESTION:\n"{user_question}"\n\n'
            f"AVAILABLE SCHEMA (use ONLY these tables and columns — do NOT invent new ones):\n"
            f"{discovered_schema}\n\n"
            f"INSTRUCTIONS — produce a detailed, well-structured Markdown report with the "
            f"following sections. Omit a section ONLY if it is genuinely irrelevant to the "
            f"question. Use the language of the user question (e.g. if the question is in "
            f"Spanish, write the full report in Spanish).\n\n"
            f"## 📋 Executive Summary\n"
            f"A concise paragraph (3-5 sentences) giving the key takeaway that directly "
            f"answers the user's question.\n\n"
            f"## 🔍 Methodology\n"
            f"Briefly explain: which tables / views were queried, any filters or joins "
            f"applied, aggregation logic, and the rationale behind the approach.\n\n"
            f"## 📊 Key Findings\n"
            f"Present the main results as a numbered list. Include specific numbers, "
            f"percentages, rankings, or comparisons. If the data supports it, highlight "
            f"top-N rankings, trends, maximums, minimums, or outliers.\n\n"
            f"## 📈 Data Detail\n"
            f"Show supporting data in well-formatted Markdown tables. Add column headers "
            f"and align numbers to the right. Limit to the most relevant rows (max ~15) "
            f"and indicate if more data exists.\n\n"
            f"## 💡 Insights & Interpretation\n"
            f"Provide analytical commentary: patterns, correlations, anomalies, or "
            f"contextual explanations that add value beyond raw numbers.\n\n"
            f"## ✅ Recommendations\n"
            f"Based on the data, suggest actionable next steps, areas for deeper analysis, "
            f"or decisions the user could take.\n\n"
            f"## ⚠️ Caveats & Limitations\n"
            f"Note any data quality issues, missing values, scope limitations, or "
            f"assumptions made during the analysis.\n\n"
            f"FORMATTING RULES:\n"
            f"- Use Markdown headings (##), bold, bullet points, and tables.\n"
            f"- Keep the tone professional and objective.\n"
            f"- Prioritize clarity and readability.\n"
            f"- Every claim must be backed by the queried data.\n"
        )

        params = {
            **self.DEFAULT_PARAMS,
            **self.DATA_QUESTION_EXTRA_PARAMS,
            "question": execution_prompt,
        }

        return self._get_with_retry("answerDataQuestion", params)

    # PUBLIC ENTRY POINT
    def answer(
        self,
        user_question: str,
        discovered_schema: str = None,
        llm_model: str = None,
    ) -> Dict[str, Any]:
        """
        Answer a question through the decision engine with metrics tracking.
        
        Args:
            user_question: The user's analytical question
            discovered_schema: Optional pre-discovered schema (skips metadata phase if provided)
            llm_model: Optional LLM model selection
            
        Returns:
            Dict with status, phases, and metrics (time_out, used_tokens, model_llm)
        """
        # determine which model we will report
        model_used = llm_model or os.getenv("LLM_MODEL") or self.DEFAULT_PARAMS["llm_model"]

        # validate provided model if any
        if llm_model is not None and llm_model not in self.AVAILABLE_MODELS:
            return {
                "status": "error",
                "message": f"Invalid LLM model. Available models: {', '.join(self.AVAILABLE_MODELS)}",
            }

        try:
            # apply the selected llm_model to the params we will send
            modified_params = {**self.DEFAULT_PARAMS, "llm_model": model_used}

            # Temporarily replace DEFAULT_PARAMS for this request
            original_params = self.DEFAULT_PARAMS.copy()
            self.__class__.DEFAULT_PARAMS = modified_params

            # start timer before any requests
            start = time.time()

            # Phase 1: metadata discovery (skip if already provided)
            if discovered_schema is None:
                metadata_response = self._discover_relevant_schema(user_question)
                discovered_schema = metadata_response.get("answer", "")

                if not discovered_schema:
                    raise RuntimeError("Metadata phase returned empty schema")
            else:
                metadata_response = {"answer": discovered_schema}

            # Phase 2: data execution
            data_response = self._execute_reasoning(
                user_question,
                discovered_schema,
            )

            # stop timer after both phases
            end = time.time()
            total_latency = end - start

            # helper to extract tokens from a phase response
            def _extract_tokens(resp: Dict[str, Any]) -> int:
                if not isinstance(resp, dict):
                    return 0
                # common key names we might encounter
                for key in ("usage", "tokens", "token_usage"):
                    if key in resp and isinstance(resp[key], dict):
                        # look for typical total/used fields
                        return resp[key].get("total_tokens") or resp[key].get("used_tokens") or 0
                    elif key in resp and isinstance(resp[key], int):
                        return resp[key]
                return 0

            tokens_metadata = _extract_tokens(metadata_response)
            tokens_data = _extract_tokens(data_response)
            total_tokens = tokens_metadata + tokens_data

            # if the response itself includes a model key override
            model_from_resp = None
            for resp in (metadata_response, data_response):
                if isinstance(resp, dict) and "model" in resp:
                    model_from_resp = resp.get("model")
                    break

            if model_from_resp:
                model_used = model_from_resp

            return {
                "status": "success",
                "metadata_phase": metadata_response,
                "execution_phase": data_response,
                "metrics": {
                    "time_out": total_latency,
                    "used_tokens": total_tokens,
                    "model_llm": model_used,
                },
            }

        except RuntimeError as run_err:
            return {
                "status": "error",
                "message": str(run_err),
            }
        finally:
            # Restore original params regardless of success/failure
            self.__class__.DEFAULT_PARAMS = original_params
