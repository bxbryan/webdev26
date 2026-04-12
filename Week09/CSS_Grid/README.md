# CSS Grid: Building Layouts That Actually Make Sense

**Course:** Intro to Web Development  
**Prerequisites:** HTML & CSS basics (selectors, box model, basic styling)  
**Duration:** ~90 minutes

---

## What You'll Learn

By the end of this lesson, you'll be able to:

- Define a grid container and control its rows and columns
- Use the `fr` unit to create flexible, proportional layouts
- Name and assign areas of a grid using `grid-template-areas`
- Control how items span across multiple rows or columns
- Build responsive layouts that adapt to different screen sizes

---

## 1. Why CSS Grid?

Before Grid, building two-dimensional layouts in CSS was painful. Developers hacked together floats, clearfixes, and table tricks just to place a sidebar next to some content.

CSS Grid is a **layout system built directly into the browser** that lets you control both rows _and_ columns at the same time. Think of it like drawing a blueprint for your page and then slotting elements into it.

> **Grid vs. Flexbox:** Flexbox is great for laying out items in _one direction_ (a row of buttons, a column of cards). Grid shines when you need _two-dimensional_ control — rows and columns together. You'll often use both on the same page.

---

## 2. Grid Basics: Rows, Columns, and the `fr` Unit

### Turning on Grid

You start by setting `display: grid` on a **container** element. Its direct children automatically become **grid items**.

```html
<div class="grid-container">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
  <div>Item 5</div>
  <div>Item 6</div>
</div>
```

```css
.grid-container {
  display: grid;
  grid-template-columns: 200px 200px 200px;
  grid-template-rows: 100px 100px;
  gap: 16px;
}
```

This creates a 3-column, 2-row grid. Each column is exactly 200px wide and each row is 100px tall. `gap` adds space between the cells.

### The `fr` Unit

Pixel values are rigid. The `fr` unit (short for **fraction**) lets you divide available space proportionally.

```css
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr; /* three equal columns */
  gap: 16px;
}
```

This is equivalent to "give each column an equal share of the available width." You can mix and match:

```css
grid-template-columns: 2fr 1fr;
/* Left column gets 2/3 of the space, right column gets 1/3 */
```

You can also mix `fr` with fixed units:

```css
grid-template-columns: 250px 1fr;
/* Fixed sidebar, flexible main content area */
```

### `repeat()` — A Shortcut

Writing `1fr 1fr 1fr 1fr` gets old fast. Use `repeat()`:

```css
grid-template-columns: repeat(4, 1fr); /* four equal columns */
grid-template-columns: repeat(3, 200px); /* three 200px columns */
```

### `gap`, `column-gap`, `row-gap`

`gap` sets space between all grid cells. You can control row and column spacing separately:

```css
gap: 16px; /* 16px between rows AND columns */
row-gap: 24px; /* vertical spacing only */
column-gap: 12px; /* horizontal spacing only */
```

> **Try it:** Create a container with 3 equal columns and 2 rows using `fr` and `repeat()`. Add a `gap` and resize the browser window — notice how `fr` columns flex with the viewport.

---

## 3. Template Areas

Named template areas let you define your layout visually in CSS — almost like drawing a sketch right in your stylesheet.

### Defining the Layout

```css
.page-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    'header  header'
    'sidebar main'
    'footer  footer';
  min-height: 100vh;
  gap: 0;
}
```

Each string in `grid-template-areas` represents a row. Each word in the string is a column. Repeated names span that area across multiple cells. A dot (`.`) represents an empty cell.

### Assigning Items to Areas

```css
.header {
  grid-area: header;
}
.sidebar {
  grid-area: sidebar;
}
.main {
  grid-area: main;
}
.footer {
  grid-area: footer;
}
```

```html
<div class="page-layout">
  <header class="header">Header</header>
  <aside class="sidebar">Sidebar</aside>
  <main class="main">Main Content</main>
  <footer class="footer">Footer</footer>
</div>
```

The result: a classic page layout — header across the top, sidebar on the left, main content filling the right, footer across the bottom. And you can read the layout structure right in your CSS.

### Empty Cells with `.`

```css
grid-template-areas:
  'header header header'
  'sidebar main   .     '
  'footer footer footer';
```

The dot leaves the third column of the middle row empty.

> **Try it:** Recreate a magazine-style layout: a wide banner header, three equal content columns in the middle, and a full-width footer. Write the `grid-template-areas` first, then assign each element its `grid-area`.

---

## 4. Auto-Placement and Spanning

### Auto-Placement

