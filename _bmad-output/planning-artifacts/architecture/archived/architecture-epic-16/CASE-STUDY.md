# Case Study: Rearchitecting the Slide Rendering Pipeline (Epic 16)

## 1. Executive Summary

In the legacy architecture of `bic-pptx-workflow`, slide layout generation was hardcoded using a flat taxonomy of slide types (`SlideKind`). Every time a visual template needed a tweak—say, changing a font size or adjusting a coordinate—a developer had to modify the TypeScript code (`SlideView.tsx` and `pptx.ts`) and redeploy the application.

Epic 16 fundamentally shifts this paradigm. We are moving from hardcoded logic to a **Data-Driven Presentation Rendering Model** coupled with a decoupled, web-based Canvas Editor. Operators can visually edit template layouts, while the underlying renderers simply draw whatever the data instructs them to.

## 2. The Paradigm Shift

### From Imperative to Declarative (Abstract Syntax Tree)
Previously, the `buildSlidePlan` function outputted an array of simple labels. The React renderer and the PPTX renderer were forced to interpret those labels and calculate coordinates and font sizes on the fly. 

In the new architecture, `buildSlidePlan` outputs a **Fully Hydrated Abstract Syntax Tree (AST)**. It queries the Artifact Registry, fetches the template layout, merges it with the dynamic text from the rundown sheet, and produces absolute rendering instructions (e.g., "Draw text 'Welcome' at X:10, Y:20, Font: 32px"). The renderers become "dumb" drawing engines, completely eliminating logic duplication.

### Architecture Data Flow

```mermaid
flowchart TD
    %% Define styles
    classDef storage fill:#f9f,stroke:#333,stroke-width:2px;
    classDef process fill:#bbf,stroke:#333,stroke-width:2px;
    classDef renderer fill:#dfd,stroke:#333,stroke-width:2px;

    %% Nodes
    A[Raw Rundown / Form Input]
    DB[(SQLite Database\nArtifact Registry)]:::storage
    Seed[data/default-registry.json\n(Startup Seed)]:::storage
    Builder[buildSlidePlan\n(AST Generator)]:::process
    Editor[Canvas Editor\n(Fabric.js)]:::process
    React[React SlideView\n(Web Renderer)]:::renderer
    PPTX[PptxGenJS\n(File Renderer)]:::renderer

    %% Connections
    Seed -.->|Seeds initial templates| DB
    Editor <-->|Reads & Saves Layouts| DB
    A --> Builder
    DB -->|Fetches Layout Template| Builder
    Builder -->|Fat Payload AST| React
    Builder -->|Fat Payload AST| PPTX
```

## 3. Key Architectural Decisions

### 1. Artifact Registry Storage (SQLite)
While the initial extraction of presentation templates was dumped into a JSON file (`data/default-registry.json`), we chose **SQLite (WAL Mode)** as the live runtime storage.
- **Why?** Storing live layouts in SQLite guarantees safety against concurrent saves from multiple operators and avoids ephemeral data loss (e.g., if deployed to Vercel or a stateless Docker container). The JSON file is merely a startup seed.

### 2. State Boundary (Fabric.js & React Integration)
Integrating an imperative library like Fabric.js into a declarative React environment is a notorious source of performance bugs. We chose an **Uncontrolled Wrapper Pattern**.
- **Why?** React only provides the mounting point (`<canvas>`) and a Save button. Fabric.js maintains full, exclusive ownership of the internal canvas state. This eliminates dragging lag, stutters, and unnecessary React re-renders. React only interacts with Fabric.js when pulling data (`canvas.toJSON()`) to send to the server.

### 3. Slide Plan Data Flow (Fat Payload)
We opted for a **Fat Payload** approach for the AST output.
- **Why?** By having `buildSlidePlan` fully hydrate the slide coordinates and content, the React `SlideView` and PPTX generators do not need to perform asynchronous database lookups during their render cycles. The database is queried exactly once during the planning phase.

## 4. Conclusion

By separating the **authoring of layouts** (Canvas Editor) from the **rendering of layouts** (React/PPTX), and by using a decoupled AST data structure as the bridge, this architecture empowers non-developer operators to design slides without compromising the performance or maintainability of the codebase.
