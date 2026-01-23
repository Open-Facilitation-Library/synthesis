# AI Facilitation Approaches

Two complementary approaches to AI-assisted facilitation have emerged from OFL research and discussions.

## Approach 1: Fine-Tuning Models

**Advocates**: Joseph Low (Cooperative AI), Public AI researchers

### Description
Train language models on facilitation data to improve their inherent facilitation capabilities at the model level.

### How It Works
1. Collect labeled facilitation datasets
2. Define feedback signals (using Why-How-Who framework)
3. Fine-tune foundation models via reinforcement learning
4. Release improved models (e.g., on Hugging Face)

### Benefits
- Capabilities baked into the model
- Works across different applications
- Contributes to open-source AI ecosystem
- Decentralizes AI development beyond large labs

### Challenges
- Requires significant compute resources
- Needs high-quality labeled data
- Longer iteration cycles
- Changes apply broadly (less context-specific)

### Best For
- Creating general-purpose facilitation capabilities
- Research into what makes facilitation effective
- Democratizing access to facilitation AI

## Approach 2: Skills at Inference Time

**Advocates**: Harmonica team, practitioners building tools

### Description
Enhance existing language models with prompts, tools, and context to enable facilitation without changing the model itself.

### How It Works
1. Design prompt templates for different facilitation methods
2. Build tool integrations (memory, retrieval, external APIs)
3. Create orchestration logic for multi-step processes
4. Configure at deployment time

### Benefits
- Works with any capable LLM
- Rapid iteration and customization
- Context-specific adaptation
- Lower technical barrier

### Challenges
- Dependent on base model capabilities
- Prompt engineering limitations
- May require more tokens/compute per session
- Less fundamental improvement

### Best For
- Building production facilitation tools
- Adapting to specific use cases
- Rapid prototyping and testing
- Organizations needing customization

## These Approaches Are Complementary

A key insight from OFL discussions: these approaches attack facilitation from different angles and can work together.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Fine-tuned models ←─── Better foundation          │
│         │                                           │
│         ▼                                           │
│   Skills & prompts ←─── Method-specific behavior    │
│         │                                           │
│         ▼                                           │
│   Better facilitation outcomes                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Fine-tuning improves the **foundation**
- Skills/prompts provide **method specificity**
- Together they enable better outcomes than either alone

## Practical Implications

### For Tool Builders (like Harmonica)
- Build with skills/prompts for flexibility
- Design to work with multiple LLMs
- Prepare for improved base models over time
- Contribute evaluation data back to fine-tuning efforts

### For Researchers (like Joseph Low)
- Use tools as testbeds for fine-tuning experiments
- Share evaluation frameworks across approaches
- Publish datasets for community benefit
- Collaborate with practitioners on what matters

### For OFL
- Document patterns usable by both approaches
- Create evaluation frameworks that work across methods
- Build community bridging research and practice
- Maintain open standards for interoperability

## Current State (2026)

- **Fine-tuning**: Early research, datasets being developed
- **Skills/prompts**: Production tools exist (Harmonica, others)
- **Integration**: Beginning collaboration between approaches
- **Standards**: OFL working to create shared infrastructure

## References

- OFL Substack blog post on AI facilitation approaches
- Joseph Low's Cooperative AI fellowship research
- Harmonica technical architecture discussions