When you don't assign items to specific areas, Grid places them automatically — filling in cells left-to-right, row by row. This is called the **auto-placement algorithm**.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
```

Drop in any number of `.card` children and they'll fill in automatically. No positioning required.

### Spanning Columns and Rows

Sometimes an item needs to take up more than one cell. Use `grid-column` and `grid-row` with the `span` keyword.

```css
/* Span across 2 columns */
.featured-card {
  grid-column: span 2;
}

/* Span across 2 rows */
.tall-item {
  grid-row: span 2;
}

/* Span both */
.hero-item {
  grid-column: span 2;
  grid-row: span 2;
}
```

### Line-Based Placement

You can also place items by referencing **grid lines** (the invisible lines between columns/rows). Lines are numbered starting at 1.

```css
.item {
  grid-column: 1 / 3; /* start at line 1, end at line 3 (spans 2 columns) */
  grid-row: 2 / 4; /* start at row line 2, end at row line 4 */
}
```

Use `-1` to reference the last line:

```css
grid-column: 1 / -1; /* stretch across ALL columns */
```

### `grid-auto-rows` — Controlling Implicit Rows

When auto-placed items overflow your defined rows, Grid creates new ones automatically. Control their size with `grid-auto-rows`:

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 200px; /* every auto-created row is 200px tall */
  gap: 20px;
}
```

Use `minmax()` to make rows flexible but with a minimum height:

```css
grid-auto-rows: minmax(150px, auto);
/* At least 150px tall, grows to fit content */
```

> **Try it:** Build a photo gallery grid with 4 columns. Make every third photo span 2 columns. Use `grid-auto-rows: minmax(200px, auto)` so rows breathe.

---

## 5. Responsive Grid Patterns

### The `minmax()` Function

`minmax(min, max)` sets a size range for a track. This is the key to fluid grids.

```css
grid-template-columns: repeat(3, minmax(200px, 1fr));
/* Each column is at least 200px wide, but grows equally to fill space */
```

### `auto-fill` vs `auto-fit`

These keywords work with `repeat()` to automatically calculate how many columns fit:

```css
/* auto-fill: create as many columns as fit, even if empty */
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

/* auto-fit: same, but collapse empty columns so items stretch */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
```

The magic combination — **no media queries needed**:

```css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}
```

This grid will show 4 columns on a wide screen, 2 on a tablet, and 1 on mobile — all automatically.

### Combining with Media Queries

For more control, use `grid-template-areas` with media queries to completely restructure your layout at different breakpoints:

```css
.page {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas:
    'header'
    'main'
    'sidebar'
    'footer';
}

@media (min-width: 768px) {
  .page {
    grid-template-columns: 250px 1fr;
    grid-template-areas:
      'header  header'
      'sidebar main'
      'footer  footer';
  }
}
```

On mobile: single column, stacked. On tablet and up: sidebar + main layout. The HTML doesn't change at all — only the CSS.

> **Try it:** Build a card grid using `auto-fit` and `minmax(280px, 1fr)`. Resize your browser from full width down to 320px and watch the columns collapse naturally.

---

## Quick Reference

| Property                 | What It Does                            |
| ------------------------ | --------------------------------------- |
| `display: grid`          | Activates grid on a container           |
| `grid-template-columns`  | Defines column sizes                    |
| `grid-template-rows`     | Defines row sizes                       |
| `grid-template-areas`    | Names regions of the grid               |
| `grid-area`              | Assigns an item to a named area         |
| `grid-column: span N`    | Makes an item span N columns            |
| `grid-row: span N`       | Makes an item span N rows               |
| `grid-auto-rows`         | Sets height of auto-generated rows      |
| `gap`                    | Space between grid cells                |
| `repeat(N, size)`        | Shorthand for repeated track sizes      |
| `fr`                     | Fractional unit — a share of free space |
| `minmax(min, max)`       | Sets a size range for a track           |
| `auto-fit` / `auto-fill` | Auto-calculates column count            |

---

## Practice Project: Build a Blog Layout

Combine everything from this lesson to build a blog page layout with these requirements:

1. A full-width header
2. A main content area and a narrower sidebar sitting side by side
3. A "featured posts" section above the main content that uses a 3-column card grid
4. Cards in the featured section that span 2 columns when marked as `.featured`
5. The layout should stack to a single column on screens narrower than 700px
6. Use `grid-template-areas` for the overall page structure
7. Use `auto-fit` + `minmax` for the card grid

---

## Further Reading

- [MDN: CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)
- [CSS-Tricks: A Complete Guide to CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Grid Garden](https://cssgridgarden.com/) — an interactive game for practicing Grid
