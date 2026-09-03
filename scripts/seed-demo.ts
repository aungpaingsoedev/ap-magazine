import 'dotenv/config';
import { nanoid } from 'nanoid';
import { eq, like } from 'drizzle-orm';
import { db } from '../src/lib/db';
import { category, content, user, type RichTextDocument } from '../src/lib/db/schema';
import { ensureCmsDefaults } from '../src/lib/db/seed';
import { slugify } from '../src/lib/slug';
import { estimateReadingMinutes } from '../src/lib/blog-utils';

const SEED_EMAIL_DOMAIN = 'seed.atlas.local';
const COVER_IMAGES = [
  '/uploads/GUMe4M1pzVoXDgmOYaOVp.jpg',
  '/uploads/4Kt9BRW9xgd4m5--uJkHu.jpg',
  '/uploads/6MkOFuB4YiGQF4KE65HpV.png',
  '/uploads/eOjNeld8Q3DwBrBCmovLZ.jpg',
  '/uploads/MPbdpTGizAkkNUmM8PiEu.png',
];

const AUTHORS = [
  { name: 'Amina Okeke', username: 'amina-okeke', bio: 'Writes about West African contemporary art and city archives.' },
  { name: 'Jonas Berg', username: 'jonas-berg', bio: 'Design critic covering type, print, and editorial systems.' },
  { name: 'Mei Lin Chen', username: 'mei-lin', bio: 'Essayist on memory, migration, and visual culture.' },
  { name: 'Sofia Alvarez', username: 'sofia-alvarez', bio: 'Documents street culture and independent publishing.' },
  { name: 'Noah Richter', username: 'noah-richter', bio: 'Focuses on sculpture, materials, and public space.' },
  { name: 'Leila Haddad', username: 'leila-haddad', bio: 'Cultural reporter with an eye for quiet museums.' },
  { name: 'Ethan Brooks', username: 'ethan-brooks', bio: 'Writes on digital craft and the future of magazines.' },
  { name: 'Priya Nair', username: 'priya-nair', bio: 'Explores design history across South Asia.' },
  { name: 'Mateo Rossi', username: 'mateo-rossi', bio: 'Photographer-turned-essayist on light and cities.' },
  { name: 'Hannah Cole', username: 'hannah-cole', bio: 'Covers independent galleries and artist books.' },
  { name: 'Omar Farid', username: 'omar-farid', bio: 'Architecture notes and the politics of plazas.' },
  { name: 'Clara Nguyen', username: 'clara-nguyen', bio: 'Writes longform on craft, food, and diaspora.' },
  { name: 'Isaac Moore', username: 'isaac-moore', bio: 'Music, nightlife, and the rooms where scenes start.' },
  { name: 'Elena Petrova', username: 'elena-petrova', bio: 'Interested in film stills and narrative photography.' },
  { name: 'Daniel Okonkwo', username: 'daniel-okonkwo', bio: 'Profiles makers working between studio and street.' },
  { name: 'Yuki Tanaka', username: 'yuki-tanaka', bio: 'Essays on stationery, rituals, and slow media.' },
  { name: 'Grace Mensah', username: 'grace-mensah', bio: 'Looks at fashion as material culture.' },
  { name: 'Luis Navarro', username: 'luis-navarro', bio: 'Writes about murals, transit, and city edges.' },
  { name: 'Freya Lind', username: 'freya-lind', bio: 'Northern light, ceramics, and quiet interiors.' },
  { name: 'Adam Quinn', username: 'adam-quinn', bio: 'Editor at large for experimental publishing.' },
] as const;

