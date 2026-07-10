---
name: ProtectedRoute redirect pattern (React + wouter)
description: How to safely redirect unauthenticated users without React setState-during-render warnings
---

**Rule:** Never call `setLocation()` (or any state setter) directly in the render body of a component. React will warn "Cannot update a component while rendering a different component".

**Correct pattern for ProtectedRoute:**
```tsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  if (loading) return <Spinner />;
  if (!user) return null;   // useEffect will redirect
  return <>{children}</>;
}
```

**Why:** Calling `setLocation` during render triggers the React "setState in render" warning and can cause double-render loops. `useEffect` fires after the render completes, avoiding the issue.

**How to apply:** Any guard component (ProtectedRoute, AdminRoute, etc.) that needs to redirect based on auth state must use this `useEffect` pattern.
