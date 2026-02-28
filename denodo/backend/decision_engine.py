import requests
import time
from typing import Dict, Any


class GenericDecisionEngine:

    def __init__(
        self,
        base_url: str = "http://localhost:8008",
        timeout: int = 60,
        max_retries: int = 3,
        backoff_factor: float = 1.5,
    ):
        self.base_url = base_url
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor

    # -----------------------------
    # INTERNAL SAFE REQUEST
    # -----------------------------
    def _post_with_retry(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:

        attempt = 0
        delay = 1

        while attempt < self.max_retries:
            try:
                response = requests.post(
                    f"{self.base_url}/{endpoint}",
                    json=payload,
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

        metadata_prompt = f"""
        The user question is:

        "{user_question}"

        Identify:
        - Relevant views
        - Relevant columns
        - Required relationships

        Do NOT execute data queries.
        Only analyze metadata.
        """

        return self._post_with_retry(
            "answerMetadataQuestion",
            {"question": metadata_prompt},
        )

    # -----------------------------
    # PHASE 2 — DATA EXECUTION
    # -----------------------------
    def _execute_reasoning(
        self,
        user_question: str,
        discovered_schema: str,
    ) -> Dict[str, Any]:

        execution_prompt = f"""
        The user question is:

        "{user_question}"

        Use ONLY the following discovered schema:

        {discovered_schema}

        Construct and execute the necessary analytical reasoning.
        Do NOT invent new tables or columns.
        Provide a structured decision-oriented answer.
        """

        return self._post_with_retry(
            "answerDataQuestion",
            {"question": execution_prompt},
        )

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