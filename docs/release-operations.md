# FitDax release operations — 22 October 2026

This is a technical release record, not clinical/legal certification or a claim that every device has been tested.

## Public site and Android
Only the Arabic and English public landing pages belong in sitemap.xml. Account, payment, admin and health pages send noindex headers. robots.txt is a discovery instruction, not access control: the API still verifies sessions and database ownership. SEO metadata includes canonical/hreflang, Open Graph and truthful WebApplication structured data without fabricated ratings. Indexing and ranking are search-engine decisions.

The PWA caches only a public offline fallback automatically. Health caching is separately opt-in, encrypted, device-local, and covered by the existing training tests. Android is a Trusted Web Activity using the same site and Google browser authentication, not a separate native health database. No Google Play publication is claimed.

## Payment operation
Beneficiary supplied by owner: Ahmed Nader Morgan. Owner confirmed Egyptian wallet 01097905455 is active and authorized for subscription collection. InstaPay supplied username ahmedmorgan2009 is normalized as ahmedmorgan2009@instapay; the bank destination and displayed name have not been independently verified.

Never approve an order solely because a user entered a reference. Match the actual receipt in the owner's wallet/bank app against order destination, amount, currency, time and reference. Pending/rejected requests do not activate access. Approval is admin-only, audited and cannot extend the same request twice. No automatic bank reconciliation or recurring debit exists. Database tests use synthetic records rolled back at completion; no real money was sent.

On 23 October 2026 the owner requested functional subscription buttons. Pro and Premium were opened for manual transfer orders after linking the 5/9/12 cumulative program entitlements. No actual bank transfer or qualified legal review was performed. Visa/Paymob remains disabled pending merchant onboarding and end-to-end gateway testing. Refund/retention terms and provider settlement must still be reviewed by the operator. Changing payment settings is admin-only and uses revision conflict checks.

## Restore and incident procedure
1. Identify the affected deployment, time window and type of data without copying health payloads into support logs.
2. Restrict the affected feature, revoke compromised sessions/secrets using provider controls, and preserve the existing data-encryption key securely for records that require it. Rotating/deleting that key without migration makes existing records unreadable.
3. Restore first into an isolated non-public database; never overwrite production as a diagnostic action. Apply the same RLS and grants. Verify synthetic test records and deletion tombstones before promotion.
4. Re-apply deletions made after the restore point so previously deleted records are not silently reintroduced. Provider backup/log erasure follows provider retention and must be confirmed by the operator.
5. Re-run role/isolation/payment/training checks and verify API responses before reopening the feature. Record the incident and any legally required communications with qualified advice.

No restore exercise or independent penetration test has been completed by this release.

## Data inventory
- Google/Supabase Auth: verified identity, email and basic profile; identity administration independent of fitness deletion.
- Supabase Postgres EU West: account profile/measurements/food logs and training set payloads encrypted server-side; consent/revision metadata; request throttles; payment requests and administrative audit.
- Vercel: server execution and infrastructure logs; no intentional logging of plaintext health records or signing secrets.
- Browser: session cookies; optional AES-GCM offline training with non-exportable device key and unsent outbox; exports are unencrypted files controlled by the user.
- GitHub: exercise image requests from browser, including normal connection metadata, without health payloads.
- Android wrapper: no additional personal data collection or Android health permissions beyond the website's documented operation.

Fitness deletion removes active fitness records and training data through tested account-scoped paths; it does not itself delete authentication, financial records, downloaded exports or provider backups. Financial retention periods, Egyptian cross-border health-data obligations, registered trader information and final consumer terms require qualified review. No invented legal registration, review, accreditation or retention guarantee is asserted.

## Content review handoff
The export content-review.csv contains all exercise IDs, original English instructions and current Arabic instructions, provenance and blank reviewer/status fields. A qualified trainer/physiotherapist must check movement safety, contraindications, translation and image correspondence. The generated illustrations are identified in media provenance; they do not establish correctness of form. Injury pages provide education and escalation, not personalized treatment or a diagnosis. A dietitian must review nutrient estimates, portions, allergens and suitability before clinical or specialized dietary claims.
