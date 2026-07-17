# Entry 28 - Deployment Lessons

Type: retrospective note, not an additional development day.

## What Held Up

Vercel was a good fit for the Next.js modular monolith. Preview and production deployments used the same application shape, and Supabase held the persistent data and Auth layer.

Separating preview and production environment variables reduced deployment risk. Production did not receive Playwright-only credentials.

The deployment process improved because it treated smoke tests as part of deployment, not as optional follow-up.

## What Was Risky

Vercel Ready status did not guarantee the user flows were correct. The production-only admin navigation race was found only through real production acceptance testing.

## Portfolio Takeaway

Deployment evidence is stronger than a link alone. The project has GitHub push evidence, encrypted Vercel env verification, preview smoke results, production alias verification, and production Playwright acceptance.
