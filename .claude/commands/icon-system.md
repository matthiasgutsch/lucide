# Icon System — Skills & Conventions

> **Project:** `lucide` — Angular app at `/Users/matthiasgutsch/Documents/git/lucide`
> All file paths in this document are relative to that root.

When this skill is invoked, start by asking:

1. "Please share the Figma link for the icon you want to add."

Then follow the workflow below.

---

## Button & Icon Size System

Three fixed sizes apply to both buttons and their icons. Always use these values — never invent custom sizes.

| Size | Button height | Icon size | Stroke width |
| ---- | ------------- | --------- | ------------ |
| sm   | 32px          | 16px      | 1.65         |
| md   | 40px          | 20px      | 2.00         |
| lg   | 48px          | 24px      | 2.35         |

### SIZE_CONFIG in `app.ts`

```ts
export type ButtonSize = 'sm' | 'md' | 'lg';

const SIZE_CONFIG: Record<ButtonSize, { size: number; strokeWidth: number }> = {
  sm: { size: 16, strokeWidth: 1.65 },
  md: { size: 20, strokeWidth: 2 },
  lg: { size: 24, strokeWidth: 2.35 },
};
```

Expose per-size config to templates via a method:

```ts
protected iconConfig(s: ButtonSize) {
  return SIZE_CONFIG[s];
}
```

### Button CSS classes

```less
.ui-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  &.btn-sm {
    height: 32px;
    padding: 0 0.75rem;
    font-size: 0.75rem;
    border-radius: 0.375rem;
  }
  &.btn-md {
    height: 40px;
    padding: 0 1rem;
    font-size: 0.875rem;
  }
  &.btn-lg {
    height: 48px;
    padding: 0 1.25rem;
    font-size: 1rem;
    border-radius: 0.625rem;
  }
}
```

### Template pattern — render all three sizes

```html
@for (s of sizes; track s) {
<button class="ui-btn btn-{{ s }}">
  <dc-icon
    name="<icon-name>"
    [size]="iconConfig(s).size"
    [strokeWidth]="iconConfig(s).strokeWidth"
  />
  <span>Label</span>
</button>
}
```

---

## Adding a Custom Icon from Figma

### Naming rule

The icon name always comes from the Figma node name **after `icon/`**.

```
Figma node: "icon/specrometer"  →  name: "specrometer"
Figma node: "icon/arrow-left"   →  name: "arrow-left"
```

### Workflow

1. **Get design context** from Figma MCP using the file key and node ID from the URL:
   - `figma.com/design/:fileKey/...?node-id=63-720` → nodeId `63:720`
   - Call `get_design_context` to retrieve geometry and a screenshot.

2. **Extract SVG paths** from the returned asset/image analysis.
   - If Figma returns vector paths directly — use them as-is.
   - If Figma returns a raster image — analyse the geometry from the screenshot description.

3. **Add the export** to `src/app/icons/custom-icons.ts`:

```ts
export const DcSpecrometer: LucideIconData = [
  [
    'circle',
    {
      cx: '12',
      cy: '12',
      r: '8',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'shape-rendering': 'geometricPrecision',
    },
  ],
  [
    'path',
    {
      d: 'M9.6 12L11.2 13.6L14.4 10.4',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'shape-rendering': 'geometricPrecision',
    },
  ],
];
```

Naming convention: export name is `Dc` + PascalCase of the icon name.

4. **Register** in `src/app/icons/dc-icon.component.ts`:

```ts
const iconRegistry: Record<string, LucideIconData> = {
  // existing entries...
  specrometer: customIcons.DcSpecrometer,
};
```

5. **Use** anywhere:

```html
<dc-icon name="specrometer" [size]="iconConfig(s).size" [strokeWidth]="iconConfig(s).strokeWidth" />
```

### SVG icon element conventions

All custom icons use these standard attributes:

```ts
{
  fill: 'none',
  stroke: 'currentColor',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'shape-rendering': 'geometricPrecision',
}
```

Filled shapes (e.g. dots) use `fill: 'currentColor'` and `stroke: 'none'`.

All icons are on a **24×24 viewBox**.

---

## Key Files

| File                                 | Purpose                                            |
| ------------------------------------ | -------------------------------------------------- | --- |
| `src/app/app.ts`                     | `SIZE_CONFIG`, `ButtonSize` type, computed signals |
| `src/app/app.less`                   | Button and icon card styles                        |
| `src/app/app.html`                   | Template with size toggle and button/icon grid     |
| `src/app/icons/custom-icons.ts`      | SVG icon definitions (`LucideIconData`)            |
| `src/app/icons/dc-icon.component.ts` | Icon registry + `<dc-icon>` wrapper component      | 3   |
