# Dependency Fix Todo List

## Immediate Actions
1. ✅ Add prebuild script to package.json
2. 🔄 Clean node_modules and package-lock.json
3. 🔄 Install dependencies with legacy peer resolution
4. 🔄 Run prebuild to identify remaining issues

## Expected Outcomes
- Dependencies installed without peer dependency conflicts
- Prebuild completes successfully or provides clearer error messages
- Plugin/dependency errors resolved or better identified for next steps

## Notes
- Using `--legacy-peer-deps` flag to handle peer dependency conflicts
- Clean install ensures no cached dependency issues
- Prebuild will validate all native dependencies and plugins