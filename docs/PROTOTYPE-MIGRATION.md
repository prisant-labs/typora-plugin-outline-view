# Migration from the Right Outline Prototype

## Background

Before the permanent repository was created, a validation spike was generated under the working name:

`typora-plugin-right-outline`

That spike should not determine the final architecture.

## What to keep conceptually

- Community Plugin `WorkspaceView`
- right-dock hosting
- independent heading rendering
- H1-H6 parsing
- click-to-scroll
- file-open refresh
- debounced mutation refresh
- active heading highlighting
- toggle/refresh commands

## What to change

### Identity

Old:

```text
typora-plugin-right-outline
prisant-labs.right-outline
Right Outline
```

New:

```text
typora-plugin-outline-view
prisant-labs.outline-view
Outline View
```

### Architecture

Old spike bundled most logic in one `main.ts`.

Production code should separate responsibilities after the first working milestone:

- parser/model
- view
- synchronization
- placement
- settings

### Placement

Old spike assumed right dock was the product.

Production plugin treats right dock as the first placement adapter.

### Settings

Old spike hard-coded auto-open.

Production plugin should make auto-open configurable.

### Styling

Old spike used minimal prototype styles.

Production plugin should use Community/Typora variables and test across themes.

## Important

Do not mechanically copy prototype code if current Community Plugin APIs suggest a better approach.

The prototype exists to validate direction, not to preserve implementation.
