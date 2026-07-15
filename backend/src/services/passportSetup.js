const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool           = require('../db/pool');

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email     = profile.emails[0].value;
        const googleId  = profile.id;
        const name      = profile.displayName;
        const avatarUrl = profile.photos?.[0]?.value || null;

        const { rows } = await pool.query(
          `INSERT INTO users (google_id, email, name, avatar_url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (google_id) DO UPDATE
             SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
           RETURNING *`,
          [googleId, email, name, avatarUrl]
        );

        const user = rows[0];

        await seedDefaultCategories(user.id);

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});


const DEFAULT_CATEGORIES = [
  'Salary',
  'Freelance',
  'Rent',
  'Food',
  'Transport',
  'Entertainment',
  'Healthcare',
  'Utilities',
  'Others',
  'Transfers',
];

async function seedDefaultCategories(userId) {
  for (const name of DEFAULT_CATEGORIES) {
    await pool.query(
      `INSERT INTO categories (user_id, name)
       VALUES ($1, $2)
       ON CONFLICT (user_id, name) DO NOTHING`,
      [userId, name]
    );
  }
}
