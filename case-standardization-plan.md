# Case Data Standardization Plan

## Current Case Analysis

### Evidence Distribution by Visibility

| Case | Total Evidence | Hidden (true) | Visible (false) | Timeline Suitable |
|------|----------------|---------------|-----------------|-------------------|
| WongTimeline | 21 | 0 | 21 | ~15-18 |
| beaumontTimeline2 | 20 | 7 | 13 | ~10-12 |
| midnightOilTimeline2 | 13 | 0 | 13 | ~10-12 |

### Timeline Data Quality

**WongTimeline.json:**
- ✅ All evidence has timeline data
- ✅ Good mix of `timeHappened` and `timeDiscovered`
- ✅ Has anchor points (`timeHappenedAnchor: true`)
- ⚠️ No hidden evidence (all visible - may be too many for puzzle)

**beaumontTimeline2.json:**
- ✅ Good balance of visible/hidden evidence
- ✅ Has anchor points
- ✅ Hidden evidence provides advanced difficulty options
- ✅ Well-structured timeline progression

**midnightOilTimeline2.json:**
- ✅ Compact evidence set (good for puzzle)
- ✅ Clear timeline progression
- ✅ Has anchor points
- ⚠️ No hidden evidence (limits difficulty scaling)

## Standardization Requirements

### 1. Evidence Selection for Timeline Puzzle

**Target: 8-12 evidence pieces per difficulty level**

#### Easy Mode (6-8 pieces)
- Select evidence with clear time gaps (>1 hour apart)
- Include 2-3 anchor points
- Focus on major events only

#### Medium Mode (8-10 pieces)
- Include evidence with moderate time gaps (30min-1hour)
- Include 3-4 anchor points
- Mix of event types

#### Hard Mode (10-12 pieces)
- Include evidence with close timestamps (<30min apart)
- Include 4-5 anchor points
- Complex overlapping events

### 2. Required Data Fields

All evidence must have:
```json
{
  "id": "string",
  "name": "string", 
  "description": "string",
  "type": "string",
  "isHidden": boolean,
  "timeHappened": "ISO8601" | null,
  "timeDiscovered": "ISO8601" | null,
  "timeHappenedDescription": "string",
  "timeDiscoveredDescription": "string",
  "timeHappenedAnchor": boolean,
  "timeDiscoveredAnchor": boolean
}
```

### 3. Timeline Sorting Logic

**Primary Sort Key:**
1. Use `timeHappened` if available
2. Fall back to `timeDiscovered` if `timeHappened` is null
3. Evidence without either timestamp goes to end

**Anchor Evidence:**
- Evidence with `timeHappenedAnchor: true` are critical checkpoints
- Must be correctly positioned for puzzle success
- Should represent key events (murder, discovery, etc.)

### 4. Case-Specific Recommendations

#### WongTimeline.json
**Suggested Evidence Selection (Medium Difficulty):**
1. `"1752270114946"` - Time of Death (ANCHOR)
2. `"7"` - James Lee Unemployment (Jan 20)
3. `"4"` - Eviction Notice (Feb 1)
4. `"9"` - Audio: Sophia and Mei-Ling Wong (Feb 10)
5. `"5"` - Email: Emily's Termination (Feb 15 10:30am)
6. `"6"` - SMS: Sophia to Mei-Ling (Feb 15 11:15am)
7. `"18"` - CCTV: Sophia 8:00pm
8. `"19"` - CCTV: James 9:00pm
9. `"3"` - CCTV: Deleted 10:00pm
10. `"1752270258011"` - Body Discovered (ANCHOR)

#### beaumontTimeline2.json
**Already well-structured** - use visible evidence for main puzzle, hidden for advanced

#### midnightOilTimeline2.json
**Suggested Evidence Selection (Medium Difficulty):**
1. `"doc-1"` - Physician's Visit (4:00pm)
2. `"evt-1"` - Last Email Sent (9:30pm - ANCHOR)
3. `"aud-1"` - Voicemail from Assistant (9:40pm)
4. `"dig-1"` - Security Log: Front Door 9:55pm
5. `"test-2"` - Assistant Leaving (10:11pm)
6. `"evt-2"` - Power Outage (10:00pm - ANCHOR)
7. `"phy-1"` - Broken Wine Glass (10:55pm)
8. `"phy-2"` - Overturned Bookshelf (11:01pm)
9. `"test-3"` - Neighbor's Testimony (11:01pm)
10. `"dig-2"` - Security Log: Front Door 11:31pm
11. `"sms-1"` - Text from Business Partner (11:45pm)
12. `"evt-3"` - Body Discovered (ANCHOR)

## Implementation Strategy

### Phase 1: Data Validation
1. Create schema validation for all case files
2. Identify missing required fields
3. Standardize timestamp formats

### Phase 2: Evidence Curation
1. Create difficulty-based evidence selection
2. Mark appropriate anchor points
3. Ensure chronological spread

### Phase 3: Testing
1. Validate timeline ordering for each case
2. Test difficulty progression
3. Ensure mobile-friendly evidence descriptions

## Quality Assurance Checklist

### Per Case File:
- [ ] All evidence has valid timestamps
- [ ] Anchor points are strategically placed
- [ ] Evidence descriptions are mobile-friendly (under 100 chars)
- [ ] Timeline spans reasonable time period
- [ ] Difficulty levels have appropriate evidence counts
- [ ] No duplicate timestamps (or handled gracefully)

### Cross-Case Consistency:
- [ ] Similar evidence types use consistent naming
- [ ] Color schemes are consistent
- [ ] Difficulty scaling is comparable
- [ ] Game mechanics work across all cases

## Mobile Optimization Notes

### Evidence Card Content:
- **Name**: Max 30 characters for mobile display
- **Description**: Max 80 characters for card preview
- **Time Display**: Show relative time ("2 hours earlier") vs absolute
- **Visual Indicators**: Use colors/icons for evidence types

### Timeline Interface:
- **Vertical Layout**: Stack evidence cards vertically for portrait mode
- **Touch Targets**: Minimum 44px height for drag handles
- **Visual Feedback**: Clear drop zones and drag previews
- **Accessibility**: Screen reader support for evidence content

This standardization ensures all three cases provide engaging, balanced timeline puzzles suitable for mobile gameplay.