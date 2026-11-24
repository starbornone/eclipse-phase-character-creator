# Eclipse Phase 2e Character & Morph Creator

A TypeScript web application for creating, validating, saving, and printing **Eclipse Phase Second Edition** characters. The app treats an **ego** (the character’s enduring mind, identity, skills, and personal history) separately from a **morph** (the current biological, synthetic, or exotic body), so players can model resleeving clearly.

> **Status:** Planning / pre-build
>
> **Primary UI stack:** TypeScript, React, shadcn/ui, Tailwind CSS

## Product goals

- Make Eclipse Phase 2e character creation approachable without hiding rules or calculations.
- Support the game’s defining distinction between ego and morph.
- Make every calculated value inspectable: users should be able to see *why* a value changed.
- Produce polished, printable character dossiers for players and a concise GM-facing view.
- Keep the first release local-first and usable without an account.

## Non-goals for the first release

- A virtual tabletop or full campaign manager.
- Rules content not covered by the project’s confirmed licensing and attribution plan.
- Multiplayer collaboration, live sheets, or cloud sync.
- Automated combat simulation.
- Replacing the core rulebook: the app should assist creation, not reproduce the entire game text.

## Licensing and content policy

Eclipse Phase Second Edition is published with Creative Commons licensing information by Posthuman Studios. Before implementation, confirm the exact licence version, attribution wording, and treatment of artwork, logos, and full rules text from the official source.

Project policy:

- Store game mechanics and published content separately from application code.
- Include attribution and licence notices in the app and all exports where required.
- Avoid bundling unverified copyrighted artwork, logos, or text.
- Write original UI copy and explanatory text.
- Preserve source references for every rules dataset and rule interpretation.

## Core concepts

### Ego

The ego is the character’s portable identity. It contains the data that generally persists through resleeving:

- Name, pronouns, background, faction, motivations, and personal details
- Aptitudes and skills
- Traits, motivations, rep networks, and personal resources
- Knowledge and social connections
- Gear and software owned by the character

### Morph

The morph is the body currently inhabited by the ego. It contributes physical capabilities, advantages, limitations, durability, movement, implants, and appearance.

### Sleeve

A sleeve is an ego-and-morph pairing at a particular point in time. The app should make this explicit so users can compare a character before and after resleeving without overwriting the ego.

### Character dossier

A dossier is a printable, shareable representation of a sleeve. It combines relevant ego and morph data, derived values, selected equipment, and player-facing notes.

## Primary user flows

### 1. Create an ego

1. Start a new character.
2. Select creation method: guided lifepath or freeform point allocation.
3. Enter identity and narrative anchors.
4. Choose background, faction, aptitudes, skills, traits, motivations, and gear.
5. Review budgets, validation messages, and calculated values.
6. Save the ego independently of any current morph.

### 2. Assign a first morph

1. Open the ego’s sleeve manager.
2. Browse or search available morphs.
3. Select a morph and configure permitted options, implants, and cosmetic details.
4. Review the combined sleeve summary.
5. Save the current sleeve and optionally create a print dossier.

### 3. Resleeve

1. Select “Resleeve” from a saved ego or sleeve.
2. Choose a new morph.
3. Compare old and new derived statistics side by side.
4. Record date, location, cause, and notes for the resleeving event.
5. Save a new sleeve record without altering prior sleeve history.

### 4. Export

1. Choose player dossier, GM summary, or raw JSON backup.
2. Select which private notes and sensitive details to include.
3. Generate a print-friendly PDF view through the browser.
4. Download a portable JSON file for backup or later import.

## Information architecture

Home
├── My Egos
│   ├── Ego overview
│   ├── Create ego
│   └── Import / export
├── Ego workspace
│   ├── Identity
│   ├── Creation path
│   ├── Aptitudes
│   ├── Skills
│   ├── Traits & motivations
│   ├── Reputation & resources
│   ├── Gear & software
│   ├── Morphs
│   ├── Sleeve history
│   ├── Validation
│   └── Export dossier
├── Morph library
│   ├── Browse morphs
│   ├── Compare morphs
│   └── Custom morphs
└── Reference
    ├── Glossary
    ├── Calculation explanations
    ├── Attribution & licences
    └── Keyboard shortcuts

## Key screens

### Dashboard

A calm entry point listing saved egos, their current morphs, last-edited date, completion state, and quick actions.

**Required UI elements**

- Character cards or compact rows
- “Create ego” primary action
- Import JSON action
- Filter by complete, draft, or recently edited
- Empty state that explains ego versus morph before the first creation

