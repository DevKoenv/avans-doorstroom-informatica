# Entity Relationship Diagram (ERD)

## Visual Schema Overview

```
┌─────────────────────┐
│       User          │
│─────────────────────│
│ id (PK)             │
│ name                │
│ email (unique)      │
│ emailVerified       │
│ password            │
│ ...auth fields      │
└──────────┬──────────┘
           │
           │ 1:N
           │
           ▼
┌─────────────────────┐         ┌─────────────────────┐
│    TeamMember       │    N:1  │        Team         │
│─────────────────────│◄────────┤─────────────────────│
│ id (PK)             │         │ id (PK)             │
│ userId (FK)         │         │ name                │
│ teamId (FK)         │         │ description         │
│ role (enum)         │         │ slug (unique)       │
│  - OWNER            │         │ createdAt           │
│  - ADMIN            │         │ updatedAt           │
│  - MEMBER           │         └──────────┬──────────┘
└─────────────────────┘                    │
                                           │ 1:N
                                           │
                                           ▼
                                ┌─────────────────────┐
                                │    Collection       │
                                │─────────────────────│
                                │ id (PK)             │
                                │ name                │
                                │ description         │
                                │ icon                │
                                │ color               │
                                │ teamId (FK)         │
                                └──────────┬──────────┘
                                           │
                                           │ 1:N
                                           │
                                           ▼
                                ┌─────────────────────┐
                                │      Bookmark       │
                                │─────────────────────│
                                │ id (PK)             │
                                │ title               │
                                │ url                 │
                                │ description         │
                                │ favicon             │
                                │ status (enum)       │
                                │  - ACTIVE           │
                                │  - ARCHIVED         │
                                │ collectionId (FK)   │
                                └──────────┬──────────┘
                                           │
                                           │ N:M
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                              │
                    ▼                                              ▼
         ┌─────────────────────┐                        ┌─────────────────────┐
         │   BookmarkTag       │                        │         Tag         │
         │─────────────────────│                        │─────────────────────│
         │ bookmarkId (FK, PK) │◄───────────────────────┤ id (PK)             │
         │ tagId (FK, PK)      │                        │ name (unique)       │
         │ createdAt           │                        │ color               │
         └─────────────────────┘                        └─────────────────────┘
```

## Cardinality Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| User → TeamMember | 1:N | One user can be member of multiple teams |
| Team → TeamMember | 1:N | One team has multiple members |
| Team → Collection | 1:N | One team has multiple collections |
| Collection → Bookmark | 1:N | One collection contains multiple bookmarks |
| Bookmark ↔ Tag | N:M | Bookmarks can have multiple tags, tags can be on multiple bookmarks |

## Key Design Features

### 1. Team Isolation Architecture
```
User
  └─> TeamMember (with role)
        └─> Team
              └─> Collection
                    └─> Bookmark
                          └─> Tags (N:M)
```

### 2. Many-to-Many Relationship (Required by Assignment)
The `BookmarkTag` junction table creates a many-to-many relationship between `Bookmark` and `Tag`:
- One bookmark can have multiple tags
- One tag can be applied to multiple bookmarks
- The junction table allows querying in both directions efficiently

### 3. Access Control Flow
```
User logs in
  → Select Team (via TeamMember)
    → View Collections (filtered by teamId)
      → View Bookmarks (filtered by collectionId)
        → Display Tags (via BookmarkTag)
```

### 4. Data Hierarchy
```
Organizational Level: Team
  ├─ Container Level: Collection
  │    └─ Content Level: Bookmark
  │         └─ Metadata Level: Tag (shared)
  └─ Access Control: TeamMember (with role)
```

## Example Data Flow

### Creating a Bookmark
1. User is member of "Development Team"
2. Selects "Frontend Resources" collection
3. Creates bookmark: "Vue.js Docs"
4. Adds tags: "Vue.js", "Documentation", "Tutorial"
5. System creates:
   - 1 `Bookmark` record (linked to collection)
   - 3 `BookmarkTag` records (linking bookmark to tags)

### Querying Bookmarks by Tag
```sql
-- Find all bookmarks with tag "Vue.js" in "Development Team"
SELECT b.*
FROM Bookmark b
JOIN BookmarkTag bt ON b.id = bt.bookmarkId
JOIN Tag t ON bt.tagId = t.id
JOIN Collection c ON b.collectionId = c.id
JOIN Team tm ON c.teamId = tm.id
WHERE t.name = 'Vue.js'
  AND tm.slug = 'dev-team'
  AND b.status = 'ACTIVE'
```

## Schema Statistics (After Seed)

| Entity | Count | Notes |
|--------|-------|-------|
| Users | 2 | John Doe, Jane Smith |
| Teams | 2 | Development Team, Marketing Team |
| TeamMembers | 3 | 2 in Dev, 1 in Marketing (with roles) |
| Collections | 3 | Frontend, Backend, Design Tools |
| Bookmarks | 7 | 6 active, 1 archived |
| Tags | 7 | Vue.js, React, TypeScript, etc. |
| BookmarkTag | 12 | Various bookmark-tag associations |

## Normalization Level

The schema is in **3rd Normal Form (3NF)**:
- ✅ No repeating groups (1NF)
- ✅ All non-key attributes depend on primary key (2NF)
- ✅ No transitive dependencies (3NF)

## Indexing Strategy

### Primary Indexes (Automatic)
- All primary keys (id fields)
- Unique constraints (email, slug, tag name)

### Secondary Indexes (Explicit)
- `Team.slug` - Fast URL routing
- `TeamMember.userId` - User's teams lookup
- `TeamMember.teamId` - Team's members lookup
- `Collection.teamId` - Team's collections filter
- `Bookmark.collectionId` - Collection's bookmarks filter
- `Bookmark.status` - Active/archived filtering
- `Tag.name` - Tag search and autocomplete
- `BookmarkTag.bookmarkId` - Bookmark's tags
- `BookmarkTag.tagId` - Tag's bookmarks

## Data Integrity Rules

### Cascade Deletes
- Delete Team → Deletes TeamMembers, Collections (and their Bookmarks)
- Delete Collection → Deletes Bookmarks (and their BookmarkTags)
- Delete Bookmark → Deletes BookmarkTags
- Delete Tag → Deletes BookmarkTags
- Delete User → Deletes TeamMembers

### Unique Constraints
- User email (authentication)
- Team slug (URL routing)
- Tag name (global consistency)
- TeamMember (teamId, userId) - No duplicate memberships

### Default Values
- Collection icon: "folder"
- Collection color: "#6366f1" (indigo)
- Tag color: "#6366f1"
- Bookmark status: ACTIVE
- TeamMember role: MEMBER
- All createdAt: now()

## Migration Naming Convention

When creating the migration, use:
```bash
npm run db:migrate
# Name: "add_bookmark_manager_models"
```

This clearly identifies the feature scope in migration history.
