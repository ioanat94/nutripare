export default function PrivacyPage() {
  return (
    <main className='mx-auto w-full max-w-3xl px-6 py-12'>
      <h1 className='mb-2 text-3xl font-bold tracking-tight'>Privacy Policy</h1>
      <p className='mb-10 text-sm text-muted-foreground'>Last updated: March 2026</p>

      <div className='space-y-10 text-base text-muted-foreground'>
        <section>
          <h2 className='mb-3 text-xl font-semibold text-foreground'>Who is responsible for your data</h2>
          <p>
            Nutripare is operated by Ioana Tiplea. If you have any questions about
            your data or want to make a request, you can contact me at{' '}
            <a
              href='mailto:ioanatiplea94@gmail.com'
              className='font-medium text-foreground underline underline-offset-4 hover:text-primary'
            >
              ioanatiplea94@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-xl font-semibold text-foreground'>What data we collect and why</h2>
          <div className='space-y-3'>
            <p>
              Nutripare can be used without an account — no data is collected from
              signed-out users.
            </p>
            <p>
              If you create an account, we collect and store the following:
            </p>
            <ul className='ml-5 list-disc space-y-2'>
              <li>
                <span className='font-medium text-foreground'>Email address and display name</span> — used to
                identify your account and personalise the experience.
              </li>
              <li>
                <span className='font-medium text-foreground'>Saved products and comparisons</span> — food
                products and comparisons you choose to save for future reference.
              </li>
              <li>
                <span className='font-medium text-foreground'>Nutrition settings</span> — your custom nutrition
                rules, visible nutrients, and display preferences.
              </li>
            </ul>
            <p>
              We do not collect any data beyond what is listed above. We do not use
              analytics, advertising, or tracking of any kind.
            </p>
          </div>
        </section>

        <section>
          <h2 className='mb-3 text-xl font-semibold text-foreground'>How your data is stored</h2>
          <p>
            Your data is stored using Firebase Authentication and Firestore,
            services provided by Google. Google acts as a data processor on our
            behalf and is bound by appropriate data processing terms. You can read
            more in{' '}
            <a
              href='https://firebase.google.com/support/privacy'
              target='_blank'
              rel='noopener noreferrer'
              className='font-medium text-foreground underline underline-offset-4 hover:text-primary'
            >
              Firebase&apos;s privacy documentation
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-xl font-semibold text-foreground'>How long we keep your data</h2>
          <p>
            Your data is kept for as long as your account exists. When you delete
            your account, all associated data — including saved products,
            comparisons, and settings — is permanently deleted immediately.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-xl font-semibold text-foreground'>Your rights</h2>
          <div className='space-y-3'>
            <p>
              Under GDPR (and equivalent laws), you have the right to access,
              correct, export, and delete your personal data. Nutripare gives you
              direct control over all of this from the Settings page:
            </p>
            <ul className='ml-5 list-disc space-y-2'>
              <li>
                <span className='font-medium text-foreground'>Download your data</span> — export a full copy
                of everything stored about you as a JSON file.
              </li>
              <li>
                <span className='font-medium text-foreground'>Update your details</span> — change your display
                name or password at any time.
              </li>
              <li>
                <span className='font-medium text-foreground'>Delete your account</span> — permanently removes
                your account and all associated data.
              </li>
            </ul>
            <p>
              If you need help exercising any of these rights, contact me at{' '}
              <a
                href='mailto:ioanatiplea94@gmail.com'
                className='font-medium text-foreground underline underline-offset-4 hover:text-primary'
              >
                ioanatiplea94@gmail.com
              </a>
              .
            </p>
          </div>
        </section>

        <section>
          <h2 className='mb-3 text-xl font-semibold text-foreground'>Cookies</h2>
          <p>
            Nutripare does not use cookies. Authentication state is stored in your
            browser&apos;s IndexedDB, which is not a cookie and is not shared with
            any third party.
          </p>
        </section>

        <section>
          <h2 className='mb-3 text-xl font-semibold text-foreground'>Changes to this policy</h2>
          <p>
            If this policy changes in a meaningful way, the date at the top of
            this page will be updated. We will not retroactively reduce your rights
            without notice.
          </p>
        </section>
      </div>
    </main>
  );
}