### Guided builder

A step-based workspace with a persistent summary panel. It should allow non-linear navigation while clearly showing incomplete or invalid sections.

**Required UI elements**

- Progress navigation with section completion states
- Budget summary for the selected creation method
- Inline rule explanations and calculation breakdowns
- Autosave indicator
- Validation summary that links to the field needing attention

### Morph library and comparison

A searchable collection of morph records, presented as cards on small screens and a comparison table on larger screens.

**Required UI elements**

- Search and filters for category, price, movement, durability, and capabilities
- Compare up to three morphs
- “Assign to ego” action
- Detail drawer with rules source, features, and restrictions
- Clear distinction between base morph data and user customisation

### Sleeve overview

The central character view: a readable dossier with ego details, current morph, derived stats, skills, conditions, equipment, and notes.

**Required UI elements**

- Ego / morph visual separation
- Derived-stat explanations on hover or tap
- Resleeve action
- Printable view
- Toggle for player versus GM-private information

## Suggested TypeScript domain model

Keep rules data, user data, and derived values distinct. The following is a planning sketch, not a final schema.

export type Id = string;

export type CreationMethod = 'lifepath' | 'point-buy';
export type MorphCategory = 'biomorph' | 'pod' | 'synth' | 'infomorph' | 'other';

export interface Ego {
  id: Id;
  version: 1;
  name: string;
  pronouns?: string;
  concept?: string;
  backgroundId?: string;
  factionId?: string;
  creationMethod: CreationMethod;
  aptitudes: Record;
  skills: SkillPurchase[];
  traits: SelectedTrait[];
  motivations: Motivation[];
  rep: Record;
  inventory: InventoryItem[];
  notes: CharacterNotes;
  sleeveIds: Id[];
  activeSleeveId?: Id;
  createdAt: string;
  updatedAt: string;
}

export interface MorphDefinition {
  id: string;
  name: string;
  category: MorphCategory;
  description?: string;
  cost: number;
  aptitudeModifiers: Record;
  durability: number;
  woundThreshold?: number;
  movement?: MovementProfile[];
  capabilities: string[];
  restrictions: string[];
  source: SourceReference;
}

