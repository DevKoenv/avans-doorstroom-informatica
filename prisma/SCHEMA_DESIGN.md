# Database Schema - Team-based Bookmark Manager

## Overview

This document describes the database schema for the Team-based Bookmark Manager application. The schema is designed to support team collaboration, organized bookmark collections, and flexible tagging.

## Entity Relationship Diagram (ERD)

### Entities

1. **User** - Application users (authentication)
2. **Team** - Groups of users working together
3. **TeamMember** - Junction table for User-Team relationship with roles
4. **Collection** - Organized folders of bookmarks within a team
5. **Bookmark** - Individual saved web links
6. **Tag** - Labels for categorizing bookmarks
7. **BookmarkTag** - Many-to-many relationship between Bookmarks and Tags

### Relationships

```
User 1:N TeamMember N:1 Team
Team 1:N Collection
Collection 1:N Bookmark
Bookmark N:M Tag (through BookmarkTag)
```

## Data Model Details

### User
- Existing authentication model
- Extended with `teamMemberships` relation

### Team
| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| name | String | Team display name |
| description | String? | Optional team description |
| slug | String | Unique URL-friendly identifier |
| members | TeamMember[] | Team members |
| collections | Collection[] | Team's bookmark collections |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Indexes:**
- `slug` (unique, for URL routing)

### TeamMember (Junction Table)
| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| teamId | Int | Foreign key to Team |
| userId | Int | Foreign key to User |
| role | TeamMemberRole | User's role in the team |
| createdAt | DateTime | Membership creation date |
| updatedAt | DateTime | Last update timestamp |

**Enum: TeamMemberRole**
- `OWNER` - Can delete team, manage all members
- `ADMIN` - Can manage collections and members
- `MEMBER` - Can view and create bookmarks

**Constraints:**
- Unique constraint on `(teamId, userId)` - users can't join same team twice
- Cascade delete when team or user is deleted

**Indexes:**
- `userId` (for finding user's teams)
- `teamId` (for finding team members)

### Collection
| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| name | String | Collection display name |
| description | String? | Optional description |
| icon | String? | Icon identifier (default: "folder") |
| color | String? | Hex color code (default: "#6366f1") |
| teamId | Int | Foreign key to Team |
| bookmarks | Bookmark[] | Collection's bookmarks |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Constraints:**
- Cascade delete when team is deleted

**Indexes:**
- `teamId` (for filtering collections by team)

### Bookmark
| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| title | String | Bookmark title |
| url | String | Target URL |
| description | String? | Optional notes/description |
| favicon | String? | Cached favicon URL |
| status | BookmarkStatus | Active or archived |
| collectionId | Int | Foreign key to Collection |
| tags | BookmarkTag[] | Associated tags |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Enum: BookmarkStatus**
- `ACTIVE` - Normal, visible bookmark
- `ARCHIVED` - Hidden from main view but preserved

**Constraints:**
- Cascade delete when collection is deleted

**Indexes:**
- `collectionId` (for filtering by collection)
- `status` (for filtering active/archived)

### Tag
| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| name | String | Tag name (unique globally) |
| color | String? | Hex color code (default: "#6366f1") |
| bookmarks | BookmarkTag[] | Associated bookmarks |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Constraints:**
- Unique constraint on `name` (tags are global)

**Indexes:**
- `name` (for searching/filtering tags)

### BookmarkTag (Many-to-Many Junction)
| Field | Type | Description |
|-------|------|-------------|
| bookmarkId | Int | Foreign key to Bookmark |
| tagId | Int | Foreign key to Tag |
| createdAt | DateTime | Association timestamp |

**Constraints:**
- Composite primary key `(bookmarkId, tagId)`
- Cascade delete when bookmark or tag is deleted

**Indexes:**
- `bookmarkId` (for finding tags of a bookmark)
- `tagId` (for finding bookmarks with a tag)

## Design Decisions

### 1. Team Isolation
- Collections belong to teams (not users directly)
- Ensures proper data scoping and access control
- Supports future multi-tenancy features

### 2. Global Tags vs Team-Scoped Tags
- **Decision:** Tags are globally unique
- **Rationale:**
  - Simpler data model
  - Enables cross-team tag insights in future
  - Easier to implement and query
- **Trade-off:** Teams can see all tag names (but only their bookmarks)

### 3. Many-to-Many Bookmark-Tag Relationship
- **Requirement:** Assignment specifies a many-to-many relationship
- **Implementation:** Explicit `BookmarkTag` junction table
- **Benefits:**
  - Clear relationship tracking
  - Easy to add metadata (e.g., when tag was applied)
  - Better query performance with proper indexes

### 4. Status Enum Instead of Soft Delete
- `BookmarkStatus.ARCHIVED` preserves bookmarks without cluttering main view
- Allows easy restoration
- Simpler than soft delete patterns (no `deletedAt` checks everywhere)

### 5. Cascade Deletes
- Team deletion → removes all collections, memberships
- Collection deletion → removes all bookmarks
- Bookmark deletion → removes tag associations
- Ensures referential integrity without orphaned data

### 6. Slug Field for Teams
- URL-friendly team identifiers
- Enables clean URLs: `/app/dev-team/collections`
- Better UX than numeric IDs

### 7. Icon and Color Customization
- Collections have customizable icons and colors
- Tags have customizable colors
- Improves visual organization and UX

## Migration Strategy

### Phase 2 Implementation
1. Generate Prisma Client: `npm run db:generate`
2. Create migration: `npm run db:migrate`
3. Run seed script: `npm run db:seed`

### Seed Data Includes
- 2 users (John Doe, Jane Smith)
- 2 teams (Development, Marketing)
- 3 team memberships
- 3 collections (Frontend, Backend, Design Tools)
- 7 bookmarks (mix of active and archived)
- 7 tags (Vue.js, React, TypeScript, Database, Design, Tutorial, Documentation)
- Multiple bookmark-tag associations

## Future Considerations

### Not Implemented (Out of Scope for Assessment)
- User preferences per team
- Bookmark sharing/permissions beyond team level
- Bookmark visit tracking/analytics
- Full-text search on bookmarks
- Nested collections/folders
- Bookmark import/export
- OAuth/social bookmarks

### Potential Enhancements (Post-Assessment)
- Add `position` field to Collections for custom ordering
- Add `createdBy` and `updatedBy` fields for audit trails
- Add `BookmarkVisit` table for usage analytics
- Add team invitation system
- Add bookmark duplicate detection
