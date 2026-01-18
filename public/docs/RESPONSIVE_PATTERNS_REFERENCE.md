# Responsive Design Patterns Reference

## Quick Reference for Responsive Classes

### Typography Patterns

#### Page Titles
```tailwind
text-lg sm:text-2xl md:text-3xl      /* H1 equivalent */
text-base sm:text-lg md:text-2xl     /* H2 equivalent */
text-sm sm:text-base md:text-lg      /* H3 equivalent */
text-xs sm:text-sm md:text-base      /* Body text */
```

#### Button & Badge Text
```tailwind
text-xs sm:text-sm md:text-base      /* Standard button text */
text-xs                              /* Small badges/labels */
text-xxs sm:text-xs md:text-sm       /* Tiny text */
```

### Spacing Patterns

#### Card Padding
```tailwind
p-3 sm:p-4 md:p-6                    /* Standard card padding */
p-2 sm:p-3 md:p-4                    /* Compact cards */
p-6 sm:p-8 md:p-12                   /* Large sections */
```

#### Section Spacing
```tailwind
space-y-3 sm:space-y-4 md:space-y-6  /* Vertical spacing between major sections */
space-y-2 sm:space-y-3 md:space-y-4  /* Tighter vertical spacing */
```

#### Grid Gaps
```tailwind
gap-2 sm:gap-3 md:gap-4              /* Standard grid gap */
gap-1 sm:gap-2 md:gap-3              /* Compact grid */
gap-3 sm:gap-4 md:gap-6              /* Large grid gap */
```

#### Margins
```tailwind
mt-2 sm:mt-3 md:mt-4                 /* Top margin */
mb-3 sm:mb-4 md:mb-6                 /* Bottom margin */
mx-2 sm:mx-3 md:mx-4                 /* Horizontal margin */
```

### Icon Patterns

#### Small Icons (in text, badges)
```tailwind
h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6  /* Inline icons */
h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8  /* Standard icons */
```

#### Large Icons (in stats/cards)
```tailwind
h-8 w-8 md:h-10 md:w-10              /* Statistics card icons */
h-10 w-10 md:h-12 md:w-12            /* Hero/big icons */
h-12 h-12 md:h-16 md:w-16            /* Extra large icons */
```

#### Always include flex-shrink
```tailwind
h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 text-blue-600 flex-shrink-0
```

### Layout Patterns

#### Grid Layouts
```tailwind
/* 2-col mobile, 2-col tablet, 4-col desktop */
grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4

/* 1-col mobile, 2-col tablet, 4-col desktop */
grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4

/* 1-col mobile, 2-col tablet, 3-col desktop */
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

/* With responsive gaps */
grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4
```

#### Flex Layouts
```tailwind
/* Stack mobile, row desktop */
flex flex-col sm:flex-row

/* With gaps and alignment */
flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3

/* Justify spacing */
flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3
```

#### Container Sizing
```tailwind
/* Full width with padding */
w-full px-3 sm:px-4 md:px-6

/* Max width for large screens */
w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6
```

### Responsive Visibility

#### Hide/Show by Breakpoint
```tailwind
hidden sm:block                      /* Hidden on mobile, visible on tablet+ */
block sm:hidden                      /* Visible on mobile, hidden on tablet+ */
hidden md:block                      /* Hidden on mobile/tablet, visible on desktop+ */
hidden lg:block                      /* Hidden on mobile/tablet/small-desktop */
lg:hidden                            /* Visible on mobile/tablet, hidden on desktop+ */
```

### Component Patterns

#### Buttons
```tailwind
px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base rounded-lg hover:opacity-90 transition

/* Compact button */
px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm

/* Large button */
px-4 sm:px-6 md:px-8 py-3 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg
```

#### Card Containers
```tailwind
bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 border-l-4 border-green-600 hover:shadow-md transition

/* Compact card */
bg-white rounded-lg shadow p-2 sm:p-3 md:p-4

/* Large card */
bg-white rounded-lg shadow p-4 sm:p-6 md:p-8
```

#### Badges/Status
```tailwind
px-2 sm:px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap flex-shrink-0 bg-green-100 text-green-800

/* Inline badge */
px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium
```

#### Tables (Responsive)
```tailwind
/* Table cell padding */
px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider

/* Hide columns on mobile */
hidden sm:table-cell                 /* Show on tablet+ */
hidden md:table-cell                 /* Show on desktop+ */
```

---

## Full Component Examples

### Responsive Header
```tsx
<div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border-l-4 border-green-600">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
    <div className="min-w-0 flex-1">
      <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
        Page Title
      </h1>
      <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
        Subtitle or description
      </p>
    </div>
    <Link href="/" className="flex-shrink-0 text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm whitespace-nowrap">
      ← Back
    </Link>
  </div>
</div>
```

