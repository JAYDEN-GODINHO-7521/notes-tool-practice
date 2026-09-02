"""Prompt templates for selection-based actions (paraphrase/custom request)
and flashcard generation. Each action function returns (system_prompt,
user_prompt).

Note: LaTeX support was dropped as part of the markdown-editor migration
(ADR-001 / session-summary-markdown-editor-migration.md) — notes are now
plain markdown text, so these prompts no longer carry the old
LaTeX-preservation instruction.
"""


def paraphrase_prompt(text: str) -> tuple[str, str]:
    system = (
        "You paraphrase and simplify text the user has selected in their "
        "notes app. Keep the same meaning, but favor clearer wording and "
        "shorter sentences where that makes the passage easier to understand "
        "— don't just restate it more complexly. "
        "Return only the paraphrased text, no preamble or explanation."
    )
    return system, text


def custom_request_prompt(text: str, instruction: str) -> tuple[str, str]:
    system = (
        "The user has selected text in their notes app and given you a "
        "custom instruction for what to do with it. Follow the instruction "
        "and return only the resulting text, no preamble or explanation "
        "of what you did."
    )
    user_prompt = f"Instruction: {instruction}\n\nSelected text:\n{text}"
    return system, user_prompt


def flashcard_generation_prompt(
    title: str, content_text: str, highlighted_text: list[str] | None = None
) -> tuple[str, str]:
    system = (
        "You generate spaced-repetition flashcards from a user's note "
        "(plain markdown text). Create 3-8 cards covering the key "
        "facts/concepts, using a mix of question styles (definition, "
        "cloze/fill-in-the-blank, application). "
        'Respond with ONLY a JSON object of the exact shape: '
        '{"cards": [{"front": string, "back": string, '
        '"variants": [string, string]}]} '
        "— variants are 1-2 alternate phrasings of the front question. "
        "No prose, no markdown code fences, just the JSON object."
    )

    user_prompt = f"Note title: {title}\n\nNote content:\n{content_text}"

    if highlighted_text:
        highlighted_block = "\n".join(f"- {h}" for h in highlighted_text)
        user_prompt += (
            "\n\nThe user has marked these passages as important — "
            "prioritize covering them in the flashcards you generate:\n"
            f"{highlighted_block}"
        )

    return system, user_prompt
