# Contributing

Describe the player or GM workflow a proposed change helps, the README milestone it serves, and how a reviewer can verify it. For rule interpretations, include the published source and the expected calculation or validation outcome. Capture open scope questions, such as launch support for custom morphs, before expanding v1.

Keep changes focused. Update [Overview](overview.md) when the supported workflows change, [Architecture](architecture.md) when a boundary or data flow changes, and [Getting started](getting-started.md) and [AGENTS.md](../AGENTS.md) when contributor commands change. Update the [README](../README.md) when a change affects the product description or delivery milestones. Record consequential design choices in [Decisions](decisions.md).

## Move roadmap items with the work

Update the [roadmap](../roadmap/roadmap.json) in the same change as the work it describes. Leave partial work in the priority list. Once its acceptance conditions are met, move the item to the end of [completed.json](../roadmap/completed.json) and record the completion timestamp. Move dropped work to [cancelled.json](../roadmap/cancelled.json) with a timestamp and short reason. Keep the item’s id through every move and update the timestamp in each changed file. See the [format contract](roadmap-format.md) for the allowed fields and reopening rules.

In the change description, record the checks run, relevant limitations, and any remaining work. Use the [development verification plan](development.md) for the affected layer.