### Responsive Statistics Cards
```tsx
<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
  {stats.map((stat) => (
    <div key={stat.id} className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 border-t-4 border-blue-600">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-gray-500 text-xs md:text-sm font-medium">{stat.label}</p>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
            {stat.value}
          </p>
        </div>
        <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
      </div>
    </div>
  ))}
</div>
```

### Responsive Button Group
```tsx
<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
  <button className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-blue-600 text-white rounded-lg text-xs sm:text-sm md:text-base hover:bg-blue-700 transition flex-1 sm:flex-none">
    Primary Action
  </button>
  <button className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 border border-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm md:text-base hover:bg-gray-50 transition flex-1 sm:flex-none">
    Secondary Action
  </button>
</div>
```

### Responsive List Items
```tsx
<div className="space-y-2 sm:space-y-3 md:space-y-4">
  {items.map((item) => (
    <div key={item.id} className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 border-t-4 border-green-500 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{item.title}</h3>
          <p className="text-gray-600 text-xs sm:text-sm mt-1">{item.description}</p>
        </div>
        <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0">
          {item.status}
        </span>
      </div>
    </div>
  ))}
</div>
```

---

## Mobile Sidebar Integration (in layouts)

```tsx
// At the end of the nav element, before closing tags:
{/* Mobile Sidebar */}
<MobileSidebar 
  navLinks={navLinks} 
  userEmail={userEmail} 
  LogoutButton={LogoutButton} 
/>
```

---

## Breakpoint Decision Tree

```
Is this a major section/page container?
├─ Yes → use space-y-3 sm:space-y-4 md:space-y-6
└─ No → use gap-2 sm:gap-3 md:gap-4

Is this text?
├─ Title/H1 → text-lg sm:text-2xl md:text-3xl
├─ Subtitle → text-base sm:text-lg md:text-xl
├─ Body → text-sm sm:text-base md:text-lg
└─ Small → text-xs sm:text-sm md:text-base

Is this an icon?
├─ Small (inline) → h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8
├─ Medium → h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10
└─ Large (stats) → h-8 w-8 md:h-10 md:w-10
└─ Remember: add flex-shrink-0

Is this padding?
├─ Standard card → p-3 sm:p-4 md:p-6
├─ Compact → p-2 sm:p-3 md:p-4
└─ Large → p-6 sm:p-8 md:p-12

Is this a grid layout?
├─ 2-column → grid-cols-2
├─ 1-col mobile → grid-cols-1 sm:grid-cols-2
├─ 4-column desktop → lg:grid-cols-4
└─ Add gap → gap-2 sm:gap-3 md:gap-4

Is this flex layout?
├─ Stack mobile → flex-col sm:flex-row
├─ Add gaps → gap-2 sm:gap-3 md:gap-4
└─ Add alignment → items-start sm:items-center
```

---

## Testing Checklist

For every component/page:
- [ ] Mobile (320px): 2-col grids, proper text size, no overflow
- [ ] Mobile (375px): Same checks, buttons tappable
- [ ] Tablet (768px): 2-4 col grids, proper spacing
- [ ] Desktop (1024px): Full layout, all features visible
- [ ] Desktop (1440px): Proper spacing, no awkward gaps
- [ ] Touch targets minimum 44x44px
- [ ] Text readable at all sizes
- [ ] No horizontal scrolling
- [ ] Icons properly sized
- [ ] Forms responsive
- [ ] Navigation works at all sizes

---

## Common Gotchas

### ❌ DON'T
```tailwind
/* Fixed widths */
w-500px
w-fixed

/* Single spacing values */
p-4
gap-3

/* Non-responsive grids */
grid-cols-4

/* Large padding on mobile */
p-8 md:p-4

/* Too-small tap targets */
h-4 w-4
```

### ✅ DO
```tailwind
/* Responsive widths */
w-full
max-w-2xl

/* Responsive spacing */
p-3 sm:p-4 md:p-6
gap-2 sm:gap-3 md:gap-4

/* Responsive grids */
grid-cols-2 md:grid-cols-4

/* Mobile-first sizing */
p-3 md:p-6

/* Proper tap targets */
h-10 w-10
```

---

## Utility Classes Quick Lookup

| Purpose | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Padding | p-3 | sm:p-4 | md:p-6 |
| Gaps | gap-2 | sm:gap-3 | md:gap-4 |
| Text Header | text-lg | sm:text-2xl | md:text-3xl |
| Icons | h-5 w-5 | sm:h-6 sm:w-6 | md:h-8 md:w-8 |
| Grid Cols | grid-cols-2 | (same) | lg:grid-cols-4 |
| Flex Dir | flex-col | sm:flex-row | (same) |
| Margins | mt-2 | sm:mt-3 | md:mt-4 |

---

## Implementation Order

When building responsive pages:
1. Build desktop layout first (easier to see full structure)
2. Add responsive classes working down through breakpoints
3. Test on mobile (most important)
4. Verify tablet layout
5. Check desktop one more time
6. Test touch interactions on actual devices if possible

---

*Last Updated: January 18, 2026*
*Applies to: All RoyaltyMeds Portal Pages*
