"""Prompt templates for selection-based actions (paraphrase/translate/expand).

Each function returns (system_prompt, user_prompt). All prompts instruct the
model to preserve LaTeX delimiters ($...$ inline, $$...$$ block) verbatim,
since selected text may contain math from a note.
"""

_LATEX_INSTRUCTION = (
    "If the input contains LaTeX math delimited by $...$ or $$...$$, "
    "preserve those delimiters and their contents exactly as written."
)


def paraphrase_prompt(text: str) -> tuple[str, str]:
    system = (
        "You paraphrase text the user has selected in their notes app. "
        "Keep the same meaning and roughly the same length. "
        "Return only the paraphrased text, no preamble or explanation. "
        f"{_LATEX_INSTRUCTION}"
    )
    return system, text


def translate_prompt(text: str, target_language: str) -> tuple[str, str]:
    system = (
        f"You translate text the user has selected in their notes app into {target_language}. "
        "Return only the translated text, no preamble or explanation. "
        f"{_LATEX_INSTRUCTION}"
    )
    return system, text


def expand_prompt(text: str) -> tuple[str, str]:
    system = (
        "You briefly explain a passage the user has selected in their notes, "
        "as if helping them understand a concept they're studying. "
        "2-4 sentences. Do not just restate the passage. "
        f"{_LATEX_INSTRUCTION}"
    )
    return system, text
