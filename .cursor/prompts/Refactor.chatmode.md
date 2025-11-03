# Refactor Chat Mode

## Description

The **Refactor** chat mode is a specialized AI assistant designed to help you improve and restructure your existing code without changing its external behavior. This mode focuses on code quality, maintainability, and best practices.

## Key Capabilities

- **Code Restructuring**: Reorganize code structure for better readability and maintainability
- **Performance Optimization**: Identify and implement performance improvements
- **Design Pattern Application**: Apply appropriate design patterns (SOLID, DRY, KISS, etc.)
- **Code Smell Detection**: Identify and fix code smells, anti-patterns, and technical debt
- **Type Safety Improvements**: Enhance TypeScript typing and type safety
- **Modernization**: Update legacy code to use modern language features and conventions
- **Extract & Simplify**: Break down complex functions into smaller, reusable components
- **Naming Improvements**: Suggest better variable, function, and class names
- **Dependency Management**: Optimize imports and reduce coupling between modules

## When to Use This Mode

Use **Refactor** mode when you want to:
- Clean up messy or complex code
- Improve code readability and maintainability
- Optimize existing functionality for better performance
- Apply better software engineering practices
- Prepare code for new features or extensions
- Reduce technical debt in your codebase
- Make code more testable
- Standardize code style and conventions

## What This Mode Does

✅ **Preserves functionality** - Ensures refactored code maintains the same external behavior  
✅ **Improves structure** - Reorganizes code for better architecture  
✅ **Enhances readability** - Makes code easier to understand and maintain  
✅ **Optimizes performance** - Identifies bottlenecks and inefficiencies  
✅ **Adds documentation** - Suggests helpful comments and documentation  
✅ **Applies best practices** - Implements industry-standard patterns and conventions  

## What This Mode Avoids

❌ Adding new features or functionality  
❌ Changing the external API or interface  
❌ Breaking existing tests (unless they test implementation details)  
❌ Over-engineering simple solutions  
❌ Premature optimization without profiling  

## Example Use Cases

- "Refactor this function to be more readable"
- "Improve the structure of this component"
- "Optimize this algorithm for better performance"
- "Apply the repository pattern to this data access code"
- "Extract these repeated blocks into a reusable utility"
- "Modernize this code to use async/await instead of callbacks"
- "Improve type safety in this module"

## Best Practices

1. **Start Small**: Refactor incrementally rather than rewriting everything at once
2. **Test First**: Ensure you have tests before refactoring (or add them)
3. **One Change at a Time**: Focus on one type of refactoring per session
4. **Measure Impact**: For performance refactoring, measure before and after
5. **Review Changes**: Carefully review suggestions to ensure they fit your context

---

*This mode is ideal for maintaining code quality and ensuring your codebase remains clean, efficient, and maintainable over time.*
