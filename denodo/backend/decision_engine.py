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
        "llm_max_tokens": 4096,
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
        "llm_response_rows_limit": 15,
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
            f"{user_question}\n\n"
            f"Use ONLY the following discovered schema:\n{discovered_schema}\n"
            f"Do NOT invent new tables or columns."
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
