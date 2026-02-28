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

            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
                attempt += 1
                if attempt >= self.max_retries:
                    raise RuntimeError("AI SDK unreachable after multiple retries")
                time.sleep(delay)
                delay *= self.backoff_factor

            except requests.exceptions.HTTPError as e:
                raise RuntimeError(f"HTTP error from AI SDK: {str(e)}")

            except Exception as e:
                raise RuntimeError(f"Unexpected error during request: {str(e)}")

        raise RuntimeError("Max retries exceeded")

    # -----------------------------
    # PHASE 1 — METADATA DISCOVERY
    # -----------------------------
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

    # -----------------------------
    # PUBLIC ENTRY POINT
    # -----------------------------
    def answer(self, user_question: str) -> Dict[str, Any]:

        try:
            metadata_response = self._discover_relevant_schema(user_question)
            discovered_schema = metadata_response.get("answer", "")

            if not discovered_schema:
                raise RuntimeError("Metadata phase returned empty schema")

            data_response = self._execute_reasoning(
                user_question,
                discovered_schema,
            )

            return {
                "status": "success",
                "metadata_phase": metadata_response,
                "execution_phase": data_response,
            }

        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
            }
