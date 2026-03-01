import logging
import os
import threading
import requests
import time
from typing import Dict, Any

logger = logging.getLogger(__name__)


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
        "disclaimer": False,
        "verbose": True,
        "check_ambiguity": False,
    }

    # Extra parameters only for answerDataQuestion
    DATA_QUESTION_EXTRA_PARAMS = {
        "vql_execute_rows_limit": 100,
        "llm_response_rows_limit": 100,
    }

    # Available LLM models
    AVAILABLE_MODELS = [
        "gemma-3-27b-it",
        "gemini-2.5-flash",
        "gemini-3-flash-preview",
    ]

    def __init__(
        self,
        base_url: str = os.environ.get("DENODO_BASE_URL", "http://localhost:8008"),
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

    # ----------------------------------------
    # STARTUP: LOAD METADATA (with retry loop)
    # ----------------------------------------
    METADATA_PARAMS = {
        "vdp_database_names": "hackudc",
        "embeddings_provider": "googleaistudio",
        "embeddings_model": "gemini-embedding-001",
        "embeddings_token_limit": 0,
        "vector_store_provider": "chroma",
        "rate_limit_rpm": 0,
        "examples_per_table": 100,
        "view_descriptions": True,
        "column_descriptions": True,
        "associations": True,
        "insert": True,
        "views_per_request": 50,
        "incremental": True,
        "parallel": True,
    }

    def load_metadata(self) -> None:
        """Call /getMetadata at startup. Retries every 5 seconds on failure."""
        logger.info("[Decision Engine] Starting metadata load from AI SDK …")
        while True:
            try:
                logger.info(
                    "[Decision Engine] GET %s/getMetadata  (params: %s)",
                    self.base_url,
                    self.METADATA_PARAMS,
                )
                response = requests.get(
                    f"{self.base_url}/getMetadata",
                    params=self.METADATA_PARAMS,
                    headers=self.headers,
                    auth=self.auth,
                    timeout=300,  # metadata load can be slow
                )
                logger.info(
                    "[Decision Engine] Response status: %s, content-type: %s, "
                    "body length: %d",
                    response.status_code,
                    response.headers.get("content-type", "unknown"),
                    len(response.content),
                )
                response.raise_for_status()

                # 204 = metadata already up-to-date (incremental, nothing new)
                if response.status_code == 204:
                    logger.info(
                        "[Decision Engine] Metadata already up-to-date "
                        "(204 No Content). Done."
                    )
                    return

                # Non-empty JSON response with new metadata
                body = response.text.strip()
                if not body:
                    logger.warning(
                        "[Decision Engine] Empty response body. " "Retrying in 5 s …"
                    )
                    time.sleep(5)
                    continue

                data = response.json()
                logger.info(
                    "[Decision Engine] Metadata loaded successfully! "
                    "Response keys: %s",
                    (
                        list(data.keys())
                        if isinstance(data, dict)
                        else type(data).__name__
                    ),
                )
                return
            except requests.exceptions.ConnectionError:
                logger.warning(
                    "[Decision Engine] AI SDK not reachable. Retrying in 5 s …"
                )
            except requests.exceptions.Timeout:
                logger.warning("[Decision Engine] Request timed out. Retrying in 5 s …")
            except requests.exceptions.HTTPError as exc:
                logger.error("[Decision Engine] HTTP error: %s. Retrying in 5 s …", exc)
            except Exception as exc:
                logger.error(
                    "[Decision Engine] Unexpected error: %s. Retrying in 5 s …", exc
                )
            time.sleep(5)

    def load_metadata_background(self) -> None:
        """Launch load_metadata in a daemon thread so it doesn't block the server."""
        thread = threading.Thread(target=self.load_metadata, daemon=True)
        thread.start()
        logger.info("[Decision Engine] Metadata load thread started.")

    # -----------------------------
    # PHASE 1 — METADATA DISCOVERY
    # -----------------------------
    def _discover_relevant_schema(
        self, user_question: str, datasets: list[str] | None = None
    ) -> Dict[str, Any]:

        # If datasets are specified, enrich the question so the AI SDK
        # focuses only on the selected tables / data sources.
        scoped_question = user_question
        if datasets:
            dataset_list = ", ".join(datasets)
            scoped_question = (
                f"{user_question}\n\n"
                f"Important: Only consider the following datasets/tables: {dataset_list}. "
                f"Do not include metadata from any other sources."
            )

        params = {**self.DEFAULT_PARAMS, "question": scoped_question}

        return self._get_with_retry("answerMetadataQuestion", params)

    # ----------------------------------------
    # PHASE 2 — DATA RETRIEVAL (raw query)
    # ----------------------------------------
    def _fetch_raw_data(
        self,
        user_question: str,
    ) -> Dict[str, Any]:
        """Send the user's question *as-is* to answerDataQuestion so the
        AI SDK focuses exclusively on generating the correct VQL, executing
        it and returning the raw data.  No formatting instructions are
        injected here — that keeps the VQL generation clean."""

        params = {
            **self.DEFAULT_PARAMS,
            **self.DATA_QUESTION_EXTRA_PARAMS,
            "question": user_question,
        }

        return self._get_with_retry("answerDataQuestion", params)

    # ----------------------------------------
    # PHASE 3 — ANALYTICAL REPORT GENERATION
    # ----------------------------------------

    REPORT_TEMPLATE = (
        "You are a senior data analyst. Using ONLY the data provided below, "
        "generate a professional analytical report in **Markdown**.\n\n"
        "CRITICAL LANGUAGE RULE: Detect the language of the USER QUESTION below "
        "and write the **ENTIRE** report — including ALL section headings, "
        "subheadings, body text, table headers, recommendations, and every "
        "single word — in that SAME language. For example, if the question is "
        'in Spanish, the heading must be "## 📋 Resumen Ejecutivo" instead of '
        '"## 📋 Executive Summary", and so on for every section. Do NOT leave '
        "any heading or text in English unless the user question is in English.\n\n"
        'USER QUESTION:\n"{user_question}"\n\n'
        "{user_profile_block}"
        "RAW DATA / ANSWER FROM THE DATABASE:\n"
        "```\n{raw_data}\n```\n\n"
        "VQL QUERY USED (for methodology reference):\n"
        "```sql\n{vql}\n```\n\n"
        "INSTRUCTIONS — You MUST produce ALL of the following sections "
        "(translate every section title to the language of the user question). "
        "Do NOT skip any section. If a section has limited relevance, still "
        "include it with a brief note.{personalisation_instruction}\n\n"
        "REQUIRED SECTIONS (shown here in English — you MUST translate the "
        "titles to match the user question language):\n\n"
        "## 📋 Executive Summary\n"
        "A concise paragraph (3-5 sentences) that **directly and unambiguously** "
        "answers the user's question. State the conclusion or decision clearly "
        "in the first sentence, then provide a brief justification grounded in "
        "the data. Avoid vague or open-ended language — every statement must be "
        "definitive and supported by specific figures or evidence from the data. "
        "If a recommendation or decision is made, explain *why* it is the best "
        "option compared to the alternatives.\n\n"
        "## 🔍 Methodology\n"
        "Briefly explain: which tables / views were queried, any filters or "
        "joins applied, aggregation logic, and the rationale behind the "
        "approach. Reference the VQL query above.\n\n"
        "## 📊 Key Findings\n"
        "Present the main results as a numbered list. Include specific "
        "numbers, percentages, rankings, or comparisons. Highlight top-N "
        "rankings, trends, maximums, minimums, or outliers.\n\n"
        "## 📈 Data Detail\n"
        "Show supporting data in well-formatted Markdown tables. Add column "
        "headers and align numbers to the right. Limit to the most relevant "
        "rows (max ~15) and indicate if more data exists.\n\n"
        "## 💡 Insights & Interpretation\n"
        "Provide analytical commentary: patterns, correlations, anomalies, "
        "or contextual explanations that add value beyond raw numbers.\n\n"
        "## ✅ Recommendations\n"
        "Based on the data, suggest actionable next steps, areas for deeper "
        "analysis, or decisions the user could take.\n\n"
        "## ⚠️ Caveats & Limitations\n"
        "Note any data quality issues, missing values, scope limitations, "
        "or assumptions made during the analysis.\n\n"
        "FORMATTING RULES:\n"
        "- Use Markdown headings (##), bold, bullet points, and tables.\n"
        "- Keep the tone professional and objective.\n"
        "- Prioritize clarity and readability.\n"
        "- Every claim MUST be backed by the provided data.\n"
        "- Do NOT invent data that is not present above.\n"
        "- REMEMBER: Translate ALL section titles and ALL text to the "
        "language of the user question. Nothing should remain in English "
        "unless the user question is in English.\n"
    )

    # Block inserted when user profile IS available
    _USER_PROFILE_BLOCK = (
        "USER PROFILE (use this to personalise the report — tone, focus, "
        "and recommendations):\n"
        "- Name: {user_name}\n"
        "- Date of birth: {user_date_of_birth}\n"
        "- Gender identity: {user_gender}\n"
        "- Preferences / interests: {user_preferences}\n\n"
    )

    _PERSONALISATION_INSTRUCTION = (
        " Personalise the report for the user: "
        "address them by name when available, tailor insights and "
        "recommendations to their stated preferences, date of birth, and "
        "interests."
    )

    # DeepThink data and report templates are defined below _generate_report

    def _generate_report(
        self,
        user_question: str,
        raw_data_response: Dict[str, Any],
        user_profile: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Take the raw data returned by answerDataQuestion and ask the LLM
        (via answerMetadataQuestion, which does NOT execute VQL) to format
        it as a structured analytical report.  Because no VQL generation is
        involved in this call, the LLM can focus 100 % on formatting.

        If *user_profile* is provided it is injected into the prompt so the
        report is personalised for the user."""

        raw_answer = raw_data_response.get("answer", str(raw_data_response))
        vql = raw_data_response.get("vql", "N/A")

        # Build the user profile block only when a profile is provided
        if user_profile:
            user_profile_block = self._USER_PROFILE_BLOCK.format(
                user_name=user_profile.get("name") or "N/A",
                user_date_of_birth=user_profile.get("date_of_birth") or "N/A",
                user_gender=user_profile.get("gender_identity") or "N/A",
                user_preferences=user_profile.get("user_preferences") or "N/A",
            )
            personalisation_instruction = self._PERSONALISATION_INSTRUCTION
        else:
            user_profile_block = ""
            personalisation_instruction = ""

        report_prompt = self.REPORT_TEMPLATE.format(
            user_question=user_question,
            raw_data=raw_answer,
            vql=vql,
            user_profile_block=user_profile_block,
            personalisation_instruction=personalisation_instruction,
        )

        params = {**self.DEFAULT_PARAMS, "question": report_prompt}

        return self._get_with_retry("answerMetadataQuestion", params)

    # ----------------------------------------
    # PHASE 3b — DEEPTHINK: SECOND DATA FETCH
    # ----------------------------------------
    DEEPTHINK_DATA_TEMPLATE = (
        "You already answered the following question:\n"
        '"{user_question}"\n\n'
        "and produced this raw data:\n"
        "```\n{first_raw_data}\n```\n\n"
        "Now perform a DEEPER analysis. Specifically:\n"
        "1. Run additional or complementary queries to uncover patterns, "
        "correlations, edge cases, or supporting data that were NOT covered "
        "in the first pass.\n"
        "2. Look for related metrics, comparisons, rankings, trends over "
        "time, or breakdowns by category that add analytical depth.\n"
        "3. Cross-validate the initial results — check for outliers, "
        "inconsistencies, or alternative interpretations.\n"
        "4. If possible, compute derived metrics (percentages, averages, "
        "growth rates, etc.) that enrich the analysis.\n\n"
        "Return the additional raw data and insights. Focus on DATA "
        "retrieval, not formatting."
    )

    def _fetch_deepthink_data(
        self,
        user_question: str,
        first_raw_data_response: Dict[str, Any],
    ) -> Dict[str, Any]:
        """DeepThink second data pass: ask answerDataQuestion for deeper,
        complementary data based on the first result."""

        first_raw_answer = first_raw_data_response.get(
            "answer", str(first_raw_data_response)
        )

        deepthink_prompt = self.DEEPTHINK_DATA_TEMPLATE.format(
            user_question=user_question,
            first_raw_data=first_raw_answer,
        )

        params = {
            **self.DEFAULT_PARAMS,
            **self.DATA_QUESTION_EXTRA_PARAMS,
            "question": deepthink_prompt,
        }

        return self._get_with_retry("answerDataQuestion", params)

    # ----------------------------------------
    # PHASE 4 — DEEPTHINK COMBINED REPORT
    # ----------------------------------------

    DEEPTHINK_REPORT_TEMPLATE = (
        "You are a senior data analyst. Using ONLY the data provided below, "
        "generate a professional, IN-DEPTH analytical report in **Markdown**.\n\n"
        "CRITICAL LANGUAGE RULE: Detect the language of the USER QUESTION below "
        "and write the **ENTIRE** report — including ALL section headings, "
        "subheadings, body text, table headers, recommendations, and every "
        "single word — in that SAME language.\n\n"
        'USER QUESTION:\n"{user_question}"\n\n'
        "{user_profile_block}"
        "PRIMARY DATA (first query):\n"
        "```\n{raw_data_1}\n```\n\n"
        "VQL QUERY USED (first query):\n"
        "```sql\n{vql_1}\n```\n\n"
        "COMPLEMENTARY / DEEP-DIVE DATA (second query):\n"
        "```\n{raw_data_2}\n```\n\n"
        "VQL QUERY USED (second query):\n"
        "```sql\n{vql_2}\n```\n\n"
        "INSTRUCTIONS — You have TWO sets of data from two separate queries. "
        "You MUST integrate, cross-reference, and synthesize BOTH data sets "
        "to produce a single, comprehensive, deeply analytical report. "
        "Do NOT skip any section. If a section has limited relevance, still "
        "include it with a brief note.{personalisation_instruction}\n\n"
        "REQUIRED SECTIONS (shown here in English — you MUST translate the "
        "titles to match the user question language):\n\n"
        "## 📋 Executive Summary\n"
        "A concise paragraph (3-5 sentences) that **directly and unambiguously** "
        "answers the user's question. State the conclusion or decision clearly "
        "in the first sentence, then provide a brief justification grounded in "
        "the data. Avoid vague or open-ended language — every statement must be "
        "definitive and supported by specific figures from BOTH data sets.\n\n"
        "## 🔍 Methodology\n"
        "Explain: which tables / views were queried in EACH pass, filters or "
        "joins applied, aggregation logic, and the rationale behind running "
        "two complementary queries. Reference both VQL queries.\n\n"
        "## 📊 Key Findings\n"
        "Present the main results as a numbered list. Include specific "
        "numbers, percentages, rankings, or comparisons. Cross-reference "
        "findings from both queries to strengthen conclusions.\n\n"
        "## 📈 Data Detail\n"
        "Show supporting data in well-formatted Markdown tables. Include data "
        "from BOTH queries where relevant. Add column headers and align "
        "numbers to the right. Limit to the most relevant rows (max ~15 per "
        "table) and indicate if more data exists.\n\n"
        "## 🔬 Deep Analysis\n"
        "This section is UNIQUE to the deep-think report. Provide advanced "
        "analytical commentary: cross-correlations between the two data sets, "
        "derived metrics, trend analysis, statistical patterns, and any "
        "non-obvious insights that only emerge when combining both queries.\n\n"
        "## 💡 Insights & Interpretation\n"
        "Provide analytical commentary: patterns, correlations, anomalies, "
        "or contextual explanations that add value beyond raw numbers.\n\n"
        "## ✅ Recommendations\n"
        "Based on the combined data, suggest actionable next steps, areas for "
        "deeper analysis, or decisions the user could take. Be specific and "
        "data-driven.\n\n"
        "## ⚠️ Caveats & Limitations\n"
        "Note any data quality issues, missing values, scope limitations, "
        "or assumptions made during the analysis.\n\n"
        "FORMATTING RULES:\n"
        "- Use Markdown headings (##), bold, bullet points, and tables.\n"
        "- Keep the tone professional and objective.\n"
        "- Prioritize clarity and readability.\n"
        "- Every claim MUST be backed by the provided data.\n"
        "- Do NOT invent data that is not present above.\n"
        "- REMEMBER: Translate ALL section titles and ALL text to the "
        "language of the user question.\n"
    )

    def _generate_deepthink_report(
        self,
        user_question: str,
        raw_data_response_1: Dict[str, Any],
        raw_data_response_2: Dict[str, Any],
        user_profile: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Generate a comprehensive report that integrates both data fetches
        into a single, deep analytical report via answerMetadataQuestion."""

        raw_answer_1 = raw_data_response_1.get("answer", str(raw_data_response_1))
        vql_1 = raw_data_response_1.get("vql", "N/A")
        raw_answer_2 = raw_data_response_2.get("answer", str(raw_data_response_2))
        vql_2 = raw_data_response_2.get("vql", "N/A")

        # Build the user profile block only when a profile is provided
        if user_profile:
            user_profile_block = self._USER_PROFILE_BLOCK.format(
                user_name=user_profile.get("name") or "N/A",
                user_date_of_birth=user_profile.get("date_of_birth") or "N/A",
                user_gender=user_profile.get("gender_identity") or "N/A",
                user_preferences=user_profile.get("user_preferences") or "N/A",
            )
            personalisation_instruction = self._PERSONALISATION_INSTRUCTION
        else:
            user_profile_block = ""
            personalisation_instruction = ""

        report_prompt = self.DEEPTHINK_REPORT_TEMPLATE.format(
            user_question=user_question,
            raw_data_1=raw_answer_1,
            vql_1=vql_1,
            raw_data_2=raw_answer_2,
            vql_2=vql_2,
            user_profile_block=user_profile_block,
            personalisation_instruction=personalisation_instruction,
        )

        params = {**self.DEFAULT_PARAMS, "question": report_prompt}

        return self._get_with_retry("answerMetadataQuestion", params)

    # -----------------------------
    # PUBLIC: METADATA DISCOVERY
    # -----------------------------
    def get_metadata(
        self, user_question: str, datasets: list[str] | None = None
    ) -> Dict[str, Any]:
        """Phase 1 only — discover relevant tables/columns for the question.
        If datasets is provided, scope the discovery to those tables only."""
        try:
            metadata_response = self._discover_relevant_schema(
                user_question, datasets=datasets
            )
            discovered_schema = metadata_response.get("answer", "")

            if not discovered_schema:
                raise RuntimeError("Metadata phase returned empty schema")

            return {
                "status": "success",
                "metadata": discovered_schema,
                "raw_metadata": metadata_response,
            }

        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
            }

    # -----------------------------
    # PUBLIC: FULL ANSWER
    # -----------------------------
    def answer(
        self,
        user_question: str,
        discovered_schema: str | None = None,
        llm_model: str | None = None,
        user_profile: Dict[str, Any] | None = None,
        deepthink: bool = False,
    ) -> Dict[str, Any]:
        """If discovered_schema is provided, skip the metadata phase and go
        straight to execution. Otherwise run both phases as before.
        If llm_model is provided, use it instead of the default.
        If user_profile is provided, personalise the report for the user.
        If deepthink is True, run an extra refinement iteration on the report."""

        # Use provided llm_model or fallback to default
        if llm_model is None:
            llm_model = self.DEFAULT_PARAMS["llm_model"]
        elif llm_model not in self.AVAILABLE_MODELS:
            return {
                "status": "error",
                "message": f"Invalid LLM model. Available models: {', '.join(self.AVAILABLE_MODELS)}",
            }

        # Create modified params with the selected llm_model
        modified_params = {**self.DEFAULT_PARAMS, "llm_model": llm_model}
        original_params = self.DEFAULT_PARAMS.copy()
        self.__class__.DEFAULT_PARAMS = modified_params

        try:
            if discovered_schema is None:
                metadata_response = self._discover_relevant_schema(user_question)
                discovered_schema = metadata_response.get("answer", "")

                if not discovered_schema:
                    raise RuntimeError("Metadata phase returned empty schema")
            else:
                metadata_response = {"answer": discovered_schema}

            # Phase 2 — retrieve raw data (clean question, no formatting noise)
            raw_data_response = self._fetch_raw_data(user_question)

            if deepthink:
                # DeepThink flow: metadata → data → data → metadata
                logger.info(
                    "[Decision Engine] DeepThink enabled — running second data pass …"
                )
                # Phase 3 (deepthink) — second data fetch for deeper analysis
                deepthink_data_response = self._fetch_deepthink_data(
                    user_question, raw_data_response
                )

                # Phase 4 (deepthink) — single metadata call combining both data sets
                logger.info(
                    "[Decision Engine] DeepThink — generating combined report …"
                )
                report_response = self._generate_deepthink_report(
                    user_question,
                    raw_data_response,
                    deepthink_data_response,
                    user_profile=user_profile,
                )
                report_text = report_response.get("answer", "")

                return {
                    "status": "success",
                    "metadata_phase": metadata_response,
                    "execution_phase": raw_data_response,
                    "deepthink_phase": deepthink_data_response,
                    "report": report_text,
                }
            else:
                # Standard flow: metadata → data → metadata
                report_response = self._generate_report(
                    user_question, raw_data_response, user_profile=user_profile
                )
                report_text = report_response.get("answer", "")

                return {
                    "status": "success",
                    "metadata_phase": metadata_response,
                    "execution_phase": raw_data_response,
                    "report": report_text,
                }

        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
            }
        finally:
            # Restore original params
            self.__class__.DEFAULT_PARAMS = original_params
