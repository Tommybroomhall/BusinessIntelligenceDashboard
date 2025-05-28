# Codebase Structure Issues and Fix Plan

This document outlines the structural issues identified in the codebase and provides a plan to address them. Each issue is categorized and includes specific tasks to resolve it.

## 1. Server Configuration Issues

### Issues:
- Multiple server entry points (`server/index.ts` and `server/server.js`)
- Duplicate package.json files (root and server directory)

### Tasks:
- [ ] Remove `server/server.js` and use `server/index.ts` as the single entry point
- [ ] Merge dependencies from `server/package.json` into the root `package.json`
- [ ] Update any scripts that reference `server/server.js` to use `server/index.ts`
- [ ] Ensure all server imports are consistent with the TypeScript structure

## 2. Database Access Issues

### Issues:
- Mixed ORM usage (Mongoose and Drizzle)
- Inconsistent database access patterns
- Duplicate schema definitions

### Tasks:
- [x] Standardize on Mongoose for MongoDB access
- [x] Remove Drizzle ORM dependencies and schema definitions in `shared/schema.ts`
- [x] Update `server/storage.ts` to use Mongoose models instead of Drizzle
- [x] Create a shared types system in `shared/types.ts` for client and server
- [x] Update any code that references Drizzle schemas to use Mongoose models

## 3. Configuration File Duplication

### Issues:
- Duplicate Vite configuration files (`vite.config.ts` and `vite.config.mjs`)
- Duplicate PostCSS configuration files (`postcss.config.js` and `postcss.config.mjs`)

### Tasks:
- [ ] Keep `vite.config.mjs` and remove `vite.config.ts`
- [ ] Keep `postcss.config.mjs` and remove `postcss.config.js`
- [ ] Update any imports or references to the removed files
- [ ] Ensure build scripts use the correct configuration files

## 4. API Structure Issues

### Issues:
- Inconsistent API route organization
- Mix of monolithic and modular route definitions
- Incomplete route modularization

### Tasks:
- [x] Create a consistent structure for API routes in `server/routes/`
- [x] Move all route definitions from `server/routes.ts` to modular files
- [x] Create separate route files for each resource (users, products, customers, etc.)
- [x] Update `server/routes.ts` to import and register these modular routes
- [x] Ensure proper middleware usage across all routes

## 5. Shared Types and Schema Issues

### Issues:
- Duplicate type definitions between client and server
- Missing shared type system
- Inconsistent type usage

### Tasks:
- [x] Create a proper shared type system in `shared/types.ts`
- [x] Move common types from client and server to this shared location
- [x] Update imports to use the shared types
- [x] Ensure consistent type naming and structure
- [x] Remove duplicate type definitions from client code

## 6. Script Organization Issues

### Issues:
- Unorganized scripts directory
- Overlapping script functionality
- Lack of clear categorization

### Tasks:
- [x] Create subdirectories in the scripts folder:
  - [x] `scripts/db/` for database scripts
  - [x] `scripts/test/` for test scripts
  - [x] `scripts/utils/` for utility scripts
- [x] Move scripts to appropriate subdirectories
- [x] Update any references or imports to the moved scripts
- [x] Update package.json script commands to reference the new locations

## 7. Client Code Organization

### Issues:
- Inconsistent API client structure
- Mix of centralized and modular approaches

### Tasks:
- [ ] Standardize the client API structure
- [ ] Organize client API modules consistently
- [ ] Ensure proper type sharing between client and server
- [ ] Update imports and references to maintain consistency

## Implementation Plan

### Phase 1: Documentation and Planning
- [x] Document all issues and create this task list
- [ ] Create a backup of the current codebase
- [ ] Establish a testing strategy to verify changes

### Phase 2: Server and Database Standardization
- [ ] Fix server configuration issues
- [x] Standardize database access
- [ ] Remove duplicate configuration files

### Phase 3: API and Type System Improvements
- [x] Reorganize API structure
- [x] Implement shared type system
- [x] Update client code to use shared types

### Phase 4: Script Organization and Final Cleanup
- [x] Reorganize scripts directory
- [x] Update package.json scripts
- [x] Complete API route modularization (orders routes)
- [x] Remove redundant files and code
- [ ] Final testing and verification

## Notes

- Make incremental changes and test after each significant modification
- Maintain backward compatibility where possible
- Document any breaking changes that require updates to development workflows
