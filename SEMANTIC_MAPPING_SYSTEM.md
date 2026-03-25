# Semantic Field Mapping System ✨

## Your Insight
> "We shouldn't blindly map things. What is what is important. The Architect should intelligently understand what fields mean and map them correctly."

**Problem with exact name matching:**
```
Node1 outputs: { argument_1, argument_2 }
Node2 needs: { parameter_1, parameter_2 }
Old behavior: ❌ FAIL - Names don't match exactly
```

**Solution with semantic matching:**
```
Node1 outputs: { argument_1 (description: "recipient email") }
Node2 needs: { parameter_1 (description: "email recipient") }
New behavior: ✅ PASS - Descriptions match semantically
Generated mapping: parameter_1 = {{ input.argument_1 }}
```

---

## What Was Changed

### 1. Worker Validation - More Permissive ✅

**Old Logic**: Required exact field name matches
```typescript
const hasInput = input.key in incomingData;
if (!hasInput) FAIL;
```

**New Logic**: Allows semantic mapping via templates
```typescript
// Input is satisfied if:
// - Exact match in config, OR
// - Exact match in upstream data, OR
// - Has upstream data available for Architect to semantically map

const hasExactMatchInConfig = input.key in config;
const hasExactMatchInUpstream = input.key in incomingData;
const canBeMappedFromUpstream = upstreamDataAvailable && !hasExactMatchInConfig;

const isSatisfied = hasExactMatchInConfig ||
                   hasExactMatchInUpstream ||
                   canBeMappedFromUpstream;
```

**Effect**:
- Validation passes if ANY upstream data is available
- Architect has freedom to map fields semantically
- No "missing inputs" errors for unmapped fields

### 2. Architect Prompt - Semantic Mapping Instructions ✅

Added new section: **INTELLIGENT FIELD MAPPING (SEMANTIC MATCHING)**

**The Algorithm:**
```
1. Look at UPSTREAM node's outputSchema (what it produces)
2. Look at DOWNSTREAM node's requiredInputs (what it needs)
3. Read the DESCRIPTIONS to understand what each field MEANS
4. Match semantically based on meaning, not name
5. Generate template reference: config.field = "{{ input.sourceField }}"
```

**Example:**
```typescript
// Upstream (Chat Trigger) outputs
outputSchema: [
  { key: 'message', type: 'string', description: 'The user message' }
]

// Downstream (Agent) needs
requiredInputs: [
  { key: 'userMessage', type: 'string', description: 'The prompt/objective for agent' }
]

// Architect semantic match
// Description match: Both describe what the user is asking for
// Generated config:
{
  userMessage: "{{ input.message }}"
}
```

### 3. Field Similarity Mapping Table

The Architect uses descriptions to match fields:

| Upstream Field | Upstream Meaning | Downstream Field | Match Strategy |
|---|---|---|---|
| `email_address` | Recipient email | `to` | Recipient → To ✅ |
| `full_name` | User name | `subject` | Can use in subject ✅ |
| `body`/`content` | Message text | `message` | Message content ✅ |
| `sender` | From email | `from` | Sender → From ✅ |
| `timestamp`/`date` | Time | `created_at` | Time → Created at ✅ |
| `title`/`subject` | Heading | `subject` | Title → Subject ✅ |

---

## How It Works End-to-End

### Scenario: Chat → Code → Gmail

**Workflow:**
```
[Chat Trigger]  → [Code Node] → [Gmail Node]
  outputs         transforms      needs
```

**Step 1: Chat Trigger executes**
```
Outputs: {
  message: "Send email to john@example.com",
  input: "Send email to john@example.com",
  source: "chat",
  timestamp: "2026-03-25T..."
}
```

**Step 2: Code Node (receives Chat output)**
```
Config: {
  code: "return { to: input.message.match(/[^@]+@[^@]+/)[0], body: 'Hello' }"
}
Output: {
  to: "john@example.com",
  body: "Hello"
}
```

