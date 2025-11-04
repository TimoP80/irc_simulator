# Personality Template

This document outlines the structure for creating new personality templates for the IRC simulator.

## `PersonalityTemplate` Interface

A personality template is an object that conforms to the `PersonalityTemplate` interface.

```typescript
export interface PersonalityTemplate {
  id: string;
  name: string;
  description: string;
  baseUser: Partial<User>;
}
```

-   `id`: A unique identifier for the personality (e.g., 'chatterbox').
-   `name`: The display name for the personality.
-   `description`: A brief description of the personality.
-   `baseUser`: An object containing the core user traits.

## `baseUser` Object Structure

The `baseUser` object is a partial representation of the `User` type.

### `personality`

A string describing the user's core personality traits.

**Example:**
`"Extremely talkative and social, always has something to say and loves keeping conversations active"`

### `languageSkills`

An object defining the user's language abilities.

```typescript
languageSkills: {
  fluency: 'beginner' | 'intermediate' | 'advanced' | 'native';
  languages: string[];
  accent: string;
}
```

-   `fluency`: The user's proficiency level.
-   `languages`: An array of languages the user speaks.
-   `accent`: The user's accent (if any).

**Example:**
```json
{
  "fluency": "native",
  "languages": ["English", "Spanish"],
  "accent": "British"
}
```

### `writingStyle`

An object defining the user's writing style.

```typescript
writingStyle: {
  formality: 'ultra_casual' | 'very_casual' | 'casual' | 'semi_formal' | 'formal' | 'very_formal' | 'ultra_formal';
  verbosity: 'terse' | 'brief' | 'moderate' | 'detailed' | 'verbose' | 'extremely_verbose' | 'novel_length';
  humor: 'none' | 'dry' | 'mild' | 'moderate' | 'witty' | 'sarcastic' | 'absurd' | 'chaotic' | 'unhinged';
  emojiUsage: 'none' | 'rare' | 'occasional' | 'moderate' | 'frequent' | 'excessive' | 'emoji_only';
  punctuation: 'minimal' | 'standard' | 'expressive' | 'dramatic' | 'chaotic' | 'artistic' | 'experimental';
}
```

-   `formality`: The level of formality in the user's writing.
-   `verbosity`: The length and detail of the user's messages.
-   `humor`: The type of humor the user employs.
-   `emojiUsage`: The frequency of emoji use.
-   `punctuation`: The style of punctuation used.

**Example:**
```json
{
  "formality": "very_casual",
  "verbosity": "verbose",
  "humor": "witty",
  "emojiUsage": "frequent",
  "punctuation": "dramatic"
}
```

## Trait Pools for Random Generation

The following pools are used for generating random users.

### Personalities
-   curious and inquisitive
-   sarcastic and witty
-   ... (and more)

### Interests
-   technology and programming
-   gaming and entertainment
-   ... (and more)

### Languages
-   English
-   Spanish
-   ... (and more)

### Accents
-   British
-   American Southern
-   ... (and more)

## Complete Example

Here is a complete example of a personality template:

```json
{
  "id": "chatterbox",
  "name": "Chatterbox",
  "description": "A user who is extremely talkative and social.",
  "baseUser": {
    "personality": "Extremely talkative and social, always has something to say and loves keeping conversations active",
    "languageSkills": {
      "fluency": "native",
      "languages": ["English"],
      "accent": ""
    },
    "writingStyle": {
      "formality": "very_casual",
      "verbosity": "verbose",
      "humor": "witty",
      "emojiUsage": "frequent",
      "punctuation": "dramatic"
    }
  }
}