const POSTS = [
  { title: 'Hope dies last', excerpt: 'A short field note on persistence in contemporary painting.', category: 'art' },
  { title: 'Don’t close your eyes', excerpt: 'Looking again at the images we rush past every morning.', category: 'culture' },
  { title: 'The quiet grid', excerpt: 'Why editorial layouts still teach us how to see.', category: 'design' },
  { title: 'Letters from the margin', excerpt: 'An essay on footnotes, asides, and unfinished drafts.', category: 'essay' },
  { title: 'Bronze in the rain', excerpt: 'Public sculpture after weather, tourists, and time.', category: 'art' },
  { title: 'Night markets', excerpt: 'How temporary stalls build lasting cultural memory.', category: 'culture' },
  { title: 'Black ink, white field', excerpt: 'Monochrome systems in magazine covers and posters.', category: 'design' },
  { title: 'A room with one window', excerpt: 'On solitude, attention, and the work of writing.', category: 'essay' },
  { title: 'Studio dust', excerpt: 'The overlooked material that proves a piece was made by hand.', category: 'art' },
  { title: 'Archive fever', excerpt: 'Collectors, keepers, and the soft politics of boxes.', category: 'culture' },
  { title: 'Kerning as care', excerpt: 'Small typographic decisions that change how trust feels.', category: 'design' },
  { title: 'Second drafts only', excerpt: 'Why the first page is rarely the true beginning.', category: 'essay' },
  { title: 'Canvas as map', excerpt: 'Artists charting cities without cartography.', category: 'art' },
  { title: 'Borrowed songs', excerpt: 'Shared playlists and the culture of soft belonging.', category: 'culture' },
  { title: 'Edges and gutters', excerpt: 'Whitespace as structure, not emptiness.', category: 'design' },
  { title: 'The long afternoon', excerpt: 'A walk through memory written in present tense.', category: 'essay' },
  { title: 'Clay remembers', excerpt: 'Touch, imprint, and the patience of ceramics.', category: 'art' },
  { title: 'Street libraries', excerpt: 'Free shelves and the informal circulation of books.', category: 'culture' },
  { title: 'Modular stories', excerpt: 'Designing publications that can be rearranged.', category: 'design' },
  { title: 'After the headline', excerpt: 'What remains when news becomes history.', category: 'essay' },
] as const;

function paragraph(text: string): RichTextDocument {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'This piece was generated for local development so the magazine grid, author pages, and CMS lists have realistic sample content.',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'A closer look' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Replace these seeded posts with your own reporting whenever you are ready. Categories, covers, and authors are already wired into the Atlas Magazine CMS.',
          },
        ],
      },
    ],
  };
}

async function seedDemo() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  await ensureCmsDefaults();

  const existingSeedUsers = await db
    .select({ id: user.id })
    .from(user)
    .where(like(user.email, `%@${SEED_EMAIL_DOMAIN}`));

  if (existingSeedUsers.length >= AUTHORS.length) {
    console.log(
      `Seed users already present (${existingSeedUsers.length}). Skipping demo seed.`,
    );
    return;
  }

  const categories = await db.select().from(category);
  const categoryBySlug = new Map(categories.map((row) => [row.slug, row.id]));
  const now = new Date();

  console.log('Creating 20 seed authors and 20 published posts...');

  for (let index = 0; index < AUTHORS.length; index += 1) {
    const author = AUTHORS[index]!;
    const post = POSTS[index]!;
    const email = `${author.username}@${SEED_EMAIL_DOMAIN}`;

    const [existingUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    let userId = existingUser?.id;
    if (!userId) {
      userId = nanoid();
      await db.insert(user).values({
        id: userId,
        name: author.name,
        email,
        emailVerified: true,
        role: 'author',
        username: author.username,
        slug: author.username,
        bio: author.bio,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    const slugBase = slugify(post.title) || `seed-post-${index + 1}`;
    const slug = `${slugBase}-${author.username}`;

    const [existingPost] = await db
      .select({ id: content.id })
      .from(content)
      .where(eq(content.slug, slug))
      .limit(1);

    if (existingPost) continue;

    const body = paragraph(post.excerpt);
    const publishedAt = new Date(now.getTime() - (AUTHORS.length - index) * 36e5);

    await db.insert(content).values({
      id: nanoid(),
      title: post.title,
      slug,
      excerpt: post.excerpt,
      coverImage: COVER_IMAGES[index % COVER_IMAGES.length],
      body,
      status: 'published',
      featured: index % 7 === 0,
      editorsPick: index % 5 === 0,
      displayOrder: AUTHORS.length - index,
      readingTime: estimateReadingMinutes(post.excerpt, body),
      categoryId: categoryBySlug.get(post.category) ?? null,
      publishedAt,
      createdAt: publishedAt,
      updatedAt: publishedAt,
      createdBy: userId,
      updatedBy: userId,
      seoTitle: post.title,
      seoDescription: post.excerpt,
    });
  }

  console.log('Demo seed complete: 20 users, 1 blog post each.');
}

seedDemo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