export interface Sleeve {
  id: Id;
  egoId: Id;
  morphDefinitionId: string;
  customName?: string;
  implants: SelectedItem[];
  cosmeticNotes?: string;
  resleevedAt?: string;
  resleevingNotes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface DerivedCharacter {
  egoId: Id;
  sleeveId: Id;
  finalAptitudes: Record;
  activeSkills: DerivedSkill[];
  durability: number;
  woundThreshold?: number;
  capabilities: string[];
  validation: ValidationIssue[];
  calculationTrace: CalculationTrace[];
}

## Rules engine approach

Implement character calculations as pure, tested functions. UI components should ask the rules engine for outputs, rather than reproducing arithmetic in components.

rules datasets + user selections
            ↓
      normalise inputs
            ↓
  pure validation/calculation functions
            ↓
 derived character + calculation trace
            ↓
   UI summary, validation, and export

### Requirements

- Each derived value must retain a trace of contributing values and modifiers.
- Validation should return structured issues with a severity, plain-language message, affected field, and optional source reference.
- Rules versions should be explicit in saved data so future updates can migrate safely.
- The engine must support incomplete drafts without crashing or inventing values.
- Unit tests should cover every calculation and character-creation constraint before UI work depends on it.

## UI and component approach

Use shadcn/ui as the component foundation, with a visual direction that feels like a modern technical dossier rather than a generic fantasy sheet.

**Likely components**

- `Button`, `Card`, `Badge`, `Tabs`, `Dialog`, `Drawer`, `Sheet`
- `Form`, `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`
- `Table`, `Tooltip`, `Popover`, `Command`, `Separator`, `ScrollArea`
- `Progress`, `Alert`, `Accordion`, `Collapsible`, `Skeleton`
- `Toast` or equivalent feedback pattern

**Custom product components**

- `EgoMorphHeader`
- `BuilderProgressNav`
- `BudgetLedger`
- `CalculationBreakdown`
- `RuleSourceBadge`
- `ValidationSummary`
- `MorphCompareTable`
- `SleeveTimeline`
- `DossierPrintLayout`

### Design principles

- Use strong hierarchy and dense-but-readable information layouts.
- Never communicate a rule error using colour alone.
- Keep character-sheet typography highly legible in both screen and print contexts.
- Prefer progressive disclosure: show essential values first, calculation detail on demand.
- Design responsive layouts for a player editing on a phone and a GM comparing data on a laptop.

## Data storage strategy

### MVP: local-first

- Store user-created egos and sleeves in IndexedDB.
- Export JSON backups from the dashboard and per-ego screens.
- Support import with schema validation and a human-readable migration report.
- Keep static rules datasets versioned in the application bundle.

### Later: optional account sync

- Introduce authentication only after local export/import is solid.
- Encrypt sensitive user content in transit and at rest.
- Keep private notes separate from data required for basic public exports.
- Preserve full user control over deletion and data export.

## Accessibility requirements

- Keyboard-complete navigation, including builder steps, dialogs, comparison tables, and tooltips.
- Semantic labels for all calculated values and status messages.
- Visible focus states and WCAG-conscious contrast.
- No drag-and-drop-only interactions.
- Reduced-motion support.
- Print layouts that do not rely on colour alone.
- Friendly validation copy that identifies both the problem and the next action.

## Testing plan

### Unit tests

- Aptitude, skill, cost, pool, and morph-modifier calculations
- Validation rules for each character-creation path
- Data migrations and import parsing
- Calculation-trace generation

### Component tests

- Builder section completion behaviour
- Error summary links and accessible announcements
- Morph filters, sorting, and comparison
- Print visibility toggles for private notes

### End-to-end tests

- Create an ego, select a morph, save, resleeve, export, and re-import
- Resume an incomplete draft after refresh
- Handle a malformed import without losing existing local characters
- Generate a print view from a complete sleeve

## Suggested project structure

src/
├── app/
│   ├── dashboard/
│   ├── egos/
│   ├── morphs/
│   ├── reference/
│   └── settings/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── character/
│   ├── morphs/
│   ├── builder/
│   └── print/
├── features/
│   ├── ego/
│   ├── sleeve/
│   ├── morph-library/
│   ├── export/
│   └── import/
├── rules/
│   ├── datasets/
│   ├── calculations/
│   ├── validation/
│   └── sources/
├── lib/
│   ├── storage/
│   ├── schemas/
│   └── utils/
├── types/
└── tests/

## Delivery milestones

### Milestone 0 — Product and rules discovery

- Confirm licence, attribution, and content boundaries.
- List exact supported character-creation pathways for version one.
- Build a source-backed rules-data inventory.
- Draft wireframes for dashboard, builder, morph library, and dossier.

**Exit criteria:** a reviewed product brief, documented data sources, and approved screen map.

### Milestone 1 — Functional vertical slice

- Local storage for one ego and one sleeve.
- Minimal ego identity and aptitude editing.
- Small sample morph dataset.
- Derived-stat calculation trace.
- Basic dossier screen.

**Exit criteria:** a user can create a draft, assign a morph, reload the app, and see an accurate calculated summary.

### Milestone 2 — Full creation workflow

- Complete chosen creation method.
- Skills, traits, motivations, reputation, and equipment.
- Validation ledger and clear calculation explanations.
- Searchable morph library and morph comparison.

**Exit criteria:** a user can build a rules-valid first character without external spreadsheets.

### Milestone 3 — Resleeving and export

- Sleeve timeline and resleeving comparison.
- Player and GM dossier layouts.
- JSON export, import, validation, and migration report.
- Browser print stylesheet.

**Exit criteria:** a user can preserve their character history and take a polished sheet to a session.

### Milestone 4 — Polish and public beta

- Accessibility audit and keyboard test pass.
- Mobile and print QA.
- Error monitoring and privacy-respecting product metrics.
- Guided onboarding and feedback collection.

**Exit criteria:** stable beta with documented known limitations and a clear feedback loop.

## Open decisions

- Which exact Eclipse Phase 2e creation options are in the first release?
- Which rules content can be bundled, paraphrased, or linked under the confirmed licence?
- Should custom morphs be available at launch, or only after official morph support is reliable?
- What does the first printable dossier need to include to be table-ready?
- Is the app strictly a character tool, or should it later include lightweight firewall, gear, and reputation trackers?
- Which framework should host the TypeScript React application: Next.js, Vite, or another agreed standard?

## Definition of done for v1

Version 1 is done when a player can create an Eclipse Phase 2e ego, assign an official supported morph, understand every major derived value, save locally, resleeve without losing history, export a backup, and print a clean dossier—with keyboard access and useful error feedback throughout.