**Step 3: Gmail Node validation**
```
Required inputs: operation, to, subject, body
Available from Code: to, body
Available in config: operation

Worker validation:
✅ operation - exists in config
✅ to - exists in incoming data (from Code)
⚠️  subject - NOT in config, NOT in incoming data
    BUT: incoming data exists, so semantic mapping is possible

Architect-generated mapping:
{
  operation: "send",
  to: "{{ input.to }}",              // ← Exact match from Code
  subject: "From Chat",              // ← Static config
  body: "{{ input.body }}"           // ← Exact match from Code
}
```

---

## Validation Flow Comparison

### Old Behavior
```
Chat.message → Agent.userMessage
❌ FAIL: "userMessage not found in incoming data"
(Even though message could map to userMessage semantically)
```

### New Behavior
```
Chat.message → Agent.userMessage
✅ PASS: "Incoming data exists, Architect can map"
Architect generates: { userMessage: "{{ input.message }}" }
```

---

## When Validation STILL Fails

Validation will fail if:
1. No config value set AND
2. No upstream data available at all

Example:
```
GitHub node needs: operation, owner, repo
Available: NOTHING (no upstream node, no config)
Result: ❌ FAIL - Cannot satisfy these inputs
Message: "Cannot satisfy required inputs: operation, owner, repo"
```

**Solution**: Architect fills config from prompt parsing
```
GitHub config: { operation: "search", owner: "Mehul0161" }
Now validation passes ✅
```

---

## Architect's Job

The Architect now has clear responsibility:

### 1. Extract Structural Config from Prompt
- Parse: "Create issue in microsoft/vscode"
- Fill: `{ operation: "create", owner: "microsoft", repo: "vscode" }`

### 2. Generate Semantic Field Mappings
- Understand upstream outputs (read descriptions)
- Understand downstream requirements (read descriptions)
- Match semantically and generate templates

### 3. Handle Mismatched Field Names
```
Instead of: "email_address doesn't match to, so fail"
Do: "Both describe recipient email, so map: to = {{ input.email_address }}"
```

---

## Benefits of This Approach

✅ **Flexible**: Node outputs don't need exact name matches
✅ **Intelligent**: Architect understands field semantics via descriptions
✅ **Automatic**: Template references generated intelligently
✅ **Forgiving**: Validation doesn't fail on name mismatches
✅ **Powerful**: Enables complex data transformations

---

## Example Workflows Now Possible

### 1. Custom Data Transform
```
[Any Node] (outputs: x, y, z)
  ↓
[Code Node] (custom transform)
  ↓
[Any Other Node] (needs: a, b, c)

Mapping: Architect maps custom fields semantically
```

### 2. Different Platforms
```
[Chat Trigger] (outputs: message)
  ↓
[Agent] (needs: userMessage)

Mapping: message → userMessage (semantic match)
```

### 3. Complex Workflows
```
[Webhook] → [Code] → [GitHub] → [Slack]

Each step: Architect generates semantic mappings
All based on field descriptions and meaning
```

---

## Implementation Summary

| Component | Change | Purpose |
|---|---|---|
| Worker Validation | More permissive | Allow semantic mapping |
| Architect Prompt | Semantic matching section | Guide intelligent mapping |
| Field Matching | Description-based | Match by meaning, not name |
| Template Generation | Automatic | `{{ input.field }}` created by Architect |
| Error Messages | Better diagnostics | Show available fields when validation fails |

---

## Next Steps

1. **Test with complex workflows**
   - Verify semantic matching works
   - Check template generation

2. **Monitor Architect output**
   - Verify correct field mappings
   - Adjust descriptions if mappings are wrong

3. **Enhance descriptions**
   - More detailed outputSchema descriptions
   - Clearer requiredInputs descriptions
   - Helps Architect make better matches

4. **Add more field similarity patterns**
   - Document common mappings
   - Improve semantic matching accuracy

---

## Summary

The system now:
✅ **Validates flexibly** - Doesn't require exact field name matches
✅ **Maps intelligently** - Uses field descriptions to understand meaning
✅ **Generates templates** - Creates `{{ input.field }}` references automatically
✅ **Enables complex flows** - Supports workflows with mismatched field names

This is the foundation for truly intelligent workflow generation! 🚀
