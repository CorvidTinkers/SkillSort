# Guidelines for AI Coding Agents

1. **Always resort to deeper-level planning** instead of resorting to surface-level monkey patches. Do not just patch the immediate bug if there is a fundamental architectural improvement that should be made.
2. **Keep proper naming conventions.** Don't create names with indicators like "Robust" (e.g., `executeRobustExtraction`). All functions should naturally be robust; do not make that the denoter. Use normal descriptors only (e.g., `executeExtraction`).
