# 🏁 Sprint 2 End Review: The "Scope Creep" Retrospective

## 📊 Summary
Sprint 2 was originally dubbed the **"Brain, Backbone & Control"** sprint, aimed at establishing database persistence, observability, and ATS scoring. While we accomplished significant architectural milestones, we fell victim to **Scope Creep**. We dove deep into technical perfection, edge-case handling, and infrastructure migrations, which prevented us from fully completing our original feature set.

---

## ✅ What We Accomplished (The Good)
Although not 100% "finished", we built a massive technical foundation:
1. **Added an ATS System:** Integrated a local ONNX `all-MiniLM-L6-v2` embedding model for cosine similarity matching, alongside a strict Knockout evaluation engine.
2. **Added Ollama Model Extension:** Successfully integrated local LLM capabilities (Llama3/Gemma), allowing the platform to run entirely on-premise without cloud APIs.
3. **Dynamic Provider Switching:** Built the infrastructure to seamlessly toggle between ultra-fast cloud models (Groq) and local models (Ollama) on the fly.
4. **SOLID Agent Decomposition:** Completely refactored the monolith. We abstracted the core retry loops, defensive JSON parsing, and LLM orchestration into a highly robust `BaseAgent`, allowing child agents (`ResumeExtractionAgent`, `KnockoutAgent`) to be clean and focused.

---

## ❌ What We Missed (The Backlog)
Because we spent so much time on Spring AI 2.0.0-M6 migrations, custom Jackson parsing, and timeout debugging, the following original Sprint 2 goals are incomplete:

1. **Observability Strings:** We did not update the `ExtractedField` schema to include a `reasoning` string for Explainable AI tooltips. (This is our true backlog item).

---

## 🤝 Pending Integrations (Teammate's Purview)
The following features are being developed by another team member. Our next major step will be reviewing what they built and integrating it into our robust new architecture:
1. **Database Persistence:** Integrating the PostgreSQL/JPA persistence layer they are building.
2. **Editable Data Grid:** Connecting our backend to their React TanStack Table cell-level editing feature.
3. **Total UI Control:** Hooking up our dynamic backend prompts to their dynamic field configuration UI.

---

## ⚠️ Retrospective Warning: Beware of Scope Creep
This sprint is a textbook example of **Technical Scope Creep**. 

Instead of building exactly what was planned, we got side-tracked by:
- Upgrading to cutting-edge framework milestones (Spring AI 2.0.0-M6).
- Building overly complex, defensive LLM parsing systems for edge-cases.
- Refactoring architectures before the core features were even shipped.

**Directive for Future Sprints:**
> *Always resort to deeper-level planning before writing code, but strictly adhere to the sprint goals. Avoid surface-level monkey patches, but do not redesign the entire architecture if it sacrifices the sprint timeline. Ship the stated features first, refine the architecture second.*

We must ruthlessly prioritize our remaining backlog in Sprint 3 to close these gaps.
