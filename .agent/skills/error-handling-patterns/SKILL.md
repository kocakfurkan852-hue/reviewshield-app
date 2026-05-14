---
name: error-handling-patterns
description: Master error handling patterns across languages including exceptions, Result types, error propagation, and graceful degradation to build resilient applications. Use when implementing error handling, designing APIs, or improving application reliability.
---

# Error Handling Patterns

Build resilient applications with robust error handling strategies that gracefully handle failures and provide excellent debugging experiences.

## When to use this skill
- Implementing error handling in new features.
- Designing error-resilient APIs.
- Debugging production issues or improving reliability.
- Creating better error messages for users and developers.
- Implementing retry, circuit breaker, or graceful degradation patterns.

## Workflow
1.  **Categorize Errors**: Determine if the error is recoverable (e.g., network timeout) or unrecoverable (e.g., OOM, logic bug).
2.  **Select Strategy**: Choose between Exceptions (for unexpected conditions) or Result types (for expected failures).
3.  **Implement Cleanup**: Ensure resources are closed using `finally`, context managers, or `defer`.
4.  **Preserve Context**: Include stack traces, metadata, and meaningful messages.
5.  **Validation**: Test the error paths and ensure appropriate logging levels.

## Instructions

### 1. Python Patterns
Use custom exception hierarchies and context managers for clean resource handling.
```python
class ApplicationError(Exception):
    def __init__(self, message: str, code: str = None, details: dict = None):
        super().__init__(message)
        self.code = code
        self.details = details or {}

# Use @contextmanager for cleanup
@contextmanager
def db_session(session):
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
```

### 2. TypeScript/JavaScript Patterns
Prefer custom error classes and the Result type pattern for explicit handling.
```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

class ApplicationError extends Error {
  constructor(public message: string, public code: string, public statusCode: number = 500) {
    super(message);
  }
}
```

### 3. Universal Patterns
- **Circuit Breaker**: Prevent cascading failures by rejecting requests when a service is failing.
- **Error Aggregation**: Collect multiple validation errors instead of failing on the first one.
- **Graceful Degradation**: Provide fallbacks (e.g., fetch from cache if DB is down).

## Best Practices
- **Fail Fast**: Validate input early.
- **Don't Swallow Errors**: Log or re-throw; never use empty catch blocks.
- **Log Appropriately**: Use `error` for real issues and `warn`/`info` for expected failures.
- **Clean Up**: Always use `finally` or equivalent to prevent resource leaks.

---

## Instructions for use
1. Trigger this skill when designing error handling or debugging: *"Help me implement robust error handling for this API using error-handling-patterns."*
