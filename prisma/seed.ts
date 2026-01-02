import { PrismaClient } from './generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Clear existing data (in reverse order of dependencies)
  await prisma.bookmarkTag.deleteMany()
  await prisma.bookmark.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()

  console.log('Cleared existing data')

  // Create users
  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      emailVerified: true,
      password: '$2a$10$HashedPassword123!', // Note: Use proper hashing in production
    },
  })

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      emailVerified: true,
      password: '$2a$10$HashedPassword123',
    },
  })

  console.log('Created users')

  // Create teams
  const team1 = await prisma.team.create({
    data: {
      name: 'Development Team',
      description: 'Resources for software development',
      slug: 'dev-team',
    },
  })

  const team2 = await prisma.team.create({
    data: {
      name: 'Marketing Team',
      description: 'Marketing and design resources',
      slug: 'marketing-team',
    },
  })

  console.log('Created teams')

  // Create team memberships
  await prisma.teamMember.create({
    data: {
      teamId: team1.id,
      userId: user1.id,
      role: 'OWNER',
    },
  })

  await prisma.teamMember.create({
    data: {
      teamId: team1.id,
      userId: user2.id,
      role: 'MEMBER',
    },
  })

  await prisma.teamMember.create({
    data: {
      teamId: team2.id,
      userId: user2.id,
      role: 'OWNER',
    },
  })

  console.log('Created team memberships')

  // Create collections
  const collection1 = await prisma.collection.create({
    data: {
      name: 'Frontend Resources',
      description: 'Vue, React, and other frontend frameworks',
      icon: 'code',
      color: '#3b82f6',
      teamId: team1.id,
    },
  })

  const collection2 = await prisma.collection.create({
    data: {
      name: 'Backend Resources',
      description: 'Node.js, databases, and APIs',
      icon: 'server',
      color: '#10b981',
      teamId: team1.id,
    },
  })

  const collection3 = await prisma.collection.create({
    data: {
      name: 'Design Tools',
      description: 'UI/UX design and prototyping tools',
      icon: 'palette',
      color: '#f59e0b',
      teamId: team2.id,
    },
  })

  console.log('Created collections')

  // Create tags
  const tagVue = await prisma.tag.create({
    data: { name: 'Vue.js', color: '#42b883' },
  })

  const tagReact = await prisma.tag.create({
    data: { name: 'React', color: '#61dafb' },
  })

  const tagTypeScript = await prisma.tag.create({
    data: { name: 'TypeScript', color: '#3178c6' },
  })

  const tagDatabase = await prisma.tag.create({
    data: { name: 'Database', color: '#336791' },
  })

  const tagDesign = await prisma.tag.create({
    data: { name: 'Design', color: '#ff6b6b' },
  })

  const tagTutorial = await prisma.tag.create({
    data: { name: 'Tutorial', color: '#845ec2' },
  })

  const tagDocumentation = await prisma.tag.create({
    data: { name: 'Documentation', color: '#00c9a7' },
  })

  console.log('Created tags')

  // Create bookmarks with tags
  const bookmark1 = await prisma.bookmark.create({
    data: {
      title: 'Vue.js Official Documentation',
      url: 'https://vuejs.org/guide/introduction.html',
      description: 'The official Vue.js documentation and guide',
      favicon: 'https://vuejs.org/logo.svg',
      status: 'ACTIVE',
      collectionId: collection1.id,
    },
  })

  await prisma.bookmarkTag.createMany({
    data: [
      { bookmarkId: bookmark1.id, tagId: tagVue.id },
      { bookmarkId: bookmark1.id, tagId: tagDocumentation.id },
    ],
  })

  const bookmark2 = await prisma.bookmark.create({
    data: {
      title: 'Nuxt 3 Documentation',
      url: 'https://nuxt.com/docs/getting-started/introduction',
      description: 'Official Nuxt 3 framework documentation',
      favicon: 'https://nuxt.com/icon.png',
      status: 'ACTIVE',
      collectionId: collection1.id,
    },
  })

  await prisma.bookmarkTag.createMany({
    data: [
      { bookmarkId: bookmark2.id, tagId: tagVue.id },
      { bookmarkId: bookmark2.id, tagId: tagTypeScript.id },
      { bookmarkId: bookmark2.id, tagId: tagDocumentation.id },
    ],
  })

  const bookmark3 = await prisma.bookmark.create({
    data: {
      title: 'React Tutorial for Beginners',
      url: 'https://react.dev/learn',
      description: 'Learn React with interactive examples',
      status: 'ACTIVE',
      collectionId: collection1.id,
    },
  })

  await prisma.bookmarkTag.createMany({
    data: [
      { bookmarkId: bookmark3.id, tagId: tagReact.id },
      { bookmarkId: bookmark3.id, tagId: tagTutorial.id },
    ],
  })

  const bookmark4 = await prisma.bookmark.create({
    data: {
      title: 'Prisma Documentation',
      url: 'https://www.prisma.io/docs',
      description: 'Next-generation ORM for Node.js and TypeScript',
      status: 'ACTIVE',
      collectionId: collection2.id,
    },
  })

  await prisma.bookmarkTag.createMany({
    data: [
      { bookmarkId: bookmark4.id, tagId: tagDatabase.id },
      { bookmarkId: bookmark4.id, tagId: tagTypeScript.id },
      { bookmarkId: bookmark4.id, tagId: tagDocumentation.id },
    ],
  })

  const bookmark5 = await prisma.bookmark.create({
    data: {
      title: 'PostgreSQL Tutorial',
      url: 'https://www.postgresql.org/docs/current/tutorial.html',
      description: 'Official PostgreSQL tutorial and documentation',
      status: 'ACTIVE',
      collectionId: collection2.id,
    },
  })

  await prisma.bookmarkTag.createMany({
    data: [
      { bookmarkId: bookmark5.id, tagId: tagDatabase.id },
      { bookmarkId: bookmark5.id, tagId: tagTutorial.id },
    ],
  })

  const bookmark6 = await prisma.bookmark.create({
    data: {
      title: 'Figma',
      url: 'https://www.figma.com',
      description: 'Collaborative interface design tool',
      status: 'ACTIVE',
      collectionId: collection3.id,
    },
  })

  await prisma.bookmarkTag.createMany({
    data: [{ bookmarkId: bookmark6.id, tagId: tagDesign.id }],
  })

  const bookmark7 = await prisma.bookmark.create({
    data: {
      title: 'Old React Documentation',
      url: 'https://legacy.reactjs.org/',
      description: 'Legacy React documentation (archived)',
      status: 'ARCHIVED',
      collectionId: collection1.id,
    },
  })

  await prisma.bookmarkTag.createMany({
    data: [
      { bookmarkId: bookmark7.id, tagId: tagReact.id },
      { bookmarkId: bookmark7.id, tagId: tagDocumentation.id },
    ],
  })

  console.log('Created bookmarks with tags')

  // Summary
  const counts = {
    users: await prisma.user.count(),
    teams: await prisma.team.count(),
    teamMembers: await prisma.teamMember.count(),
    collections: await prisma.collection.count(),
    bookmarks: await prisma.bookmark.count(),
    tags: await prisma.tag.count(),
    bookmarkTags: await prisma.bookmarkTag.count(),
  }

  console.log('\nSeed Summary:')
  console.log(`   Users: ${counts.users}`)
  console.log(`   Teams: ${counts.teams}`)
  console.log(`   Team Members: ${counts.teamMembers}`)
  console.log(`   Collections: ${counts.collections}`)
  console.log(`   Bookmarks: ${counts.bookmarks}`)
  console.log(`   Tags: ${counts.tags}`)
  console.log(`   Bookmark-Tag Relations: ${counts.bookmarkTags}`)
  console.log('\nDatabase seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
